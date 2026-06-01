import { ElMessage } from 'element-plus'
import type { AxiosError } from 'axios'

export enum ErrorCode {
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  RATE_LIMITED = 429,
  SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
}

const errorMessages: Record<number, string> = {
  [ErrorCode.UNAUTHORIZED]: '登录已过期，请重新登录',
  [ErrorCode.FORBIDDEN]: '暂无权限访问',
  [ErrorCode.NOT_FOUND]: '请求的资源不存在',
  [ErrorCode.RATE_LIMITED]: '请求过于频繁，请稍后重试',
  [ErrorCode.SERVER_ERROR]: '服务器内部错误',
  [ErrorCode.BAD_GATEWAY]: '网关错误',
  [ErrorCode.SERVICE_UNAVAILABLE]: '服务暂不可用',
}

export function handleApiError(error: AxiosError<ApiResponse<unknown>>): void {
  const status = error.response?.status

  if (status && errorMessages[status]) {
    ElMessage.error(errorMessages[status])
  } else if (error.response?.data?.message) {
    ElMessage.error(error.response.data.message)
  } else {
    ElMessage.error('网络异常，请检查网络连接')
  }
}
