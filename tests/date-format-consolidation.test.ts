import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

type DateInput = Date | string | null | undefined

interface DateUtilsModule {
  formatShortTableDate: (date: DateInput, fallback?: string) => string
  formatLongDate: (date: DateInput, fallback?: string) => string
  formatShortWeekdayDate: (date: DateInput, options?: { includeYear?: boolean, fallback?: string }) => string
  formatLongWeekdayDate: (date: DateInput, fallback?: string) => string
  parseUtcDate: (dateString: string | Date | null | undefined) => Date | null
  formatDateTime: (date: string | Date | null | undefined) => string
}

describe('date format consolidation', () => {
  it('shared date utilities exist and preserve formatter families', async () => {
    expect(existsSync('src/utils/date.ts')).toBe(true)

    let dateUtils: DateUtilsModule | null = null

    try {
      dateUtils = await import('@/utils/date') as DateUtilsModule
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

  it('parseUtcDate is exported from date.ts and parses UTC strings correctly', async () => {
    const dateUtils = await import('@/utils/date') as DateUtilsModule

    expect(dateUtils.parseUtcDate).toBeDefined()
    expect(dateUtils.parseUtcDate(null)).toBeNull()
    expect(dateUtils.parseUtcDate(undefined)).toBeNull()

    // Plain ISO string (no timezone) treated as UTC
    const result = dateUtils.parseUtcDate('2024-03-15T12:00:00')
    expect(result).toBeInstanceOf(Date)
    expect(result!.toISOString()).toBe('2024-03-15T12:00:00.000Z')

    // String with Z suffix already
    const withZ = dateUtils.parseUtcDate('2024-03-15T12:00:00Z')
    expect(withZ).toBeInstanceOf(Date)
    expect(withZ!.toISOString()).toBe('2024-03-15T12:00:00.000Z')

    // Date object passthrough
    const dateObj = new Date('2024-03-15T12:00:00Z')
    expect(dateUtils.parseUtcDate(dateObj)).toBe(dateObj)
  })

  it('formatDateTime is exported from date.ts and formats dates with time', async () => {
    const dateUtils = await import('@/utils/date') as DateUtilsModule

    expect(dateUtils.formatDateTime).toBeDefined()
    expect(dateUtils.formatDateTime(null)).toBe('-')
    expect(dateUtils.formatDateTime(undefined)).toBe('-')

    const result = dateUtils.formatDateTime('2024-03-15T12:00:00Z')
    expect(result).not.toBe('-')
    expect(result).toContain('Mar')
    expect(result).toContain('15')
    expect(result).toContain('2024')
  })

  it('targeted files no longer define local formatDate helpers', () => {
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
      'src/components/sessions/StartSessionModal.vue',
      'src/components/sessions/EndSessionModal.vue',
      'src/components/sessions/UpdateRoomModal.vue',
    ]

    files.forEach((file) => {
      const source = readFileSync(file, 'utf8')
      expect(source.includes('function formatDate(')).toBe(false)
    })
  })

  it('consumers import parseUtcDate and formatDateTime from date.ts, not qrcode.ts', () => {
    const consumers = [
      'src/views/SessionDetailView.vue',
      'src/views/SectionEnrollmentsView.vue',
      'src/components/tables/InstructorTableSection.vue',
      'src/stores/qrCodeStore.ts',
      'src/components/qrcode/QRCodeListModal.vue',
    ]

    consumers.forEach((file) => {
      const source = readFileSync(file, 'utf8')
      expect(source.includes(`from '@/utils/qrcode'`)).toBe(false)
    })
  })

  it('qrcode.ts still exports QR-specific utilities', () => {
    const source = readFileSync('src/utils/qrcode.ts', 'utf8')
    expect(source.includes('export function formatDate')).toBe(true)
    expect(source.includes('export function formatCountdown')).toBe(true)
    expect(source.includes('export function calculateRemainingTime')).toBe(true)
    expect(source.includes('export function isQrExpired')).toBe(true)
    expect(source.includes('export function formatScanTime')).toBe(true)
  })
})
