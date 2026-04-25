import type { SessionResponseDto } from '@/api/sessions'
import type { SessionStatus } from '@/utils/constants'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import CancelSessionModal from '@/components/sessions/CancelSessionModal.vue'

vi.mock('@/api/sessions', () => ({
  getSessionDisplayName: vi.fn((session: SessionResponseDto) =>
    session ? `${session.courseCode} - ${session.courseName}` : 'Unknown Session',
  ),
}))

vi.mock('@/utils/date', () => ({
  formatLongWeekdayDate: vi.fn(() => 'Wednesday, January 1, 2026'),
}))

function createSession(overrides: Partial<SessionResponseDto> = {}): SessionResponseDto {
  return {
    id: '1',
    status: 'not_started' as SessionStatus,
    sessionDate: '2026-01-01T00:00:00',
    courseCode: 'CS101',
    courseName: 'Data Structures',
    sectionName: 'Section A',
    ...overrides,
  }
}

function mountModal(props: {
  session?: SessionResponseDto
  isDeleting?: boolean
} = {}) {
  return mount(CancelSessionModal, {
    props: {
      session: createSession(),
      isDeleting: false,
      ...props,
    },
    global: {
      stubs: {
        Trash2: true,
        X: true,
        AlertTriangle: true,
      },
    },
  })
}

describe('cancelSessionModal', () => {
  describe('props', () => {
    it('renders session info correctly', () => {
      const session = createSession({
        courseCode: 'CS201',
        courseName: 'Algorithms',
        sectionName: 'Section B',
        sessionDate: '2026-03-15T00:00:00',
      })
      const wrapper = mountModal({ session })

      expect(wrapper.text()).toContain('CS201')
      expect(wrapper.text()).toContain('Algorithms')
      expect(wrapper.text()).toContain('Section B')
    })

    it('shows N/A when sectionName is missing', () => {
      const session = createSession({ sectionName: undefined as unknown as string })
      const wrapper = mountModal({ session })

      expect(wrapper.text()).toContain('N/A')
    })
  })

  describe('validation', () => {
    it('is invalid when reason is empty', async () => {
      const wrapper = mountModal()
      const textarea = wrapper.find('textarea')

      await textarea.setValue('')
      await flushPromises()

      const confirmBtn = wrapper.find('.btn-confirm')
      expect(confirmBtn.attributes('disabled')).toBeDefined()
    })

    it('is invalid when reason is too short (< 5 chars)', async () => {
      const wrapper = mountModal()
      const textarea = wrapper.find('textarea')

      await textarea.setValue('Hi')
      await flushPromises()

      const confirmBtn = wrapper.find('.btn-confirm')
      expect(confirmBtn.attributes('disabled')).toBeDefined()
      expect(wrapper.find('.helper-text').text()).toContain('2/500')
    })

    it('is valid when reason meets minimum length (5 chars)', async () => {
      const wrapper = mountModal()
      const textarea = wrapper.find('textarea')

      await textarea.setValue('Hello')
      await flushPromises()

      const confirmBtn = wrapper.find('.btn-confirm')
      expect(confirmBtn.attributes('disabled')).toBeUndefined()
    })

    it('is valid when reason is within bounds (5-500 chars)', async () => {
      const wrapper = mountModal()
      const textarea = wrapper.find('textarea')
      const longReason = 'A'.repeat(300)

      await textarea.setValue(longReason)
      await flushPromises()

      const confirmBtn = wrapper.find('.btn-confirm')
      expect(confirmBtn.attributes('disabled')).toBeUndefined()
      expect(wrapper.find('.helper-text').text()).toContain('300/500')
    })

    it('is invalid when reason exceeds maximum length (> 500 chars)', async () => {
      const wrapper = mountModal()
      const textarea = wrapper.find('textarea')
      const tooLongReason = 'B'.repeat(501)

      await textarea.setValue(tooLongReason)
      await flushPromises()

      const confirmBtn = wrapper.find('.btn-confirm')
      expect(confirmBtn.attributes('disabled')).toBeDefined()
      expect(wrapper.find('.helper-text.error').text()).toContain('501/500')
    })

    it('shows error styling when reason is present but invalid', async () => {
      const wrapper = mountModal()
      const textarea = wrapper.find('textarea')

      await textarea.setValue('No')
      await flushPromises()

      expect(wrapper.find('textarea.has-error').exists()).toBe(true)
    })

    it('does not show error styling when reason is empty', async () => {
      const wrapper = mountModal()
      const textarea = wrapper.find('textarea')

      await textarea.setValue('')
      await flushPromises()

      expect(wrapper.find('textarea.has-error').exists()).toBe(false)
    })

    it('character counter updates as user types', async () => {
      const wrapper = mountModal()
      const textarea = wrapper.find('textarea')

      await textarea.setValue('Test reason')
      await flushPromises()

      const helperText = wrapper.find('.helper-text')
      expect(helperText.text()).toContain('11/500')
    })
  })

  describe('emits', () => {
    it('emits confirm with trimmed reason when valid and not deleting', async () => {
      const wrapper = mountModal()
      const textarea = wrapper.find('textarea')

      await textarea.setValue('  Instructor unavailable  ')
      await flushPromises()
      await wrapper.find('.btn-confirm').trigger('submit')
      await flushPromises()

      const emit = wrapper.emitted<{ confirm: [reason: string] }>('confirm')
      expect(emit).toBeDefined()
      expect(emit?.[0]).toEqual(['Instructor unavailable'])
    })

    it('does not emit confirm when reason is invalid', async () => {
      const wrapper = mountModal()
      const textarea = wrapper.find('textarea')

      await textarea.setValue('Hi')
      await flushPromises()
      await wrapper.find('.btn-confirm').trigger('submit')
      await flushPromises()

      expect(wrapper.emitted('confirm')).toBeUndefined()
    })

    it('does not emit confirm when isDeleting is true', async () => {
      const wrapper = mountModal({ isDeleting: true })
      const textarea = wrapper.find('textarea')

      await textarea.setValue('Valid reason here')
      await flushPromises()
      await wrapper.find('.btn-confirm').trigger('submit')
      await flushPromises()

      expect(wrapper.emitted('confirm')).toBeUndefined()
    })

    it('emits cancel when cancel button is clicked and not deleting', async () => {
      const wrapper = mountModal()

      await wrapper.find('.btn-cancel').trigger('click')
      await flushPromises()

      expect(wrapper.emitted('cancel')).toBeDefined()
    })

    it('does not emit cancel when isDeleting is true', async () => {
      const wrapper = mountModal({ isDeleting: true })

      await wrapper.find('.btn-cancel').trigger('click')
      await flushPromises()

      expect(wrapper.emitted('cancel')).toBeUndefined()
    })

    it('close button emits cancel when not deleting', async () => {
      const wrapper = mountModal()

      await wrapper.find('.btn-close').trigger('click')
      await flushPromises()

      expect(wrapper.emitted('cancel')).toBeDefined()
    })

    it('close button does not emit cancel when isDeleting is true', async () => {
      const wrapper = mountModal({ isDeleting: true })

      await wrapper.find('.btn-close').trigger('click')
      await flushPromises()

      expect(wrapper.emitted('cancel')).toBeUndefined()
    })

    it('confirm button shows spinner when isDeleting is true', async () => {
      const wrapper = mountModal({ isDeleting: true })

      expect(wrapper.find('.spinner').exists()).toBe(true)
      // Check the btn-confirm itself does NOT contain "Confirm Cancellation" text
      // (wrapper.text() includes hidden descendants, so check the button's direct text)
      const btnText = wrapper.find('.btn-confirm').text()
      expect(btnText).not.toContain('Confirm Cancellation')
    })
  })

  describe('loading states', () => {
    it('disables textarea when isDeleting is true', () => {
      const wrapper = mountModal({ isDeleting: true })

      expect(wrapper.find('textarea').attributes('disabled')).toBeDefined()
    })

    it('disables cancel button when isDeleting is true', () => {
      const wrapper = mountModal({ isDeleting: true })

      expect(wrapper.find('.btn-cancel').attributes('disabled')).toBeDefined()
    })

    it('confirm button is disabled when isDeleting even if reason is valid', async () => {
      const wrapper = mountModal({ isDeleting: true })
      const textarea = wrapper.find('textarea')

      await textarea.setValue('Valid reason that cannot be submitted')
      await flushPromises()

      const confirmBtn = wrapper.find('.btn-confirm')
      expect(confirmBtn.attributes('disabled')).toBeDefined()
    })
  })
})
