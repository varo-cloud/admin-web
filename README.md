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

## GitHub Pages 部署

仓库：`varo-cloud/admin-web`  
线上地址：**https://varo-cloud.github.io/admin-web/**

### 首次启用 GitHub Pages

1. 打开 GitHub 仓库 → **Settings** → **Pages**
2. **Source** 选择 **GitHub Actions**（不要选 Deploy from branch）
3. 将本次改动 push 到 `main` 分支，workflow 会自动构建并发布

### 本地预览 Pages 构建

```bash
npm run preview:pages
# 访问 http://localhost:4173/admin-web/
```

生产构建使用 `.env.production`：

- `VITE_BASE=/admin-web/` — 子路径部署
- `VITE_USE_MOCK=true` — 静态站点无后端，浏览器端 Mock 拦截 API

## 环境变量

| 变量 | 说明 |
|---|---|
| `VITE_USE_MOCK` | 是否启用 mock（默认 true） |
| `VITE_BASE` | 部署 base path（GitHub Pages 为 `/admin-web/`） |
| `VITE_TURNSTILE_SITE_KEY` | Cloudflare Turnstile Site Key |

## 页面

- P0：登录、仪表盘、用户、模型、任务、充值订单
- P1：API Keys、定价、系统配置、审计日志

## 构建

```bash
npm run build        # 生产构建（含 GitHub Pages 配置）
npm run preview      # 预览 dist
```
