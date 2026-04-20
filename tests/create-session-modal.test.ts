import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getMySchedules } from '@/api/instructors'
import CreateSessionModal from '@/components/sessions/CreateSessionModal.vue'

vi.mock('@/api/instructors', () => ({
  getMySchedules: vi.fn(),
}))

const schedule = {
  id: 1,
  dayOfWeek: 'Tuesday',
  startTime: '08:00',
  endTime: '10:00',
  courseCode: 'CS101',
  courseName: 'Data Structures',
  section: 'A',
}

function mountModal() {
  return mount(CreateSessionModal, {
    global: {
      stubs: {
        AlertTriangle: true,
        Plus: true,
        X: true,
        LoadingSpinner: true,
      },
    },
  })
}

describe('create session modal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getMySchedules).mockResolvedValue([schedule])
  })

  it('requires a reason when creating an off-schedule session date', async () => {
    const wrapper = mountModal()
    await flushPromises()

    await wrapper.find('select').setValue('1')
    await wrapper.find('input[type="date"]').setValue('2026-04-20')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.emitted('create')).toBeUndefined()
    expect(wrapper.text().toLowerCase()).toContain('reason')
  })

  it('emits off-schedule override fields when reason is provided', async () => {
    const wrapper = mountModal()
    await flushPromises()

    await wrapper.find('select').setValue('1')
    await wrapper.find('input[type="date"]').setValue('2026-04-20')

    const reasonInput = wrapper.find('textarea[name="offScheduleReason"]')
    expect(reasonInput.exists()).toBe(true)
    await reasonInput.setValue('Campus activity moved this class')

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    const createEvents = wrapper.emitted('create')

    expect(createEvents).toBeDefined()
    expect(createEvents?.[0]?.[0]).toMatchObject({
      scheduleId: 1,
      sessionDate: '2026-04-20',
      allowOffScheduleDate: true,
      offScheduleReason: 'Campus activity moved this class',
    })
  })

  it('does not emit offScheduleReason for a normal on-schedule session', async () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date('2026-04-20T09:00:00'))

      const wrapper = mountModal()
      await flushPromises()

      await wrapper.find('select').setValue('1')
      await wrapper.find('input[type="date"]').setValue('2026-04-21')
      await wrapper.find('form').trigger('submit.prevent')
      await flushPromises()

      const createEvents = wrapper.emitted('create')
      const payload = createEvents?.[0]?.[0] as Record<string, unknown>

      expect(createEvents).toBeDefined()
      expect(payload).toMatchObject({
        scheduleId: 1,
        sessionDate: '2026-04-21',
      })
      expect(payload).not.toHaveProperty('offScheduleReason')
      expect(payload).not.toHaveProperty('allowOffScheduleDate')
    }
    finally {
      vi.useRealTimers()
    }
  })

  it('uses local calendar date for min date near timezone boundaries', async () => {
    const originalTz = process.env.TZ

    vi.useFakeTimers()
    try {
      process.env.TZ = 'Asia/Manila'
      vi.setSystemTime(new Date('2026-04-20T00:30:00+08:00'))

      const wrapper = mountModal()
      await flushPromises()

      const sessionDateInput = wrapper.find('input[type="date"]')
      expect(sessionDateInput.attributes('min')).toBe('2026-04-20')
    }
    finally {
      vi.useRealTimers()
      if (originalTz === undefined)
        delete process.env.TZ
      else
        process.env.TZ = originalTz
    }
  })
})
