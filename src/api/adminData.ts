import type { AxiosResponseHeaders, RawAxiosResponseHeaders } from 'axios'
import api from '@/api'

export type AdminDataEntity = 'users' | 'courses' | 'sections' | 'subjects' | 'classrooms' | 'schedules' | 'enrollments'
export type AdminDataFormat = 'csv' | 'xlsx'

export interface AdminDataIssueDto {
  rowNumber?: number | null
  code?: string
  severity?: string
  message: string
  field?: string | null
}

export interface AdminDataRowResultDto {
  rowNumber: number
  status: string
  values: Record<string, string | null | undefined>
  issues: AdminDataIssueDto[]
}

export interface AdminDataPreviewResponseDto {
  success: boolean
  entity: string
  format: string
  fileName: string
  totalRows: number
  readyRows: number
  duplicateRows: number
  invalidRows: number
  canImport: boolean
  columns: string[]
  fileIssues: AdminDataIssueDto[]
  rows: AdminDataRowResultDto[]
}

export interface AdminDataImportResponseDto {
  success: boolean
  entity: string
  format: string
  fileName: string
  totalRows: number
  createdRows: number
  skippedDuplicateRows: number
  failedRows: number
  fileIssues: AdminDataIssueDto[]
  rows: AdminDataRowResultDto[]
}

export interface AdminDataDownloadResult {
  blob: Blob
  filename: string
  contentType: string
}

function createFormData(file: File, params: Record<string, unknown> = {}): FormData {
  const formData = new FormData()
  formData.append('file', file)

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '')
      return
    formData.append(key, String(value))
  })

  return formData
}

function extractFilename(
  headers: AxiosResponseHeaders | Partial<RawAxiosResponseHeaders> | undefined,
  fallback: string,
): string {
  const contentDisposition = headers?.['content-disposition']
    ?? headers?.['Content-Disposition']

  if (typeof contentDisposition !== 'string')
    return fallback

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1])
    return decodeURIComponent(utf8Match[1])

  const plainMatch = contentDisposition.match(/filename="?([^";]+)"?/i)
  if (plainMatch?.[1])
    return plainMatch[1]

  return fallback
}

async function requestFile(url: string, fallback: string, params?: Record<string, unknown>): Promise<AdminDataDownloadResult> {
  const response = await api.get<Blob>(url, {
    params,
    responseType: 'blob',
  })

  return {
    blob: response.data,
    filename: extractFilename(response.headers, fallback),
    contentType: response.headers['content-type'] ?? 'application/octet-stream',
  }
}

export async function previewAdminDataImport(entity: AdminDataEntity, file: File, params: Record<string, unknown> = {}): Promise<AdminDataPreviewResponseDto> {
  const response = await api.post<AdminDataPreviewResponseDto>(
    `/admin-data/${entity}/import-preview`,
    createFormData(file, params),
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  )

  return response.data
}

export async function importAdminData(entity: AdminDataEntity, file: File, params: Record<string, unknown> = {}): Promise<AdminDataImportResponseDto> {
  const response = await api.post<AdminDataImportResponseDto>(
    `/admin-data/${entity}/import`,
    createFormData(file, params),
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  )

  return response.data
}

export async function downloadAdminDataTemplate(entity: AdminDataEntity, format: AdminDataFormat): Promise<AdminDataDownloadResult> {
  return requestFile(`/admin-data/${entity}/template`, `${entity}-template.${format}`, { format })
}

export async function exportAdminData(entity: AdminDataEntity, format: AdminDataFormat, params: Record<string, unknown> = {}): Promise<AdminDataDownloadResult> {
  return requestFile(`/admin-data/${entity}/export`, `${entity}-export.${format}`, { format, ...params })
}
