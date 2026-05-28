import { describe, expect, it } from 'vitest'
import { normalizeUserName, formatDisplayName } from '@/composables/useUserName'

describe('normalizeUserName', () => {
  it('prefers camelCase firstName over lowercase firstname', () => {
    const raw = { firstName: 'John', firstname: 'johnny', lastName: 'Doe', lastname: 'doey' }
    const result = normalizeUserName(raw)
    expect(result.firstName).toBe('John')
    expect(result.lastName).toBe('Doe')
  })

  it('falls back to lowercase firstname when firstName missing', () => {
    const raw = { firstname: 'John', lastname: 'Doe' }
    const result = normalizeUserName(raw)
    expect(result.firstName).toBe('John')
    expect(result.lastName).toBe('Doe')
  })

  it('returns empty string when both variants missing', () => {
    const raw = { username: 'jdoe' }
    const result = normalizeUserName(raw)
    expect(result.firstName).toBe('')
    expect(result.lastName).toBe('')
  })

  it('handles null input gracefully', () => {
    const result = normalizeUserName(null)
    expect(result.firstName).toBe('')
    expect(result.lastName).toBe('')
  })

  it('handles undefined input gracefully', () => {
    const result = normalizeUserName(undefined)
    expect(result.firstName).toBe('')
    expect(result.lastName).toBe('')
  })

  it('handles mixed camelCase and lowercase', () => {
    const raw = { firstName: 'John', lastname: 'Doe' }
    const result = normalizeUserName(raw)
    expect(result.firstName).toBe('John')
    expect(result.lastName).toBe('Doe')
  })
})

describe('formatDisplayName', () => {
  it('returns "First Last" for normal input', () => {
    const raw = { firstName: 'John', lastName: 'Doe' }
    expect(formatDisplayName(raw)).toBe('John Doe')
  })

  it('falls back to lowercase firstname/lastname', () => {
    const raw = { firstname: 'John', lastname: 'Doe' }
    expect(formatDisplayName(raw)).toBe('John Doe')
  })

  it('returns fallback when both name parts empty', () => {
    const raw = { username: 'jdoe' }
    expect(formatDisplayName(raw, 'Unknown')).toBe('Unknown')
  })

  it('returns empty string when no fallback and names empty', () => {
    const raw = { username: 'jdoe' }
    expect(formatDisplayName(raw)).toBe('')
  })

  it('trims extra whitespace', () => {
    const raw = { firstName: '  John  ', lastName: '  Doe  ' }
    expect(formatDisplayName(raw)).toBe('John Doe')
  })

  it('handles null input', () => {
    expect(formatDisplayName(null)).toBe('')
    expect(formatDisplayName(null, 'Unknown')).toBe('Unknown')
  })

  it('handles partial names (first only)', () => {
    const raw = { firstName: 'John' }
    expect(formatDisplayName(raw)).toBe('John')
  })
})

describe('formatDisplayName with extra fallbacks', () => {
  it('fills missing lastName from extra', () => {
    const raw = { firstName: 'John' }
    expect(formatDisplayName(raw, '', { lastName: 'Doe' })).toBe('John Doe')
  })

  it('fills missing firstName from extra', () => {
    const raw = { lastName: 'Doe' }
    expect(formatDisplayName(raw, '', { firstName: 'John' })).toBe('John Doe')
  })

  it('ignores extra when both name parts present in raw', () => {
    const raw = { firstName: 'John', lastName: 'Doe' }
    expect(formatDisplayName(raw, '', { firstName: 'Jane', lastName: 'Smith' })).toBe('John Doe')
  })

  it('uses extra when raw is null', () => {
    expect(formatDisplayName(null, '', { firstName: 'John', lastName: 'Doe' })).toBe('John Doe')
  })

  it('uses extra with lowercase firstname from raw', () => {
    const raw = { firstname: 'johnny' }
    expect(formatDisplayName(raw, '', { lastName: 'Doe' })).toBe('johnny Doe')
  })

  it('extra and fallback text work together', () => {
    expect(formatDisplayName(null, 'Unknown', { firstName: 'John', lastName: 'Doe' })).toBe('John Doe')
  })

  it('falls back to text fallback when both raw and extra are empty', () => {
    expect(formatDisplayName(null, 'Unknown')).toBe('Unknown')
  })
})
