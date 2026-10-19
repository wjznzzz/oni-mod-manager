# -*- coding: utf-8 -*-
"""ONI Mod Manager —— 应用工厂。"""
from __future__ import annotations

from flask import Flask
from flask_cors import CORS

from .config import BASE_DIR, ensure_dirs

__version__ = "1.1.1"


def create_app() -> Flask:
    """创建 Flask 应用（静态资源与模板位于项目根目录）。"""
    app = Flask(
        __name__,
        static_folder=str(BASE_DIR / "static"),
        static_url_path="/static",
        template_folder=str(BASE_DIR / "templates"),
    )
    CORS(app)
    ensure_dirs()

    from .routes import bp
    app.register_blueprint(bp)
    return app
