# -*- coding: utf-8 -*-
"""下载队列管理。

修复原版的几处问题：
- 队列只会派发一个任务、完成后不再继续（现在用 ``_pump`` 持续派发到并发上限）；
- ``clear_history`` 在持有非可重入锁时又调 ``_save_history`` 造成死锁（改用 RLock）；
- ``cancel`` 只能改状态、不能真正中断在途下载（现在 chunk 循环里检查取消标志）；
- 解压用字符串前缀判顶层目录、且无 zip-slip 防护（改用 utils.safe_extract_zip）。
"""
from __future__ import annotations

import threading
import time
from datetime import datetime
from pathlib import Path

import requests

from .config import DATA_DIR, load_config
from .utils import safe_extract_zip, sanitize_filename


class DownloadCancelled(Exception):
    """用户主动取消下载。"""


class DownloadManager:
    def __init__(self):
        self.queue = []
        self.active = {}
        self.completed = []
        self.failed = []
        self.history_file = DATA_DIR / "download_history.json"
        self.lock = threading.RLock()
        self._load_history()

    # ------------------------------------------------------------- history
    def _load_history(self):
        if not self.history_file.exists():
            return
        try:
            data = self.history_file.read_text(encoding="utf-8")
            import json
            parsed = json.loads(data)
            self.completed = parsed.get("completed", [])
            self.failed = parsed.get("failed", [])
        except Exception:
            self.completed, self.failed = [], []

    def _save_history(self):
        import json
        with self.lock:
            self.history_file.parent.mkdir(parents=True, exist_ok=True)
            self.history_file.write_text(json.dumps({
                "completed": self.completed[-200:],   # 限制记录数
                "failed": self.failed[-100:],
            }, ensure_ascii=False, indent=2), encoding="utf-8")

    # ------------------------------------------------------------- queue
    def add_to_queue(self, mod_id, mod_name, mod_url, download_source="steam_cdn"):
        with self.lock:
            if any(t["mod_id"] == mod_id for t in self.queue):
                return {"status": "exists", "message": f"模组 {mod_name} 已在队列中"}
            if mod_id in self.active:
                return {"status": "exists", "message": f"模组 {mod_name} 正在下载中"}
            self.queue.append({
                "mod_id": mod_id,
                "mod_name": mod_name,
                "mod_url": mod_url,
                "download_source": download_source,
                "added_time": datetime.now().isoformat(),
                "status": "queued",
                "progress": 0,
                "speed": 0,
                "size": 0,
                "downloaded": 0,
                "cancelled": False,
            })
        self._pump()
        return {"status": "queued", "message": f"模组 {mod_name} 已加入下载队列"}

    def _pump(self):
        """持续把队列任务派发出去，直到达到并发上限或队列空。"""
        while True:
            with self.lock:
                limit = int(load_config().get("max_download_threads") or 1)
                if not self.queue or len(self.active) >= max(1, limit):
                    return
                task = self.queue.pop(0)
                task["status"] = "downloading"
                self.active[task["mod_id"]] = task
            threading.Thread(target=self._do_download, args=(task,), daemon=True).start()

    # ------------------------------------------------------------- worker
    def _do_download(self, task):
        mod_id = task["mod_id"]
        config = load_config()
        download_dir = Path(config["download_dir"])
        download_dir.mkdir(parents=True, exist_ok=True)
        target_zip = download_dir / f"{mod_id}_{sanitize_filename(task['mod_name'])}.zip"

        try:
            urls = self._get_download_urls(mod_id, task["download_source"])
            if not urls:
                raise RuntimeError("无法获取下载链接（该模组可能未提供公开直链，可尝试手动导入 ZIP）")

            last_error = None
            for source_url in urls:
                try:
                    self._download_file(source_url, str(target_zip), task)
                    last_error = None
                    break
                except DownloadCancelled:
                    raise
                except Exception as exc:
                    last_error = str(exc)
            else:
                raise RuntimeError(last_error or "所有下载源均失败")

            if not target_zip.exists():
                raise RuntimeError("下载未生成文件")
            if target_zip.stat().st_size < 1024:   # <1KB 多半是错误页
                target_zip.unlink()
                raise RuntimeError("下载的文件无效（文件过小）")

            extract_dir = Path(config["mods_dir"]) / str(mod_id)
            safe_extract_zip(target_zip, extract_dir)

            with self.lock:
                task["status"] = "completed"
                task["progress"] = 100
                task["completed_time"] = datetime.now().isoformat()
                task["local_path"] = str(extract_dir)
                self.completed.insert(0, task)
                self.active.pop(mod_id, None)
            self._save_history()

            if target_zip.exists():
                target_zip.unlink()

        except DownloadCancelled:
            with self.lock:
                task["status"] = "cancelled"
                task["error"] = "用户取消"
                self.failed.insert(0, task)
                self.active.pop(mod_id, None)
            if target_zip.exists():
                target_zip.unlink()
            self._save_history()

        except Exception as exc:
            with self.lock:
                task["status"] = "failed"
                task["error"] = str(exc)
                self.failed.insert(0, task)
                self.active.pop(mod_id, None)
            self._save_history()

        finally:
            self._pump()   # 一个任务结束 → 继续消化队列

    # ------------------------------------------------------------- sources
    def _get_download_urls(self, mod_id, preferred_source) -> list:
        """下载链接：官方 API 直链优先；第三方中转站默认关闭。"""
        config = load_config()
        urls = []

        if preferred_source in ("steam_cdn", ""):
            file_url = self._resolve_steam_file_url(mod_id)
            if file_url:
                urls.append(file_url)

        # ⚠️ 第三方中转站：稳定性差、多数已失效，需在设置中显式开启
        if config.get("allow_third_party_sources") and preferred_source in ("steam_cdn", "third_party", ""):
            urls.append(f"https://steamworkshopdownloader.io/api/workshop/download/{mod_id}")
            urls.append(f"https://steamworkshop.download/download/view/{mod_id}")

        return urls

    def _resolve_steam_file_url(self, mod_id):
        """通过官方 GetPublishedFileDetails 拿公开直链 ``file_url``。"""
        try:
            resp = requests.post(
                "https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/",
                data={"itemcount": 1, "publishedfileids[0]": mod_id},
                headers={"User-Agent": "ONIModManager",
                         "Content-Type": "application/x-www-form-urlencoded"},
                timeout=10)
            details = resp.json().get("response", {}).get("publishedfiledetails") or []
            if details:
                return details[0].get("file_url") or None
        except Exception:
            pass
        return None

    def _download_file(self, url, save_path, task, chunk_size=8192):
        config = load_config()
        proxies = {}
        if config.get("proxy"):
            proxies = {"http": config["proxy"], "https": config["proxy"]}

        headers = {
            "User-Agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                           "AppleWebKit/537.36 (KHTML, like Gecko) "
                           "Chrome/120.0.0.0 Safari/537.36"),
            "Accept": "*/*",
            "Accept-Language": "zh-CN,zh;q=0.9",
            "Referer": f"https://steamcommunity.com/sharedfiles/filedetails/?id={task['mod_id']}",
        }

        response = requests.get(url, stream=True, timeout=30, proxies=proxies, headers=headers)
        response.raise_for_status()

        total_size = int(response.headers.get("content-length", 0))
        task["size"] = total_size
        downloaded = 0
        start_time = time.time()

        with open(save_path, "wb") as handle:
            for chunk in response.iter_content(chunk_size=chunk_size):
                if task.get("cancelled"):
                    raise DownloadCancelled()
                if not chunk:
                    continue
                handle.write(chunk)
                downloaded += len(chunk)
                task["downloaded"] = downloaded
                elapsed = time.time() - start_time
                if elapsed > 0:
                    task["speed"] = downloaded / elapsed
                if total_size > 0:
                    task["progress"] = round(downloaded / total_size * 100, 1)

    # ------------------------------------------------------------- control
    def cancel(self, mod_id):
        with self.lock:
            self.queue = [t for t in self.queue if t["mod_id"] != mod_id]
            task = self.active.get(mod_id)
            if task:
                task["cancelled"] = True   # 在途任务由下载循环自行中止

    def get_status(self) -> dict:
        with self.lock:
            return {
                "queue": list(self.queue),
                "active": list(self.active.values()),
                "completed": self.completed[:50],
                "failed": self.failed[:20],
            }

    def clear_history(self):
        with self.lock:
            self.completed, self.failed = [], []
            self._save_history()


download_manager = DownloadManager()
