# 更新日志

## [1.1.1] - 2026-10-19

### 变更
- **许可证改为 [PolyForm Noncommercial 1.0.0](LICENSE)**：允许个人使用、修改、二次开发、免费分发；**禁止商用与倒卖**（收费分发、付费墙后提供、捆绑进付费产品/服务、企业用于商业经营）。商用需向作者单独申请授权。
  - 说明：1.1.0（MIT）已分发出去的副本仍受当时条款约束，许可证变更不追溯；从本版本起的发布以新条款为准。

## [1.1.0] - 2026-10-19

代码重构版（功能与 1.0.0 完全一致，接口路径不变）。

### 新增
- `.env` 支持：密钥可直接放同目录 `.env`（`STEAM_WEB_API_KEY` / `BAIDU_APP_ID` / `BAIDU_SECRET_KEY`），无需写进 `config.json`。
- `config.example.json`：作为配置模板，`config.json` 首次运行自动生成。
- `docs/steam-api-key.md`：Steam Web API Key 申请图文教程。

### 修复
- **代码重构版上线的回归修复**（2026-10-19 独立验收发现）：
  - `onimod/routes.py` 漏了 `import zipfile`，「手动导入 ZIP」上传非 zip 文件或含非法路径的压缩包时直接 500（`NameError`），现恢复为 `{"success": false, "error": ...}` 的友好提示。**接口路径与成功路径行为不变。**
  - `/api/preview/<path:filepath>` 之前直接把请求路径当绝对路径解析，前端拼出来的 `/api/preview/C:\Users\...\preview.png` 一律 403（本地模组预览图全部裂图）；现在会先去掉盘符拼到模组库目录下解析，越界仍返回 403。
  - 右侧「模组详情」面板的预览图用的是模组对象里的**本地绝对路径**，浏览器把它当相对 URL 请求，本地模组详情图必然裂图；现与卡片网格统一走 `/api/preview/`。
  - 侧边栏版本号写死 `v1.0.0`，与实际版本不符；改为由后端注入 `__version__`（单一版本来源）。
- **死锁**：`clear_history()` 在持有非可重入锁时又调用 `_save_history()`，导致「清空下载历史」接口永久卡住。
- **下载队列停摆**：原实现每个任务只派发一个下载，完成后不会继续消化队列（超过并发上限的任务永远排不上）。现由 `_pump()` 持续派发。
- **取消无效**：`cancel()` 只改状态、不中断在途下载；现在下载循环会检查取消标志并真正中止。
- **zip-slip 安全漏洞**：解压未校验条目路径，恶意压缩包可写到目标目录之外；现已拦截。
- **顶层目录判定错误**：改用字符串前缀（`mod1/` 与 `mod10/` 会被误判），现按路径段判断。
- **无效下载源**：移除写错的兜底链接（原为异星工厂接口）。
- **mods.json 路径写死**：改为跟随 `config.wegame_mods_dir` 推导。
- 预览图 MIME 类型不再一律当成 PNG。

### 修复（2026-10-19 实机联调，WeGame + 真实 API Key 环境）

- **模组名显示成文件夹 ID**：缺氧把 `title` / `description` / `author` 写在 `mod.yaml`（`mod_info.yaml` 只有版本与 API 号），原实现只读 `mod_info.yaml`；且 `mod.yaml` 常带 UTF-8 BOM，`startswith("title:")` 匹配不到。现两处都读，并按 `utf-8-sig` 解码。
- **搬运目标目录**：游戏只扫 `…\mods\local\<id>\`。当配置指向 `…\mods` 时，搬运会把模组铺在 `mods\<id>`（游戏里显示「未找到兼容」）。现统一落到 `mods\local`，目录不存在则自动新建；安装/卸载同样按此解析（并兼容老版本铺错的位置）。
- **网络抖动导致界面变假数据**：Steam 接口请求改为带重试（对连接异常与 429/5xx 退避重试，整体 20 秒预算），避免偶发丢包就把创意工坊整个降级成示例数据。
- **降级提示不再撒谎**：连不上时提示「创意工坊接口暂时连不上（具体原因）」而不是一律「未配置 Steam API Key」，并把 `error` 一并返回。
- 预览图候选名补充 `thumbnail.png` / `screen1.png` / `screen.png`（不少模组没放 `preview.png`）。
- **接口冷启动慢**：改用 `requests.Session` 复用连接（Steam 接口从 12~15 秒降到 0.3 秒）。
- **下载易被丢包打断**：下载前对直链请求重试 3 次；直链解析复用 `SteamWorkshopAPI.resolve_file_url`，不再维护第二份实现。

### 变更
- 硬编码密钥全部移除：Steam API Key、百度翻译 appid/secret 改由 `config.json` / `.env` 提供。
- `config.json` 与下载历史不再进仓库（见 `.gitignore`）。
- 前端拆分：`index.html`（约 2100 行）拆为 `templates/index.html` + `static/css/style.css` + `static/js/app.js`（`static/js/i18n.js`、`static/css/i18n.css` 是 1.0.0 起就独立的文件）。
- 后端拆分：单文件 `app.py`（约 1450 行）拆为 `onimod/` 包（config / utils / steam_api / downloader / local_mods / wegame / translate / routes，外加 `__init__.py` 应用工厂与 `mock_data.py` 示例数据）。
- 第三方中转下载站改为默认关闭（`allow_third_party_sources`），主路径回归官方 Steam Web API。
- 修正设置接口的误导性注释（原注释称「隐藏敏感信息」但实际回传完整配置）。

## [1.0.0]

初始版本（AI 辅助生成的原型）：创意工坊搜索、下载队列、本地模组库、WeGame 一键搬运、五语言界面。
