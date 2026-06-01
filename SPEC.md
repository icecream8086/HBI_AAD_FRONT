# 前端项目技术架构蓝图

## 核心理念分层

```
Epoch 1（工程化）  →  Epoch 2（演进能力）
写靠谱的代码       →  系统长不大
```

---

## Epoch 1：工程基石（可立即落地）

### 1. 技术栈

| 层 | 选型 |
|---|---|
| 框架 | Vue 3 (Composition API + `<script setup>`) |
| 状态管理 | **Vuex 4**（仅 Client State：会话、角色、UI 偏好） |
| 服务端状态 | —（Vuex 兜底，Epoch 2 迁移到 TanStack Query） |
| 构建 | Vue CLI 5 (Webpack 5) → 未来迁移 Vite |
| UI | Element Plus 2 |
| 语言 | TypeScript 全链路 |
| HTTP | Axios + 全局拦截器 |
| 测试 | Vitest + jsdom + @vue/test-utils |
| E2E | Playwright |

### 2. 目录结构

```
src/
├── types/                  # TS 类型定义
│   ├── api.d.ts            # 后端响应泛型
│   ├── store.d.ts          # Vuex 类型推导
│   └── models/             # 业务模型
│       ├── user.ts
│       ├── case.ts
│       ├── medicine.ts
│       └── schedule.ts
├── store/                  # Vuex 4 — 仅 Client State
│   ├── index.ts            # createStore + 类型推导
│   └── modules/
│       ├── user.ts         # 用户信息、角色、权限
│       ├── app.ts          # 主题、语言、UI 状态
│       └── draft.ts        # 表单草稿
├── api/                    # 2 层 API 架构
│   ├── client.ts           # Axios 实例 + 拦截器
│   ├── error-handler.ts    # 全局异常处理
│   ├── debug.ts            # 日志调试
│   ├── interceptor.ts      # 401 重试 / 自愈逻辑
│   └── modules/            # 按业务拆分（代码生成 OR 手写）
│       ├── auth.api.ts
│       ├── case.api.ts
│       ├── user.api.ts
│       ├── medicine.api.ts
│       └── generated/      # OpenAPI 自动生成的代码
├── composables/            # 可复用组合函数
│   ├── useTheme.ts
│   ├── useStore.ts         # 类型化 useStore 包装
│   └── usePagination.ts
├── router/
│   └── index.ts
├── components/             # 通用组件
├── views/                  # 页面
├── assets/themes/          # CSS 主题
├── App.vue
└── main.ts
```

### 3. API 分层

```
Component
    ↓ (调用业务函数，获得类型化响应)
api/modules/case.api.ts   ← 类型安全，可代码生成
    ↓ (基础设施)
api/client.ts             ← Axios + 全局拦截器
    ↓ (HTTP)
后端 API
```

**api/modules/case.api.ts 示例：**

```typescript
// 类型安全，不夹带任何转换逻辑
export const caseApi = {
  getList: (params: PaginationParams) =>
    apiClient.get<PaginatedResult<Case>>('/medical-cases', { params }),

  getById: (id: string) =>
    apiClient.get<Case>(`/medical-cases/${id}`),

  create: (data: CreateCaseDto) =>
    apiClient.post<Case>('/medical-cases', data),
}
```

**转换逻辑不散落在 API 层，而是收拢到 composables 或 service 层：**

```typescript
// composables/useCaseList.ts
export function useCaseList(params: Ref<PaginationParams>) {
  const { data, isLoading, error } = useAsyncState(
    () => caseApi.getList(params.value),
    { items: [], total: 0 }
  )

  // 转换逻辑集中在这里，不影响 API 层
  const displayList = computed(() =>
    data.value.items.map(c => ({
      ...c,
      statusLabel: CASE_STATUS_MAP[c.status],
      feeDisplay: `¥${(c.totalFee / 100).toFixed(2)}`,
    }))
  )

  return { data, displayList, isLoading, error }
}
```

### 4. 类型全链路

```typescript
// types/api.d.ts — 后端统一响应格式
interface ApiResponse<T> {
  code: number
  message: string
  data: T
  traceId?: string
}

// types/models/case.ts — 业务模型
interface Case {
  id: string
  petId: string
  doctorId: string
  diagnosis: string
  status: CaseStatus
  totalFee: number    // 后端返回「分」
  createdAt: string
}

// api/client.ts — 泛型封装，自动解包 ApiResponse
class ApiClient {
  async get<T>(url: string, config?: AxiosConfig): Promise<T> {
    const response = await this.axios.get<ApiResponse<T>>(url, config)
    return response.data.data  // 自动解包，上层拿到的直接是 T
  }
}
```

### 5. 主题系统

~50 行 composable，registry 注册 + CSS 变量 + localStorage 持久化，不做更复杂的设计。

### 6. RBAC 权限系统

静态权限映射表 + `hasPermission()` 控制视图，角色和权限用 TypeScript `const enum` 或 `as const` 带类型推导。

---

## Epoch 2：演进能力（业务膨胀后逐步引入）

### 1. 状态分层 — Vuex 瘦身

**什么时候触发：** Vuex 的 state 膨胀超过 5 个模块，或者你发现 Vuex 里存的数据"后端也有一份"。

```
Vuex 只存：
  └─ 当前登录用户、角色、权限
  └─ 主题偏好、语言
  └─ 当前选中的 tab / 弹窗状态
  └─ 表单草稿

TanStack Query 接管：
  └─ 病例列表、药品库存、用户列表……
  └─ 任何从后端来的 CRUD 数据
  └─ 自动缓存 + 去重 + 后台刷新
```

**迁移不靠重写，靠"一个页面试水"：**

```typescript
// 旧页面：Vuex + api 调用
// 新页面：useQuery
// 通过 Feature Flag 控制，风险隔离

const { data } = useQuery({
  queryKey: ['cases', page.value],
  queryFn: () => caseApi.getList({ page: page.value }),
  staleTime: 30_000,     // 30 秒内不重复请求
  placeholderData: keepPreviousData,  // 翻页不断
})
```

### 2. 微前端 — 模块联邦

**什么时候触发：** 三个以上团队同时修改这个 repo，发布需要协调。

```
Shell App（宿主）
 ├─ Schedule Module（排班团队，独立部署）
 ├─ Pharmacy Module（药房团队，独立部署）
 ├─ Billing Module（财务团队，独立部署）
 └─ Shared（Vue + Vuex + Element Plus，统一版本）
```

**不是一开始就切，而是从"最独立的模块"试点：**

```text
第 1 步：把 Schedule 域抽成独立包，通过 npm link 在 monorepo 里开发
第 2 步：验证独立构建、独立部署流程
第 3 步：改为 Module Federation remote，正式拆分 CI
```

### 3. 自愈系统

**什么时候触发：** 用户反馈"刷新一下就好了"出现超过 3 次。

```
网络断开  → 自动重试（指数退避，最多 3 次）
限流 429  → 等待 + 重试，同时降低请求频率
服务宕机  → 降级到缓存数据 + 界面标记 "(离线模式)"
后端报错  → 自动上报 Sentry + 友好提示（不暴露技术细节）
```

### 4. 代码生成

**什么时候触发：** 后端已经有 Swagger 文档，或者 API 字段变更频繁导致前端手动同步总出 bug。

```bash
# Integration 阶段引入，不影响已存在的代码
openapi-generator generate \
  -i http://backend:8080/swagger.json \
  -g typescript-axios \
  -o src/api/generated \
  --type-mappings integer=int
```

**策略：** 生成的代码放 `api/generated/`，手写转换放 `api/modules/`，生成的类型直接 import 使用。

---

## 完整演进路线图

```
Now                             3 months                        6 months
├───────────────────────────────┼───────────────────────────────┤

Phase 1: 工程化（立即开始）        Phase 2: 状态管理升级             Phase 3: 架构升级
──────────────────────            ──────────────────────            ──────────────────────
 TypeScript + Vuex 4              引入 TanStack Query               Module Federation 试点
 2 层 API + 类型定义                Vuex 瘦身（移出 CRUD 数据）        CI 拆分
 全局错误处理                       第一个页面迁移到 useQuery          独立部署流程
 主题系统 + RBAC                   缓存策略落地                      性能监控
 单元测试 + MSW 方案                SWR 模式                         E2E 覆盖核心路径
```

## 关键原则

1. **不要重写，要替换** — 每个新方案先在 1 个页面验证，再推广
2. **Feature Flag 驱动迁移** — 新旧共存，随时回滚
3. **工具解决 80%，手写解决 20%** — 代码生成、Query 库、MSW 都属于"工具"
4. **类型安全是最低要求** — 没有 TS 的代码不允许合入 main
