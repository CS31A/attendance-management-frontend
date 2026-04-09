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

export function useAdminData(entity: AdminDataEntity, options: UseAdminDataOptions = {}) {
  const file = ref<File | null>(null)
  const preview = ref<AdminDataPreviewResponseDto | null>(null)
  const importResult = ref<AdminDataImportResponseDto | null>(null)
  const error = ref('')
  const isPreviewing = ref(false)
  const isImporting = ref(false)
  const isDownloading = ref(false)
  const isImportModalOpen = ref(false)
  const getExportParams = options.getExportParams ?? options.exportFilters ?? (() => ({}))
  const getImportParams = options.getImportParams ?? options.importParams ?? (() => ({}))

  const canCommitImport = computed(() => !!preview.value?.canImport && !isImporting.value)

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
    isDownloading.value = true
    error.value = ''

    try {
      const response = await downloadAdminDataTemplate(entity, format)
      triggerBrowserDownload(response)
      return response
    }
    catch (caughtError) {
      error.value = getErrorMessage(caughtError, 'Failed to download template')
      throw caughtError
    }
    finally {
      isDownloading.value = false
    }
  }

  async function exportRows(format: AdminDataFormat) {
    isDownloading.value = true
    error.value = ''

    try {
      const response = await exportAdminData(entity, format, getExportParams())
      triggerBrowserDownload(response)
      return response
    }
    catch (caughtError) {
      error.value = getErrorMessage(caughtError, 'Failed to export data')
      throw caughtError
    }
    finally {
      isDownloading.value = false
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
