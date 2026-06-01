import { ref, computed, type Ref } from 'vue'

interface PaginationState {
  page: number
  pageSize: number
  total: number
}

export function usePagination(defaultPageSize = 20) {
  const pagination: Ref<PaginationState> = ref({
    page: 1,
    pageSize: defaultPageSize,
    total: 0,
  })

  const paginationParams = computed<PaginationParams>(() => ({
    page: pagination.value.page,
    pageSize: pagination.value.pageSize,
  }))

  function setTotal(total: number): void {
    pagination.value.total = total
  }

  function setPage(page: number): void {
    pagination.value.page = page
  }

  function setPageSize(pageSize: number): void {
    pagination.value.pageSize = pageSize
    pagination.value.page = 1
  }

  function resetPagination(): void {
    pagination.value = { page: 1, pageSize: defaultPageSize, total: 0 }
  }

  return {
    pagination,
    paginationParams,
    setTotal,
    setPage,
    setPageSize,
    resetPagination,
  }
}
