import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { normalizeUserName, formatDisplayName } from '@/composables/useUserName'

describe('firstname/lastname lowercase fallback behavior', () => {
  it('handles camelCase firstName/lastName from API', () => {
    const raw = { firstName: 'John', lastName: 'Doe' }
    expect(formatDisplayName(raw)).toBe('John Doe')
  })

  it('falls back to lowercase firstname/lastname from API', () => {
    const raw = { firstname: 'John', lastname: 'Doe' }
    expect(formatDisplayName(raw)).toBe('John Doe')
  })

  it('prefers camelCase over lowercase when both present', () => {
    const raw = { firstName: 'John', firstname: 'johnny', lastName: 'Doe', lastname: 'doey' }
    expect(formatDisplayName(raw)).toBe('John Doe')
  })

  it('handles mixed case variants', () => {
    const raw = { firstName: 'John', lastname: 'Doe' }
    expect(formatDisplayName(raw)).toBe('John Doe')
  })

  it('returns empty string for missing names', () => {
    const raw = { username: 'jdoe' }
    expect(formatDisplayName(raw)).toBe('')
  })

  it('handles null/undefined raw input', () => {
    expect(formatDisplayName(null)).toBe('')
    expect(formatDisplayName(undefined)).toBe('')
  })
})

describe('UserTable migration to composable', () => {
  it('UserTable uses formatDisplayName from composable', () => {
    const source = readFileSync('src/components/tables/UserTable.vue', 'utf8')
    expect(source).toContain("import { formatDisplayName } from '@/composables/useUserName'")
    expect(source).not.toContain('user.firstName && user.lastName')
  })
})
