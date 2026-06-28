// 主题 Token 类型系统 — Layer 3B
//
// 自定义 CSS 变量 token。Element Plus 的 --el-* 变量由 Element Plus 维护。
// 新增 --app-* 变量时必须在此联合类型中添加。

/** 应用级 CSS 变量名 */
export type AppCssVar =
  | '--app-bg'
  | '--app-nav-bg'
  | '--app-nav-text'
  | '--app-nav-border'
  | '--app-sidebar-bg'
  | '--app-sidebar-text'
  | '--app-sidebar-active'
  | '--app-content-bg'
  | '--app-card-shadow'

/** 组件中可用的设计 token 引用 */
export type DesignToken =
  | 'color-primary'
  | 'color-success'
  | 'color-warning'
  | 'color-danger'
  | 'color-info'
  | 'bg-page'
  | 'bg-overlay'
  | 'text-primary'
  | 'text-regular'
  | 'text-secondary'
  | 'text-placeholder'
  | 'border'
  | 'border-light'
  | 'shadow'
  | 'shadow-light'

/** Token → CSS var() 映射 */
export const TOKEN_VAR: Record<DesignToken, string> = {
  'color-primary':      'var(--el-color-primary)',
  'color-success':      'var(--el-color-success)',
  'color-warning':      'var(--el-color-warning)',
  'color-danger':       'var(--el-color-danger)',
  'color-info':         'var(--el-color-info)',
  'bg-page':            'var(--el-bg-color-page)',
  'bg-overlay':         'var(--el-bg-color-overlay)',
  'text-primary':       'var(--el-text-color-primary)',
  'text-regular':       'var(--el-text-color-regular)',
  'text-secondary':     'var(--el-text-color-secondary)',
  'text-placeholder':   'var(--el-text-color-placeholder)',
  'border':             'var(--el-border-color)',
  'border-light':       'var(--el-border-color-light)',
  'shadow':             'var(--el-box-shadow)',
  'shadow-light':       'var(--el-box-shadow-light)',
}
