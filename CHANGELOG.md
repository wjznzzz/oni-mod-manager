# 更新日志

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

### 变更
- 硬编码密钥全部移除：Steam API Key、百度翻译 appid/secret 改由 `config.json` / `.env` 提供。
- `config.json` 与下载历史不再进仓库（见 `.gitignore`）。
- 前端拆分：`index.html`（约 2100 行）拆为 `templates/index.html` + `static/css/style.css` + `static/js/app.js`（`static/js/i18n.js`、`static/css/i18n.css` 是 1.0.0 起就独立的文件）。
- 后端拆分：单文件 `app.py`（约 1450 行）拆为 `onimod/` 包（config / utils / steam_api / downloader / local_mods / wegame / translate / routes，外加 `__init__.py` 应用工厂与 `mock_data.py` 示例数据）。
- 第三方中转下载站改为默认关闭（`allow_third_party_sources`），主路径回归官方 Steam Web API。
- 修正设置接口的误导性注释（原注释称「隐藏敏感信息」但实际回传完整配置）。

## [1.0.0]

初始版本（AI 辅助生成的原型）：创意工坊搜索、下载队列、本地模组库、WeGame 一键搬运、五语言界面。
