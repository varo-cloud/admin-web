# Varo Admin Console

Varo 管理后台前端工程，基于 Vue 3 + TypeScript + Vite + Naive UI。

## 开发

```bash
npm install
npm run dev
```

默认启用 Mock API（`VITE_USE_MOCK=true`）。

### Mock 登录

- 管理员邮箱：`admin@varo.cloud`
- 验证码：任意 6 位数字
- 非 admin 邮箱登录后会被拒绝访问

## 环境变量

| 变量 | 说明 |
|---|---|
| `VITE_USE_MOCK` | 是否启用 mock（默认 true） |
| `VITE_API_BASE_URL` | 后端 API 根路径 |
| `VITE_TURNSTILE_SITE_KEY` | Cloudflare Turnstile Site Key |

## 页面

- P0：登录、仪表盘、用户、模型、任务、充值订单
- P1：API Keys、定价、系统配置、审计日志

## 构建

```bash
npm run build
npm run preview
```
