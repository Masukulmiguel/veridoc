export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiErrorPayload {
  detail?: string | Array<{ loc?: string[]; msg?: string; type?: string }>
  message?: string
  code?: string
}
