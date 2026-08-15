export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiErrorPayload {
  detail?: string
  message?: string
  code?: string
}
