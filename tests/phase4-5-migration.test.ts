import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('phase 4 and 5 migration targets', () => {
  it('core entrypoints are TypeScript files', () => {
    expect(existsSync('src/main.ts')).toBe(true)
    expect(existsSync('src/router/index.ts')).toBe(true)
    expect(existsSync('src/router/authGuard.ts')).toBe(true)
    expect(existsSync('src/api/index.ts')).toBe(true)
  })

  it('api service modules are migrated to TypeScript', () => {
    const apiModules = [
      'src/api/admin.ts',
      'src/api/attendance.ts',
      'src/api/classrooms.ts',
      'src/api/courses.ts',
      'src/api/enrollments.ts',
      'src/api/index.ts',
      'src/api/instructors.ts',
      'src/api/qrCode.ts',
      'src/api/schedules.ts',
      'src/api/sections.ts',
      'src/api/sessions.ts',
      'src/api/subjects.ts',
    ]

    apiModules.forEach((modulePath) => {
      expect(existsSync(modulePath)).toBe(true)
    })
  })
})
