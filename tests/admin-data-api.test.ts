import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import api from '@/api'
import {
  downloadAdminDataTemplate,
  exportAdminData,
  importAdminData,
  previewAdminDataImport,
} from '@/api/adminData'

describe('admin data api', () => {
  const originalGet = api.get
  const originalPost = api.post

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    api.get = originalGet
    api.post = originalPost
  })

  it('posts preview import as multipart form data', async () => {
    let capturedBody: FormData | null = null
    let capturedHeaders: Record<string, string> | undefined

    api.post = (async (_url: string, body: FormData, config?: { headers?: Record<string, string> }) => {
      capturedBody = body
      capturedHeaders = config?.headers
      return {
        data: {
          success: true,
          entity: 'users',
          format: 'csv',
          fileName: 'users.csv',
          totalRows: 1,
          readyRows: 1,
          duplicateRows: 0,
          invalidRows: 0,
          canImport: true,
          columns: [],
          fileIssues: [],
          rows: [],
        },
      }
    }) as typeof api.post

    const response = await previewAdminDataImport('users', new File(['a'], 'users.csv', { type: 'text/csv' }))

    expect(response.canImport).toBe(true)
    expect(capturedBody).toBeInstanceOf(FormData)
    expect(capturedBody?.get('file')).toBeInstanceOf(File)
    expect(capturedHeaders).toEqual({ 'Content-Type': 'multipart/form-data' })
  })

  it('extracts filenames from download responses', async () => {
    api.get = (async () => ({
      data: new Blob(['content'], { type: 'text/csv' }),
      headers: {
        'content-disposition': 'attachment; filename="users-export.csv"',
        'content-type': 'text/csv',
      },
    })) as typeof api.get

    const response = await exportAdminData('users', 'csv', { status: 'Active' })

    expect(response.filename).toBe('users-export.csv')
    expect(response.contentType).toBe('text/csv')
  })

  it('downloads templates with the requested format', async () => {
    let capturedParams: Record<string, unknown> | undefined

    api.get = (async (_url: string, config?: { params?: Record<string, unknown> }) => {
      capturedParams = config?.params
      return {
        data: new Blob(['template']),
        headers: {},
      }
    }) as typeof api.get

    const response = await downloadAdminDataTemplate('courses', 'xlsx')

    expect(capturedParams).toEqual({ format: 'xlsx' })
    expect(response.filename).toBe('courses-template.xlsx')
  })

  it('posts commit import as multipart form data', async () => {
    api.post = (async () => ({
      data: {
        success: true,
        entity: 'courses',
        format: 'csv',
        fileName: 'courses.csv',
        totalRows: 2,
        createdRows: 2,
        skippedDuplicateRows: 0,
        failedRows: 0,
        fileIssues: [],
        rows: [],
      },
    })) as typeof api.post

    const response = await importAdminData('courses', new File(['name'], 'courses.csv', { type: 'text/csv' }))

    expect(response.createdRows).toBe(2)
  })
})
