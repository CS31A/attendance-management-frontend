import type { EntityId } from '@/types'
import type { QrCodePayload, QrCodeResponseDto } from '@/api/qrCode'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import api from '@/api'
import * as qrCodeApi from '@/api/qrCode'

vi.mock('@/api')

describe('qrCode API module with EntityId', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateQrCode', () => {
    it('generates QR code with EntityId sessionId (number)', async () => {
      const payload: QrCodePayload = {
        sessionId: 123 as EntityId,
        expirationMinutes: 30,
        maxUsage: 10,
      }

      const mockResponse: QrCodeResponseDto = {
        id: 456 as EntityId,
        qrCodeId: 456 as EntityId,
        qrHash: 'abc123def456',
        qrCodeImage: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
        generatedAt: '2024-01-01T00:00:00Z',
        expiresAt: '2024-01-01T01:00:00Z',
        isActive: true,
        usageCount: 0,
      }

      vi.mocked(api.post).mockResolvedValue({ data: mockResponse } as never)

      const result = await qrCodeApi.generateQrCode(payload)

      expect(api.post).toHaveBeenCalledWith('/QrCode/generate', payload)
      expect(result.id).toBe(456 as EntityId)
      expect(result.qrCodeId).toBe(456 as EntityId)
      expect(result.qrHash).toBe('abc123def456')
      expect(result.qrCodeImageUrl).toBe('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=')
    })

    it('generates QR code with EntityId sessionId (string UUID)', async () => {
      const payload: QrCodePayload = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000' as EntityId,
        expirationMinutes: 30,
      }

      const mockResponse: QrCodeResponseDto = {
        id: '660e8400-e29b-41d4-a716-446655440001' as EntityId,
        qrCodeId: '660e8400-e29b-41d4-a716-446655440001' as EntityId,
        qrHash: 'xyz789abc123',
        qrCodeImage: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
        generatedAt: '2024-01-01T00:00:00Z',
        expiresAt: '2024-01-01T01:00:00Z',
        isActive: true,
        usageCount: 0,
      }

      vi.mocked(api.post).mockResolvedValue({ data: mockResponse } as never)

      const result = await qrCodeApi.generateQrCode(payload)

      expect(api.post).toHaveBeenCalledWith('/QrCode/generate', payload)
      expect(result.id).toBe('660e8400-e29b-41d4-a716-446655440001' as EntityId)
      expect(result.qrCodeId).toBe('660e8400-e29b-41d4-a716-446655440001' as EntityId)
    })

    it('converts base64 image to data URL', async () => {
      const payload: QrCodePayload = {
        sessionId: 1 as EntityId,
      }

      const mockResponse: QrCodeResponseDto = {
        id: 1 as EntityId,
        qrCodeImage: 'base64ImageData',
      }

      vi.mocked(api.post).mockResolvedValue({ data: mockResponse } as never)

      const result = await qrCodeApi.generateQrCode(payload)

      expect(result.qrCodeImageUrl).toBe('data:image/png;base64,base64ImageData')
    })
  })

  describe('getQrCodeById', () => {
    it('fetches QR code by EntityId (number)', async () => {
      const qrCodeId = 123 as EntityId

      const mockResponse: QrCodeResponseDto = {
        id: 123 as EntityId,
        qrCodeId: 123 as EntityId,
        qrHash: 'abc123',
        isActive: true,
        usageCount: 5,
      }

      vi.mocked(api.get).mockResolvedValue({ data: mockResponse } as never)

      const result = await qrCodeApi.getQrCodeById(qrCodeId)

      expect(api.get).toHaveBeenCalledWith('/QrCode/123')
      expect(result.id).toBe(123 as EntityId)
      expect(result.qrCodeId).toBe(123 as EntityId)
      expect(result.qrHash).toBe('abc123')
    })

    it('fetches QR code by EntityId (string UUID)', async () => {
      const qrCodeId = '550e8400-e29b-41d4-a716-446655440000' as EntityId

      const mockResponse: QrCodeResponseDto = {
        id: '550e8400-e29b-41d4-a716-446655440000' as EntityId,
        qrCodeId: '550e8400-e29b-41d4-a716-446655440000' as EntityId,
        qrHash: 'xyz789',
        isActive: true,
        usageCount: 3,
      }

      vi.mocked(api.get).mockResolvedValue({ data: mockResponse } as never)

      const result = await qrCodeApi.getQrCodeById(qrCodeId)

      expect(api.get).toHaveBeenCalledWith('/QrCode/550e8400-e29b-41d4-a716-446655440000')
      expect(result.id).toBe('550e8400-e29b-41d4-a716-446655440000' as EntityId)
      expect(result.qrCodeId).toBe('550e8400-e29b-41d4-a716-446655440000' as EntityId)
    })
  })

  describe('fetchQrCode', () => {
    it('is an alias for getQrCodeById', async () => {
      const qrCodeId = 456 as EntityId

      const mockResponse: QrCodeResponseDto = {
        id: 456 as EntityId,
        qrHash: 'test123',
      }

      vi.mocked(api.get).mockResolvedValue({ data: mockResponse } as never)

      const result = await qrCodeApi.fetchQrCode(qrCodeId)

      expect(api.get).toHaveBeenCalledWith('/QrCode/456')
      expect(result.id).toBe(456 as EntityId)
    })
  })

  describe('revokeQrCodeById', () => {
    it('revokes QR code by EntityId (number)', async () => {
      const qrCodeId = 789 as EntityId
      const payload = { reason: 'Session ended' }

      const mockResponse: QrCodeResponseDto = {
        id: 789 as EntityId,
        qrCodeId: 789 as EntityId,
        qrHash: 'abc123',
        isActive: false,
      }

      vi.mocked(api.patch).mockResolvedValue({ data: mockResponse } as never)

      const result = await qrCodeApi.revokeQrCodeById(qrCodeId, payload)

      expect(api.patch).toHaveBeenCalledWith('/QrCode/789/revoke', payload)
      expect(result.id).toBe(789 as EntityId)
      expect(result.isActive).toBe(false)
    })

    it('revokes QR code by EntityId (string UUID)', async () => {
      const qrCodeId = '770e8400-e29b-41d4-a716-446655440002' as EntityId
      const payload = { reason: 'Security concern' }

      const mockResponse: QrCodeResponseDto = {
        id: '770e8400-e29b-41d4-a716-446655440002' as EntityId,
        qrCodeId: '770e8400-e29b-41d4-a716-446655440002' as EntityId,
        qrHash: 'xyz789',
        isActive: false,
      }

      vi.mocked(api.patch).mockResolvedValue({ data: mockResponse } as never)

      const result = await qrCodeApi.revokeQrCodeById(qrCodeId, payload)

      expect(api.patch).toHaveBeenCalledWith('/QrCode/770e8400-e29b-41d4-a716-446655440002/revoke', payload)
      expect(result.id).toBe('770e8400-e29b-41d4-a716-446655440002' as EntityId)
      expect(result.isActive).toBe(false)
    })

    it('revokes QR code without payload', async () => {
      const qrCodeId = 100 as EntityId

      const mockResponse: QrCodeResponseDto = {
        id: 100 as EntityId,
        isActive: false,
      }

      vi.mocked(api.patch).mockResolvedValue({ data: mockResponse } as never)

      const result = await qrCodeApi.revokeQrCodeById(qrCodeId)

      expect(api.patch).toHaveBeenCalledWith('/QrCode/100/revoke', {})
      expect(result.isActive).toBe(false)
    })
  })

  describe('reactivateQrCodeById', () => {
    it('reactivates QR code by EntityId (number)', async () => {
      const qrCodeId = 200 as EntityId

      const mockResponse: QrCodeResponseDto = {
        id: 200 as EntityId,
        qrCodeId: 200 as EntityId,
        qrHash: 'reactivated123',
        isActive: true,
      }

      vi.mocked(api.patch).mockResolvedValue({ data: mockResponse } as never)

      const result = await qrCodeApi.reactivateQrCodeById(qrCodeId)

      expect(api.patch).toHaveBeenCalledWith('/QrCode/200/reactivate')
      expect(result.id).toBe(200 as EntityId)
      expect(result.isActive).toBe(true)
    })

    it('reactivates QR code by EntityId (string UUID)', async () => {
      const qrCodeId = '880e8400-e29b-41d4-a716-446655440003' as EntityId

      const mockResponse: QrCodeResponseDto = {
        id: '880e8400-e29b-41d4-a716-446655440003' as EntityId,
        qrCodeId: '880e8400-e29b-41d4-a716-446655440003' as EntityId,
        qrHash: 'reactivated456',
        isActive: true,
      }

      vi.mocked(api.patch).mockResolvedValue({ data: mockResponse } as never)

      const result = await qrCodeApi.reactivateQrCodeById(qrCodeId)

      expect(api.patch).toHaveBeenCalledWith('/QrCode/880e8400-e29b-41d4-a716-446655440003/reactivate')
      expect(result.id).toBe('880e8400-e29b-41d4-a716-446655440003' as EntityId)
      expect(result.isActive).toBe(true)
    })
  })

  describe('getSessionQrCodes', () => {
    it('fetches QR codes for session with EntityId (number)', async () => {
      const sessionId = 300 as EntityId

      const mockResponse: QrCodeResponseDto[] = [
        {
          id: 1 as EntityId,
          qrCodeId: 1 as EntityId,
          qrHash: 'qr1',
          isActive: true,
        },
        {
          id: 2 as EntityId,
          qrCodeId: 2 as EntityId,
          qrHash: 'qr2',
          isActive: false,
        },
      ]

      vi.mocked(api.get).mockResolvedValue({ data: mockResponse } as never)

      const result = await qrCodeApi.getSessionQrCodes(sessionId)

      expect(api.get).toHaveBeenCalledWith('/QrCode/session/300')
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe(1 as EntityId)
      expect(result[1].id).toBe(2 as EntityId)
    })

    it('fetches QR codes for session with EntityId (string UUID)', async () => {
      const sessionId = '990e8400-e29b-41d4-a716-446655440004' as EntityId

      const mockResponse: QrCodeResponseDto[] = [
        {
          id: '111e8400-e29b-41d4-a716-446655440005' as EntityId,
          qrCodeId: '111e8400-e29b-41d4-a716-446655440005' as EntityId,
          qrHash: 'qr-uuid-1',
          isActive: true,
        },
      ]

      vi.mocked(api.get).mockResolvedValue({ data: mockResponse } as never)

      const result = await qrCodeApi.getSessionQrCodes(sessionId)

      expect(api.get).toHaveBeenCalledWith('/QrCode/session/990e8400-e29b-41d4-a716-446655440004')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('111e8400-e29b-41d4-a716-446655440005' as EntityId)
    })
  })

  describe('getScanHistoryById', () => {
    it('fetches scan history by EntityId (number)', async () => {
      const qrCodeId = 400 as EntityId

      const mockResponse = {
        qrCodeInfo: {
          scheduleTitle: 'Math 101',
          generatedAt: '2024-01-01T00:00:00Z',
          expiresAt: '2024-01-01T01:00:00Z',
        },
        scanStatistics: {
          totalScans: 10,
          successfulScans: 8,
          failedScans: 2,
          uniqueStudents: 8,
        },
        scans: {
          items: [
            {
              id: 1 as EntityId,
              studentId: 100 as EntityId,
              studentName: 'John Doe',
              scannedAt: '2024-01-01T00:10:00Z',
              status: 'present',
            },
          ],
          totalItems: 1,
        },
      }

      vi.mocked(api.get).mockResolvedValue({ data: mockResponse } as never)

      const result = await qrCodeApi.getScanHistoryById(qrCodeId)

      expect(api.get).toHaveBeenCalledWith('/QrCode/400/scan-history', { params: {} })
      expect(result.qrCodeInfo?.scheduleTitle).toBe('Math 101')
      expect(result.scanStatistics?.totalScans).toBe(10)
      expect(result.scans?.items).toHaveLength(1)
      expect(result.scans?.items?.[0].studentId).toBe(100 as EntityId)
    })

    it('fetches scan history by EntityId (string UUID) with pagination', async () => {
      const qrCodeId = '222e8400-e29b-41d4-a716-446655440006' as EntityId
      const params = { page: 2, limit: 10 }

      const mockResponse = {
        qrCodeInfo: {
          scheduleTitle: 'Physics 201',
        },
        scanStatistics: {
          totalScans: 25,
        },
        scans: {
          items: [
            {
              id: '333e8400-e29b-41d4-a716-446655440007' as EntityId,
              studentId: '444e8400-e29b-41d4-a716-446655440008' as EntityId,
              studentName: 'Jane Smith',
              scannedAt: '2024-01-01T00:20:00Z',
              status: 'present',
            },
          ],
          totalItems: 25,
        },
      }

      vi.mocked(api.get).mockResolvedValue({ data: mockResponse } as never)

      const result = await qrCodeApi.getScanHistoryById(qrCodeId, params)

      expect(api.get).toHaveBeenCalledWith('/QrCode/222e8400-e29b-41d4-a716-446655440006/scan-history', { params })
      expect(result.scans?.items?.[0].id).toBe('333e8400-e29b-41d4-a716-446655440007' as EntityId)
      expect(result.scans?.items?.[0].studentId).toBe('444e8400-e29b-41d4-a716-446655440008' as EntityId)
    })
  })

  describe('mixed ID types', () => {
    it('handles mixed number and string EntityId in same test', async () => {
      // Generate with number ID
      const generatePayload: QrCodePayload = {
        sessionId: 500 as EntityId,
      }

      const generateResponse: QrCodeResponseDto = {
        id: 600 as EntityId,
        qrCodeId: 600 as EntityId,
        qrHash: 'mixed123',
      }

      vi.mocked(api.post).mockResolvedValue({ data: generateResponse } as never)

      const generated = await qrCodeApi.generateQrCode(generatePayload)
      expect(generated.id).toBe(600 as EntityId)

      // Fetch with string UUID
      const fetchId = '555e8400-e29b-41d4-a716-446655440009' as EntityId

      const fetchResponse: QrCodeResponseDto = {
        id: '555e8400-e29b-41d4-a716-446655440009' as EntityId,
        qrCodeId: '555e8400-e29b-41d4-a716-446655440009' as EntityId,
        qrHash: 'mixed456',
      }

      vi.mocked(api.get).mockResolvedValue({ data: fetchResponse } as never)

      const fetched = await qrCodeApi.getQrCodeById(fetchId)
      expect(fetched.id).toBe('555e8400-e29b-41d4-a716-446655440009' as EntityId)
    })
  })
})
