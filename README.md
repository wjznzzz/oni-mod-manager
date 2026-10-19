# ONI Mod Manager · 缺氧创意工坊模组管理器

> 给 **WeGame / Epic / 离线版《缺氧》** 玩家用的创意工坊模组获取与管理工具：
> 在线搜索 Steam 创意工坊 → 下载 → 一键搬运进 WeGame 版《缺氧》。

> **当前版本：v1.1.0**（重构版，接口与 v1.0.0 完全一致，详见 [CHANGELOG](CHANGELOG.md)）

[English README](README.en.md) · [更新日志](CHANGELOG.md) · [申请 Steam Web API Key](docs/steam-api-key.md)

**📦 直接下载：[最新版 v1.1.0 zip](https://github.com/wjznzzz/oni-mod-manager/releases/latest)**（免安装，解压后双击 `install.bat`）

<!-- 界面截图：docs/screenshot.png -->
![界面预览](docs/screenshot.png)

---

## ⚠️ 免责声明

- 本工具**非 Klei / Valve / 腾讯官方工具**，与上述公司无任何关联。
- 数据来自 **Steam 官方 Web API**（公开接口），不抓取、不绕过任何登录或付费限制。
- 请仅在你**合法拥有**《缺氧》的前提下使用本工具获取模组，并遵守 Steam 服务条款与各模组作者的授权协议。
- 使用本工具产生的一切后果由使用者自行承担。

---

## 为什么需要它

《缺氧》在 Steam 上有创意工坊，而 **WeGame 版 / Epic 版 / 离线版没有**。
但各版本的模组目录结构是**一样的**（`Documents\Klei\OxygenNotIncludedTGP\mods`），
差别只是「没有工坊可以点订阅」。

本工具把缺的那一段补上：搜索、下载、解压、注册启用状态，一条龙。

## 功能

- **创意工坊浏览** — 搜索、排序（热度/最新/评分）、按分类筛选、网格/列表切换、详情面板
- **下载管理** — 队列、并发、实时进度与速度、暂停/取消/重试、下载历史、手动导入 ZIP
- **本地模组库** — 自动读取 `mod_info.yaml/json` 元信息、预览图、删除、打开目录
- **WeGame 管理** — 本地库 ⇄ 已安装分栏、一键批量搬运、启用/禁用（写 `mods.json`）、卸载
- **设置** — 路径自动探测、下载源、并发数、代理、通知开关、API Key
- **界面** — 深色缺氧风 UI，内置 **中/英/日/韩/俄** 五语言

## 快速开始

### 一键安装

1. 安装 [Python 3.8+](https://www.python.org/downloads/)（安装时勾选 **Add Python to PATH**）
2. 双击 **`install.bat`** — 自动建虚拟环境并装依赖（走清华镜像）
3. 双击 **`start.bat`** — 启动服务并自动打开浏览器

访问地址：<http://127.0.0.1:9420>

### 手动运行

```bash
pip install -r requirements.txt
python app.py
```

### 首次使用

1. 按 [docs/steam-api-key.md](docs/steam-api-key.md) 申请一个免费 Steam Web API Key（约 60 秒）
2. 打开工具 → 设置 → 填入 Key → 保存
3. 回到「创意工坊」页，搜索并下载模组
4. 到「WeGame 管理」页勾选模组 → 一键搬运 → 启动游戏即可

> 没填 Key 也能打开界面，但工坊页只会显示**示例数据**（明显标注，非实时）。

---

## 下载原理（三条路径，按优先级）

| 路径 | 说明 | 状态 |
|------|------|------|
| ① 官方 API 直链 | `ISteamRemoteStorage/GetPublishedFileDetails` 返回的公开 `file_url`，直接下载 | ✅ 主路径 |
| ② 社区页面解析 | 无 Key 时从模组页面解析标题/作者/简介（仅详情展示，**不含文件**） | ⚠️ 降级，页面改版可能失效 |
| ③ 第三方中转站 | 需在设置中显式打开 `allow_third_party_sources` | ⚠️ **默认关闭**，多数已失效，不推荐 |
| ④ 手动导入 ZIP | 「下载管理 → 导入 ZIP」，自己找的模组包直接装 | ✅ 兜底，始终可用 |

部分模组作者限制了下载权限，官方接口不会返回直链 —— 这属于正常情况，请走路径 ④。

## 目录结构

```
ONIModManager/
├── app.py                  # 启动入口
├── onimod/                 # 后端包
│   ├── __init__.py         # 应用工厂 create_app() / 版本号
│   ├── config.py           # 配置 / 密钥读取
│   ├── utils.py            # 安全解压（防 zip-slip）等
│   ├── steam_api.py        # Steam 创意工坊接口
│   ├── downloader.py       # 下载队列
│   ├── local_mods.py       # 本地模组库
│   ├── wegame.py           # WeGame 搬运 / mods.json
│   ├── translate.py        # 百度翻译（可选）
│   ├── mock_data.py        # 离线示例数据
│   └── routes.py           # HTTP 路由
├── templates/index.html
├── static/css/style.css    # 主样式
├── static/css/i18n.css     # 多语言样式
├── static/js/app.js        # 前端逻辑
├── static/js/i18n.js       # 多语言词条
├── install.bat / start.bat
├── config.example.json     # 配置模板
└── docs/steam-api-key.md
```

## 配置说明

首次运行自动生成 `config.json`（模板见 `config.example.json`）。

| 字段 | 说明 |
|------|------|
| `download_dir` | 下载缓存目录（默认直接落 `…\OxygenNotIncludedTGP\mods\local`） |
| `mods_dir` | 本地模组库（先下这里，再搬运） |
| `wegame_game_dir` | WeGame 游戏安装目录，留空则自动探测 |
| `wegame_mods_dir` | WeGame 版 mods 目录（实际模组放在其下的 `local\`；`mods.json` 在它上一级） |
| `wegame_mods_json` | `mods.json` 的完整路径（留空则按 `wegame_mods_dir` 推导） |
| `steam_api_key` | Steam Web API Key（**留空则只显示示例数据**） |
| `baidu_app_id` / `baidu_secret_key` | 可选，用于模组简介翻译 |
| `allow_third_party_sources` | 是否启用第三方中转站（默认 `false`） |
| `max_download_threads` | 最大并发下载数（默认 3） |
| `proxy` | HTTP 代理，如 `http://127.0.0.1:7890` |

### 密钥放哪里

**推荐 `.env`**（已在 `.gitignore` 中，不会被提交）：

```
STEAM_WEB_API_KEY=你的Key
```

或写进 `config.json` 的 `steam_api_key` 字段（同样已被 gitignore 忽略）。

## 常见问题

| 问题 | 解决 |
|------|------|
| 工坊页都是「示例数据」 | 没填 API Key，见 [docs/steam-api-key.md](docs/steam-api-key.md) |
| 下载失败 / 提示无直链 | 该模组作者限制了权限，改用「导入 ZIP」 |
| WeGame 路径未检测到 | 设置里手动指定，或确认游戏确实装在常见目录 |
| 搬运提示「已存在」 | 选择覆盖（force）或跳过 |
| 启用/禁用不生效 | 确认 `mods.json` 路径正确、游戏已关闭 |
| 换模组不生效 | 替换 mod 文件需在**游戏未运行**时进行 |

## 开发

```bash
python app.py          # 开发模式（Flask 内置服务器，仅本机）
python -m py_compile app.py onimod/__init__.py onimod/config.py onimod/utils.py onimod/steam_api.py onimod/downloader.py onimod/local_mods.py onimod/wegame.py onimod/translate.py onimod/mock_data.py onimod/routes.py   # 语法自检

# 或者用标准库自动遍历（跨平台，Windows 下也可用）：
python -c "import compileall,sys; sys.exit(0 if compileall.compile_dir('onimod', quiet=1) and compileall.compile_file('app.py', quiet=1) else 1)"
```

打包为单文件 EXE（可选）：

```bash
pip install pyinstaller
pyinstaller -F -n ONIModManager --add-data "templates;templates" --add-data "static;static" app.py
```

## 许可

[MIT](LICENSE)
