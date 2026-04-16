import { describe, expect, it } from 'vitest'

// Test the empty state logic directly as pure functions
// This mirrors the computed property logic in ReportsView.vue

function hasNoAttendanceData(isLoading: boolean, values: number[]): boolean {
  return !isLoading && values.length > 0 && values.every(v => v === 0)
}

function hasNoClassPerformanceData(isLoading: boolean, values: number[]): boolean {
  return !isLoading && values.length > 0 && values.every(v => v === 0)
}

describe('reportsView - Empty State Logic', () => {
  describe('hasNoAttendanceData computed property logic', () => {
    it('returns true when not loading and all values are zero', () => {
      expect(hasNoAttendanceData(false, [0, 0, 0, 0, 0])).toBe(true)
    })

    it('returns false when loading', () => {
      expect(hasNoAttendanceData(true, [0, 0, 0, 0, 0])).toBe(false)
    })

    it('returns false when array is empty', () => {
      expect(hasNoAttendanceData(false, [])).toBe(false)
    })

    it('returns false when values are not all zero', () => {
      expect(hasNoAttendanceData(false, [0, 50, 75, 0, 25])).toBe(false)
    })

    it('returns false when array has mixed zero and non-zero values', () => {
      expect(hasNoAttendanceData(false, [0, 0, 10, 0, 0])).toBe(false)
    })

    it('returns false when array has single non-zero value', () => {
      expect(hasNoAttendanceData(false, [100])).toBe(false)
    })

    it('returns true when array has single zero value', () => {
      expect(hasNoAttendanceData(false, [0])).toBe(true)
    })
  })

  describe('hasNoClassPerformanceData computed property logic', () => {
    it('returns true when not loading and all values are zero', () => {
      expect(hasNoClassPerformanceData(false, [0, 0, 0, 0, 0])).toBe(true)
    })

    it('returns false when loading', () => {
      expect(hasNoClassPerformanceData(true, [0, 0, 0, 0, 0])).toBe(false)
    })

    it('returns false when array is empty', () => {
      expect(hasNoClassPerformanceData(false, [])).toBe(false)
    })

    it('returns false when values are not all zero', () => {
      expect(hasNoClassPerformanceData(false, [85, 90, 75, 80, 95])).toBe(false)
    })

    it('returns false when array has mixed zero and non-zero values', () => {
      expect(hasNoClassPerformanceData(false, [0, 85, 0, 90, 0])).toBe(false)
    })
  })
})
