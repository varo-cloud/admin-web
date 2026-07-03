# 管理后台 — 通用文件上传 API

供 `admin-web`「文件上传」页面对接。实现于 **Admin 服务**（`app.main_admin:app`），路径前缀 `/api/admin/*`。

## 接口总览

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/admin/upload` | 上传任意文件，返回可引用的 URL |
| DELETE | `/api/admin/upload` | 按 S3 key 删除已上传文件，释放存储 |

---

## POST /api/admin/upload

管理后台通用上传接口，用于 Hero 轮播、模型图标、运营素材等场景。与用户侧 `POST /api/upload` 不同，**不限制** `image/*` / `video/*` / `audio/*`，允许上传任意 MIME 类型（仍受大小与环境配置约束）。

### 认证

- **必需**：管理员 JWT（`Authorization: Bearer <token>`，且 `role = admin`）
- 非管理员 → `403`；未认证 / token 失效 → `401`

### 请求

- **Content-Type**：`multipart/form-data`

| 字段 | 必填 | 说明 |
|---|---|---|
| `file` | 是 | 上传的文件本体 |
| `prefix` | 否 | S3 对象 key 前缀，默认 `uploads`。仅允许 `[a-zA-Z0-9/_-]`，首尾 `/` 会被去掉 |

**示例（curl）**

```bash
curl -X POST 'https://staging.admin.varo.cloud/api/admin/upload' \
  -H 'Authorization: Bearer <admin_jwt>' \
  -F 'file=@./banner.png' \
  -F 'prefix=assets/hero'
```

### 响应 200（`data`）

统一信封：`{ "code": 0, "message": "ok", "data": { ... } }`

```json
{
  "url": "https://cdn.varo.cloud/uploads/mk1abc9xyz.png",
  "filename": "banner.png",
  "content_type": "image/png",
  "size_bytes": 245760,
  "key": "uploads/mk1abc9xyz.png"
}
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `url` | `string` | 可被前端 / 上游直接引用的 URL。配置了 `S3_PUBLIC_BASE_URL` 时为公开/CDN URL，否则为预签名 GET URL |
| `filename` | `string` | 原始文件名（basename） |
| `content_type` | `string` | 检测到的 MIME；未知时 `application/octet-stream` |
| `size_bytes` | `integer` | 文件字节数 |
| `key` | `string` | S3 对象 key，便于排查与生命周期管理 |

### 存储 key 规则（建议实现）

```
{prefix}/{uuid}{ext}
```

- `prefix`：请求字段或默认 `uploads`
- `uuid`：随机唯一 ID（建议 `uuid.uuid4().hex` 或时间戳 + 随机串）
- `ext`：取自原始文件名的扩展名（小写），无扩展名可省略

不在 key 中嵌入管理员 `user_id`，避免 URL 过长。

### 错误码

| HTTP | `code` | 含义 |
|---|---|---|
| 401 | 401 | 未登录 |
| 403 | 403 | 非管理员 |
| 413 | 413 | 超过 `UPLOAD_MAX_BYTES`（默认 50MB，与用户上传共用） |
| 503 | 503 | 未配置 `S3_BUCKET` |

### 环境变量

与用户上传共用，见 [`rest-api-zh.md`](https://github.com/varo-cloud/genflow-api/blob/main/docs/api/rest-api-zh.md#上传接口) / `docs/deploy/env-zh.md`：

| 变量 | 说明 |
|---|---|
| `S3_BUCKET` | 必填，未配置返回 503 |
| `S3_REGION` | 可选，默认 `ap-southeast-1` |
| `S3_PUBLIC_BASE_URL` | 可选，CDN/公开域名 |
| `S3_PRESIGN_EXPIRY` | 预签名 URL 有效期（秒） |
| `UPLOAD_MAX_BYTES` | 单文件上限，默认 `52428800`（50MB） |

### 实现参考（Python / FastAPI）

```python
import os
import re
import uuid
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.auth import verify_admin_jwt  # role == admin
from app import storage
from app.envelope import EnvelopeRoute

router = APIRouter(prefix="/api/admin/upload", tags=["admin-upload"], route_class=EnvelopeRoute)

_PREFIX_RE = re.compile(r"[^a-zA-Z0-9/_-]+")


def _sanitize_prefix(raw: str | None) -> str:
    value = (raw or "uploads").strip() or "uploads"
    cleaned = _PREFIX_RE.sub("", value).strip("/")
    return cleaned or "uploads"


@router.post("")
async def admin_upload(
    file: UploadFile = File(...),
    prefix: str | None = Form(None),
    claims: dict = Depends(verify_admin_jwt),
):
    if not storage.is_configured():
        raise HTTPException(status_code=503, detail="Upload storage not configured")

    data = await file.read()
    max_bytes = int(os.environ.get("UPLOAD_MAX_BYTES", str(50 * 1024 * 1024)))
    if len(data) > max_bytes:
        raise HTTPException(status_code=413, detail="File too large")

    filename = os.path.basename(file.filename or "file")
    ext = os.path.splitext(filename)[1].lower()
    key_prefix = _sanitize_prefix(prefix)
    key = f"{key_prefix}/{uuid.uuid4().hex}{ext}"

    content_type = file.content_type or "application/octet-stream"
    url = storage.put_object(key, data, content_type)

    return {
        "url": url,
        "filename": filename,
        "content_type": content_type,
        "size_bytes": len(data),
        "key": key,
    }
```

注册到 Admin app 的 router 列表即可。

---

## DELETE /api/admin/upload

删除 Admin 上传的文件（S3 对象），用于清理不再引用的素材以节省存储。

### 认证

同上传接口：管理员 JWT。

### 请求

- **Content-Type**：`application/json`

| 字段 | 必填 | 说明 |
|---|---|---|
| `key` | 是 | 上传时返回的 S3 对象 key（`POST` 响应中的 `key` 字段） |

**示例（curl）**

```bash
curl -X DELETE 'https://staging.admin.varo.cloud/api/admin/upload' \
  -H 'Authorization: Bearer <admin_jwt>' \
  -H 'Content-Type: application/json' \
  -d '{"key":"uploads/mk1abc9xyz.png"}'
```

### 响应 200（`data`）

```json
{
  "deleted": true,
  "key": "uploads/mk1abc9xyz.png"
}
```

### 错误码

| HTTP | `code` | 含义 |
|---|---|---|
| 400 | 400 | `key` 缺失 |
| 401 | 401 | 未登录 |
| 403 | 403 | 非管理员 |
| 404 | 404 | 对象不存在 |
| 503 | 503 | 未配置 `S3_BUCKET` |

### 实现参考（Python / FastAPI）

```python
@router.delete("")
async def admin_upload_delete(
    body: dict,
    claims: dict = Depends(verify_admin_jwt),
):
    if not storage.is_configured():
        raise HTTPException(status_code=503, detail="Upload storage not configured")

    key = str(body.get("key") or "").strip()
    if not key:
        raise HTTPException(status_code=400, detail="key is required")

    if not storage.delete_object(key):
        raise HTTPException(status_code=404, detail="Object not found")

    return {"deleted": True, "key": key}
```

需在 `app/storage.py` 增加 `delete_object(key) -> bool`（调用 `s3.delete_object`，404 时返回 `False`）。
