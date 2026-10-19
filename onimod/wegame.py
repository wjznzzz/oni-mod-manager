# -*- coding: utf-8 -*-
"""WeGame 版缺氧的模组管理：路径探测 / 搬运 / 启停 / 卸载。

WeGame 版与 Steam 版的 mod 目录结构相同（``Documents\\Klei\\OxygenNotIncludedTGP\\mods``），
差别只在没有创意工坊 —— 所以「搬运 + 注册到 mods.json」就是把 Steam 模组接进来的关键。
"""
from __future__ import annotations

import json
import shutil
from pathlib import Path

from .config import DOCUMENTS, load_config
from .local_mods import LocalModManager
from .utils import dir_size

# 常见 WeGame 游戏安装位置（用于自动探测）
_GAME_DIR_CANDIDATES = [
    r"D:\WeGameApps\rail_apps\缺氧(2000075)",
    r"C:\WeGameApps\rail_apps\缺氧(2000075)",
    r"E:\WeGameApps\rail_apps\缺氧(2000075)",
    r"F:\WeGameApps\rail_apps\缺氧(2000075)",
]


def _mods_json_path(config=None) -> Path:
    """mods.json 的位置。

    缺氧的布局是 ``…\\OxygenNotIncludedTGP\\mods.json``，而模组文件夹在
    ``…\\OxygenNotIncludedTGP\\mods\\local\\<id>\\`` —— 两者并非简单的父子关系，
    所以优先用配置里的显式路径，其次才按 mods 目录推导。
    """
    config = config or load_config()
    if config.get("wegame_mods_json"):
        return Path(config["wegame_mods_json"])
    mods_dir = Path(config["wegame_mods_dir"])
    if mods_dir.name.lower() == "local":
        return mods_dir.parent.parent / "mods.json"
    return mods_dir.parent / "mods.json"


def _match_id(entry: dict):
    """从 mods.json 条目里取标识（兼容简化格式与 WeGame 原版格式）。"""
    return (entry.get("modId")
            or entry.get("staticID")
            or entry.get("label", {}).get("id"))


class WeGameModManager:
    @staticmethod
    def detect_paths() -> dict:
        config = load_config()
        paths = {
            "wegame_game_dir": config.get("wegame_game_dir", ""),
            "wegame_mods_dir": config.get("wegame_mods_dir", ""),
            "detected": False,
        }

        # 模组实际存放在 mods\local 下
        for candidate in (DOCUMENTS / "Klei" / "OxygenNotIncludedTGP" / "mods" / "local",
                          DOCUMENTS / "Klei" / "OxygenNotIncludedTGP" / "mods"):
            if candidate.exists():
                paths["wegame_mods_dir"] = str(candidate)
                paths["detected"] = True
                break

        # 注意 Path("") == Path(".") 且恒存在，必须先判空再判存在
        game_dir = (paths["wegame_game_dir"] or "").strip()
        if not game_dir or not Path(game_dir).exists():
            for alt in _GAME_DIR_CANDIDATES:
                if Path(alt).exists():
                    paths["wegame_game_dir"] = alt
                    break

        mods_json = _mods_json_path({**config, "wegame_mods_dir": paths["wegame_mods_dir"]})
        paths["mods_json_exists"] = mods_json.exists()
        paths["mods_json_path"] = str(mods_json) if mods_json.exists() else ""
        return paths

    @staticmethod
    def get_installed_mods() -> list:
        mods_dir = Path(load_config()["wegame_mods_dir"])
        mods_json_path = _mods_json_path()

        enabled = set()
        if mods_json_path.exists():
            try:
                data = json.loads(mods_json_path.read_text(encoding="utf-8"))
                for entry in data.get("mods", []):
                    if entry.get("enabled"):
                        mid = _match_id(entry)
                        if mid:
                            enabled.add(str(mid))
            except (OSError, json.JSONDecodeError):
                pass

        mods = []
        if mods_dir.exists():
            for item in mods_dir.iterdir():
                if not item.is_dir():
                    continue
                info = LocalModManager.read_mod_info(item)
                mod_id = info.get("static_id") or info.get("id") or item.name
                mods.append({
                    "id": mod_id,
                    "dir_name": item.name,
                    "title": info.get("title", item.name),
                    "version": info.get("version", "未知"),
                    "author": info.get("author", "未知"),
                    "enabled": mod_id in enabled or item.name in enabled,
                    "path": str(item),
                    "size": dir_size(item),
                })
        return mods

    @staticmethod
    def deploy_mod(mod_id):
        """搬运本地模组到 WeGame 目录（已存在则拒绝，除非 force）。"""
        return WeGameModManager._deploy(mod_id, force=False)

    @staticmethod
    def deploy_mod_force(mod_id):
        """强制搬运，覆盖 WeGame 目录中同名模组。"""
        return WeGameModManager._deploy(mod_id, force=True)

    @staticmethod
    def _deploy(mod_id, force: bool):
        config = load_config()
        local_dir = Path(config["mods_dir"]) / str(mod_id)
        if not local_dir.exists():
            return {"success": False, "error": f"本地模组 {mod_id} 不存在"}

        wegame_dir = Path(config["wegame_mods_dir"])
        wegame_dir.mkdir(parents=True, exist_ok=True)
        target_dir = wegame_dir / str(mod_id)

        if target_dir.exists() and not force:
            return {"success": False, "exists": True,
                    "error": f"模组 {mod_id} 已存在于 WeGame 目录中"}

        try:
            if target_dir.exists():
                shutil.rmtree(str(target_dir))
            shutil.copytree(str(local_dir), str(target_dir))
            WeGameModManager.toggle_mod(mod_id, True)  # 自动注册为启用
            return {"success": True, "message": f"模组 {mod_id} 搬运成功"}
        except OSError as exc:
            return {"success": False, "error": str(exc)}

    @staticmethod
    def toggle_mod(mod_id, enabled):
        """启用 / 禁用：写 mods.json（兼容 WeGame 原版格式与简化格式）。"""
        mods_json_path = _mods_json_path()
        try:
            data = (json.loads(mods_json_path.read_text(encoding="utf-8"))
                    if mods_json_path.exists()
                    else {"version": 1, "mods": [], "mod_load_in_progress": False})

            is_wegame_format = "version" in data

            found = False
            for entry in data.setdefault("mods", []):
                mid = _match_id(entry)
                if mid == mod_id or mid == str(mod_id):
                    entry["enabled"] = enabled
                    found = True
                    break

            if not found:
                if is_wegame_format:
                    data["mods"].append({
                        "label": {"distribution_platform": 2, "id": str(mod_id),
                                  "title": str(mod_id), "version": 0},
                        "status": 1,
                        "enabled": enabled,
                        "enabledForDlc": ["EXPANSION1_ID"],
                        "crash_count": 0,
                        "reinstall_path": None,
                        "staticID": str(mod_id),
                    })
                else:
                    data["mods"].append({"modId": str(mod_id), "enabled": enabled,
                                         "name": str(mod_id)})

            mods_json_path.parent.mkdir(parents=True, exist_ok=True)
            mods_json_path.write_text(
                json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
            return {"success": True,
                    "message": f"模组 {mod_id} 已{'启用' if enabled else '禁用'}"}
        except (OSError, json.JSONDecodeError) as exc:
            return {"success": False, "error": str(exc)}

    @staticmethod
    def uninstall_mod(mod_id):
        """从 WeGame 目录卸载，并同步清理 mods.json 条目。"""
        config = load_config()
        mod_dir = Path(config["wegame_mods_dir"]) / str(mod_id)
        if not mod_dir.exists():
            return {"success": False, "error": "模组不存在"}

        try:
            shutil.rmtree(str(mod_dir))
            mods_json_path = _mods_json_path(config)
            if mods_json_path.exists():
                data = json.loads(mods_json_path.read_text(encoding="utf-8"))
                data["mods"] = [
                    m for m in data.get("mods", [])
                    if str(_match_id(m) or "") not in (str(mod_id),)
                ]
                mods_json_path.write_text(
                    json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
            return {"success": True, "message": f"模组 {mod_id} 已卸载"}
        except (OSError, json.JSONDecodeError) as exc:
            return {"success": False, "error": str(exc)}
