import apiClient from '../client'

export const caseApi = {
  getList: (params: PaginationParams) =>
    apiClient.get<PaginatedResult<Case>>('/medical-cases', { params }),

  getById: (id: string) => apiClient.get<Case>(`/medical-cases/${id}`),

  create: (data: CreateCaseDto) => apiClient.post<Case>('/medical-cases', data),

  update: (id: string, data: UpdateCaseDto) =>
    apiClient.put<Case>(`/medical-cases/${id}`, data),

  delete: (id: string) => apiClient.delete<void>(`/medical-cases/${id}`),
}
