import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('reports view summary wiring', () => {
  it('uses the roster total from the reports summary for Total Students', () => {
    const source = readFileSync('src/views/ReportsView.vue', 'utf8')

    expect(source).toContain('summaryTotalEnrolled')
    expect(source).toContain('summary.totalEnrolled')
    expect(source).not.toContain('userStore.students.length || summaryTotalRecords.value')
  })
})
