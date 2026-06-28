// Route 类型系统 — Layer 2A
//
// 信源：router/index.ts 的 RouteRecordRaw[] 配置
// 新增路由时，在此处添加对应的 path + params → TS 强制视图更新

// ── 顶层路由 ──

export type AppRoute =
  | { path: '/login'; params?: never }

  // Children (MainLayout)
  | { path: '/dashboard'; params?: never }

  // Sandbox
  | { path: '/sandboxes/pods'; params?: never }
  | { path: '/sandboxes/pods/:providerId'; params: { providerId: string } }
  | { path: '/sandboxes'; params?: never }
  | { path: '/sandboxes/:id'; params: { id: string } }

  // Templates
  | { path: '/templates'; params?: never }
  | { path: '/templates/:id'; params: { id: string } }

  // Images
  | { path: '/images'; params?: never }

  // Users
  | { path: '/users'; params?: never }
  | { path: '/users/:id'; params: { id: string } }

  // Permissions
  | { path: '/permissions'; params?: never }
  | { path: '/permissions/policies'; params?: never }
  | { path: '/permissions/groups'; params?: never }
  | { path: '/permissions/user-groups'; params?: never }
  | { path: '/permissions/route-acls'; params?: never }
  | { path: '/permissions/system-groups'; params?: never }
  | { path: '/permissions/user-templates'; params?: never }
  | { path: '/permissions/container-secrets'; params?: never }
  | { path: '/permissions/elevations'; params?: never }
  | { path: '/permissions/invitations'; params?: never }
  | { path: '/permissions/tools'; params?: never }

  // Topology
  | { path: '/topology/instances'; params?: never }
  | { path: '/topology/credentials'; params?: never }
  | { path: '/topology/buckets'; params?: never }
  | { path: '/topology/volumes'; params?: never }

  // Networks
  | { path: '/networks'; params?: never }
  | { path: '/subnets'; params?: never }

  // Logs & Monitoring
  | { path: '/extension-fields'; params?: never }
  | { path: '/audit'; params?: never }
  | { path: '/events'; params?: never }

  // Actions
  | { path: '/actions/dashboard'; params?: never }
  | { path: '/actions/organizations'; params?: never }
  | { path: '/actions/registry'; params?: never }
  | { path: '/actions/runners'; params?: never }
  | { path: '/actions/runs'; params?: never }
  | { path: '/actions/runs/:id'; params: { id: string } }
  | { path: '/actions/runs/:runId/jobs/:jobId'; params: { runId: string; jobId: string } }
  | { path: '/actions/secrets/:workflowId'; params: { workflowId: string } }
  | { path: '/actions/shared-links'; params?: never }
  | { path: '/actions/templates'; params?: never }
  | { path: '/actions/workflows'; params?: never }
  | { path: '/actions/workflows/:id'; params: { id: string } }
  | { path: '/actions/workflows/:id/editor'; params: { id: string } }

  // Profile
  | { path: '/profile'; params?: never }

// ── 辅助类型 ──

export type AppRoutePath = AppRoute['path']

/** 从 path 提取 params 类型 */
export type RouteParamsFor<P extends AppRoutePath> =
  Extract<AppRoute, { path: P }> extends { params: infer Params } ? Params : never
