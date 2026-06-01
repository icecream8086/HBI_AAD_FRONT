interface ApiResponse<T> {
  code: number
  message: string
  data: T
  traceId?: string
}

interface PaginationParams {
  page: number
  pageSize: number
}

interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}
