import type { QrCodeResponseDto, QrCodeScanHistoryResponseDto } from '@/api/qrCode'
import type { EntityId } from '@/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import qrCodeApi from '@/api/qrCode'
import { getErrorMessage } from '@/utils/httpError'
import { parseUtcDate } from '@/utils/qrcode'

interface ActiveQrCode extends QrCodeResponseDto {
  qrCodeData?: string | ArrayBuffer | null
  sessionId?: EntityId
  expirationMinutes?: number
  maxUsage?: number
}

export const useQrCodeStore = defineStore('qrCodeStore', () => {
  let visibilityListenerAttached = false

  // State
  const activeQrCode = ref<ActiveQrCode | null>(null)
  const qrCodes = ref<QrCodeResponseDto[]>([])
  const sessionQrCodes = ref<QrCodeResponseDto[]>([])
  const scanHistory = ref<QrCodeScanHistoryResponseDto>({
    qrCodeInfo: null,
    scanStatistics: null,
    scans: {
      items: [],
      totalItems: 0,
    },
  })
  const loading = ref(false)
  const error = ref('')
  const isPolling = ref(false)
  const pollInterval = ref<ReturnType<typeof setInterval> | null>(null)
  const pollIntervalMs = ref(5000)
  const currentQrCodeId = ref<number | null>(null)
  const isVisible = ref(true)

  // Getters
  const getActiveQrCode = computed(() => activeQrCode.value)
  const getScanHistory = computed(() => scanHistory.value)
  const isLoading = computed(() => loading.value)
  const getError = computed(() => error.value)
  const isPollingActive = computed(() => isPolling.value)

  // Actions
  function clearError() {
    error.value = ''
  }

  /**
   * Generate a new QR code
   * @param {object} payload - { sessionId, expirationMinutes, maxUsage, uniqueHash }
   */
  async function generateQrCode(payload: Record<string, unknown> & { sessionId: number }) {
    loading.value = true
    clearError()
    try {
      const response = await qrCodeApi.generateQrCode(payload)

      // Create a QR code object with the response data
      const qrCodeObject = {
        id: response.qrCodeId,
        qrHash: response.qrHash,
        qrCodeData: response.qrCodeImageUrl, // Base64 image converted to data URL
        sessionId: payload.sessionId,
        expirationMinutes: payload.expirationMinutes != null ? Number(payload.expirationMinutes) : undefined,
        maxUsage: payload.maxUsage != null ? Number(payload.maxUsage) : undefined,
        generatedAt: response.generatedAt,
        expiresAt: response.expiresAt,
        isActive: true,
        usageCount: 0,
      }

      activeQrCode.value = qrCodeObject
      return qrCodeObject
    }
    catch (err) {
      error.value = getErrorMessage(err, 'Error generating QR code')
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Fetch QR code details by ID
   * @param {EntityId} id
   */
  async function fetchQrCode(id: EntityId) {
    loading.value = true
    clearError()
    try {
      // Fetch QR code metadata
      const data = await qrCodeApi.getQrCodeById(id)

      // Fetch QR code image separately
      try {
        const imageData = await qrCodeApi.getQrCodeImage(id)
        data.qrCodeData = imageData
      }
      catch (imageErr) {
        console.error('Failed to fetch QR code image:', imageErr)
        // Continue without image - the UI will handle the missing image gracefully
      }

      activeQrCode.value = data
      return data
    }
    catch (err) {
      error.value = getErrorMessage(err, 'Error fetching QR code')
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Fetch all QR codes for a specific session
   * @param {number} sessionId - Session ID
   */
  async function fetchSessionQrCodes(sessionId: number) {
    loading.value = true
    clearError()
    try {
      const data = await qrCodeApi.getSessionQrCodes(sessionId)
      sessionQrCodes.value = data
      return data
    }
    catch (err) {
      error.value = getErrorMessage(err, 'Error fetching session QR codes')
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Clear session QR codes
   */
  function clearSessionQrCodes() {
    sessionQrCodes.value = []
  }

  /**
   * Fetch scan history for a QR code
   * @param {number} id - QR Code ID
   * @param {object} params - pagination params
   */
  async function fetchScanHistory(id: number, params: Record<string, unknown> = {}) {
    try {
      // Note: We don't set global loading here to avoid flickering during polling
      const data = await qrCodeApi.getScanHistoryById(id, params)
      scanHistory.value = data
      return data
    }
    catch (err) {
      console.error('Error fetching scan history:', err)
      // We generally don't set global error during polling to avoid disrupting UI
      if (!isPolling.value) {
        error.value = getErrorMessage(err, 'Error fetching history')
      }
    }
  }

  /**
   * Revoke the current or specified QR code
   * @param {number} id
   * @param {string} reason
   */
  async function revokeQrCode(id: number, reason: string | null = null) {
    loading.value = true
    clearError()
    try {
      const data = await qrCodeApi.revokeQrCodeById(id, { reason })
      // Update activeQrCode if it matches
      if (activeQrCode.value && activeQrCode.value.id === id) {
        activeQrCode.value = { ...activeQrCode.value, ...data }
      }
      return data
    }
    catch (err) {
      error.value = getErrorMessage(err, 'Error revoking QR code')
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Calculate adaptive polling interval based on QR expiration
   * @param {Date|string} expiresAt - Expiration timestamp
   * @returns {number} Interval in milliseconds
   */
  function calculatePollingInterval(expiresAt: string | Date | null | undefined): number {
    if (!expiresAt)
      return 5000

    const now = new Date()
    const expiration = parseUtcDate(expiresAt)
    if (!expiration)
      return 5000

    const secondsRemaining = Math.floor((expiration.getTime() - now.getTime()) / 1000)

    // Expired: stop polling
    if (secondsRemaining <= 0)
      return 0

    // Near expiration (< 2 min): 2 seconds
    if (secondsRemaining < 120)
      return 2000

    // Normal: 5 seconds
    return 5000
  }

  /**
   * Update polling interval dynamically
   */
  function updatePollingInterval() {
    if (!isPolling.value || !activeQrCode.value)
      return

    const newInterval = calculatePollingInterval(activeQrCode.value.expiresAt)

    // Stop polling if expired
    if (newInterval === 0) {
      stopPolling()
      return
    }

    // Update interval if changed
    if (newInterval !== pollIntervalMs.value) {
      pollIntervalMs.value = newInterval
      // Restart polling with new interval
      if (currentQrCodeId.value) {
        stopPolling()
        startPolling(currentQrCodeId.value)
      }
    }
  }

  /**
   * Start polling for scan history updates
   * @param {number} qrCodeId
   */
  function startPolling(qrCodeId: number): void {
    if (isPolling.value && currentQrCodeId.value === qrCodeId)
      return

    // Stop any existing polling
    stopPolling()

    currentQrCodeId.value = qrCodeId
    isPolling.value = true
    attachVisibilityListener()

    // Calculate initial interval
    pollIntervalMs.value = calculatePollingInterval(activeQrCode.value?.expiresAt)

    if (pollIntervalMs.value === 0) {
      // Already expired, don't start
      isPolling.value = false
      detachVisibilityListener()
      return
    }

    // Initial fetch
    fetchScanHistory(qrCodeId)

    // Start interval polling
    pollInterval.value = setInterval(() => {
      // Only fetch if tab is visible
      if (isVisible.value) {
        fetchScanHistory(qrCodeId)
        // Check if we need to adjust interval
        updatePollingInterval()
      }
    }, pollIntervalMs.value)
  }

  /**
   * Stop polling
   */
  function stopPolling() {
    if (pollInterval.value) {
      clearInterval(pollInterval.value)
      pollInterval.value = null
    }
    isPolling.value = false
    currentQrCodeId.value = null
    detachVisibilityListener()
  }

  /**
   * Handle visibility change (tab focus/blur)
   */
  function handleVisibilityChange() {
    if (typeof document === 'undefined')
      return

    isVisible.value = !document.hidden

    if (isVisible.value && isPolling.value && currentQrCodeId.value) {
      // Tab became visible, fetch immediately
      fetchScanHistory(currentQrCodeId.value)
    }
  }

  function attachVisibilityListener() {
    if (visibilityListenerAttached || typeof document === 'undefined')
      return

    document.addEventListener('visibilitychange', handleVisibilityChange)
    visibilityListenerAttached = true
    isVisible.value = !document.hidden
  }

  function detachVisibilityListener() {
    if (!visibilityListenerAttached || typeof document === 'undefined')
      return

    document.removeEventListener('visibilitychange', handleVisibilityChange)
    visibilityListenerAttached = false
  }

  return {
    // State
    activeQrCode,
    qrCodes,
    sessionQrCodes,
    scanHistory,
    loading,
    error,
    isPolling,
    pollInterval,
    pollIntervalMs,
    currentQrCodeId,
    isVisible,

    // Getters
    getActiveQrCode,
    getScanHistory,
    isLoading,
    getError,
    isPollingActive,

    // Actions
    generateQrCode,
    fetchQrCode,
    fetchSessionQrCodes,
    clearSessionQrCodes,
    fetchScanHistory,
    revokeQrCode,
    startPolling,
    stopPolling,
    attachVisibilityListener,
    detachVisibilityListener,
    clearError,
  }
})
