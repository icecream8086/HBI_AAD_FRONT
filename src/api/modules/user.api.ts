import apiClient from '../client'

export const userApi = {
  getList: (params: PaginationParams) =>
    apiClient.get<PaginatedResult<User>>('/users', { params }),

  getById: (id: string) => apiClient.get<User>(`/users/${id}`),

  create: (data: Partial<User>) => apiClient.post<User>('/users', data),

  update: (id: string, data: Partial<User>) =>
    apiClient.put<User>(`/users/${id}`, data),

  delete: (id: string) => apiClient.delete<void>(`/users/${id}`),
}
