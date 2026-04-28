import type { FingerprintDeviceDto } from '@/api/fingerprint'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getDevices } from '@/api/fingerprint'

export const useDeviceStore = defineStore('deviceStore', () => {
  // State
  const devices = ref<FingerprintDeviceDto[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const fetchError = ref<string | null>(null)

  // Getters
  const activeDevices = computed(() =>
    devices.value.filter(d => d.isActive),
  )

  const inactiveDevices = computed(() =>
    devices.value.filter(d => !d.isActive),
  )

  const deviceCount = computed(() => devices.value.length)

  const activeDeviceCount = computed(() => activeDevices.value.length)

  // Actions
  async function fetchDevices() {
    loading.value = true
    error.value = null
    fetchError.value = null

    try {
      const data = await getDevices()
      devices.value = data

      return { success: true }
    }
    catch (err) {
      console.error('Failed to fetch devices:', err)
      const msg = 'Failed to load devices. Please try again.'
      error.value = msg
      fetchError.value = msg
      return { success: false, error: msg }
    }
    finally {
      loading.value = false
    }
  }

  function getDeviceById(id: string | number) {
    return devices.value.find(d => d.id === id)
  }

  function getDeviceByIdentifier(identifier: string) {
    return devices.value.find(d => d.deviceIdentifier === identifier)
  }

  // Update device status from SignalR
  function updateDeviceStatus(deviceUpdate: Partial<FingerprintDeviceDto> & { id: string | number }) {
    const index = devices.value.findIndex(d => d.id === deviceUpdate.id)
    if (index !== -1) {
      devices.value[index] = { ...devices.value[index], ...deviceUpdate }
    }
  }

  // Filter devices by search query
  function filterDevices(searchQuery: string) {
    if (!searchQuery.trim()) {
      return devices.value
    }

    const query = searchQuery.toLowerCase()
    return devices.value.filter(device =>
      (device.name ?? '').toLowerCase().includes(query)
      || device.deviceIdentifier.toLowerCase().includes(query)
      || (device.location ?? '').toLowerCase().includes(query),
    )
  }

  // Reset store
  function $reset() {
    devices.value = []
    loading.value = false
    error.value = null
    fetchError.value = null
  }

  return {
    // State
    devices,
    loading,
    error,
    fetchError,

    // Getters
    activeDevices,
    inactiveDevices,
    deviceCount,
    activeDeviceCount,

    // Actions
    fetchDevices,
    getDeviceById,
    getDeviceByIdentifier,
    updateDeviceStatus,
    filterDevices,
    $reset,
  }
})
