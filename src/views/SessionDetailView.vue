<script setup lang="ts">
import type { QrCodeResponseDto } from '@/api/qrCode'
import type { SessionResponseDto } from '@/api/sessions'
import { AlertTriangle, ArrowLeft, Calendar, Check, Clock, Eye, History, MapPin, QrCode, RefreshCw } from 'lucide-vue-next'
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQrCodeStore } from '@/stores/qrCodeStore'
import { useSessionStore } from '@/stores/sessionStore'
import { LOCALE } from '@/utils/constants'
import { formatShortWeekdayDateWithYear } from '@/utils/date'
import { getErrorMessage } from '@/utils/httpError'
import { formatDateTime, parseUtcDate } from '@/utils/qrcode'

const QRDisplayModal = defineAsyncComponent(() => import('@/components/qrcode/QRDisplayModal.vue'))
const QRScanHistoryModal = defineAsyncComponent(() => import('@/components/qrcode/QRScanHistoryModal.vue'))
const SessionStatusBadge = defineAsyncComponent(() => import('@/components/sessions/SessionStatusBadge.vue'))

const route = useRoute()
const router = useRouter()
const sessionStore = useSessionStore()
const qrCodeStore = useQrCodeStore()

const session = ref<SessionResponseDto | null>(null)
const sessionError = ref('')
const loadingSession = ref(false)
const loadingQrCodes = ref(false)
const qrError = ref('')
const showQRDisplayModal = ref(false)
const showScanHistoryModal = ref(false)
const currentQrCode = ref<QrCodeResponseDto | null>(null)
const selectedScanQrCodeId = ref('')

const sessionId = computed(() => String(route.params.sessionId || ''))
const qrCodes = computed(() => qrCodeStore.sessionQrCodes)

function fieldValue(source: SessionResponseDto | QrCodeResponseDto | null, keys: string[]): unknown {
  if (!source)
    return undefined

  return keys.map(key => source[key]).find(value => value != null && value !== '')
}

function displayText(value: unknown, fallback = 'Not provided') {
  return typeof value === 'string' && value.trim() ? value : fallback
}

function getCourseName(value: SessionResponseDto | null) {
  if (!value)
    return 'Session Details'

  if (value.subjectCode && value.subjectName)
    return `${value.subjectCode} - ${value.subjectName}`
  if (value.courseCode && value.courseName)
    return `${value.courseCode} - ${value.courseName}`

  return displayText(value.subjectName || value.subjectCode || value.courseName || value.courseCode, 'Unknown Course')
}

function formatDate(value: unknown) {
  return typeof value === 'string' && value ? formatShortWeekdayDateWithYear(value) : 'Date TBD'
}

function formatTime(value: unknown) {
  if (typeof value !== 'string' || !value)
    return ''

  const parsedDate = new Date(value)
  if (!Number.isNaN(parsedDate.getTime()))
    return parsedDate.toLocaleTimeString(LOCALE.DEFAULT, LOCALE.TIME_FORMAT)

  const timeParts = value.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/)
  if (!timeParts)
    return ''

  const hour = Number.parseInt(timeParts[1], 10)
  const minutes = timeParts[2]
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${period}`
}

function formatTimeRange(value: SessionResponseDto | null) {
  const actualStart = fieldValue(value, ['actualStartTime'])
  const actualEnd = fieldValue(value, ['actualEndTime'])
  const scheduledStart = fieldValue(value, ['scheduledStartTime', 'startTime'])
  const scheduledEnd = fieldValue(value, ['scheduledEndTime', 'endTime'])

  if (actualStart && actualEnd)
    return `${formatTime(actualStart)} - ${formatTime(actualEnd)}`
  if (scheduledStart && scheduledEnd)
    return `${formatTime(scheduledStart)} - ${formatTime(scheduledEnd)}`

  return 'Time TBD'
}

function getRoomName(value: SessionResponseDto | null) {
  return displayText(fieldValue(value, ['actualRoomName', 'scheduledRoomName', 'roomName']), 'Room TBD')
}

function getLifecycleTimestamp(value: SessionResponseDto | null, keys: string[]) {
  const timestamp = fieldValue(value, keys)
  return typeof timestamp === 'string' && timestamp ? formatDateTime(timestamp) : 'Not recorded'
}

function getQrId(qrCode: QrCodeResponseDto) {
  return qrCode.id || qrCode.qrCodeId || ''
}

function getQrStatusLabel(qrCode: QrCodeResponseDto) {
  if (!qrCode.isActive)
    return 'Inactive'
  if (qrCode.isExpired)
    return 'Expired'

  const expiresAt = typeof qrCode.expiresAt === 'string' ? parseUtcDate(qrCode.expiresAt) : null
  if (expiresAt && expiresAt < new Date())
    return 'Expired'

  return 'Active'
}

function getQrStatusClass(qrCode: QrCodeResponseDto) {
  return `status-${getQrStatusLabel(qrCode).toLowerCase()}`
}

function formatExpiration(qrCode: QrCodeResponseDto) {
  if (!qrCode.expiresAt)
    return 'No expiration'

  const expiration = parseUtcDate(qrCode.expiresAt)
  if (!expiration)
    return 'Invalid expiration'

  if (expiration < new Date())
    return 'Expired'

  return formatDateTime(qrCode.expiresAt)
}

async function loadSession() {
  loadingSession.value = true
  sessionError.value = ''

  try {
    session.value = await sessionStore.fetchSessionById(sessionId.value)
  }
  catch (error) {
    session.value = null
    sessionError.value = getErrorMessage(error, 'Session could not be loaded.')
  }
  finally {
    loadingSession.value = false
  }
}

async function loadQrCodes() {
  if (!sessionId.value)
    return

  loadingQrCodes.value = true
  qrError.value = ''

  try {
    await qrCodeStore.fetchSessionQrCodes(sessionId.value)
  }
  catch (error) {
    qrError.value = getErrorMessage(error, 'QR codes could not be loaded.')
  }
  finally {
    loadingQrCodes.value = false
  }
}

async function refreshQrCodes() {
  await loadQrCodes()
}

async function openQrCode(qrCode: QrCodeResponseDto) {
  const id = getQrId(qrCode)
  if (!id)
    return

  currentQrCode.value = await qrCodeStore.fetchQrCode(id)
  showQRDisplayModal.value = true
}

function openScanHistory(qrCode: QrCodeResponseDto) {
  const id = getQrId(qrCode)
  if (!id)
    return

  selectedScanQrCodeId.value = id
  showScanHistoryModal.value = true
}

function closeQrModal() {
  showQRDisplayModal.value = false
  currentQrCode.value = null
}

function closeScanHistory() {
  showScanHistoryModal.value = false
  selectedScanQrCodeId.value = ''
}

function goBackToSessions() {
  router.push('/sessions')
}

onMounted(async () => {
  qrCodeStore.clearSessionQrCodes()
  await Promise.all([loadSession(), loadQrCodes()])
})
</script>

<template>
  <div class="session-detail-view">
    <button class="back-button" type="button" @click="goBackToSessions">
      <ArrowLeft :size="18" />
      <span>Session Management</span>
    </button>

    <div v-if="loadingSession" class="state-panel">
      <RefreshCw class="spin" :size="28" />
      <p>Loading session details...</p>
    </div>

    <div v-else-if="sessionError" class="state-panel error">
      <AlertTriangle :size="32" />
      <h1>Session Unavailable</h1>
      <p>{{ sessionError }}</p>
      <button type="button" class="primary-button" @click="goBackToSessions">
        Back to Session Management
      </button>
    </div>

    <template v-else-if="session">
      <header class="detail-header">
        <div>
          <p class="eyebrow">
            {{ formatDate(session.sessionDate) }}
          </p>
          <h1>{{ getCourseName(session) }}</h1>
          <p class="subtitle">
            {{ displayText(session.sectionName, 'Section TBD') }}
          </p>
        </div>
        <SessionStatusBadge :status="session.status" />
      </header>

      <section class="detail-grid" aria-label="Session context">
        <div class="detail-item">
          <Calendar :size="18" />
          <div>
            <span>Date</span>
            <strong>{{ formatDate(session.sessionDate) }}</strong>
          </div>
        </div>
        <div class="detail-item">
          <Clock :size="18" />
          <div>
            <span>Time</span>
            <strong>{{ formatTimeRange(session) }}</strong>
          </div>
        </div>
        <div class="detail-item">
          <MapPin :size="18" />
          <div>
            <span>Room</span>
            <strong>{{ getRoomName(session) }}</strong>
          </div>
        </div>
        <div class="detail-item">
          <Check :size="18" />
          <div>
            <span>Description</span>
            <strong>{{ displayText(session.description) }}</strong>
          </div>
        </div>
      </section>

      <section class="lifecycle-section">
        <h2>Lifecycle</h2>
        <dl>
          <div>
            <dt>Scheduled Start</dt>
            <dd>{{ displayText(formatTime(fieldValue(session, ['scheduledStartTime', 'startTime'])), 'Not scheduled') }}</dd>
          </div>
          <div>
            <dt>Actual Start</dt>
            <dd>{{ getLifecycleTimestamp(session, ['actualStartTime', 'startedAt']) }}</dd>
          </div>
          <div>
            <dt>Actual End</dt>
            <dd>{{ getLifecycleTimestamp(session, ['actualEndTime', 'endedAt']) }}</dd>
          </div>
          <div>
            <dt>Updated</dt>
            <dd>{{ getLifecycleTimestamp(session, ['updatedAt', 'modifiedAt']) }}</dd>
          </div>
        </dl>
      </section>

      <section class="qr-section" aria-labelledby="qr-section-title">
        <div class="section-header">
          <div>
            <h2 id="qr-section-title">
              QR Codes
            </h2>
            <p>{{ qrCodes.length }} code{{ qrCodes.length === 1 ? '' : 's' }} generated for this session</p>
          </div>
          <button type="button" class="secondary-button" :disabled="loadingQrCodes" @click="refreshQrCodes">
            <RefreshCw :class="{ spin: loadingQrCodes }" :size="16" />
            <span>Refresh</span>
          </button>
        </div>

        <div v-if="loadingQrCodes" class="state-panel compact">
          <RefreshCw class="spin" :size="24" />
          <p>Loading QR codes...</p>
        </div>

        <div v-else-if="qrError" class="state-panel compact error">
          <AlertTriangle :size="28" />
          <p>{{ qrError }}</p>
        </div>

        <div v-else-if="!qrCodes.length" class="state-panel compact">
          <QrCode :size="36" />
          <h3>No QR Codes Generated</h3>
          <p>This session does not have QR codes yet.</p>
        </div>

        <div v-else class="qr-grid">
          <article v-for="qrCode in qrCodes" :key="getQrId(qrCode)" class="qr-card">
            <div class="qr-card-header">
              <div>
                <span class="qr-id">QR {{ getQrId(qrCode) }}</span>
                <strong class="qr-status" :class="getQrStatusClass(qrCode)">{{ getQrStatusLabel(qrCode) }}</strong>
              </div>
            </div>

            <dl class="qr-meta">
              <div>
                <dt>Generated</dt>
                <dd>{{ formatDateTime(qrCode.generatedAt || qrCode.createdAt) }}</dd>
              </div>
              <div>
                <dt>Expires</dt>
                <dd>{{ formatExpiration(qrCode) }}</dd>
              </div>
              <div>
                <dt>Scans</dt>
                <dd>{{ qrCode.usageCount || 0 }}{{ qrCode.maxUsage ? ` / ${qrCode.maxUsage}` : '' }}</dd>
              </div>
            </dl>

            <div class="qr-actions">
              <button type="button" class="secondary-button" @click="openQrCode(qrCode)">
                <Eye :size="16" />
                <span>View</span>
              </button>
              <button type="button" class="secondary-button" @click="openScanHistory(qrCode)">
                <History :size="16" />
                <span>Scan History</span>
              </button>
            </div>
          </article>
        </div>
      </section>
    </template>

    <QRDisplayModal
      v-if="showQRDisplayModal && currentQrCode"
      :show="showQRDisplayModal"
      :qr-code="currentQrCode"
      @close="closeQrModal"
      @fullscreen="router.push(`/qr-code/projection/${getQrId(currentQrCode)}`)"
    />

    <QRScanHistoryModal
      v-if="showScanHistoryModal && selectedScanQrCodeId"
      :show="showScanHistoryModal"
      :qr-code-id="selectedScanQrCodeId"
      @close="closeScanHistory"
    />
  </div>
</template>

<style scoped>
.session-detail-view {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-width: 1180px;
  margin: 0 auto;
  padding: 1.5rem;
}

.back-button,
.primary-button,
.secondary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.back-button {
  width: fit-content;
  border: 0;
  background: transparent;
  color: var(--color-primary);
  padding: 0.25rem 0;
}

.primary-button {
  border: 1px solid var(--color-primary);
  background: var(--color-primary);
  color: white;
  padding: 0.625rem 1rem;
}

.secondary-button {
  border: 1px solid var(--color-gray-300);
  background: white;
  color: var(--color-gray-700);
  padding: 0.5rem 0.75rem;
}

.secondary-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-gray-200);
}

.eyebrow,
.subtitle,
.section-header p {
  margin: 0;
  color: var(--color-gray-500);
}

h1,
h2,
h3 {
  margin: 0;
  color: var(--color-gray-900, #111827);
}

h1 {
  margin-top: 0.25rem;
  font-size: 2rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.75rem;
}

.detail-item {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  padding: 1rem;
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  background: white;
}

.detail-item span,
dt {
  display: block;
  color: var(--color-gray-500);
  font-size: 0.8125rem;
}

.detail-item strong,
dd {
  margin: 0.25rem 0 0;
  color: var(--color-gray-800);
}

.lifecycle-section,
.qr-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.lifecycle-section dl,
.qr-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
  margin: 0;
}

.lifecycle-section dl > div,
.qr-meta > div {
  padding: 0.875rem;
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  background: white;
}

.section-header,
.qr-card-header,
.qr-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.qr-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.qr-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  background: white;
}

.qr-id {
  display: block;
  max-width: 250px;
  overflow-wrap: anywhere;
  color: var(--color-gray-800);
  font-weight: 700;
}

.qr-status {
  display: inline-block;
  margin-top: 0.25rem;
  font-size: 0.8125rem;
}

.status-active {
  color: var(--color-success);
}

.status-expired,
.status-inactive {
  color: var(--color-error-dark);
}

.state-panel {
  display: flex;
  min-height: 220px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  background: white;
  padding: 2rem;
  text-align: center;
  color: var(--color-gray-600);
}

.state-panel.compact {
  min-height: 160px;
}

.state-panel.error {
  color: var(--color-error-dark);
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .session-detail-view {
    padding: 1rem;
  }

  .detail-header,
  .section-header,
  .qr-actions {
    align-items: stretch;
    flex-direction: column;
  }

  h1 {
    font-size: 1.5rem;
  }
}
</style>
