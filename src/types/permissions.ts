// 权限与 Feature Flag 类型系统 — Layer 4
//
// 信源：UserRole 来自 models/user.d.ts

// ── 角色常量（避免裸字符串比较） ──

/** 角色层级：低索引 = 低权限 */
export const ROLE_ORDER: readonly UserRole[] = ['Viewer', 'Operator', 'root', 'wheel'] as const

export function hasMinRole(userRole: UserRole | undefined, minRole: UserRole): boolean {
  if (!userRole) return false
  const userIdx = ROLE_ORDER.indexOf(userRole)
  const minIdx = ROLE_ORDER.indexOf(minRole)
  return userIdx >= minIdx
}

export function isRoot(role: UserRole | undefined): boolean { return role === 'root' || role === 'wheel' }
export function isOperator(role: UserRole | undefined): boolean { return isRoot(role) || role === 'Operator' }
export function isViewer(role: UserRole | undefined): boolean { return role === 'Viewer' }

// ── 路由级权限 ──

/** 各路由所需的最低角色 */
export type RouteMinRole = 'Viewer' | 'Operator' | 'root'

/** 路由权限映射 — 新增路由必须在此定义 */
export const ROUTE_MIN_ROLE: Record<string, RouteMinRole> = {
  dashboard:              'Viewer',
  SandboxPods:            'Viewer',
  PodDetail:              'Viewer',
  Sandboxes:              'Viewer',
  SandboxDetail:          'Viewer',
  Templates:              'Viewer',
  TemplateDetail:         'Viewer',
  Images:                 'Viewer',
  Profile:                'Viewer',
  // Operator+
  ActionDashboard:        'Operator',
  ActionOrgs:             'Operator',
  ActionRegistry:         'Operator',
  Runners:                'Operator',
  WorkflowRuns:           'Operator',
  RunDetail:              'Operator',
  JobDetail:              'Operator',
  WorkflowSecrets:        'Operator',
  SharedLinks:            'Operator',
  ActionTemplates:        'Operator',
  Workflows:              'Operator',
  WorkflowDetail:         'Operator',
  WorkflowEditor:         'Operator',
  ExtensionFields:        'Operator',
  AuditLogs:              'Operator',
  Events:                 'Operator',
  InstanceList:           'Operator',
  CredentialList:         'Operator',
  BucketList:             'Operator',
  VolumeList:             'Operator',
  SecurityGroups:         'Operator',
  Subnets:                'Operator',
  // root only
  Users:                  'root',
  UserDetail:             'root',
  Permissions:            'root',
  Policies:               'root',
  PermissionGroups:       'root',
  UserGroups:             'root',
  RouteAcls:              'root',
  SystemGroups:           'root',
  UserTemplates:          'root',
  ContainerSecrets:       'root',
  Elevations:             'root',
  Invitations:            'root',
  PermTools:              'root',
}

// ── Feature Flags ──

export type FeatureFlag =
  | 'enableNewDashboard'
  | 'enableDarkMode'
  | 'enableBilling'

/** Feature flag 默认值 — 新增 flag 必须在此定义 */
export const FEATURE_FLAGS: Record<FeatureFlag, boolean> = {
  enableNewDashboard: false,
  enableDarkMode:     true,
  enableBilling:      false,
}
