# HBI-AAD Frontend (Vue 3 + TypeScript)

## ⚠️ 重要：不要杀掉后端进程

不要执行 `fuser -k 3000/tcp` 或任何 kill 后端进程的命令。后端进程不由前端 shell 管理，kill 命令无法正确终止后端进程（常驻的 workerd 或 tsx 实例），反而可能导致数据损坏（OCC 版本号不一致）。后端由用户手动管理。

## 开发

```bash
npm run serve       # 启动前端 dev server (port 8086)
npm run build       # 生产构建
npm run test:unit   # 单元测试
npm run docs:openapi # 从后端拉取 OpenAPI 并生成 SDK
```

## API 对接

后端运行在 `localhost:3000`，CORS 已配置。前端 axios(p=src/api/index.ts) 直连后端，不走 proxy。

**认证**：除登录/注册外所有 API 需要 Bearer token。token 有效期 **2 小时**，过期自动跳转登录页（axios 401 拦截器，见 `src/api/index.ts:35-50`）。

**token 获取**：
```
POST /api/users/register  {"email":"...","password":"...","name":"...","role":"root"}
POST /api/users/login     {"email":"...","password":"..."}
→ {"data":{"token":"sess_xxx","user":{...}}}
```

### 权限模型

| 概念 | 说明 |
|---|---|
| `user.role` | `root` / `Operator` / `Viewer` / `wheel` |
| `wheel` | 最高权限，可管理所有用户组和权限 |
| `root` | 常规管理员，可管理自己创建的组 |
| `UserGroup` | 包含成员列表和管理员列表(`adminIds`) |
| 邀请机制 | 管理员通过 `POST /api/permissions/invite` 邀请他人入组 |

关键规则：
- 用户组 CRUD 需要 `wheel` 权限
- 组内管理（邀请）需要 `adminIds` 成员身份
- 普通用户只能查看已知 ID 的组
- 权限策略（policy）CRUD 需要 `root` 权限

### Volume 与计算实例

Volume **必须绑定**到计算实例（`instanceId`），不能独立存在。

### 分页与筛选

所有列表端点统一支持 `?page=&limit=&name=&type=&status=`，返回格式：
```json
{"data":{"items":[],"total":0,"page":1,"limit":50}}
```

### 注册账号

所有用户注册默认 `Viewer` 角色。第一个注册用户也不会自动变成 `root`。
root 用户可以在"用户管理 → 用户详情"页面提升其他用户角色。

### OpenAPI

完整 OpenAPI 3.0 规范在 `openapi.json`（154 路由、82 路径），自动从后端生成。可用 `npm run docs:openapi` 拉取最新版本。可在 `/api/openapi.json` 查看或导入 Postman/Swagger UI。

### API 端点速查

| 模块 | 基础路径 | 前端入口（src/api/index.ts） |
|---|---|---|
| 认证 | `/api/users` | `api.auth.*`, `api.users.*` |
| 权限 | `/api/permissions` | `api.permissions.*`, `api.perm.*` |
| 沙箱 | `/api/sandboxes` | `api.sandboxes.*`, `api.pods.*` |
| 模板 | `/api/templates` | `api.templates.*` |
| 数据卷 | `/api/volumes` | `api.topology.volumes.*` |
| 网络 | `/api/networks` | `api.securityGroups.*` |
| 子网 | `/api/subnets` | `api.subnets.*` |
| 计算实例 | `/api/topology/instances` | `api.topology.instances.*` |
| 凭据 | `/api/topology/credentials` | `api.topology.credentials.*` |
| 存储桶 | `/api/topology/buckets` | `api.topology.buckets.*` |
| 镜像 | `/api/topology/images` | `api.topology.images.*` |
| 事件 | `/api/events` | `api.events.*` |
| 审计 | `/api/audit` | `api.audit.*` |
| 系统组 | `/api/system-groups` | `api.systemGroups.*` |
| 平台 | `/api/platforms` | `api.platforms.*` |
| 信息 | `/` | `api.info.*` |

### 生产日志

后端生产环境运行在 Cloudflare Workers。`GET /api/audit/logs` 查询接口在生产环境**不工作**（从进程内内存环缓冲读数据，Worker 重启丢数据）。真要看生产日志走 `wrangler tail` 或 Logpush。
