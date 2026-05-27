import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

describe('createAttendanceSubmissionError lives in utils', () => {
  describe('exports from @/utils/attendanceSubmission', () => {
    it('createAttendanceSubmissionError is exported from utils', async () => {
      const mod = await import('@/utils/attendanceSubmission')
      expect(mod.createAttendanceSubmissionError).toBeDefined()
      expect(typeof mod.createAttendanceSubmissionError).toBe('function')
    })

    it('creates error with savedCount and totalCount properties', async () => {
      const { createAttendanceSubmissionError } = await import('@/utils/attendanceSubmission')
      const sourceError = new Error('network timeout')
      const result = createAttendanceSubmissionError(sourceError, 2, 5)

      expect(result).toBeInstanceOf(Error)
      expect(result).toHaveProperty('savedCount', 2)
      expect(result).toHaveProperty('totalCount', 5)
    })

    it('error message matches the source error message', async () => {
      const { createAttendanceSubmissionError } = await import('@/utils/attendanceSubmission')
      const sourceError = new Error('connection refused')
      const result = createAttendanceSubmissionError(sourceError, 0, 3)

      expect(result.message).toBe('connection refused')
    })

    it('wraps non-Error values with default message', async () => {
      const { createAttendanceSubmissionError } = await import('@/utils/attendanceSubmission')
      const result = createAttendanceSubmissionError('string error', 1, 4)

      expect(result.message).toBe('Failed to record attendance.')
      expect(result).toHaveProperty('savedCount', 1)
      expect(result).toHaveProperty('totalCount', 4)
    })

    it('preserves response property when present on source error', async () => {
      const { createAttendanceSubmissionError } = await import('@/utils/attendanceSubmission')
      const mockResponse = { status: 500, data: 'Internal Server Error' }
      const sourceError = Object.assign(new Error('server error'), { response: mockResponse })
      const result = createAttendanceSubmissionError(sourceError, 0, 2)

      expect(result.response).toBe(mockResponse)
    })
  })

  describe('NOT defined in attendanceStore', () => {
    it('createAttendanceSubmissionError is not in the store source file', () => {
      const storeSource = readFileSync('src/stores/attendanceStore.ts', 'utf8')

      // After refactor, the function definition should be removed from the store
      expect(storeSource.includes('function createAttendanceSubmissionError')).toBe(false)
    })
  })
})
