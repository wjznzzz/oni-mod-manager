# -*- coding: utf-8 -*-
"""模组简介翻译（百度翻译 API）。

凭据从 ``config.json`` 的 ``baidu_app_id`` / ``baidu_secret_key`` 或环境变量
``BAIDU_APP_ID`` / ``BAIDU_SECRET_KEY`` 读取 —— **不要写进代码**。
"""
from __future__ import annotations

import hashlib
import random

import requests

from .config import load_config, secret

API_URL = "https://fanyi-api.baidu.com/api/trans/vip/translate"


def translate(text: str, target: str = "zh") -> dict:
    text = (text or "").strip()
    if not text:
        return {"success": False, "error": "缺少翻译文本"}

    config = load_config()
    app_id = secret(config, "baidu_app_id", "BAIDU_APP_ID")
    secret_key = secret(config, "baidu_secret_key", "BAIDU_SECRET_KEY")
    if not (app_id and secret_key):
        return {"success": False,
                "error": "未配置百度翻译凭据（设置里填 baidu_app_id / baidu_secret_key，或用 .env）"}

    text = text[:5000]                      # 限制长度规避超时
    salt = str(random.randint(10000, 99999))
    sign = hashlib.md5((app_id + text + salt + secret_key).encode("utf-8")).hexdigest()

    try:
        resp = requests.post(API_URL, data={
            "q": text, "from": "auto", "to": target,
            "appid": app_id, "salt": salt, "sign": sign,
        }, timeout=15)
        result = resp.json()
        error_code = result.get("error_code")
        if error_code and error_code != "0":
            return {"success": False,
                    "error": f"百度翻译错误: {result.get('error_msg', error_code)}"}
        translated = "\n".join(item["dst"] for item in result.get("trans_result", []))
        return {"success": True, "translated": translated}
    except Exception as exc:
        return {"success": False, "error": f"翻译失败: {exc}"}
