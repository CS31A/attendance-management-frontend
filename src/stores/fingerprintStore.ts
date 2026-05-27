import type { EntityId } from '@/types'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as fingerprintApi from '@/api/fingerprint'
import { useLoadingState } from '@/composables/useLoadingState'

export const useFingerprintStore = defineStore('fingerprintStore', () => {
  const devices = ref<fingerprintApi.FingerprintDeviceDto[]>([])
  const { loading, withLoading } = useLoadingState()

  async function fetchDevices() {
    return withLoading(async () => {
      devices.value = await fingerprintApi.getDevices()
    }, err => console.error('Failed to fetch devices:', err))
  }

  async function createEnrollmentSession(studentId: EntityId, deviceIdentifier: string) {
    return withLoading(async () => {
      return await fingerprintApi.createEnrollmentSession({ studentId, deviceId: deviceIdentifier })
    })
  }

  async function getEnrollmentSession(sessionId: string) {
    return await fingerprintApi.getEnrollmentSession(sessionId)
  }

  async function cancelEnrollmentSession(sessionId: string) {
    return await fingerprintApi.cancelEnrollmentSession(sessionId)
  }

  async function deleteFingerprint(fingerprintId: EntityId) {
    return withLoading(async () => {
      await fingerprintApi.deleteFingerprint(fingerprintId)
    })
  }

  return {
    devices,
    loading,
    fetchDevices,
    createEnrollmentSession,
    getEnrollmentSession,
    cancelEnrollmentSession,
    deleteFingerprint,
  }
})
