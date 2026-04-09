<script setup lang="ts">
import type { AdminDataEntity } from '@/api/adminData'
import { Download, FileSpreadsheet, Upload } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import { useAdminData } from '@/composables/useAdminData'

const props = defineProps<{
  entity: AdminDataEntity
  title: string
  exportParams?: Record<string, unknown>
  importParams?: Record<string, unknown>
}>()

const emit = defineEmits<{
  success: [message: string]
  error: [message: string]
  imported: []
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const showModal = ref(false)
const {
  file,
  preview,
  error,
  isPreviewing,
  isImporting,
  isDownloading,
  setFile,
  reset,
  previewImport,
  commitImport,
  downloadTemplate,
  exportRows,
} = useAdminData(props.entity, {
  getExportParams: () => props.exportParams ?? {},
  getImportParams: () => props.importParams ?? {},
})

const issueCount = computed(() => (preview.value?.fileIssues.length ?? 0) + (preview.value?.rows.reduce((count, row) => count + row.issues.length, 0) ?? 0))
const selectedFileName = computed(() => file.value?.name ?? 'No file selected')

function openModal() {
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  reset()
}

function chooseFile() {
  inputRef.value?.click()
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement | null
  setFile(target?.files?.[0] ?? null)
}

async function handlePreview() {
  try {
    const response = await previewImport()
    if (response.canImport) {
      emit('success', `${props.title} preview is ready. ${response.readyRows} row(s) can be imported.`)
    }
    else {
      emit('error', `${props.title} preview found blocking issues. Review the rows before importing.`)
    }
  }
  catch {
    emit('error', error.value || `Failed to preview ${props.title.toLowerCase()} import`)
  }
}

async function handleImport() {
  try {
    const response = await commitImport()
    if (response.success) {
      emit('success', `${props.title} import completed. ${response.createdRows} row(s) created, ${response.skippedDuplicateRows} duplicate row(s) skipped.`)
      emit('imported')
      closeModal()
    }
    else {
      emit('error', `${props.title} import finished with ${response.failedRows} failed row(s).`)
    }
  }
  catch {
    emit('error', error.value || `Failed to import ${props.title.toLowerCase()} file`)
  }
}

async function handleTemplateDownload() {
  try {
    await downloadTemplate('xlsx')
    emit('success', `${props.title} template downloaded.`)
  }
  catch {
    emit('error', error.value || `Failed to download ${props.title.toLowerCase()} template`)
  }
}

async function handleExport(format: 'csv' | 'xlsx') {
  try {
    await exportRows(format)
    emit('success', `${props.title} ${format.toUpperCase()} export downloaded.`)
  }
  catch {
    emit('error', error.value || `Failed to export ${props.title.toLowerCase()} data`)
  }
}
</script>

<template>
  <div class="bulk-data-actions">
    <input
      ref="inputRef"
      type="file"
      class="bulk-data-actions__input"
      accept=".csv,.xlsx"
      @change="handleFileChange"
    >

    <BaseButton variant="secondary" :icon="Upload" :loading="isDownloading" @click="openModal">
      Import
    </BaseButton>
    <BaseButton variant="secondary" :icon="FileSpreadsheet" :loading="isDownloading" @click="handleTemplateDownload">
      Download Template
    </BaseButton>
    <BaseButton variant="secondary" :icon="Download" :loading="isDownloading" @click="handleExport('csv')">
      Export CSV
    </BaseButton>
    <BaseButton variant="secondary" :icon="Download" :loading="isDownloading" @click="handleExport('xlsx')">
      Export Excel
    </BaseButton>

    <BaseModal :show="showModal" :title="`${title} import`" size="xl" @close="closeModal">
      <div class="bulk-import-modal">
        <div class="bulk-import-modal__row">
          <strong>Selected file:</strong>
          <span>{{ selectedFileName }}</span>
        </div>

        <div class="bulk-import-modal__actions">
          <BaseButton variant="secondary" :icon="Upload" @click="chooseFile">
            Choose File
          </BaseButton>
          <BaseButton variant="primary" :loading="isPreviewing" :disabled="!file" @click="handlePreview">
            Preview Import
          </BaseButton>
          <BaseButton
            variant="success"
            :loading="isImporting"
            :disabled="!preview || !preview.canImport || isPreviewing"
            @click="handleImport"
          >
            Commit Import
          </BaseButton>
        </div>

        <p v-if="error" class="bulk-import-modal__error">
          {{ error }}
        </p>

        <div v-if="preview" class="bulk-import-modal__summary">
          <div><strong>Total:</strong> {{ preview.totalRows }}</div>
          <div><strong>Ready:</strong> {{ preview.readyRows }}</div>
          <div><strong>Duplicates:</strong> {{ preview.duplicateRows }}</div>
          <div><strong>Invalid:</strong> {{ preview.invalidRows }}</div>
          <div><strong>Issues:</strong> {{ issueCount }}</div>
        </div>

        <div v-if="preview?.rows.length" class="bulk-import-modal__table-wrapper">
          <table class="bulk-import-modal__table">
            <thead>
              <tr>
                <th>Row</th>
                <th>Status</th>
                <th>Issues</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in preview.rows" :key="row.rowNumber">
                <td>{{ row.rowNumber }}</td>
                <td>{{ row.status }}</td>
                <td>
                  <ul>
                    <li v-for="issue in row.issues" :key="`${row.rowNumber}-${issue.code}-${issue.field}`">
                      {{ issue.message }}
                    </li>
                  </ul>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<style scoped>
.bulk-data-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.bulk-data-actions__input {
  display: none;
}

.bulk-import-modal {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.bulk-import-modal__row,
.bulk-import-modal__summary {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.bulk-import-modal__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.bulk-import-modal__error {
  color: var(--color-error);
  font-weight: 600;
}

.bulk-import-modal__table-wrapper {
  max-height: 320px;
  overflow: auto;
  border: 1px solid var(--color-slate-200);
  border-radius: 12px;
}

.bulk-import-modal__table {
  width: 100%;
  border-collapse: collapse;
}

.bulk-import-modal__table th,
.bulk-import-modal__table td {
  padding: 0.75rem;
  border-bottom: 1px solid var(--color-slate-200);
  text-align: left;
  vertical-align: top;
}

.bulk-import-modal__table ul {
  margin: 0;
  padding-left: 1rem;
}
</style>
