import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('instructor management regression coverage', () => {
  it('user management view includes instructor workload overview wiring', () => {
    const source = readFileSync('src/views/UserManagementView.vue', 'utf8')

    expect(source).toContain('fetchInstructorSessionsReport')
    expect(source).toContain('Instructor Workload')
  })

  it('edit user modal exposes instructor department field', () => {
    const source = readFileSync('src/components/EditUserModal.vue', 'utf8')

    expect(source).toContain('Department')
  })

  it('missing functionality doc no longer reports instructors as 100% complete', () => {
    const source = readFileSync('Frontend-Status.md', 'utf8')

    expect(source).not.toContain('| **Instructors** | 9 | 9 | 0 | 100% |')
    expect(source).not.toContain('### 3.4 Instructor Management ✅ **FULLY IMPLEMENTED**')
  })
})
