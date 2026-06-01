import type { AxiosRequestConfig, AxiosResponse } from 'axios'

export function logRequest(config: AxiosRequestConfig): void {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config)
  }
}

export function logResponse(response: AxiosResponse): void {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[API] ${response.status} ${response.config.url}`, response.data)
  }
}

export function logError(error: unknown): void {
  if (process.env.NODE_ENV !== 'production') {
    console.error('[API] Error:', error)
  }
}
