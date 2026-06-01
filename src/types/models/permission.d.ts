type PolicyEffect = 'allow' | 'deny'
type MatchType = 'prefix' | 'exact'

interface StoredPolicy {
  id: string
  name: string
  effect: PolicyEffect
  actions: string[]
  resource?: string
  userId?: string
  role?: UserRole
  priority: number
  enabled: boolean
  createdAt: number
  updatedAt: number
}

interface CreatePolicyRequest {
  name: string
  effect: PolicyEffect
  actions: string[]
  resource: string
  priority?: number
}

interface UserGroup {
  id: string
  name: string
  memberIds: string[]
  dependsOn: string[]
  createdAt: number
  updatedAt: number
}

interface CreateUserGroupRequest {
  name: string
  memberIds: string[]
  dependsOn?: string[]
}

interface PermissionGroupRule {
  effect: PolicyEffect
  actions: string[]
  resource?: string
  priority: number
}

interface PermissionGroup {
  id: string
  name: string
  rules: PermissionGroupRule[]
  userGroupIds: string[]
  userIds: string[]
  dependsOn: string[]
  createdAt: number
  updatedAt: number
}

interface CreatePermissionGroupRequest {
  name: string
  rules: PermissionGroupRule[]
  userGroupIds?: string[]
  userIds?: string[]
  dependsOn?: string[]
}

interface RouteAcl {
  id: string
  method: string
  pathPrefix: string
  matchType: MatchType
  effect: PolicyEffect
  userId: string
  userGroupId?: string
  priority: number
  createdAt: number
  updatedAt: number
}

interface CreateRouteAclRequest {
  method: string
  pathPrefix: string
  matchType: MatchType
  effect: PolicyEffect
  userId?: string
  userGroupId?: string
  priority?: number
}

interface SystemGroup {
  id: string
  name: string
  rules: PermissionGroupRule[]
  priority: number
  dependsOn: string[]
  createdAt: number
  updatedAt: number
}

interface PermissionTemplate {
  id: string
  name: string
  description: string
}

interface UserTemplate {
  id: string
  name: string
  defaultGroupIds: string[]
  defaultPermGroupIds: string[]
  dependsOn: string[]
  createdAt: number
  updatedAt: number
}

interface LogPolicy {
  defaultLevel: string
  auditLevel: string
  facilities: { facility: string; level: string }[]
}

interface PermissionCheckRequest {
  userId: string
  action: string
  resource: string
  ip?: string
}

interface PermissionCheckResult {
  allowed: boolean
  matchedRule?: string
}
