export type Id = number | string

/**
 * EntityId represents a unique identifier for domain entities.
 * Post-transition: This type now only accepts string (UUID) values.
 * The migration from number | string to string is complete.
 */
export type EntityId = string

interface PagePaginationParams {
  page?: number
  limit?: number
  offset?: never
}

interface OffsetPaginationParams {
  offset?: number
  limit?: number
  page?: never
}

export type PaginationParams = PagePaginationParams | OffsetPaginationParams

export type PaginationMeta = { mode: 'page', page: number, limit: number, total: number, totalPages: number } | { mode: 'offset', offset: number, limit: number, total: number }

export interface ApiError {
  message: string
  code?: string
  details?: unknown
  status?: number
}

export type ApiEnvelope<TData> = { success: true, data: TData, error?: never, message?: string } | { success: false, error: ApiError, data?: never, message?: string }
