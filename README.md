# Varo Admin Console

Varo 管理后台前端工程，基于 Vue 3 + TypeScript + Vite + Naive UI。

## 开发

```bash
npm install
npm run dev
```

默认启用 Mock API（`VITE_USE_MOCK=true`）。复制 `.env.example` 为 `.env.development` 可覆盖本地配置。

### 转发到本地 / 远程后端

**分路代理**（user profile 与 admin 接口在不同服务上，本地常见场景）：

```bash
VITE_USE_MOCK=false
VITE_API_BASE_URL=/api
VITE_DEV_USER_API_PROXY_TARGET=http://localhost:8000   # /api/user、/api/auth
VITE_DEV_ADMIN_API_PROXY_TARGET=http://localhost:8001 # /api/admin/*
VITE_DEV_AUTH_TOKEN=你的admin_access_token            # 可选，免登录联调
```

**单后端**（所有 `/api` 指向同一地址，如 staging）：

```bash
VITE_USE_MOCK=false
VITE_API_BASE_URL=/api
VITE_DEV_API_PROXY_TARGET=https://staging.api.varo.cloud
```

重启 `npm run dev` 后生效。`VITE_USE_MOCK` 必须为 `false`，否则 Mock 会拦截请求。

### Mock 开发（离线）

```bash
VITE_USE_MOCK=true
# 不设置 VITE_DEV_API_PROXY_TARGET
```

无 token 时会自动写入 mock admin token，可直接进入后台。

### 与主站同域部署

生产环境无需代理；与主站共享 `auth_token` / `refresh_token`，仅 `role === admin` 可访问。

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

生产构建（GitHub Pages）在 workflow 中注入：

- `VITE_BASE=/admin-web/` — 子路径部署
- `VITE_USE_MOCK=false` — 请求真实后端
- `VITE_API_BASE_URL=https://staging.admin.varo.cloud/api` — Admin API 地址

本地预览时可在 `.env.production` 中配置相同变量后执行 `npm run preview:pages`。

## 环境变量

| 变量 | 说明 |
|---|---|
| `VITE_USE_MOCK` | 开发时是否启用 mock（`true` / `false`） |
| `VITE_API_BASE_URL` | API 根路径；部署为 `https://staging.admin.varo.cloud/api` |
| `VITE_DEV_USER_API_PROXY_TARGET` | **仅 dev**：`/api/user`、`/api/auth` 代理目标 |
| `VITE_DEV_ADMIN_API_PROXY_TARGET` | **仅 dev**：`/api/admin/*` 代理目标 |
| `VITE_DEV_API_PROXY_TARGET` | **仅 dev**：单后端模式，所有 `/api` 代理到同一目标 |
| `VITE_DEV_AUTH_TOKEN` | **仅 dev**：写入 localStorage 的 admin token |
| `VITE_BASE` | 部署 base path（GitHub Pages 为 `/admin-web/`） |

## 页面

- P0：登录、仪表盘、用户、模型、任务、充值订单
- P1：API Keys、定价、系统配置、审计日志

## 构建

```bash
npm run build        # 生产构建（含 GitHub Pages 配置）
npm run preview      # 预览 dist
```
