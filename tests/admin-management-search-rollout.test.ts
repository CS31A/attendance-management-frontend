import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const files = [
  'src/views/UserManagementView.vue',
  'src/views/CourseView.vue',
  'src/views/SubjectView.vue',
  'src/views/ClassroomView.vue',
  'src/views/SectionsView.vue',
  'src/views/SchedulesView.vue',
]

describe('admin management search rollout', () => {
  it('uses the shared ManagementSearchBar across admin management views', () => {
    for (const file of files) {
      const source = readFileSync(file, 'utf8')
      expect(source).toContain('ManagementSearchBar')
    }
  })

  it('removes the inline user management search implementation', () => {
    const source = readFileSync('src/views/UserManagementView.vue', 'utf8')

    expect(source).not.toContain('handleSearchInput')
    expect(source).not.toContain('live-search-container')
  })
})
