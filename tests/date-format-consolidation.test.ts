import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, test } from 'bun:test'

describe('date format consolidation', () => {
  test('shared date utilities exist and preserve formatter families', async () => {
    expect(existsSync('src/utils/date.ts')).toBe(true)

    let dateUtils: null | Record<string, (...args: any[]) => string> = null

    try {
      dateUtils = await import('../src/utils/date.ts') as Record<string, (...args: any[]) => string>
    }
    catch {
      dateUtils = null
    }

    expect(dateUtils).not.toBeNull()
    if (!dateUtils)
      return

    const sample = new Date(2024, 2, 15, 12, 0, 0)

    expect(dateUtils.formatShortTableDate(sample)).toBe('Mar 15, 2024')
    expect(dateUtils.formatLongDate(sample)).toBe('March 15, 2024')
    expect(dateUtils.formatLongDate(null, '-')).toBe('-')
    expect(dateUtils.formatShortWeekdayDate(sample)).toBe('Fri, Mar 15')
    expect(dateUtils.formatShortWeekdayDate(sample, { includeYear: true })).toBe('Fri, Mar 15, 2024')
    expect(dateUtils.formatLongWeekdayDate(sample)).toBe('Friday, March 15, 2024')
  })

  test('targeted files no longer define local formatDate helpers', () => {
    const files = [
      'src/components/tables/UserTable.vue',
      'src/components/tables/SubjectTable.vue',
      'src/components/tables/SectionTable.vue',
      'src/components/tables/CourseTable.vue',
      'src/components/tables/ClassroomTable.vue',
      'src/views/ProfileView.vue',
      'src/views/DashboardView.vue',
      'src/components/attendance/AttendanceList.vue',
      'src/components/attendance/AttendanceRecord.vue',
      'src/components/sessions/SessionTable.vue',
      'src/components/sessions/SessionCard.vue',
      'src/components/sessions/StartSessionModal.vue',
      'src/components/sessions/EndSessionModal.vue',
      'src/components/sessions/UpdateRoomModal.vue',
    ]

    files.forEach((file) => {
      const source = readFileSync(file, 'utf8')
      expect(source.includes('function formatDate(')).toBe(false)
    })
  })
})
