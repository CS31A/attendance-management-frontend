<script setup>
import { CheckCircle, Clock, Download, Users, X, XCircle } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { useQrCodeStore } from '@/stores/qrCodeStore'
import { formatDate, formatScanTime } from '@/utils/qrcode'

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  qrCodeId: {
    type: Number,
    required: true,
  },
})

defineEmits(['close'])

const qrCodeStore = useQrCodeStore()
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)

const scanHistory = computed(() => qrCodeStore.scanHistory)
const qrCodeInfo = computed(() => scanHistory.value?.qrCodeInfo || {})
const statistics = computed(() => scanHistory.value?.scanStatistics || {})
const scans = computed(() => scanHistory.value?.scans?.items || [])
const totalScans = computed(() => scanHistory.value?.scans?.totalItems || 0)
const totalPages = computed(() => Math.ceil(totalScans.value / pageSize.value))

const hasScans = computed(() => scans.value.length > 0)

async function loadScanHistory() {
  loading.value = true
  try {
    await qrCodeStore.fetchScanHistory(props.qrCodeId, {
      page: currentPage.value,
      limit: pageSize.value,
    })
  }
  catch (error) {
    console.error('Failed to load scan history:', error)
  }
  finally {
    loading.value = false
  }
}

function handlePageChange(page) {
  currentPage.value = page
  loadScanHistory()
}

function exportToCSV() {
  if (!hasScans.value)
    return

  const headers = ['Student Name', 'Student ID', 'Scan Time', 'Status', 'Device Info']
  const rows = scans.value.map(scan => [
    scan.studentName || 'N/A',
    scan.studentId || 'N/A',
    formatScanTime(scan.scannedAt),
    scan.status || 'success',
    scan.deviceInfo || 'N/A',
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `qr-scan-history-${props.qrCodeId}-${Date.now()}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    currentPage.value = 1
    loadScanHistory()
  }
}, { immediate: true })
</script>

<template>
  <div v-if="show" class="overlay" role="dialog" aria-modal="true" aria-labelledby="scan-history-title" @click.self="$emit('close')">
    <div class="modal">
      <!-- Header -->
      <div class="modal-header">
        <h2 id="scan-history-title">
          Scan History
        </h2>
        <button type="button" class="btn-close" aria-label="Close modal" @click="$emit('close')">
          <X :size="24" />
        </button>
      </div>

      <!-- Statistics Summary -->
      <div v-if="statistics" class="stats-summary">
        <div class="stat-card">
          <Users class="stat-icon" :size="24" />
          <div class="stat-content">
            <span class="stat-value">{{ statistics.totalScans || 0 }}</span>
            <span class="stat-label">Total Scans</span>
          </div>
        </div>

        <div class="stat-card">
          <CheckCircle class="stat-icon success" :size="24" />
          <div class="stat-content">
            <span class="stat-value">{{ statistics.successfulScans || 0 }}</span>
            <span class="stat-label">Successful</span>
          </div>
        </div>

        <div class="stat-card">
          <XCircle class="stat-icon error" :size="24" />
          <div class="stat-content">
            <span class="stat-value">{{ statistics.failedScans || 0 }}</span>
            <span class="stat-label">Failed</span>
          </div>
        </div>

        <div class="stat-card">
          <Clock class="stat-icon" :size="24" />
          <div class="stat-content">
            <span class="stat-value">{{ statistics.uniqueStudents || 0 }}</span>
            <span class="stat-label">Unique Students</span>
          </div>
        </div>
      </div>

      <!-- QR Code Info -->
      <div v-if="qrCodeInfo" class="qr-info">
        <div class="info-row">
          <span class="info-label">Session:</span>
          <span class="info-value">{{ qrCodeInfo.scheduleTitle || 'N/A' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Generated:</span>
          <span class="info-value">{{ formatDate(qrCodeInfo.generatedAt) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Expires:</span>
          <span class="info-value">{{ formatDate(qrCodeInfo.expiresAt) }}</span>
        </div>
      </div>

      <!-- Body -->
      <div class="modal-body">
        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
          <div class="spinner" />
          <p>Loading scan history...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="!hasScans" class="empty-state">
          <Users :size="48" class="empty-icon" />
          <h3>No Scans Yet</h3>
          <p>Students who scan this QR code will appear here.</p>
        </div>

        <!-- Scans Table -->
        <div v-else class="scans-table-wrapper">
          <table class="scans-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Student ID</th>
                <th>Scan Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="scan in scans" :key="scan.id" class="scan-row">
                <td class="student-name">
                  {{ scan.studentName || 'Unknown' }}
                </td>
                <td class="student-id">
                  {{ scan.studentId || 'N/A' }}
                </td>
                <td class="scan-time">
                  {{ formatScanTime(scan.scannedAt) }}
                </td>
                <td>
                  <span
                    class="status-badge"
                    :class="scan.status === 'success' ? 'status-success' : 'status-failed'"
                  >
                    {{ scan.status || 'success' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="pagination">
          <button
            class="btn-page"
            :disabled="currentPage === 1"
            @click="handlePageChange(currentPage - 1)"
          >
            Previous
          </button>

          <span class="page-info">
            Page {{ currentPage }} of {{ totalPages }}
          </span>

          <button
            class="btn-page"
            :disabled="currentPage === totalPages"
            @click="handlePageChange(currentPage + 1)"
          >
            Next
          </button>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button
          class="btn-export"
          :disabled="!hasScans"
          @click="exportToCSV"
        >
          <Download :size="18" />
          Export to CSV
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  padding: 1rem;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.2s ease-out;
}

.modal {
  background: white;
  border-radius: 1rem;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  animation: scaleUp 0.3s ease-out;
}

.modal-header {
  padding: 1.25rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--color-gray-200);
  background: var(--color-gray-50);
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  color: var(--color-gray-900);
}

.btn-close {
  background: transparent;
  border: none;
  color: var(--color-gray-400);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  display: flex;
}

.stats-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  padding: 1.5rem;
  background: var(--color-gray-50);
  border-bottom: 1px solid var(--color-gray-200);
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: white;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid var(--color-gray-200);
}

.stat-icon {
  color: var(--color-primary);
  flex-shrink: 0;
}

.stat-icon.success {
  color: #059669;
}

.stat-icon.error {
  color: #dc2626;
}

.stat-content {
  display: flex;
  flex-direction: column;
  line-height: 1;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-gray-900);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--color-gray-500);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 0.25rem;
}

.qr-info {
  padding: 1rem 1.5rem;
  background: white;
  border-bottom: 1px solid var(--color-gray-200);
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.info-row {
  display: flex;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.info-label {
  font-weight: 600;
  color: var(--color-gray-600);
}

.info-value {
  color: var(--color-gray-900);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-gray-200);
  border-radius: 50%;
  border-top-color: var(--color-primary);
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.empty-icon {
  color: var(--color-gray-300);
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-gray-700);
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  color: var(--color-gray-500);
  margin: 0;
}

.scans-table-wrapper {
  overflow-x: auto;
  border: 1px solid var(--color-gray-200);
  border-radius: 0.5rem;
}

.scans-table {
  width: 100%;
  border-collapse: collapse;
}

.scans-table thead {
  background: var(--color-gray-50);
  border-bottom: 2px solid var(--color-gray-200);
}

.scans-table th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-gray-700);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.scans-table tbody tr {
  border-bottom: 1px solid var(--color-gray-100);
}

.scans-table tbody tr:hover {
  background: var(--color-gray-50);
}

.scans-table td {
  padding: 0.875rem 1rem;
  font-size: 0.875rem;
  color: var(--color-gray-700);
}

.student-name {
  font-weight: 500;
  color: var(--color-gray-900);
}

.status-badge {
  padding: 0.125rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-success {
  background: #ecfdf5;
  color: #059669;
}

.status-failed {
  background: #fef2f2;
  color: #dc2626;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

.btn-page {
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid var(--color-gray-300);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-gray-700);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-page:hover:not(:disabled) {
  background: var(--color-gray-50);
  border-color: var(--color-gray-400);
}

.btn-page:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.875rem;
  color: var(--color-gray-600);
}

.modal-footer {
  padding: 1rem 1.5rem;
  background: var(--color-gray-50);
  border-top: 1px solid var(--color-gray-200);
  display: flex;
  justify-content: flex-end;
}

.btn-export {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-export:hover:not(:disabled) {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

.btn-export:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleUp {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .stats-summary {
    grid-template-columns: repeat(2, 1fr);
  }

  .qr-info {
    flex-direction: column;
    gap: 0.75rem;
  }

  .scans-table th:nth-child(2),
  .scans-table td:nth-child(2) {
    display: none;
  }
}
</style>
