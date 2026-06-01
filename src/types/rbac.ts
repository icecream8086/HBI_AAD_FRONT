export const RoleEnum = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  NURSE: 'nurse',
  PHARMACIST: 'pharmacist',
  RECEPTIONIST: 'receptionist',
} as const

export type RoleEnum = (typeof RoleEnum)[keyof typeof RoleEnum]

export const PermissionMap = {
  CASE_VIEW: 'case:view',
  CASE_CREATE: 'case:create',
  CASE_EDIT: 'case:edit',
  CASE_DELETE: 'case:delete',
  MEDICINE_VIEW: 'medicine:view',
  MEDICINE_CREATE: 'medicine:create',
  MEDICINE_EDIT: 'medicine:edit',
  MEDICINE_DELETE: 'medicine:delete',
  SCHEDULE_VIEW: 'schedule:view',
  SCHEDULE_CREATE: 'schedule:create',
  SCHEDULE_EDIT: 'schedule:edit',
  USER_MANAGE: 'user:manage',
  ROLE_MANAGE: 'role:manage',
  SYSTEM_CONFIG: 'system:config',
} as const

export type Permission = (typeof PermissionMap)[keyof typeof PermissionMap]

export const RolePermissions: Record<RoleEnum, Permission[]> = {
  [RoleEnum.ADMIN]: Object.values(PermissionMap),
  [RoleEnum.DOCTOR]: [
    PermissionMap.CASE_VIEW,
    PermissionMap.CASE_CREATE,
    PermissionMap.CASE_EDIT,
    PermissionMap.SCHEDULE_VIEW,
    PermissionMap.SCHEDULE_CREATE,
    PermissionMap.MEDICINE_VIEW,
  ],
  [RoleEnum.NURSE]: [
    PermissionMap.CASE_VIEW,
    PermissionMap.CASE_CREATE,
    PermissionMap.MEDICINE_VIEW,
    PermissionMap.SCHEDULE_VIEW,
  ],
  [RoleEnum.PHARMACIST]: [
    PermissionMap.MEDICINE_VIEW,
    PermissionMap.MEDICINE_CREATE,
    PermissionMap.MEDICINE_EDIT,
    PermissionMap.MEDICINE_DELETE,
  ],
  [RoleEnum.RECEPTIONIST]: [
    PermissionMap.CASE_VIEW,
    PermissionMap.CASE_CREATE,
    PermissionMap.SCHEDULE_VIEW,
    PermissionMap.SCHEDULE_CREATE,
  ],
}

export function hasPermission(userPermissions: string[], permission: Permission): boolean {
  return userPermissions.includes(permission)
}

export function hasAnyPermission(userPermissions: string[], permissions: Permission[]): boolean {
  return permissions.some((p) => userPermissions.includes(p))
}

export function hasAllPermissions(userPermissions: string[], permissions: Permission[]): boolean {
  return permissions.every((p) => userPermissions.includes(p))
}
