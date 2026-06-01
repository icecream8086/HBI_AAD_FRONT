import apiClient from '../client'

export const authApi = {
  login: (data: { username: string; password: string }) =>
    apiClient.post<{ accessToken: string; refreshToken: string }>('/auth/login', data),

  logout: () => apiClient.post<void>('/auth/logout'),

  refresh: (refreshToken: string) =>
    apiClient.post<{ accessToken: string }>('/auth/refresh', { refreshToken }),

  getProfile: () => apiClient.get<User>('/auth/profile'),
}
