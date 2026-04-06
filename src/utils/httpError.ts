import type { AxiosError } from 'axios'
import { isAxiosError } from 'axios'

interface ApiErrorData {
  message?: string
  errors?: Record<string, string[] | string> | string[] | string
}

interface ResponseLike<TData> {
  status?: number
  data?: TData
}

function getAxiosError(error: unknown): AxiosError<ApiErrorData> | null {
  return isAxiosError<ApiErrorData>(error) ? error : null
}

function getResponseLike(error: unknown): ResponseLike<ApiErrorData> | undefined {
  const axiosError = getAxiosError(error)
  if (axiosError?.response) {
    return axiosError.response
  }

  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: unknown }).response
    if (response && typeof response === 'object') {
      return response as ResponseLike<ApiErrorData>
    }
  }

  return undefined
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function normalizeValidationErrors(
  errors: ApiErrorData['errors'],
): string[] {
  if (!errors) {
    return []
  }

  if (Array.isArray(errors)) {
    return errors.filter(isNonEmptyString)
  }

  if (typeof errors === 'string') {
    return isNonEmptyString(errors) ? [errors] : []
  }

  return Object.values(errors).flatMap((value) => {
    if (Array.isArray(value)) {
      return value.filter(isNonEmptyString)
    }

    return isNonEmptyString(value) ? [value] : []
  })
}

export function getErrorStatus(error: unknown): number | undefined {
  return getResponseLike(error)?.status
}

export function getErrorMessage(error: unknown, fallback: string): string {
  const axiosError = getAxiosError(error)
  const apiMessage = getResponseLike(error)?.data?.message

  if (isNonEmptyString(apiMessage)) {
    return apiMessage
  }

  if (axiosError?.response) {
    return fallback
  }

  if (axiosError && isNonEmptyString(axiosError.message)) {
    return axiosError.message
  }

  if (error instanceof Error && isNonEmptyString(error.message)) {
    return error.message
  }

  return fallback
}

export function getValidationErrorMessages(error: unknown): string[] {
  return normalizeValidationErrors(getResponseLike(error)?.data?.errors)
}
