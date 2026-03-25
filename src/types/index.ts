export type Id = number | string

export type EntityId = Id

export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ApiError {
  message: string
  code?: string
  details?: unknown
  status?: number
}

export interface ApiEnvelope<TData> {
  success: boolean
  data: TData
  message?: string
  error?: ApiError
}
