# -*- coding: utf-8 -*-
"""配置加载与保存。

- ``config.json`` 属于用户本地文件，**不入库**（见 .gitignore）；首次运行自动生成。
- 密钥优先从 ``config.json`` 读取，其次读环境变量 / 同目录 ``.env``，避免把 key 写进代码。
"""
from __future__ import annotations

import json
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
CONFIG_FILE = BASE_DIR / "config.json"
CONFIG_EXAMPLE = BASE_DIR / "config.example.json"
ENV_FILE = BASE_DIR / ".env"
DATA_DIR = BASE_DIR / "data"

USER_HOME = Path.home()
DOCUMENTS = USER_HOME / "Documents"

# WeGame 版缺氧的存档目录（Klei 在国区 WeGame 版使用的目录名带 TGP 后缀）
ONI_WEGAME_DIR = DOCUMENTS / "Klei" / "OxygenNotIncludedTGP"
ONI_WEGAME_MODS_DIR = ONI_WEGAME_DIR / "mods"

DEFAULT_CONFIG = {
    # 下载缓存目录：默认直接落到 WeGame 的 local mods 目录
    "download_dir": str(ONI_WEGAME_MODS_DIR / "local"),
    # 本地模组库（先下到这里，再一键搬运到 WeGame）
    "mods_dir": str(DOCUMENTS / "ONIModManager" / "mods"),
    # WeGame 游戏安装目录：留空则启动时自动探测
    "wegame_game_dir": "",
    # 存放模组文件夹的目录：缺氧把本地模组装在 mods\local\<id>\ 下
    "wegame_mods_dir": str(ONI_WEGAME_MODS_DIR / "local"),
    # mods.json（记录启用状态）与 mods 目录同级，位于存档根目录下
    "wegame_mods_json": str(ONI_WEGAME_DIR / "mods.json"),
    "preferred_download_source": "steam_cdn",
    # 第三方中转站稳定性差且多已失效，默认关闭（详见 README「下载原理」）
    "allow_third_party_sources": False,
    "theme": "dark",
    "language": "zh",
    "proxy": "",
    "max_download_threads": 3,
    "auto_check_update": True,
    "notification_enabled": True,
    # 密钥一律留空，用户自行填写 / 或用 .env（STEAM_WEB_API_KEY 等）
    "steam_api_key": "",
    "baidu_app_id": "",
    "baidu_secret_key": "",
}


def _load_env_file() -> None:
    """极简 .env 解析（KEY=VALUE），仅为方便本地放密钥。"""
    if not ENV_FILE.exists():
        return
    try:
        for raw in ENV_FILE.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))
    except OSError:
        pass


_load_env_file()


def load_config() -> dict:
    """读取配置；缺失字段用默认值补齐；文件不存在则按默认值生成。"""
    if CONFIG_FILE.exists():
        try:
            data = json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
            if isinstance(data, dict):
                return {**DEFAULT_CONFIG, **data}
        except (json.JSONDecodeError, OSError, ValueError):
            pass
        return dict(DEFAULT_CONFIG)
    save_config(DEFAULT_CONFIG)
    return dict(DEFAULT_CONFIG)


def save_config(config: dict) -> None:
    CONFIG_FILE.write_text(
        json.dumps(config, ensure_ascii=False, indent=2), encoding="utf-8")


def ensure_dirs() -> None:
    """确保下载目录 / 模组库 / 数据目录存在。"""
    config = load_config()
    for key in ("download_dir", "mods_dir"):
        path = config.get(key)
        if path:
            Path(path).mkdir(parents=True, exist_ok=True)
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def secret(config: dict, config_key: str, env_key: str):
    """密钥取值：config.json 优先，其次环境变量 / .env；都没有则 None。"""
    value = (config.get(config_key) or "").strip()
    if not value:
        value = (os.environ.get(env_key) or "").strip()
    return value or None
