import { describe, expect, it } from 'vitest'
import { matchesSearchQuery } from '@/utils/search'

describe('search utilities', () => {
  it('matches primitive values case-insensitively', () => {
    expect(matchesSearchQuery('  ada ', ['Ada Lovelace', '2026-0001'])).toBe(true)
  })

  it('matches nested array values and ignores nullish entries', () => {
    expect(matchesSearchQuery('hopper', [null, undefined, ['Grace Hopper', 42]])).toBe(true)
  })

  it('returns false when none of the values match', () => {
    expect(matchesSearchQuery('physics', ['Mathematics', 'Algorithms'])).toBe(false)
  })
})
