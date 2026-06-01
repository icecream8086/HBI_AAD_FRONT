import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import apiClient from './client'
import { handleApiError } from './error-handler'
import { logRequest, logResponse, logError } from './debug'
import { ErrorCode } from './error-handler'

let isRefreshing = false
let pendingRequests: Array<(token: string) => void> = []

export function setupInterceptors(): void {
  apiClient.axios.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem('access_token')
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }
      logRequest(config)
      return config
    },
    (error) => Promise.reject(error),
  )

  apiClient.axios.interceptors.response.use(
    (response) => {
      logResponse(response)
      return response
    },
    async (error: AxiosError<ApiResponse<unknown>>) => {
      logError(error)

      const status = error.response?.status
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

      if (status === ErrorCode.UNAUTHORIZED && originalRequest && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve) => {
            pendingRequests.push((token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`
              }
              resolve(apiClient.axios(originalRequest))
            })
          })
        }

        originalRequest._retry = true
        isRefreshing = true

        try {
          const refreshToken = localStorage.getItem('refresh_token')
          const { data } = await apiClient.axios.post<ApiResponse<{ accessToken: string }>>(
            '/auth/refresh',
            { refreshToken },
          )
          const newToken = data.data.accessToken
          localStorage.setItem('access_token', newToken)

          pendingRequests.forEach((cb) => cb(newToken))
          pendingRequests = []

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`
          }
          return apiClient.axios(originalRequest)
        } catch {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
          return Promise.reject(error)
        } finally {
          isRefreshing = false
        }
      }

      handleApiError(error)
      return Promise.reject(error)
    },
  )
}
