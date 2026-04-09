import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as adminDataApi from '@/api/adminData'
import { useAdminData } from '@/composables/useAdminData'

describe('useAdminData', () => {
  const createObjectURL = vi.fn(() => 'blob:url')
  const revokeObjectURL = vi.fn()
  const click = vi.fn()
  const createElement = vi.fn(() => ({
    click,
    download: '',
    href: '',
  }))

  beforeEach(() => {
    vi.stubGlobal('document', { createElement } as unknown as Document)
    vi.spyOn(URL, 'createObjectURL').mockImplementation(createObjectURL)
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(revokeObjectURL)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    click.mockReset()
    createObjectURL.mockReset()
    revokeObjectURL.mockReset()
    createElement.mockClear()
  })

  it('previews a selected file', async () => {
    vi.spyOn(adminDataApi, 'previewAdminDataImport').mockResolvedValue({
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
    })

    const adminData = useAdminData('users')
    await adminData.selectFile(new File(['x'], 'users.csv', { type: 'text/csv' }))

    expect(adminData.preview.value?.readyRows).toBe(1)
    expect(adminData.canCommitImport.value).toBe(true)
  })

  it('runs import and triggers refresh callback on success', async () => {
    const onImported = vi.fn()
    vi.spyOn(adminDataApi, 'importAdminData').mockResolvedValue({
      success: true,
      entity: 'users',
      format: 'csv',
      fileName: 'users.csv',
      totalRows: 1,
      createdRows: 1,
      skippedDuplicateRows: 0,
      failedRows: 0,
      fileIssues: [],
      rows: [],
    })

    const adminData = useAdminData('users', { onImported })
    adminData.setFile(new File(['x'], 'users.csv', { type: 'text/csv' }))
    await adminData.commitImport()

    expect(onImported).toHaveBeenCalledTimes(1)
    expect(adminData.importResult.value?.createdRows).toBe(1)
  })

  it('downloads exports through the browser helper', async () => {
    vi.spyOn(adminDataApi, 'exportAdminData').mockResolvedValue({
      blob: new Blob(['content']),
      filename: 'users-export.csv',
      contentType: 'text/csv',
    })

    const adminData = useAdminData('users')
    await adminData.exportFile('csv')

    expect(createObjectURL).toHaveBeenCalled()
    expect(click).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:url')
  })
})
