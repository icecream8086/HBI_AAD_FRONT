import apiClient from '../client'

export const medicineApi = {
  getList: (params: PaginationParams) =>
    apiClient.get<PaginatedResult<Medicine>>('/medicines', { params }),

  getById: (id: string) => apiClient.get<Medicine>(`/medicines/${id}`),

  create: (data: CreateMedicineDto) =>
    apiClient.post<Medicine>('/medicines', data),

  update: (id: string, data: Partial<Medicine>) =>
    apiClient.put<Medicine>(`/medicines/${id}`, data),

  delete: (id: string) => apiClient.delete<void>(`/medicines/${id}`),
}
