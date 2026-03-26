<script setup>
import { Check, Clock, Eye, QrCode, RefreshCw, X, XCircle } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { useQrCodeStore } from '@/stores/qrCodeStore'
import { parseUtcDate } from '@/utils/qrcode'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  session: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['close', 'viewQr'])

const qrCodeStore = useQrCodeStore()
const loading = ref(false)
const error = ref('')

// Computed
const qrCodes = computed(() => qrCodeStore.sessionQrCodes)

// Methods
async function loadQrCodes() {
  if (!props.session?.id)
    return

  loading.value = true
  error.value = ''

  try {
    await qrCodeStore.fetchSessionQrCodes(props.session.id)
  }
  catch (err) {
    console.error('Failed to load QR codes:', err)
    error.value = err.response?.data?.message || 'Failed to load QR codes'
  }
  finally {
    loading.value = false
  }
}

function handleClose() {
  qrCodeStore.clearSessionQrCodes()
  emit('close')
}

function handleViewQr(qrCode) {
  emit('viewQr', qrCode)
}

async function handleRefresh() {
  await loadQrCodes()
}

function formatDate(dateString) {
  if (!dateString)
    return 'N/A'
  const date = parseUtcDate(dateString)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getStatusBadgeClass(qrCode) {
  if (!qrCode.isActive)
    return 'status-revoked'
  if (qrCode.isExpired)
    return 'status-expired'
  return 'status-active'
}

function getStatusLabel(qrCode) {
  if (!qrCode.isActive)
    return 'Revoked'
  if (qrCode.isExpired)
    return 'Expired'
  return 'Active'
}

function formatExpiration(expiresAt) {
  if (!expiresAt)
    return 'No expiration'
  const date = parseUtcDate(expiresAt)
  const now = new Date()

  if (date < now)
    return 'Expired'

  const diffMs = date - now
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)

  if (diffHours > 24) {
    return `Expires in ${Math.floor(diffHours / 24)} days`
  }
  if (diffHours > 0) {
    return `Expires in ${diffHours}h ${diffMins % 60}m`
  }
  return `Expires in ${diffMins}m`
}

// Lifecycle
onMounted(() => {
  if (props.show) {
    loadQrCodes()
  }
})

// Watch for show prop changes
watch(() => props.show, (newVal) => {
  if (newVal) {
    loadQrCodes()
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click="handleClose">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <div class="header-content">
              <QrCode :size="24" class="header-icon" />
              <div>
                <h2 class="modal-title">
                  QR Codes for Session
                </h2>
                <p class="modal-subtitle">
                  {{ session.subjectName }} - {{ session.sectionName }}
                </p>
              </div>
            </div>
            <button class="btn-close" @click="handleClose">
              <X :size="20" />
            </button>
          </div>

          <div class="modal-body">
            <!-- Loading State -->
            <div v-if="loading" class="loading-state">
              <div class="spinner" />
              <p>Loading QR codes...</p>
            </div>

            <!-- Error State -->
            <div v-else-if="error" class="error-state">
              <XCircle :size="48" class="error-icon" />
              <p>{{ error }}</p>
              <button class="btn-retry" @click="handleRefresh">
                <RefreshCw :size="16" />
                Try Again
              </button>
            </div>

            <!-- Empty State -->
            <div v-else-if="!qrCodes.length" class="empty-state">
              <QrCode :size="64" class="empty-icon" />
              <h3>No QR Codes Generated</h3>
              <p>No QR codes have been generated for this session yet.</p>
            </div>

            <!-- QR Codes List -->
            <div v-else class="qr-list">
              <div class="list-header">
                <span class="list-count">{{ qrCodes.length }} QR code{{ qrCodes.length !== 1 ? 's' : '' }}</span>
                <button class="btn-refresh" @click="handleRefresh">
                  <RefreshCw :size="16" />
                  Refresh
                </button>
              </div>

              <div class="qr-cards">
                <div
                  v-for="qrCode in qrCodes"
                  :key="qrCode.id"
                  class="qr-card"
                  :class="{ 'is-inactive': !qrCode.isActive || qrCode.isExpired }"
                >
                  <div class="card-header">
                    <div class="qr-id">
                      QR #{{ qrCode.id }}
                    </div>
                    <span class="status-badge" :class="getStatusBadgeClass(qrCode)">
                      {{ getStatusLabel(qrCode) }}
                    </span>
                  </div>

                  <div class="card-body">
                    <div class="info-row">
                      <Clock :size="16" class="info-icon" />
                      <div class="info-content">
                        <span class="info-label">Created:</span>
                        <span class="info-value">{{ formatDate(qrCode.createdAt) }}</span>
                      </div>
                    </div>

                    <div class="info-row">
                      <Clock :size="16" class="info-icon" />
                      <div class="info-content">
                        <span class="info-label">Expiration:</span>
                        <span class="info-value">{{ formatExpiration(qrCode.expiresAt) }}</span>
                      </div>
                    </div>

                    <div class="info-row">
                      <Check :size="16" class="info-icon" />
                      <div class="info-content">
                        <span class="info-label">Usage:</span>
                        <span class="info-value">
                          {{ qrCode.usageCount || 0 }}{{ qrCode.maxUsage ? ` / ${qrCode.maxUsage}` : '' }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div class="card-footer">
                    <button
                      class="btn-view"
                      :disabled="!qrCode.isActive || qrCode.isExpired"
                      @click="handleViewQr(qrCode)"
                    >
                      <Eye :size="16" />
                      View QR Code
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-secondary" @click="handleClose">
              Close
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 1rem;
}

.modal-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-gray-200);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-icon {
  color: var(--color-secondary);
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-gray-900);
  margin: 0;
}

.modal-subtitle {
  font-size: 0.9rem;
  color: var(--color-gray-500);
  margin: 0.25rem 0 0 0;
}

.btn-close {
  padding: 0.5rem;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  color: var(--color-gray-500);
  transition: all 0.2s;
}

.btn-close:hover {
  background: var(--color-gray-100);
  color: var(--color-gray-700);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--color-gray-200);
  border-top-color: var(--color-secondary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p,
.error-state p {
  margin-top: 1rem;
  color: var(--color-gray-600);
}

.error-icon {
  color: var(--color-error);
  margin-bottom: 1rem;
}

.btn-retry {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: var(--color-secondary);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-retry:hover {
  background: var(--color-secondary-dark);
}

.empty-icon {
  color: var(--color-gray-300);
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-gray-900);
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  color: var(--color-gray-500);
  margin: 0;
}

.qr-list {
  width: 100%;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.list-count {
  font-size: 0.9rem;
  color: var(--color-gray-600);
  font-weight: 500;
}

.btn-refresh {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: transparent;
  color: var(--color-secondary);
  border: 1px solid var(--color-secondary);
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-refresh:hover {
  background: var(--color-secondary);
  color: white;
}

.qr-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.qr-card {
  background: white;
  border: 1px solid var(--color-gray-200);
  border-radius: 12px;
  padding: 1.25rem;
  transition: all 0.2s;
}

.qr-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.qr-card.is-inactive {
  opacity: 0.6;
  background: var(--color-gray-50);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-gray-200);
}

.qr-id {
  font-weight: 600;
  color: var(--color-gray-900);
}

.status-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-active {
  background: var(--color-success-bg);
  color: rgb(6, 95, 70);
}

.status-expired {
  background: var(--color-warning-bg);
  color: rgb(146, 64, 14);
}

.status-revoked {
  background: var(--color-error-lighter);
  color: var(--color-error-darkest);
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.info-row {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.info-icon {
  color: var(--color-gray-400);
  flex-shrink: 0;
  margin-top: 2px;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.info-label {
  font-size: 0.8rem;
  color: var(--color-gray-500);
  font-weight: 500;
}

.info-value {
  font-size: 0.9rem;
  color: var(--color-gray-900);
}

.card-footer {
  padding-top: 1rem;
  border-top: 1px solid var(--color-gray-200);
}

.btn-view {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem;
  background: var(--color-secondary);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-view:hover:not(:disabled) {
  background: var(--color-secondary-dark);
}

.btn-view:disabled {
  background: var(--color-gray-300);
  color: var(--color-gray-500);
  cursor: not-allowed;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid var(--color-gray-200);
}

.btn-secondary {
  padding: 0.75rem 1.5rem;
  background: var(--color-gray-100);
  color: var(--color-gray-700);
  border: 1px solid var(--color-gray-300);
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: var(--color-gray-200);
}

/* Modal Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.95);
}

/* Responsive */
@media (max-width: 1200px) {
  .modal-container {
    max-width: 90%;
  }

  .qr-cards {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
}

@media (max-width: 900px) {
  .modal-container {
    max-width: 95%;
  }

  .modal-header {
    padding: 1.25rem;
  }

  .modal-title {
    font-size: 1.25rem;
  }

  .qr-cards {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .modal-container {
    max-height: 95vh;
  }

  .modal-header {
    padding: 1rem;
  }

  .modal-title {
    font-size: 1.125rem;
  }

  .modal-subtitle {
    font-size: 0.813rem;
  }

  .modal-body,
  .modal-footer {
    padding: 1rem;
  }

  .qr-cards {
    grid-template-columns: 1fr;
  }
}
</style>
