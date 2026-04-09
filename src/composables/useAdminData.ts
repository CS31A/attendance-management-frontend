import type {
  AdminDataDownloadResult,
  AdminDataEntity,
  AdminDataFormat,
  AdminDataImportResponseDto,
  AdminDataPreviewResponseDto,
} from '@/api/adminData'
import { computed, ref } from 'vue'
import {
  downloadAdminDataTemplate,
  exportAdminData,
  importAdminData,
  previewAdminDataImport,
} from '@/api/adminData'
import { getErrorMessage } from '@/utils/httpError'

export interface UseAdminDataOptions {
  getImportParams?: () => Record<string, unknown>
  importParams?: () => Record<string, unknown>
  getExportParams?: () => Record<string, unknown>
  exportFilters?: () => Record<string, unknown>
  onImported?: () => Promise<void> | void
}

function triggerBrowserDownload(file: AdminDataDownloadResult) {
  const objectUrl = URL.createObjectURL(file.blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = file.filename
  anchor.click()
  URL.revokeObjectURL(objectUrl)
}

function createOperationError(caughtError: unknown, fallbackMessage: string) {
  const message = getErrorMessage(caughtError, fallbackMessage)

  if (caughtError instanceof Error && caughtError.message === message)
    return caughtError

  return new Error(message)
}

export function useAdminData(entity: AdminDataEntity, options: UseAdminDataOptions = {}) {
  const file = ref<File | null>(null)
  const preview = ref<AdminDataPreviewResponseDto | null>(null)
  const importResult = ref<AdminDataImportResponseDto | null>(null)
  const error = ref('')
  const isPreviewing = ref(false)
  const isImporting = ref(false)
  const templateDownloadCount = ref(0)
  const exportDownloadCounts = ref<Record<AdminDataFormat, number>>({ csv: 0, xlsx: 0 })
  const isImportModalOpen = ref(false)
  const getExportParams = options.getExportParams ?? options.exportFilters ?? (() => ({}))
  const getImportParams = options.getImportParams ?? options.importParams ?? (() => ({}))

  const canCommitImport = computed(() => !!preview.value?.canImport && !isImporting.value)
  const isDownloading = computed(() => templateDownloadCount.value + exportDownloadCounts.value.csv + exportDownloadCounts.value.xlsx > 0)
  const isDownloadingTemplate = computed(() => templateDownloadCount.value > 0)
  const isExportingCsv = computed(() => exportDownloadCounts.value.csv > 0)
  const isExportingXlsx = computed(() => exportDownloadCounts.value.xlsx > 0)

  function decrementDownloadCounter(currentCount: number, applyNextCount: (nextCount: number) => void, label: string) {
    if (currentCount === 0) {
      console.warn(`[useAdminData] Attempted to decrement ${label} below zero.`)
      return
    }

    applyNextCount(currentCount - 1)
  }

  function setFile(nextFile: File | null) {
    file.value = nextFile
    preview.value = null
    importResult.value = null
    error.value = ''
  }

  function reset() {
    setFile(null)
  }

  function openImportModal() {
    isImportModalOpen.value = true
  }

  function closeImportModal() {
    isImportModalOpen.value = false
    reset()
  }

  async function previewImport() {
    if (!file.value)
      throw new Error('Please select a CSV or XLSX file first.')

    isPreviewing.value = true
    error.value = ''
    importResult.value = null

    try {
      preview.value = await previewAdminDataImport(entity, file.value, getImportParams())
      return preview.value
    }
    catch (caughtError) {
      error.value = getErrorMessage(caughtError, 'Failed to preview import')
      throw caughtError
    }
    finally {
      isPreviewing.value = false
    }
  }

  async function selectFile(nextFile: File | null) {
    setFile(nextFile)
    if (!nextFile)
      return null
    return previewImport()
  }

  async function commitImport() {
    if (!file.value)
      throw new Error('Please select a CSV or XLSX file first.')

    isImporting.value = true
    error.value = ''

    try {
      importResult.value = await importAdminData(entity, file.value, getImportParams())
      if (importResult.value.success)
        await options.onImported?.()
      return importResult.value
    }
    catch (caughtError) {
      error.value = getErrorMessage(caughtError, 'Failed to import file')
      throw caughtError
    }
    finally {
      isImporting.value = false
    }
  }

  async function downloadTemplate(format: AdminDataFormat) {
    templateDownloadCount.value += 1

    try {
      const response = await downloadAdminDataTemplate(entity, format)
      triggerBrowserDownload(response)
      return response
    }
    catch (caughtError) {
      throw createOperationError(caughtError, 'Failed to download template')
    }
    finally {
      decrementDownloadCounter(
        templateDownloadCount.value,
        (nextCount) => { templateDownloadCount.value = nextCount },
        'template download counter',
      )
    }
  }

  async function exportRows(format: AdminDataFormat) {
    exportDownloadCounts.value[format] += 1

    try {
      const response = await exportAdminData(entity, format, getExportParams())
      triggerBrowserDownload(response)
      return response
    }
    catch (caughtError) {
      throw createOperationError(caughtError, 'Failed to export data')
    }
    finally {
      decrementDownloadCounter(
        exportDownloadCounts.value[format],
        (nextCount) => { exportDownloadCounts.value[format] = nextCount },
        `${format} export counter`,
      )
    }
  }

  return {
    file,
    preview,
    importResult,
    result: importResult,
    error,
    isPreviewing,
    isImporting,
    isDownloading,
    isDownloadingTemplate,
    isExportingCsv,
    isExportingXlsx,
    isImportModalOpen,
    canCommitImport,
    setFile,
    selectFile,
    reset,
    openImportModal,
    closeImportModal,
    previewImport,
    commitImport,
    downloadTemplate,
    exportRows,
    exportFile: exportRows,
  }
}
