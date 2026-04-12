import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as adminDataApi from '@/api/adminData'
import { useAdminData } from '@/composables/useAdminData'

function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((innerResolve, innerReject) => {
    resolve = innerResolve
    reject = innerReject
  })

  return { promise, resolve, reject }
}

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

  it('keeps download loading state true until all concurrent downloads finish', async () => {
    const templateDownload = createDeferred<adminDataApi.AdminDataDownloadResult>()
    const exportDownload = createDeferred<adminDataApi.AdminDataDownloadResult>()

    vi.spyOn(adminDataApi, 'downloadAdminDataTemplate').mockReturnValue(templateDownload.promise)
    vi.spyOn(adminDataApi, 'exportAdminData').mockReturnValue(exportDownload.promise)

    const adminData = useAdminData('users')

    const templatePromise = adminData.downloadTemplate('xlsx')
    const exportPromise = adminData.exportRows('csv')

    expect(adminData.isDownloading.value).toBe(true)
    expect(adminData.isDownloadingTemplate.value).toBe(true)
    expect(adminData.isExportingCsv.value).toBe(true)
    expect(adminData.isExportingXlsx.value).toBe(false)

    templateDownload.resolve({
      blob: new Blob(['template']),
      filename: 'users-template.xlsx',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    await templatePromise

    expect(adminData.isDownloading.value).toBe(true)
    expect(adminData.isDownloadingTemplate.value).toBe(false)
    expect(adminData.isExportingCsv.value).toBe(true)

    exportDownload.resolve({
      blob: new Blob(['export']),
      filename: 'users-export.csv',
      contentType: 'text/csv',
    })
    await exportPromise

    expect(adminData.isDownloading.value).toBe(false)
    expect(adminData.isExportingCsv.value).toBe(false)
  })

  it('preserves active download state when another concurrent download fails', async () => {
    const templateDownload = createDeferred<adminDataApi.AdminDataDownloadResult>()
    const exportDownload = createDeferred<adminDataApi.AdminDataDownloadResult>()

    vi.spyOn(adminDataApi, 'downloadAdminDataTemplate').mockReturnValue(templateDownload.promise)
    vi.spyOn(adminDataApi, 'exportAdminData').mockReturnValue(exportDownload.promise)

    const adminData = useAdminData('users')

    const templatePromise = adminData.downloadTemplate('xlsx')
    const exportPromise = adminData.exportRows('csv')

    templateDownload.reject(new Error('Template download failed'))
    await expect(templatePromise).rejects.toThrow('Template download failed')

    expect(adminData.error.value).toBe('')
    expect(adminData.isDownloading.value).toBe(true)
    expect(adminData.isDownloadingTemplate.value).toBe(false)
    expect(adminData.isExportingCsv.value).toBe(true)

    exportDownload.resolve({
      blob: new Blob(['export']),
      filename: 'users-export.csv',
      contentType: 'text/csv',
    })
    await exportPromise

    expect(adminData.isDownloading.value).toBe(false)
    expect(adminData.isExportingCsv.value).toBe(false)
  })

  it('clears all granular loading flags after concurrent export failures', async () => {
    const csvExport = createDeferred<adminDataApi.AdminDataDownloadResult>()
    const xlsxExport = createDeferred<adminDataApi.AdminDataDownloadResult>()

    vi.spyOn(adminDataApi, 'exportAdminData')
      .mockReturnValueOnce(csvExport.promise)
      .mockReturnValueOnce(xlsxExport.promise)

    const adminData = useAdminData('users')

    const csvPromise = adminData.exportRows('csv')
    const xlsxPromise = adminData.exportRows('xlsx')

    expect(adminData.isExportingCsv.value).toBe(true)
    expect(adminData.isExportingXlsx.value).toBe(true)

    csvExport.reject(new Error('CSV export failed'))
    await expect(csvPromise).rejects.toThrow('CSV export failed')

    expect(adminData.error.value).toBe('')
    expect(adminData.isDownloading.value).toBe(true)
    expect(adminData.isExportingCsv.value).toBe(false)
    expect(adminData.isExportingXlsx.value).toBe(true)

    xlsxExport.reject(new Error('Excel export failed'))
    await expect(xlsxPromise).rejects.toThrow('Excel export failed')

    expect(adminData.isDownloading.value).toBe(false)
    expect(adminData.isExportingCsv.value).toBe(false)
    expect(adminData.isExportingXlsx.value).toBe(false)
    expect(adminData.error.value).toBe('')
  })
})
