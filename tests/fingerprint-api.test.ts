import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '@/api'
import { createEnrollmentSession, getEnrollmentSession } from '@/api/fingerprint'

vi.mock('@/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
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
})
