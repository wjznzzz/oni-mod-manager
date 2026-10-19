# -*- coding: utf-8 -*-
"""HTTP 路由（Flask Blueprint）。URL 与原版完全一致，前端无需改动。"""
from __future__ import annotations

import re
import zipfile
from datetime import datetime
from pathlib import Path

from flask import Blueprint, jsonify, render_template, request, send_from_directory

from . import translate as translate_mod
from .config import DEFAULT_CONFIG, ensure_dirs, load_config, save_config
from .downloader import download_manager
from .local_mods import LocalModManager
from .mock_data import get_mock_mods
from .steam_api import SteamWorkshopAPI
from .utils import safe_extract_zip, sanitize_filename
from .wegame import WeGameModManager

bp = Blueprint("onimod", __name__)

_IMAGE_MIME = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
               ".gif": "image/gif", ".webp": "image/webp"}


# ─────────────────────────────────────────────────────────────── 创意工坊
@bp.route("/api/workshop/search")
def api_workshop_search():
    keyword = request.args.get("keyword", "")
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 20))
    sort = request.args.get("sort", "popular")
    category = request.args.get("category", "")

    result = SteamWorkshopAPI.search_mods(keyword, page, per_page, sort, category)
    if result.get("success"):
        return jsonify(result)

    # 无 Key / 接口不可用 → 降级为示例数据（前端另有提示条）
    mods = get_mock_mods(keyword, per_page)
    return jsonify({
        "success": True, "total": len(mods), "page": 1, "per_page": per_page,
        "mods": mods, "mock": True,
        "notice": "未配置 Steam API Key，当前显示示例数据。获取地址: "
                  "https://steamcommunity.com/dev/apikey",
    })


@bp.route("/api/workshop/popular")
def api_workshop_popular():
    limit = int(request.args.get("limit", 20))
    result = SteamWorkshopAPI.get_popular_mods(limit)
    if not result.get("success") or not result.get("mods"):
        result = {"success": True, "mods": get_mock_mods("", limit), "mock": True,
                  "notice": "未配置 Steam API Key，当前显示示例数据。"}
    return jsonify(result)


@bp.route("/api/workshop/detail/<mod_id>")
def api_workshop_detail(mod_id):
    result = SteamWorkshopAPI.get_mod_detail(mod_id)
    if not result.get("success"):
        for mod in get_mock_mods("", 50):
            if mod["id"] == mod_id:
                return jsonify({"success": True, "mod": mod, "mock": True})
        return jsonify({"success": False, "error": "未找到该模组"})
    return jsonify(result)


# ─────────────────────────────────────────────────────────────── 下载管理
@bp.route("/api/download/start", methods=["POST"])
def api_download_start():
    data = request.json or {}
    mod_id = data.get("mod_id", "")
    if not mod_id:
        return jsonify({"success": False, "error": "缺少模组ID"})
    return jsonify(download_manager.add_to_queue(
        mod_id, data.get("mod_name", "未知模组"),
        data.get("mod_url", ""), data.get("download_source", "steam_cdn")))


@bp.route("/api/download/status")
def api_download_status():
    return jsonify(download_manager.get_status())


@bp.route("/api/download/cancel", methods=["POST"])
def api_download_cancel():
    download_manager.cancel((request.json or {}).get("mod_id", ""))
    return jsonify({"success": True, "message": "下载已取消"})


@bp.route("/api/download/clear_history", methods=["POST"])
def api_download_clear_history():
    download_manager.clear_history()
    return jsonify({"success": True, "message": "下载历史已清空"})


@bp.route("/api/download/import", methods=["POST"])
def api_download_import():
    """手动导入模组压缩包（官方直链不可用时的兜底方式）。"""
    file = request.files.get("file")
    if file is None or file.filename == "":
        return jsonify({"success": False, "error": "未选择文件"})

    config = load_config()
    temp_zip = Path(config["download_dir"]) / sanitize_filename(Path(file.filename).name)
    temp_zip.parent.mkdir(parents=True, exist_ok=True)
    file.save(str(temp_zip))

    try:
        mod_name = sanitize_filename(Path(file.filename).stem, fallback="imported_mod")
        extract_dir = safe_extract_zip(temp_zip, Path(config["mods_dir"]) / mod_name)
        return jsonify({"success": True, "message": f"模组 {mod_name} 导入成功",
                        "mod_path": str(extract_dir)})
    except zipfile.BadZipFile:
        return jsonify({"success": False, "error": "文件不是有效的 ZIP 压缩包"})
    except Exception as exc:
        return jsonify({"success": False, "error": str(exc)})
    finally:
        temp_zip.unlink(missing_ok=True)


# ─────────────────────────────────────────────────────────────── 本地模组库
@bp.route("/api/local/mods")
def api_local_mods():
    mods = LocalModManager.scan_mods()
    return jsonify({"success": True, "mods": mods, "total": len(mods)})


@bp.route("/api/local/mods/<mod_id>", methods=["DELETE"])
def api_local_delete_mod(mod_id):
    if LocalModManager.delete_mod(mod_id):
        return jsonify({"success": True, "message": f"模组 {mod_id} 已删除"})
    return jsonify({"success": False, "error": "删除失败，模组不存在"})


@bp.route("/api/local/mods/<mod_id>/open")
def api_local_open_mod(mod_id):
    if LocalModManager.open_mod_folder(mod_id):
        return jsonify({"success": True, "message": "已打开文件夹"})
    return jsonify({"success": False, "error": "模组不存在"})


# ─────────────────────────────────────────────────────────────── WeGame 管理
@bp.route("/api/wegame/detect")
def api_wegame_detect():
    return jsonify({"success": True, **WeGameModManager.detect_paths()})


@bp.route("/api/wegame/mods")
def api_wegame_mods():
    mods = WeGameModManager.get_installed_mods()
    return jsonify({"success": True, "mods": mods, "total": len(mods)})


@bp.route("/api/wegame/deploy", methods=["POST"])
def api_wegame_deploy():
    data = request.json or {}
    mod_id = data.get("mod_id", "")
    if not mod_id:
        return jsonify({"success": False, "error": "缺少模组ID"})
    if data.get("force"):
        return jsonify(WeGameModManager.deploy_mod_force(mod_id))
    return jsonify(WeGameModManager.deploy_mod(mod_id))


@bp.route("/api/wegame/batch_deploy", methods=["POST"])
def api_wegame_batch_deploy():
    data = request.json or {}
    mod_ids = data.get("mod_ids", [])
    force = data.get("force", False)
    deploy = WeGameModManager.deploy_mod_force if force else WeGameModManager.deploy_mod
    results = [{"mod_id": mid, **deploy(mid)} for mid in mod_ids]
    ok = sum(1 for r in results if r.get("success"))
    return jsonify({"success": True, "results": results,
                    "summary": f"{ok}/{len(mod_ids)} 个模组搬运成功"})


@bp.route("/api/wegame/toggle", methods=["POST"])
def api_wegame_toggle():
    data = request.json or {}
    mod_id = data.get("mod_id", "")
    if not mod_id:
        return jsonify({"success": False, "error": "缺少模组ID"})
    return jsonify(WeGameModManager.toggle_mod(mod_id, data.get("enabled", True)))


@bp.route("/api/wegame/uninstall", methods=["POST"])
def api_wegame_uninstall():
    mod_id = (request.json or {}).get("mod_id", "")
    if not mod_id:
        return jsonify({"success": False, "error": "缺少模组ID"})
    return jsonify(WeGameModManager.uninstall_mod(mod_id))


# ─────────────────────────────────────────────────────────────── 设置
@bp.route("/api/settings", methods=["GET"])
def api_get_settings():
    """返回完整配置。本工具只监听 127.0.0.1、单用户使用，
    因此设置页需要能看到/编辑自己的 Key（密钥只存在本机 config.json）。"""
    return jsonify(load_config())


@bp.route("/api/settings", methods=["POST"])
def api_update_settings():
    current = load_config()
    current.update(request.json or {})
    save_config(current)
    ensure_dirs()
    return jsonify({"success": True, "message": "设置已保存"})


@bp.route("/api/settings/reset", methods=["POST"])
def api_settings_reset():
    save_config(DEFAULT_CONFIG)
    ensure_dirs()
    return jsonify({"success": True, "message": "设置已重置为默认值"})


# ─────────────────────────────────────────────────────────────── 其它
@bp.route("/api/preview/<path:filepath>")
def api_preview_file(filepath):
    """模组预览图，只允许访问本地模组库目录内的文件。"""
    mods_dir = Path(load_config()["mods_dir"]).resolve()
    # 前端的预览地址是 ``/api/preview/`` + 绝对路径（见 /api/local/mods 的 preview 字段）。
    # 直接 Path(filepath) 会被 Windows 当成新根（C:\...），必须先去掉盘符再拼到 mods_dir 下；
    # 万一 mods_dir 不在该盘符（如被设置到了 OneDrive 重定向的文档目录）则回退用原始绝对路径，
    # 两种情况都要经过下面的 relative_to 越界检查。
    rel_path = re.sub(r"^[A-Za-z]:", "", filepath).lstrip("/\\")
    full_path = (mods_dir / rel_path).resolve()
    abs_path = Path(filepath)
    if not full_path.exists() and abs_path.is_absolute():
        full_path = abs_path.resolve()
    try:
        full_path.relative_to(mods_dir)
    except ValueError:
        return jsonify({"error": "禁止访问"}), 403
    if not full_path.exists():
        return jsonify({"error": "文件不存在"}), 404
    return send_from_directory(str(full_path.parent), full_path.name,
                               mimetype=_IMAGE_MIME.get(full_path.suffix.lower(), "image/png"))


@bp.route("/api/translate", methods=["POST"])
def api_translate():
    data = request.json or {}
    return jsonify(translate_mod.translate(data.get("text", ""), data.get("target", "zh")))


@bp.route("/api/health")
def api_health():
    from . import __version__
    return jsonify({"status": "ok", "version": __version__,
                    "timestamp": datetime.now().isoformat()})


@bp.route("/")
def index():
    from . import __version__
    return render_template("index.html", version=__version__)
