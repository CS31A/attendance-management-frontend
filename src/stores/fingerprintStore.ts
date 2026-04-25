import type { EntityId } from '@/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as fingerprintApi from '@/api/fingerprint'

export const useFingerprintStore = defineStore('fingerprintStore', () => {
  const devices = ref<fingerprintApi.FingerprintDeviceDto[]>([])
  const loadingCount = ref(0)
  const loading = computed(() => loadingCount.value > 0)
  const error = ref('')

  function beginLoading() {
    loadingCount.value += 1
  }
  function endLoading() {
    loadingCount.value = Math.max(0, loadingCount.value - 1)
  }

  async function fetchDevices() {
    beginLoading()
    try {
      devices.value = await fingerprintApi.getDevices()
    }
    catch (err) {
      console.error('Failed to fetch devices:', err)
      throw err
    }
    finally {
      endLoading()
    }
  }

  async function createEnrollmentSession(studentId: EntityId, deviceIdentifier: string) {
    beginLoading()
    try {
      return await fingerprintApi.createEnrollmentSession({ studentId, deviceId: deviceIdentifier })
    }
    finally {
      endLoading()
    }
  }

  async function getEnrollmentSession(sessionId: string) {
    return await fingerprintApi.getEnrollmentSession(sessionId)
  }

  async function deleteFingerprint(fingerprintId: EntityId) {
    beginLoading()
    try {
      await fingerprintApi.deleteFingerprint(fingerprintId)
    }
    finally {
      endLoading()
    }
  }

  return {
    devices,
    loading,
    error,
    fetchDevices,
    createEnrollmentSession,
    getEnrollmentSession,
    deleteFingerprint,
  }
})
