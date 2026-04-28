import type { SessionResponseDto } from '@/api/sessions'
import type { SessionStatus } from '@/utils/constants'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import SessionTable from '@/components/sessions/SessionTable.vue'

vi.mock('@/api/sessions', () => ({
  canStartSession: vi.fn((session: SessionResponseDto) => {
    // Mock implementation: sessions scheduled for today can be started
    const today = new Date()
    const sessionDate = session.sessionDate ? new Date(session.sessionDate) : null
    if (!sessionDate)
      return false
    return sessionDate.toDateString() === today.toDateString()
  }),
}))

vi.mock('@/utils/date', () => ({
  formatShortWeekdayDateWithYear: vi.fn(() => 'Fri, Mar 15, 2024'),
}))

function createSession(overrides: Partial<SessionResponseDto> = {}): SessionResponseDto {
  const today = new Date()
  return {
    id: '1',
    status: 'not_started' as SessionStatus,
    sessionDate: today.toISOString(),
    subjectCode: 'CS101',
    subjectName: 'Data Structures',
    sectionName: 'Section A',
    scheduledRoomName: 'Room 101',
    ...overrides,
  }
}

function mountTable(sessions: SessionResponseDto[]) {
  return mount(SessionTable, {
    props: { sessions },
    global: {
      stubs: {
        Calendar: true,
        Clock: true,
        Eye: true,
        MapPin: true,
        Play: true,
        QrCode: true,
        StopCircle: true,
        Trash2: true,
        SessionStatusBadge: true,
      },
    },
  })
}

function formatExpectedLocalTime(value: string): string {
  return new Date(value).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

describe('session table', () => {
  describe('start button behavior', () => {
    it('disables Start button when session cannot be started (not scheduled for today)', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const session = createSession({
        sessionDate: yesterday.toISOString(),
        status: 'not_started',
      })
      const wrapper = mountTable([session])

      const startBtn = wrapper.find('.btn-start')
      expect(startBtn.attributes('disabled')).toBeDefined()
    })

    it('enables Start button when session can be started (scheduled for today)', () => {
      const session = createSession({
        status: 'not_started',
      })
      const wrapper = mountTable([session])

      const startBtn = wrapper.find('.btn-start')
      expect(startBtn.attributes('disabled')).toBeUndefined()
    })

    it('shows correct tooltip when Start button is disabled', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const session = createSession({
        sessionDate: yesterday.toISOString(),
        status: 'not_started',
      })
      const wrapper = mountTable([session])

      const startBtn = wrapper.find('.btn-start')
      expect(startBtn.attributes('title')).toBe('Session can only be started on its scheduled date')
    })

    it('shows correct tooltip when Start button is enabled', () => {
      const session = createSession({
        status: 'not_started',
      })
      const wrapper = mountTable([session])

      const startBtn = wrapper.find('.btn-start')
      expect(startBtn.attributes('title')).toBe('Start Session')
    })

    it('disables Start button for sessions with undefined sessionDate', () => {
      const session = createSession({
        sessionDate: undefined as unknown as string,
        status: 'not_started',
      })
      const wrapper = mountTable([session])

      const startBtn = wrapper.find('.btn-start')
      expect(startBtn.attributes('disabled')).toBeDefined()
    })

    it('disables Start button for sessions with malformed sessionDate', () => {
      const session = createSession({
        sessionDate: 'invalid-date',
        status: 'not_started',
      })
      const wrapper = mountTable([session])

      const startBtn = wrapper.find('.btn-start')
      expect(startBtn.attributes('disabled')).toBeDefined()
    })

    it('does not show Start button for active sessions', () => {
      const session = createSession({
        status: 'active',
      })
      const wrapper = mountTable([session])

      const startBtn = wrapper.find('.btn-start')
      expect(startBtn.exists()).toBe(false)
    })

    it('does not show Start button for ended sessions', () => {
      const session = createSession({
        status: 'ended',
      })
      const wrapper = mountTable([session])

      const startBtn = wrapper.find('.btn-start')
      expect(startBtn.exists()).toBe(false)
    })

    it('does not show Start button for cancelled sessions', () => {
      const session = createSession({
        status: 'cancelled',
      })
      const wrapper = mountTable([session])

      const startBtn = wrapper.find('.btn-start')
      expect(startBtn.exists()).toBe(false)
    })

    it('emits start event when Start button is clicked and enabled', async () => {
      const session = createSession({
        status: 'not_started',
      })
      const wrapper = mountTable([session])

      const startBtn = wrapper.find('.btn-start')
      await startBtn.trigger('click')

      const emitted = wrapper.emitted<{ start: [SessionResponseDto] }>('start')
      expect(emitted).toBeDefined()
      expect(emitted?.[0]).toEqual([session])
      expect(wrapper.emitted('viewDetails')).toBeUndefined()
    })

    it('does not emit start event when Start button is clicked and disabled', async () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const session = createSession({
        sessionDate: yesterday.toISOString(),
        status: 'not_started',
      })
      const wrapper = mountTable([session])

      const startBtn = wrapper.find('.btn-start')
      await startBtn.trigger('click')

      expect(wrapper.emitted('start')).toBeUndefined()
    })
  })

  describe('tooltip text edge cases', () => {
    it('shows disabled tooltip for empty sessionDate', () => {
      const session = createSession({
        sessionDate: '',
        status: 'not_started',
      })
      const wrapper = mountTable([session])

      const startBtn = wrapper.find('.btn-start')
      expect(startBtn.attributes('title')).toBe('Session can only be started on its scheduled date')
    })

    it('shows disabled tooltip for null-like sessionDate', () => {
      const session = createSession({
        sessionDate: null as unknown as string,
        status: 'not_started',
      })
      const wrapper = mountTable([session])

      const startBtn = wrapper.find('.btn-start')
      expect(startBtn.attributes('title')).toBe('Session can only be started on its scheduled date')
    })
  })

  describe('time rendering', () => {
    it('renders ISO datetime values using local clock time for active sessions', () => {
      const startIso = '2026-04-20T00:30:00Z'
      const endIso = '2026-04-20T01:45:00Z'
      const session = createSession({
        status: 'active',
        actualStartTime: startIso,
        actualEndTime: endIso,
      })

      const wrapper = mountTable([session])
      const timeText = wrapper.find('.time-text').text()

      expect(timeText).toBe(`${formatExpectedLocalTime(startIso)} - ${formatExpectedLocalTime(endIso)}`)
    })
  })

  describe('detail navigation behavior', () => {
    it('emits viewDetails when a row is clicked', async () => {
      const session = createSession()
      const wrapper = mountTable([session])

      await wrapper.find('.session-row').trigger('click')

      expect(wrapper.emitted<{ viewDetails: [SessionResponseDto] }>('viewDetails')?.[0]).toEqual([session])
    })

    it('emits viewDetails when a focused row is activated with Enter', async () => {
      const session = createSession()
      const wrapper = mountTable([session])

      await wrapper.find('.session-row').trigger('keydown', { key: 'Enter' })

      expect(wrapper.emitted<{ viewDetails: [SessionResponseDto] }>('viewDetails')?.[0]).toEqual([session])
    })

    it('does not emit viewDetails when active session action buttons are clicked', async () => {
      const session = createSession({ status: 'active' })
      const wrapper = mountTable([session])

      await wrapper.find('.btn-qr').trigger('click')
      await wrapper.find('.btn-view-qr').trigger('click')
      await wrapper.find('.btn-end').trigger('click')
      await wrapper.find('.btn-room').trigger('click')

      expect(wrapper.emitted('viewDetails')).toBeUndefined()
      expect(wrapper.emitted('generateQr')).toHaveLength(1)
      expect(wrapper.emitted('viewQrCodes')).toHaveLength(1)
      expect(wrapper.emitted('end')).toHaveLength(1)
      expect(wrapper.emitted('updateRoom')).toHaveLength(1)
    })
  })
})
