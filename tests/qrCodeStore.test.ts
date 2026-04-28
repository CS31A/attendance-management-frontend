import type { QrCodeResponseDto, QrCodeScanHistoryResponseDto } from '@/api/qrCode'

import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import qrCodeApi from '@/api/qrCode'
import { useQrCodeStore } from '@/stores/qrCodeStore'
import { getErrorMessage, getErrorStatus } from '@/utils/httpError'

vi.mock('@/api/qrCode')
vi.mock('@/utils/httpError')

// Helper factory
function createQrCode(overrides: Partial<QrCodeResponseDto> = {}): QrCodeResponseDto {
  return {
    id: '1',
    qrHash: 'abc123',
    generatedAt: '2024-01-01T00:00:00Z',
    expiresAt: '2024-01-01T01:00:00Z',
    isActive: true,
    usageCount: 0,
    ...overrides,
  }
}

function createScanHistory(overrides: Partial<QrCodeScanHistoryResponseDto> = {}): QrCodeScanHistoryResponseDto {
  return {
    qrCodeInfo: null,
    scanStatistics: null,
    scans: {
      items: [],
      totalItems: 0,
    },
    ...overrides,
  }
}

describe('qrCodeStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getters and simple actions', () => {
    it('getActiveQrCode mirrors underlying activeQrCode state', () => {
      const store = useQrCodeStore()
      const qrCode = createQrCode()
      store.activeQrCode = qrCode
      expect(store.getActiveQrCode).toEqual(qrCode)
    })

    it('getScanHistory mirrors underlying scanHistory state', () => {
      const store = useQrCodeStore()
      const history = createScanHistory()
      store.scanHistory = history
      expect(store.getScanHistory).toEqual(history)
    })

    it('isLoading mirrors underlying loading state', () => {
      const store = useQrCodeStore()
      store.loading = true
      expect(store.isLoading).toBe(true)
    })

    it('getError mirrors underlying error state', () => {
      const store = useQrCodeStore()
      store.error = 'test error'
      expect(store.getError).toBe('test error')
    })

    it('isPollingActive mirrors underlying isPolling state', () => {
      const store = useQrCodeStore()
      store.isPolling = true
      expect(store.isPollingActive).toBe(true)
    })

    it('clearError resets error state', () => {
      const store = useQrCodeStore()
      store.error = 'test error'
      store.clearError()
      expect(store.error).toBe('')
    })

    it('clearSessionQrCodes resets sessionQrCodes state', () => {
      const store = useQrCodeStore()
      store.sessionQrCodes = [createQrCode(), createQrCode({ id: '2' })]
      store.clearSessionQrCodes()
      expect(store.sessionQrCodes).toEqual([])
    })
  })

  describe('actions — success paths', () => {
    it('generateQrCode clears error, sets loading, maps API response into activeQrCode, and returns created object', async () => {
      const apiResponse = {
        qrCodeId: '1',
        qrHash: 'abc123',
        qrCodeImageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
        generatedAt: '2024-01-01T00:00:00Z',
        expiresAt: '2024-01-01T01:00:00Z',
      }
      vi.mocked(qrCodeApi.generateQrCode).mockResolvedValue(apiResponse as never)

      const store = useQrCodeStore()
      store.error = 'previous error'

      const payload = { sessionId: '1', expirationMinutes: 30, maxUsage: 10 }
      const result = await store.generateQrCode(payload)

      expect(store.error).toBe('')
      expect(store.loading).toBe(false)
      expect(store.activeQrCode).toEqual({
        id: '1',
        qrHash: 'abc123',
        qrCodeData: apiResponse.qrCodeImageUrl,
        sessionId: '1',
        expirationMinutes: 30,
        maxUsage: 10,
        generatedAt: '2024-01-01T00:00:00Z',
        expiresAt: '2024-01-01T01:00:00Z',
        isActive: true,
        usageCount: 0,
      })
      expect(result).toEqual(store.activeQrCode)
    })

    it('fetchQrCode loads metadata, then image, and stores merged result', async () => {
      const metadata = createQrCode({ id: '1', qrHash: 'abc123' })
      const imageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
      vi.mocked(qrCodeApi.getQrCodeById).mockResolvedValue(metadata as never)
      vi.mocked(qrCodeApi.getQrCodeImage).mockResolvedValue(imageData as never)

      const store = useQrCodeStore()
      store.error = 'previous error'

      const result = await store.fetchQrCode('1')

      expect(store.error).toBe('')
      expect(store.loading).toBe(false)
      expect(qrCodeApi.getQrCodeById).toHaveBeenCalledWith('1')
      expect(qrCodeApi.getQrCodeImage).toHaveBeenCalledWith('1')
      expect(store.activeQrCode).toEqual({
        ...metadata,
        qrCodeData: imageData,
      })
      expect(result).toEqual(store.activeQrCode)
    })

    it('fetchSessionQrCodes populates sessionQrCodes', async () => {
      const sessionQrCodes = [createQrCode(), createQrCode({ id: '2' })]
      vi.mocked(qrCodeApi.getSessionQrCodes).mockResolvedValue(sessionQrCodes as never)

      const store = useQrCodeStore()
      store.error = 'previous error'

      const result = await store.fetchSessionQrCodes('1')

      expect(store.error).toBe('')
      expect(store.loading).toBe(false)
      expect(store.sessionQrCodes).toEqual(sessionQrCodes)
      expect(result).toEqual(sessionQrCodes)
    })

    it('fetchSessionQrCodes treats NO_QRCODES_FOUND as an empty list', async () => {
      const store = useQrCodeStore()
      const error = {
        response: {
          status: 404,
          data: { errorCode: 'NO_QRCODES_FOUND' },
        },
      }

      vi.mocked(qrCodeApi.getSessionQrCodes).mockRejectedValue(error as never)
      vi.mocked(getErrorStatus).mockReturnValue(404)

      const result = await store.fetchSessionQrCodes('session-1')

      expect(result).toEqual([])
      expect(store.sessionQrCodes).toEqual([])
      expect(getErrorMessage).not.toHaveBeenCalled()
    })

    it('fetchScanHistory stores returned history payload', async () => {
      const history = createScanHistory({
        qrCodeInfo: { scheduleTitle: 'Test Session' },
        scanStatistics: { totalScans: 5 },
        scans: { items: [{ studentName: 'John' }], totalItems: 1 },
      })
      vi.mocked(qrCodeApi.getScanHistoryById).mockResolvedValue(history as never)

      const store = useQrCodeStore()

      const result = await store.fetchScanHistory('1')

      expect(store.scanHistory).toEqual(history)
      expect(result).toEqual(history)
    })

    it('revokeQrCode updates matching activeQrCode and returns API response', async () => {
      const activeQrCode = createQrCode({ id: '1', isActive: true })
      const revokedResponse = { ...activeQrCode, isActive: false }
      vi.mocked(qrCodeApi.revokeQrCodeById).mockResolvedValue(revokedResponse as never)

      const store = useQrCodeStore()
      store.activeQrCode = activeQrCode
      store.error = 'previous error'

      const result = await store.revokeQrCode('1', 'Test reason')

      expect(store.error).toBe('')
      expect(store.loading).toBe(false)
      expect(qrCodeApi.revokeQrCodeById).toHaveBeenCalledWith('1', { reason: 'Test reason' })
      expect(store.activeQrCode).toEqual(revokedResponse)
      expect(result).toEqual(revokedResponse)
    })
  })

  describe('actions — error paths', () => {
    it('generateQrCode sets error from getErrorMessage, resets loading, and rethrows', async () => {
      const testError = new Error('Generation failed')
      vi.mocked(qrCodeApi.generateQrCode).mockRejectedValue(testError)
      vi.mocked(getErrorMessage).mockReturnValue('Error generating QR code: Generation failed')

      const store = useQrCodeStore()

      await expect(store.generateQrCode({ sessionId: '1' })).rejects.toThrow(testError)

      expect(getErrorMessage).toHaveBeenCalledWith(testError, 'Error generating QR code')
      expect(store.error).toBe('Error generating QR code: Generation failed')
      expect(store.loading).toBe(false)
    })

    it('fetchQrCode metadata failure sets error, resets loading, and rethrows', async () => {
      const testError = new Error('Not found')
      vi.mocked(qrCodeApi.getQrCodeById).mockRejectedValue(testError)
      vi.mocked(getErrorMessage).mockReturnValue('Error fetching QR code: Not found')

      const store = useQrCodeStore()

      await expect(store.fetchQrCode('1')).rejects.toThrow(testError)

      expect(getErrorMessage).toHaveBeenCalledWith(testError, 'Error fetching QR code')
      expect(store.error).toBe('Error fetching QR code: Not found')
      expect(store.loading).toBe(false)
    })

    it('fetchSessionQrCodes sets error, resets loading, and rethrows', async () => {
      const testError = new Error('Session not found')
      vi.mocked(qrCodeApi.getSessionQrCodes).mockRejectedValue(testError)
      vi.mocked(getErrorMessage).mockReturnValue('Error fetching session QR codes: Session not found')

      const store = useQrCodeStore()

      await expect(store.fetchSessionQrCodes('1')).rejects.toThrow(testError)

      expect(getErrorMessage).toHaveBeenCalledWith(testError, 'Error fetching session QR codes')
      expect(store.error).toBe('Error fetching session QR codes: Session not found')
      expect(store.loading).toBe(false)
    })

    it('fetchScanHistory when not polling logs failure and sets error without throwing', async () => {
      const testError = new Error('History fetch failed')
      vi.mocked(qrCodeApi.getScanHistoryById).mockRejectedValue(testError)
      vi.mocked(getErrorMessage).mockReturnValue('Error fetching history: History fetch failed')

      const store = useQrCodeStore()
      store.isPolling = false

      await store.fetchScanHistory('1')

      expect(console.error).toHaveBeenCalledWith('Error fetching scan history:', testError)
      expect(getErrorMessage).toHaveBeenCalledWith(testError, 'Error fetching history')
      expect(store.error).toBe('Error fetching history: History fetch failed')
    })

    it('fetchScanHistory when isPolling = true logs failure and does not set global error', async () => {
      const testError = new Error('History fetch failed')
      vi.mocked(qrCodeApi.getScanHistoryById).mockRejectedValue(testError)

      const store = useQrCodeStore()
      store.isPolling = true
      store.error = 'previous error'

      await store.fetchScanHistory('1')

      expect(console.error).toHaveBeenCalledWith('Error fetching scan history:', testError)
      expect(store.error).toBe('previous error') // Error should not be set during polling
    })

    it('revokeQrCode sets error, resets loading, and rethrows', async () => {
      const testError = new Error('Revocation failed')
      vi.mocked(qrCodeApi.revokeQrCodeById).mockRejectedValue(testError)
      vi.mocked(getErrorMessage).mockReturnValue('Error revoking QR code: Revocation failed')

      const store = useQrCodeStore()
      store.activeQrCode = createQrCode({ id: '1' })

      await expect(store.revokeQrCode('1')).rejects.toThrow(testError)

      expect(getErrorMessage).toHaveBeenCalledWith(testError, 'Error revoking QR code')
      expect(store.error).toBe('Error revoking QR code: Revocation failed')
      expect(store.loading).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('generateQrCode coerces expirationMinutes from string value to number', async () => {
      const apiResponse = {
        qrCodeId: '1',
        qrHash: 'abc123',
        qrCodeImageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
        generatedAt: '2024-01-01T00:00:00Z',
        expiresAt: '2024-01-01T01:00:00Z',
      }
      vi.mocked(qrCodeApi.generateQrCode).mockResolvedValue(apiResponse as never)

      const store = useQrCodeStore()

      const payload = { sessionId: '1', expirationMinutes: '30' as never, maxUsage: 10 }
      await store.generateQrCode(payload)

      expect(store.activeQrCode?.expirationMinutes).toBe(30)
    })

    it('generateQrCode coerces maxUsage from string value to number', async () => {
      const apiResponse = {
        qrCodeId: '1',
        qrHash: 'abc123',
        qrCodeImageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
        generatedAt: '2024-01-01T00:00:00Z',
        expiresAt: '2024-01-01T01:00:00Z',
      }
      vi.mocked(qrCodeApi.generateQrCode).mockResolvedValue(apiResponse as never)

      const store = useQrCodeStore()

      const payload = { sessionId: '1', expirationMinutes: 30, maxUsage: '10' as never }
      await store.generateQrCode(payload)

      expect(store.activeQrCode?.maxUsage).toBe(10)
    })

    it('generateQrCode leaves optional numeric fields undefined when omitted', async () => {
      const apiResponse = {
        qrCodeId: '1',
        qrHash: 'abc123',
        qrCodeImageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
        generatedAt: '2024-01-01T00:00:00Z',
        expiresAt: '2024-01-01T01:00:00Z',
      }
      vi.mocked(qrCodeApi.generateQrCode).mockResolvedValue(apiResponse as never)

      const store = useQrCodeStore()

      const payload = { sessionId: '1' }
      await store.generateQrCode(payload)

      expect(store.activeQrCode?.expirationMinutes).toBeUndefined()
      expect(store.activeQrCode?.maxUsage).toBeUndefined()
    })

    it('generateQrCode leaves optional numeric fields undefined when null', async () => {
      const apiResponse = {
        qrCodeId: '1',
        qrHash: 'abc123',
        qrCodeImageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
        generatedAt: '2024-01-01T00:00:00Z',
        expiresAt: '2024-01-01T01:00:00Z',
      }
      vi.mocked(qrCodeApi.generateQrCode).mockResolvedValue(apiResponse as never)

      const store = useQrCodeStore()

      const payload = { sessionId: '1', expirationMinutes: null, maxUsage: null }
      await store.generateQrCode(payload)

      expect(store.activeQrCode?.expirationMinutes).toBeUndefined()
      expect(store.activeQrCode?.maxUsage).toBeUndefined()
    })

    it('fetchQrCode image fetch failure keeps metadata result and does not fail the whole action', async () => {
      const metadata = createQrCode({ id: '1', qrHash: 'abc123' })
      const imageError = new Error('Image fetch failed')
      vi.mocked(qrCodeApi.getQrCodeById).mockResolvedValue(metadata as never)
      vi.mocked(qrCodeApi.getQrCodeImage).mockRejectedValue(imageError)

      const store = useQrCodeStore()

      const result = await store.fetchQrCode('1')

      expect(console.error).toHaveBeenCalledWith('Failed to fetch QR code image:', imageError)
      expect(store.activeQrCode).toEqual(metadata)
      expect(result).toEqual(metadata)
    })

    it('revokeQrCode with non-matching active id returns API response but leaves current active QR code unchanged', async () => {
      const activeQrCode = createQrCode({ id: '1', isActive: true })
      const revokedResponse = createQrCode({ id: '2', isActive: false })
      vi.mocked(qrCodeApi.revokeQrCodeById).mockResolvedValue(revokedResponse as never)

      const store = useQrCodeStore()
      store.activeQrCode = activeQrCode

      const result = await store.revokeQrCode('2', 'Test reason')

      expect(result).toEqual(revokedResponse)
      expect(store.activeQrCode).toEqual(activeQrCode) // Should remain unchanged
    })
  })
})
