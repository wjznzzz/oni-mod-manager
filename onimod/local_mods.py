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

_PREVIEW_NAMES = ("preview.png", "preview.jpg", "icon.png", "icon.jpg",
                  "thumbnail.png", "screen1.png", "screen.png")


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
    def _parse_flat_yaml(path: Path) -> dict:
        """解析缺氧 mod 的扁平 ``key: value`` 文件（mod.yaml / mod_info.yaml）。

        游戏写出的 ``mod.yaml`` 常带 UTF-8 BOM，必须用 ``utf-8-sig`` 读，
        否则第一行的 ``title`` 永远匹配不上（列表里就只剩文件夹 ID）。
        """
        data = {}
        try:
            for raw in path.read_text(encoding="utf-8-sig").splitlines():
                line = raw.strip()
                if not line or line.startswith("#") or ":" not in line:
                    continue
                key, value = line.split(":", 1)
                data[key.strip()] = value.strip().strip('"').strip("'")
        except OSError:
            pass
        return data

    @staticmethod
    def read_mod_info(mod_dir) -> dict:
        """读取 ``mod.yaml`` / ``mod_info.yaml`` / ``mod_info.json`` 与预览图。

        缺氧的元数据是分开的：标题/描述/作者在 ``mod.yaml``，
        版本与 API 号在 ``mod_info.yaml``，两处都要读。
        """
        mod_dir = Path(mod_dir)
        info = {"id": mod_dir.name}

        # ① mod.yaml —— 标题、描述、作者
        mod_yaml = mod_dir / "mod.yaml"
        if mod_yaml.exists():
            meta = LocalModManager._parse_flat_yaml(mod_yaml)
            if meta.get("title"):
                info["title"] = meta["title"]
            if meta.get("description"):
                info["description"] = meta["description"][:200]
            if meta.get("author"):
                info["author"] = meta["author"]
            if meta.get("version"):
                info["version"] = meta["version"]

        # ② mod_info.yaml —— 版本号 / staticID（优先级高于 mod.yaml 的同名字段）
        yaml_path = mod_dir / "mod_info.yaml"
        if yaml_path.exists():
            tech = LocalModManager._parse_flat_yaml(yaml_path)
            if tech.get("title"):
                info.setdefault("title", tech["title"])
            if tech.get("version"):
                info["version"] = tech["version"]
            if tech.get("staticID"):
                info.setdefault("static_id", tech["staticID"])
            if tech.get("author"):
                info.setdefault("author", tech["author"])

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
