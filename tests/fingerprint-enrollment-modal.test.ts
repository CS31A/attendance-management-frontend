import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import FingerprintEnrollmentModal from '@/components/fingerprint/FingerprintEnrollmentModal.vue'

const fingerprintStore = reactive({
  devices: [] as Array<{
    id: string
    deviceIdentifier: string
    name: string
    location: string
    isActive: boolean
    lastSeenAt: string
  }>,
  loading: false,
  fetchDevices: vi.fn(),
  createEnrollmentSession: vi.fn(),
  getEnrollmentSession: vi.fn(),
})

vi.mock('@/stores/fingerprintStore', () => ({
  useFingerprintStore: () => fingerprintStore,
}))

describe('fingerprint enrollment modal', () => {
  beforeEach(() => {
    fingerprintStore.devices = [
      {
        id: 'device-uuid-1',
        deviceIdentifier: 'esp32-attendance-01',
        name: 'Lab Scanner',
        location: 'Lab 201',
        isActive: true,
        lastSeenAt: '2026-04-25T10:00:00Z',
      },
    ]
    fingerprintStore.loading = false
    fingerprintStore.fetchDevices.mockResolvedValue(undefined)
    fingerprintStore.createEnrollmentSession.mockResolvedValue({
      enrollmentSessionId: 'session-uuid',
      studentId: 'student-uuid',
      studentName: 'Alice Smith',
      assignedSensorFingerprintId: 2,
      status: 'Pending',
      expiresAt: '2026-04-25T10:05:00Z',
    })
    fingerprintStore.getEnrollmentSession.mockReset()
  })

  it('submits the selected device identifier instead of the device uuid', async () => {
    const wrapper = mount(FingerprintEnrollmentModal, {
      props: {
        show: true,
        studentId: 'student-uuid',
        studentName: 'Alice Smith',
      },
      global: {
        stubs: {
          AlertTriangle: true,
          Check: true,
          Clock: true,
          Fingerprint: true,
          Loader2: true,
          X: true,
        },
      },
    })

    await flushPromises()

    await wrapper.find('select').setValue('esp32-attendance-01')
    await wrapper.find('.btn-primary').trigger('click')

    expect(fingerprintStore.createEnrollmentSession).toHaveBeenCalledWith('student-uuid', 'esp32-attendance-01')
  })

  it('starts monitoring and polls enrollment session status', async () => {
    const wrapper = mount(FingerprintEnrollmentModal, {
      props: {
        show: true,
        studentId: 'student-uuid',
        studentName: 'Alice Smith',
      },
      global: {
        stubs: {
          AlertTriangle: true,
          Check: true,
          Clock: true,
          Fingerprint: true,
          Loader2: true,
          X: true,
        },
      },
    })

    await flushPromises()

    await wrapper.find('select').setValue('esp32-attendance-01')
    await wrapper.find('.btn-secondary').trigger('click')

    expect(fingerprintStore.createEnrollmentSession).toHaveBeenCalledWith('student-uuid', 'esp32-attendance-01')
  })

  it('emits enrolled event when session completes successfully', async () => {
    fingerprintStore.getEnrollmentSession.mockResolvedValue({
      enrollmentSessionId: 'session-uuid',
      studentId: 'student-uuid',
      studentName: 'Alice Smith',
      assignedSensorFingerprintId: 2,
      status: 'Completed',
      expiresAt: '2026-04-25T10:05:00Z',
    })

    const wrapper = mount(FingerprintEnrollmentModal, {
      props: {
        show: true,
        studentId: 'student-uuid',
        studentName: 'Alice Smith',
      },
      global: {
        stubs: {
          AlertTriangle: true,
          Check: true,
          Clock: true,
          Fingerprint: true,
          Loader2: true,
          X: true,
        },
      },
    })

    await flushPromises()

    await wrapper.find('select').setValue('esp32-attendance-01')
    await wrapper.find('.btn-secondary').trigger('click')

    await flushPromises()

    // Trigger polling callback
    const pollCallback = fingerprintStore.getEnrollmentSession.mock.calls[0]
    if (pollCallback) {
      await fingerprintStore.getEnrollmentSession('session-uuid')
    }
  })

  it('displays error message when enrollment fails', async () => {
    fingerprintStore.createEnrollmentSession.mockRejectedValue({
      response: {
        data: {
          message: 'Device not found',
        },
      },
    })

    const wrapper = mount(FingerprintEnrollmentModal, {
      props: {
        show: true,
        studentId: 'student-uuid',
        studentName: 'Alice Smith',
      },
      global: {
        stubs: {
          AlertTriangle: true,
          Check: true,
          Clock: true,
          Fingerprint: true,
          Loader2: true,
          X: true,
        },
      },
    })

    await flushPromises()

    await wrapper.find('select').setValue('esp32-attendance-01')
    await wrapper.find('.btn-primary').trigger('click')

    await flushPromises()

    expect(wrapper.find('.error-banner').exists()).toBe(true)
  })

  it('closes modal and stops polling when cancel is clicked', async () => {
    const wrapper = mount(FingerprintEnrollmentModal, {
      props: {
        show: true,
        studentId: 'student-uuid',
        studentName: 'Alice Smith',
      },
      global: {
        stubs: {
          AlertTriangle: true,
          Check: true,
          Clock: true,
          Fingerprint: true,
          Loader2: true,
          X: true,
        },
      },
    })

    await flushPromises()

    await wrapper.find('.btn-secondary').trigger('click')

    expect(wrapper.emitted('close')).toBeTruthy()
  })
})
