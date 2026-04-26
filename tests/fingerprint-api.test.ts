import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '@/api'
import { createEnrollmentSession, deleteFingerprint, getDevices, getEnrollmentSession } from '@/api/fingerprint'

vi.mock('@/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('fingerprint api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts enrollment with the fingerprint device identifier string', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: {
        enrollmentSessionId: 'session-uuid',
        studentId: 'student-uuid',
        studentName: 'Alice Smith',
        deviceId: 'esp32-attendance-01',
        assignedSensorFingerprintId: 4,
        status: 'Pending',
        expiresAt: '2026-04-25T10:00:00Z',
      },
    } as never)

    const payload = {
      studentId: 'student-uuid',
      deviceId: 'esp32-attendance-01',
    }

    const result = await createEnrollmentSession(payload)

    expect(api.post).toHaveBeenCalledWith('/fingerprint/enrollment-sessions', payload)
    expect(result.enrollmentSessionId).toBe('session-uuid')
  })

  it('fetches enrollment session status by enrollment session id', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        enrollmentSessionId: 'session-uuid',
        studentId: 'student-uuid',
        studentName: 'Alice Smith',
        deviceId: 'esp32-attendance-01',
        assignedSensorFingerprintId: 4,
        status: 'Completed',
        expiresAt: '2026-04-25T10:00:00Z',
      },
    } as never)

    const result = await getEnrollmentSession('session-uuid')

    expect(api.get).toHaveBeenCalledWith('/fingerprint/enrollment-sessions/session-uuid')
    expect(result.enrollmentSessionId).toBe('session-uuid')
  })

  it('fetches all fingerprint devices', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [
        {
          id: 'device-uuid-1',
          deviceIdentifier: 'esp32-attendance-01',
          name: 'Lab Scanner',
          location: 'Lab 201',
          isActive: true,
          lastSeenAt: '2026-04-25T10:00:00Z',
        },
        {
          id: 'device-uuid-2',
          deviceIdentifier: 'esp32-attendance-02',
          name: 'Library Scanner',
          location: 'Library',
          isActive: true,
          lastSeenAt: '2026-04-25T10:00:00Z',
        },
      ],
    } as never)

    const result = await getDevices()

    expect(api.get).toHaveBeenCalledWith('/fingerprint/devices')
    expect(result).toHaveLength(2)
    expect(result[0].deviceIdentifier).toBe('esp32-attendance-01')
  })

  it('deletes a fingerprint by fingerprint id', async () => {
    vi.mocked(api.delete).mockResolvedValue({} as never)

    await deleteFingerprint('fingerprint-uuid')

    expect(api.delete).toHaveBeenCalledWith('/fingerprint/fingerprint-uuid')
  })
})
