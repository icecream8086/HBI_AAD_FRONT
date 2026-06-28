// 统一错误类型系统 — Layer 1A
//
// 所有 API 调用和 catch 块应使用 AppError 而非 raw Error / unknown。
// Record<AppError['code'], ...> 映射强制穷举所有错误分支。

// ── 错误码联合类型 ──

export type ApiErrorCode = 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT' | 'VALIDATION_ERROR' | 'RATE_LIMITED' | 'INTERNAL_ERROR'

export type ClientErrorCode = 'NETWORK_ERROR' | 'TIMEOUT' | 'PARSE_ERROR'

export type AppErrorCode = ApiErrorCode | ClientErrorCode | 'UNKNOWN'

// ── Discriminated Union ──

export type AppError =
  | { code: 'NETWORK_ERROR'; message: string }
  | { code: 'TIMEOUT'; message: string }
  | { code: 'UNAUTHORIZED'; message: string }
  | { code: 'FORBIDDEN'; message: string; resource?: string }
  | { code: 'NOT_FOUND'; message: string; resource: string }
  | { code: 'CONFLICT'; message: string }
  | { code: 'VALIDATION_ERROR'; message: string; fields?: Record<string, string> }
  | { code: 'RATE_LIMITED'; message: string; retryAfter?: number }
  | { code: 'INTERNAL_ERROR'; message: string }
  | { code: 'PARSE_ERROR'; message: string }
  | { code: 'UNKNOWN'; message: string }

// ── 错误配置 map（唯一信源：新增 code 必须在此补条目） ──

export interface ErrorConfig {
  title: string
  variant: 'error' | 'warning' | 'info'
  icon: string
}

export const ERROR_CONFIG: Record<AppError['code'], ErrorConfig> = {
  NETWORK_ERROR:    { title: '网络异常',       variant: 'error',   icon: 'WifiOff' },
  TIMEOUT:          { title: '请求超时',       variant: 'warning', icon: 'Clock' },
  UNAUTHORIZED:     { title: '登录已过期',     variant: 'warning', icon: 'Lock' },
  FORBIDDEN:        { title: '无访问权限',     variant: 'warning', icon: 'Warning' },
  NOT_FOUND:        { title: '资源未找到',     variant: 'info',    icon: 'Search' },
  CONFLICT:         { title: '数据冲突',       variant: 'warning', icon: 'Warning' },
  VALIDATION_ERROR: { title: '参数校验失败',   variant: 'warning', icon: 'Edit' },
  RATE_LIMITED:     { title: '请求过于频繁',   variant: 'warning', icon: 'Timer' },
  INTERNAL_ERROR:   { title: '服务器内部错误', variant: 'error',   icon: 'Failed' },
  PARSE_ERROR:      { title: '数据解析失败',   variant: 'error',   icon: 'Document' },
  UNKNOWN:          { title: '未知错误',       variant: 'error',   icon: 'QuestionFilled' },
}

// ── Axios error → AppError 转换器 ──

export function toAppError(err: unknown): AppError {
  if (err && typeof err === 'object' && 'code' in err && typeof (err as Record<string, unknown>).code === 'string') {
    const code = (err as Record<string, unknown>).code as string
    if (code in ERROR_CONFIG) return err as AppError
  }

  if (err && typeof err === 'object' && 'response' in err) {
    const axiosErr = err as { response?: { status: number; data?: unknown }; message?: string; code?: string }

    if (axiosErr.code === 'ECONNABORTED') {
      return { code: 'TIMEOUT', message: '请求超时，请检查网络后重试' }
    }

    const status = axiosErr.response?.status
    const backendMsg = getErrorMessage(axiosErr.response?.data)

    switch (status) {
      case 400: return { code: 'VALIDATION_ERROR', message: backendMsg || '请求参数有误' }
      case 401: return { code: 'UNAUTHORIZED', message: backendMsg || '登录已过期，请重新登录' }
      case 403: return { code: 'FORBIDDEN', message: backendMsg || '没有权限执行此操作' }
      case 404: return { code: 'NOT_FOUND', message: backendMsg || '请求的资源不存在', resource: '' }
      case 409: return { code: 'CONFLICT', message: backendMsg || '数据冲突，请刷新后重试' }
      case 429: return { code: 'RATE_LIMITED', message: backendMsg || '请求过于频繁，请稍后重试' }
      case 500: return { code: 'INTERNAL_ERROR', message: backendMsg || '服务器内部错误，请稍后重试' }
      default: {
        if (!status && axiosErr.message?.includes('Network Error')) {
          return { code: 'NETWORK_ERROR', message: '网络连接失败，请检查网络' }
        }
        return { code: 'UNKNOWN', message: axiosErr.message || '未知错误' }
      }
    }
  }

  if (err instanceof Error) {
    return { code: 'UNKNOWN', message: err.message }
  }

  return { code: 'UNKNOWN', message: '未知错误' }
}

function getErrorMessage(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>
  return (d.message as string) || (d.error as string) || null
}
