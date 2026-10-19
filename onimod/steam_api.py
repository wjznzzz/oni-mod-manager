# -*- coding: utf-8 -*-
"""Steam 创意工坊接口封装。

主路径是 **官方 Steam Web API**：
- 搜索：``IPublishedFileService/QueryFiles``（需要 API Key）
- 详情：``ISteamRemoteStorage/GetPublishedFileDetails``（返回 ``file_url`` 直链）

无 Key 时降级为解析 Steam 社区页面（可能因页面改版失效）。
"""
from __future__ import annotations

import re
import time

import requests

from .config import load_config, secret

ONI_APP_ID = 457140

# 复用连接：本机网络新建连接偶发丢包，每次重新握手会让接口慢到十几秒
_SESSION = requests.Session()
_SESSION.mount("https://", requests.adapters.HTTPAdapter(pool_connections=8, pool_maxsize=16))
_SESSION.mount("http://", requests.adapters.HTTPAdapter(pool_connections=8, pool_maxsize=16))


class SteamWorkshopAPI:
    """Steam 创意工坊 API 封装。"""

    ONI_APP_ID = ONI_APP_ID

    QUERY_TYPE_MAP = {
        "popular": 0,   # ranked by trend over lifetime
        "newest": 1,    # ranked by publication date
        "rating": 3,    # ranked by votes
    }

    TAG_MAP = {
        "功能": "Mod",
        "美化": "Graphics",
        "建筑": "Building",
        "玩法": "Gameplay",
        "工具": "Utility",
        "生物": "Creatures",
        "世界": "World",
    }

    UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
          "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")

    # ---------------------------------------------------------------- helpers
    RETRIES = 3

    @staticmethod
    def _request(method, url, *, params=None, data=None, proxies=None,
                 timeout=12, retries=None, headers=None, max_total=20.0):
        """带重试的 HTTP 请求（返回 response，重试耗尽则抛异常）。

        校园网/家庭网络新建连接偶发丢包（实测约 15% 丢 SYN），单次失败就让界面
        掉回「示例数据」体验很差，所以对连接异常与 429/5xx 都退避重试。
        ``max_total`` 是整体时间预算，避免前端一直转圈。
        """
        attempts = SteamWorkshopAPI.RETRIES if retries is None else retries
        merged = {"User-Agent": SteamWorkshopAPI.UA, "Accept": "application/json"}
        if headers:
            merged.update(headers)

        started = time.time()
        last_error = "request failed"
        for attempt in range(attempts):
            try:
                budget = max(2.0, min(timeout, max_total - (time.time() - started)))
                resp = _SESSION.request(method, url, params=params, data=data,
                                        headers=merged, timeout=budget, proxies=proxies)
                if resp.status_code != 429 and resp.status_code < 500:
                    return resp
                last_error = f"HTTP {resp.status_code}"
            except requests.RequestException as exc:
                last_error = f"{type(exc).__name__}: {exc}"
            if attempt < attempts - 1 and (time.time() - started) < max_total:
                time.sleep(min(0.6 * (2 ** attempt), 2.0))
            else:
                break
        raise RuntimeError(last_error)

    @staticmethod
    def _get_api_key():
        """Steam Web API Key：config.json 优先，其次环境变量 STEAM_WEB_API_KEY。"""
        return secret(load_config(), "steam_api_key", "STEAM_WEB_API_KEY")

    @staticmethod
    def _get_proxy() -> dict:
        """代理：优先 config.proxy，其次读 Windows 系统代理。"""
        config = load_config()
        if config.get("proxy"):
            return {"http": config["proxy"], "https": config["proxy"]}
        try:
            import winreg
            key = winreg.OpenKey(
                winreg.HKEY_CURRENT_USER,
                r"Software\Microsoft\Windows\CurrentVersion\Internet Settings")
            try:
                enabled, _ = winreg.QueryValueEx(key, "ProxyEnable")
                if enabled:
                    server, _ = winreg.QueryValueEx(key, "ProxyServer")
                    proxy = server if "://" in server else f"http://{server}"
                    return {"http": proxy, "https": proxy}
            finally:
                winreg.CloseKey(key)
        except Exception:
            pass
        return {}

    # ---------------------------------------------------------------- search
    @staticmethod
    def search_mods(keyword="", page=1, per_page=20, sort="popular", category=""):
        """搜索模组。有 Key 走官方 API，无 Key 返回 ``success=False`` 让上层降级。"""
        proxies = SteamWorkshopAPI._get_proxy()
        api_key = SteamWorkshopAPI._get_api_key()
        if not api_key:
            return {
                "success": False,
                "error": "missing_api_key",
                "notice": "未配置 Steam API Key，当前展示示例数据。获取地址: "
                          "https://steamcommunity.com/dev/apikey",
            }

        try:
            params = {
                "appid": ONI_APP_ID,
                "key": api_key,
                "query_type": SteamWorkshopAPI.QUERY_TYPE_MAP.get(sort, 0),
                "page": page,
                "numperpage": per_page,
                "search_text": keyword,
                "return_vote_data": "true",
                "return_tags": "true",
                "return_metadata": "true",
                "return_previews": "true",
                "return_short_description": "true",
            }
            if category and category in SteamWorkshopAPI.TAG_MAP:
                params["requiredtags"] = SteamWorkshopAPI.TAG_MAP[category]

            resp = SteamWorkshopAPI._request(
                "GET", "https://api.steampowered.com/IPublishedFileService/QueryFiles/v1/",
                params=params, proxies=proxies, timeout=12)
            data = resp.json()
            response = data.get("response")
            if response is not None:
                items = response.get("publishedfiledetails", [])
                return {
                    "success": True,
                    "total": response.get("total", len(items)),
                    "page": page,
                    "per_page": per_page,
                    "mods": SteamWorkshopAPI._parse_mod_list(items),
                    "source": "steam_api",
                }
        except Exception as exc:  # 网络 / 解析异常 → 上层降级
            return {"success": False, "error": str(exc), "error_kind": "network"}

        return {"success": False, "error": "empty_response"}

    @staticmethod
    def _parse_mod_list(items) -> list:
        mods = []
        for item in items:
            pfid = str(item.get("publishedfileid", ""))
            mods.append({
                "id": pfid,
                "title": item.get("title", "未知模组"),
                "description": (item.get("short_description", "") or item.get("description", ""))[:300],
                "author": item.get("creator", "未知作者"),
                "subscriptions": item.get("subscriptions", 0),
                "favorited": item.get("favorited", 0),
                "views": item.get("views", 0),
                "time_updated": item.get("time_updated", 0),
                "time_created": item.get("time_created", 0),
                "preview_url": item.get("preview_url", ""),
                "tags": [t.get("tag", "") for t in item.get("tags", [])],
                "file_size": int(item.get("file_size", 0) or 0),
                "url": f"https://steamcommunity.com/sharedfiles/filedetails/?id={pfid}",
            })
        return mods

    # ---------------------------------------------------------------- detail
    @staticmethod
    def _post_details(ids, proxy=None) -> list:
        """调用 GetPublishedFileDetails。

        注意：该接口**只接受 POST**，用 GET 会返回
        ``405 This API must be called with a HTTP POST request``（原版就是踩了这个坑，
        又被 ``except: pass`` 吞掉，导致详情页永远拿不到信息与 ``file_url``）。
        这个接口是公开的，不需要 API Key。
        """
        if isinstance(ids, str):
            ids = [ids]
        data = {"itemcount": len(ids)}
        for index, mod_id in enumerate(ids):
            data[f"publishedfileids[{index}]"] = str(mod_id)
        try:
            resp = SteamWorkshopAPI._request(
                "POST", "https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/",
                data=data, proxies=proxy, timeout=15,
                headers={"Content-Type": "application/x-www-form-urlencoded"})
            return resp.json().get("response", {}).get("publishedfiledetails") or []
        except Exception:
            return []

    @staticmethod
    def resolve_file_url(mod_id):
        """取模组的公开直链 ``file_url``（拿不到返回 None）。"""
        for item in SteamWorkshopAPI._post_details([mod_id],
                                                   SteamWorkshopAPI._get_proxy()):
            if str(item.get("publishedfileid")) == str(mod_id):
                return item.get("file_url") or None
        return None

    @staticmethod
    def get_mod_detail(mod_id):
        """模组详情：优先官方 API（含 file_url 直链），失败再抓社区页面降级。"""
        proxies = SteamWorkshopAPI._get_proxy()

        details = SteamWorkshopAPI._post_details([mod_id], proxies)
        if details:
            item = details[0]
            if item.get("result") == 1:
                return {
                    "success": True,
                    "source": "steam_api",
                    "mod": {
                        "id": str(mod_id),
                        "title": item.get("title", "未知模组"),
                        "description": item.get("description", ""),
                        "author": item.get("creator", "未知作者"),
                        "subscriptions": item.get("subscriptions", 0),
                        "favorited": item.get("favorited", 0),
                        "views": item.get("views", 0),
                        "time_updated": item.get("time_updated", 0),
                        "time_created": item.get("time_created", 0),
                        "preview_url": item.get("preview_url", ""),
                        "file_size": int(item.get("file_size", 0) or 0),
                        "file_url": item.get("file_url", ""),
                        "tags": [t.get("tag", "") for t in item.get("tags", [])],
                        "children": item.get("children", []),
                        "url": f"https://steamcommunity.com/sharedfiles/filedetails/?id={mod_id}",
                    },
                }

        # 降级：解析社区页面（Steam 页面改版即可能失效）
        try:
            community_url = f"https://steamcommunity.com/sharedfiles/filedetails/?id={mod_id}&l=schinese"
            html = SteamWorkshopAPI._request(
                "GET", community_url, proxies=proxies, timeout=15,
                headers={"Accept": "text/html"}).text

            desc_match = re.search(
                r'<div class="workshopItemDescription"[^>]*id="highlightContent"[^>]*>(.*?)</div>',
                html, re.DOTALL)
            description = re.sub(r"<[^>]+>", "", desc_match.group(1)).strip() if desc_match else ""

            title_match = re.search(r'<div class="workshopItemTitle">([^<]+)</div>', html)
            title = title_match.group(1).strip() if title_match else "未知模组"

            author_match = re.search(r'workshopItemAuthorName.*?>.*?<a[^>]*>(.*?)</a>',
                                     html, re.DOTALL)
            author = author_match.group(1).strip() if author_match else "未知作者"

            if title != "未知模组":
                return {
                    "success": True,
                    "mod": {
                        "id": str(mod_id), "title": title, "description": description,
                        "author": author, "subscriptions": 0, "favorited": 0, "views": 0,
                        "time_updated": 0, "time_created": 0, "preview_url": "",
                        "file_size": 0, "file_url": "", "tags": [], "children": [],
                        "url": community_url,
                    },
                    "source": "community_html",
                }
        except Exception:
            pass

        return {"success": False, "error": "获取模组详情失败"}

    @staticmethod
    def get_popular_mods(limit=20):
        return SteamWorkshopAPI.search_mods(keyword="", page=1, per_page=limit, sort="popular")
