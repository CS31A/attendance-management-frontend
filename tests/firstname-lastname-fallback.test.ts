import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('firstname/lastname lowercase fallback coverage', () => {
  it('EditUserModal falls back to lowercase firstname/lastname from API profile', () => {
    const source = readFileSync('src/components/EditUserModal.vue', 'utf8')

    expect(source).toContain('newUser.firstName || newUser.firstname ||')
    expect(source).toContain('newUser.lastName || newUser.lastname ||')
  })

  it('ScheduleList falls back to lowercase instructor firstname/lastname', () => {
    const source = readFileSync('src/components/schedules/ScheduleList.vue', 'utf8')

    expect(source).toContain('instructor.firstName || instructor.firstname ||')
    expect(source).toContain('instructor.lastName || instructor.lastname ||')
  })

  it('UserTable handles lowercase firstname/lastname from API', () => {
    const source = readFileSync('src/components/tables/UserTable.vue', 'utf8')

    expect(source).toContain('user.firstname && user.lastname')
  })

  it('SchedulesView falls back to lowercase instructor firstname/lastname', () => {
    const source = readFileSync('src/views/SchedulesView.vue', 'utf8')

    // Instructor label in form options
    expect(source).toContain('instructor.firstName || instructor.firstname ||')
    expect(source).toContain('instructor.lastName || instructor.lastname ||')
  })

  it('UserManagementView falls back to lowercase user firstname/lastname', () => {
    const source = readFileSync('src/views/UserManagementView.vue', 'utf8')

    expect(source).toContain('user.firstName || user.firstname ||')
    expect(source).toContain('user.lastName || user.lastname ||')
  })

  it('StudentDetailView falls back to lowercase firstname/lastname', () => {
    const source = readFileSync('src/views/StudentDetailView.vue', 'utf8')

    expect(source).toContain('studentUser.value.firstName || studentUser.value.firstname ||')
    expect(source).toContain('studentUser.value.lastName || studentUser.value.lastname ||')
  })
})
