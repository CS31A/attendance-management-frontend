import type { SessionResponseDto } from '@/api/sessions'
import type { EntityId } from '@/types'
import { describe, expect, it } from 'vitest'
import { canStartSession } from '@/api/sessions'
import { isSessionScheduledForToday } from '@/utils/sessionDateHelpers'

function createSession(overrides: Partial<SessionResponseDto> = {}): SessionResponseDto {
  return {
    id: 1 as EntityId,
    status: 'not_started',
    sessionDate: '2026-04-19T00:00:00',
    ...overrides,
  }
}

describe('session start guards', () => {
  const today = new Date('2026-04-19T09:00:00')

  it('isSessionScheduledForToday returns true when session date matches today', () => {
    const session = createSession({ sessionDate: '2026-04-19T00:00:00' })

    expect(isSessionScheduledForToday(session, today)).toBe(true)
  })

  it('isSessionScheduledForToday returns false when session date is different', () => {
    const session = createSession({ sessionDate: '2026-04-20T00:00:00' })

    expect(isSessionScheduledForToday(session, today)).toBe(false)
  })

  it('canStartSession returns true only for not_started sessions scheduled today', () => {
    const session = createSession({ status: 'not_started', sessionDate: '2026-04-19T00:00:00' })

    expect(canStartSession(session, today)).toBe(true)
  })

  it('canStartSession returns false for future sessions', () => {
    const session = createSession({ status: 'not_started', sessionDate: '2099-01-01T00:00:00' })

    expect(canStartSession(session, today)).toBe(false)
  })

  it('canStartSession returns false for non-not_started status', () => {
    const session = createSession({ status: 'active', sessionDate: '2026-04-19T00:00:00' })

    expect(canStartSession(session, today)).toBe(false)
  })
})
