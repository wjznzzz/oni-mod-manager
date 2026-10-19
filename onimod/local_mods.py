# -*- coding: utf-8 -*-
"""本地模组库：扫描 / 读取 mod 元信息 / 删除 / 打开目录。"""
from __future__ import annotations

import json
import shutil
import subprocess
from datetime import datetime
from pathlib import Path

from .config import load_config
from .utils import dir_size

_PREVIEW_NAMES = ("preview.png", "preview.jpg", "icon.png", "icon.jpg")


class LocalModManager:
    """管理「本地模组库」目录（下载后先落在这里，再搬运进 WeGame）。"""

    @staticmethod
    def scan_mods() -> list:
        mods_dir = Path(load_config()["mods_dir"])
        if not mods_dir.exists():
            return []

        mods = []
        for item in mods_dir.iterdir():
            if not item.is_dir():
                continue
            info = LocalModManager.read_mod_info(item)
            info["local_path"] = str(item)
            info["size"] = dir_size(item)
            info["mod_time"] = datetime.fromtimestamp(item.stat().st_mtime).isoformat()
            mods.append(info)

        return sorted(mods, key=lambda x: x.get("mod_time", ""), reverse=True)

    @staticmethod
    def read_mod_info(mod_dir) -> dict:
        """读取 ``mod_info.yaml`` / ``mod_info.json`` 与预览图。"""
        mod_dir = Path(mod_dir)
        info = {"id": mod_dir.name}

        yaml_path = mod_dir / "mod_info.yaml"
        if yaml_path.exists():
            try:
                for raw in yaml_path.read_text(encoding="utf-8").splitlines():
                    line = raw.strip()
                    for field, key in (("title", "title"), ("description", "description"),
                                       ("version", "version"), ("staticID", "static_id"),
                                       ("author", "author")):
                        if line.startswith(field + ":") or line.startswith(field + " "):
                            value = line.split(":", 1)[-1].strip().strip('"').strip("'")
                            info[key] = value[:200] if key == "description" else value
            except OSError:
                pass

        json_path = mod_dir / "mod_info.json"
        if json_path.exists():
            try:
                jdata = json.loads(json_path.read_text(encoding="utf-8"))
                info["title"] = info.get("title") or jdata.get("title", "")
                info["description"] = info.get("description") or jdata.get("description", "")[:200]
                info["version"] = info.get("version") or jdata.get("version", "")
                info["static_id"] = info.get("static_id") or jdata.get("staticID", "")
                info["author"] = info.get("author") or jdata.get("author", "")
            except (OSError, json.JSONDecodeError):
                pass

        for preview_name in _PREVIEW_NAMES:
            preview_path = mod_dir / preview_name
            if preview_path.exists():
                info["preview"] = str(preview_path)
                break

        info["title"] = info.get("title") or mod_dir.name
        info["description"] = info.get("description") or "无描述"
        info["version"] = info.get("version") or "未知"
        info["author"] = info.get("author") or "未知作者"
        return info

    @staticmethod
    def delete_mod(mod_id) -> bool:
        mod_dir = Path(load_config()["mods_dir"]) / str(mod_id)
        if mod_dir.exists():
            shutil.rmtree(str(mod_dir))
            return True
        return False

    @staticmethod
    def open_mod_folder(mod_id) -> bool:
        mod_dir = Path(load_config()["mods_dir"]) / str(mod_id)
        if mod_dir.exists():
            subprocess.Popen(["explorer", str(mod_dir)])
            return True
        return False
