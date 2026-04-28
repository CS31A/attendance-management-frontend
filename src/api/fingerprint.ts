import type { EntityId } from '@/types'
import api from '@/api'

export interface FingerprintDeviceDto {
  id: EntityId
  deviceIdentifier: string
  name?: string
  location?: string
  isActive: boolean
  lastSeenAt: string
}

export interface FingerprintEnrollmentSessionDto {
  enrollmentSessionId: string
  studentId: EntityId
  studentName: string
  assignedSensorFingerprintId: number
  status: 'Pending' | 'InProgress' | 'Completed' | 'Failed' | 'Expired'
  expiresAt: string
  failureReason?: string
}

export async function getDevices(): Promise<FingerprintDeviceDto[]> {
  const response = await api.get('/fingerprint/devices')
  return response.data
}

export async function createEnrollmentSession(payload: {
  studentId: EntityId
  deviceId: string
}): Promise<FingerprintEnrollmentSessionDto> {
  const response = await api.post('/fingerprint/enrollment-sessions', payload)
  return response.data
}

export async function getEnrollmentSession(sessionId: string): Promise<FingerprintEnrollmentSessionDto> {
  const response = await api.get(`/fingerprint/enrollment-sessions/${sessionId}`)
  return response.data
}

export async function deleteFingerprint(fingerprintId: EntityId): Promise<void> {
  await api.delete(`/fingerprint/${fingerprintId}`)
}
