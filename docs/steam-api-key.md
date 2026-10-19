# 申请 Steam Web API Key

本工具用 **Steam 官方 Web API** 搜索创意工坊、获取模组直链。Key 免费、即时发放。

> 只需 **60 秒**，无需信用卡、无需开发者资格。

## 步骤

### 1. 登录 Steam

浏览器打开 <https://steamcommunity.com/dev/apikey>，用你的 Steam 账号登录。

> 没有 Steam 账号？到 <https://store.steampowered.com/join> 免费注册一个（免费账号也能申请 Key）。

### 2. 填写域名

页面会要求填写 **Domain Name**：

- 随便填即可（例如 `onimodmanager`、`localhost`、`example.com`）——只是形式字段，不会校验。
- 勾选同意《Steam Web API 使用条款》。

### 3. 复制 Key

点击 **Register**，页面会立刻显示一串 **32 位十六进制**字符串，例如：

```
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

复制它。

### 4. 填进本工具

打开工具 → 左下角 **设置** → 把 Key 粘进 **Steam Web API Key** 输入框 → 保存。

或直接写进项目根目录的 `config.json`：

```json
{
  "steam_api_key": "你的32位Key"
}
```

也可以放 `.env`（更安全，`.env` 已被 `.gitignore` 忽略）：

```
STEAM_WEB_API_KEY=你的32位Key
```

## 注意事项

- **不要泄露给别人**。这个 Key 代表你的账号调用额度；泄露后请回到上面的页面重新生成（旧的会失效）。
- **不要提交进 Git**。本仓库的 `.gitignore` 已忽略 `config.json` 与 `.env`。
- **有额度上限**：约每天 10 万次调用。正常搜索、下载用不完；但不要把 Key 塞进批量脚本疯狂轮询。
- 拿不到直链的模组（作者设置了权限限制）属于正常现象——用「下载管理 → 导入 ZIP」手动导入即可。

## 常见问题

**Q：页面打不开 / 一直转圈？**
A：`steamcommunity.com` 在国内可能不稳定。可先在工具「设置」里填 HTTP 代理，或稍后重试；`api.steampowered.com` 通常比社区页面稳。

**Q：申请时提示「You must have a valid Steam account」？**
A：确认账号邮箱已验证，且账号没有被限制（受限账号无法申请）。

**Q：填了 Key 还是显示示例数据？**
A：检查 Key 有没有多余空格；保存后再回工坊页刷新一次。
