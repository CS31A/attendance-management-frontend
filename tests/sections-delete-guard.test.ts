import { readFileSync } from 'node:fs'

import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import api from '@/api'
import { useSectionStore } from '@/stores/sectionStore'
import { getErrorMessage, getErrorStatus } from '@/utils/httpError'

describe('sections delete guard regression', () => {
  const originalDelete = api.delete

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    api.delete = originalDelete
  })

  it('locks the three dependency checks and fallback warning in SectionsView', () => {
    const source = readFileSync('src/views/SectionsView.vue', 'utf8')

    expect(source).toContain('const [hasSchedules, hasStudents, hasEnrollments] = await Promise.all([')
    expect(source).toContain('sectionsApi.hasSchedulesInSection(id).then(r => r.data)')
    expect(source).toContain('sectionsApi.hasStudentsInSection(id).then(r => r.data)')
    expect(source).toContain('sectionsApi.hasEnrollmentsInSection(id).then(r => r.data)')
    expect(source).toContain('Cannot delete: Section has schedules assigned. Remove schedules first.')
    expect(source).toContain('Warning: Could not verify section dependencies. Server will validate the delete request.')
    expect(source).toContain('finally {')
    expect(source).toContain('isDeletionChecking.value = false')
    expect(source).toContain('sectionToDelete.value = section')
    expect(source).toContain('showDeleteModal.value = true')
  })

  it('keeps delete buttons disabled while deletion checks are pending', () => {
    const tableSource = readFileSync('src/components/tables/SectionTable.vue', 'utf8')
    const wrapperSource = readFileSync('src/components/tables/SectionTableSection.vue', 'utf8')

    expect(tableSource).toContain('isDeletionChecking')
    expect(tableSource).toContain(':disabled="isDeletionChecking"')
    expect(wrapperSource).toContain(':is-deletion-checking="isDeletionChecking"')
  })

  it('handles 409 conflict responses in confirmDelete without closing modal', () => {
    const source = readFileSync('src/views/SectionsView.vue', 'utf8')

    expect(source).toContain('getErrorStatus(error)')
    expect(source).toContain('if (status === 409)')
    expect(source).toContain('getErrorMessage(error')
    expect(source).toContain('// Conflict: keep modal open and show server message')
    expect(source).toContain('// Other errors: keep modal open for retry (consistent with sibling views)')
  })

  it('propagates 409 error with status code for conflict handling', async () => {
    const sectionStore = useSectionStore()
    const sectionId = 1
    const conflictMessage = 'Cannot delete: Section has schedules assigned. Remove schedules first.'

    // Add a section to the store first
    sectionStore.sections = [{ id: sectionId, name: 'Test Section' }]

    const error = new Error('Request failed with status code 409') as Error & {
      response?: {
        status: number
        data: { message: string }
      }
    }
    error.response = {
      status: 409,
      data: { message: conflictMessage },
    }

    api.delete = async () => {
      throw error
    }

    let caughtError: unknown
    try {
      await sectionStore.deleteSection(sectionId)
    }
    catch (err) {
      caughtError = err
    }

    // Verify error propagates with status 409
    expect(getErrorStatus(caughtError)).toBe(409)
    expect(getErrorMessage(caughtError, 'Delete request failed')).toBe(conflictMessage)

    // Verify section was NOT removed from store on conflict
    expect(sectionStore.sections.find(s => s.id === sectionId)).toBeDefined()
  })

  it('removes section from store only on successful delete', async () => {
    const sectionStore = useSectionStore()
    const sectionId = 1

    // Add a section to the store
    sectionStore.sections = [{ id: sectionId, name: 'Test Section' }]

    api.delete = async () => {
      return { status: 204, data: {} }
    }

    await sectionStore.deleteSection(sectionId)

    // Verify section was removed from store
    expect(sectionStore.sections.find(s => s.id === sectionId)).toBeUndefined()
  })

  it('preserves section in store when delete fails with 409', async () => {
    const sectionStore = useSectionStore()
    const sectionId = 1
    const sectionName = 'Test Section'

    // Add a section to the store
    sectionStore.sections = [{ id: sectionId, name: sectionName }]

    const error = new Error('Request failed with status code 409') as Error & {
      response?: { status: number, data: { message: string } }
    }
    error.response = {
      status: 409,
      data: { message: 'Cannot delete: Section has dependencies' },
    }

    api.delete = async () => {
      throw error
    }

    try {
      await sectionStore.deleteSection(sectionId)
    }
    catch {
      // Expected to throw
    }

    // Verify section is still in store (not removed on conflict)
    const section = sectionStore.sections.find(s => s.id === sectionId)
    expect(section).toBeDefined()
    expect(section?.name).toBe(sectionName)
  })

  it('does not close modal or clear section in error handler (regression test)', () => {
    const source = readFileSync('src/views/SectionsView.vue', 'utf8')

    // Extract the confirmDelete function and its catch block
    const confirmDeleteMatch = source.match(/async function confirmDelete\(\) \{[\s\S]*?\n\}/)
    expect(confirmDeleteMatch).toBeTruthy()

    const confirmDeleteFn = confirmDeleteMatch![0]

    // Find the catch block within confirmDelete
    const catchMatch = confirmDeleteFn.match(/catch\s*\(error\)\s*\{[\s\S]*\n\s*\}/)
    expect(catchMatch).toBeTruthy()

    const catchBlock = catchMatch![0]

    // The catch block should NOT close the modal or clear sectionToDelete
    expect(catchBlock).not.toContain('showDeleteModal.value = false')
    expect(catchBlock).not.toContain('sectionToDelete.value = null')

    // It should have the status check and showToast calls
    expect(catchBlock).toContain('if (status === 409)')
    expect(catchBlock).toContain('showToast(')
  })

  it('has consistent error handling with sibling admin views (regression test)', () => {
    const sectionsSource = readFileSync('src/views/SectionsView.vue', 'utf8')
    const subjectSource = readFileSync('src/views/SubjectView.vue', 'utf8')
    const courseSource = readFileSync('src/views/CourseView.vue', 'utf8')
    const classroomSource = readFileSync('src/views/ClassroomView.vue', 'utf8')

    // All views should have error handlers that keep modal open
    // (Subject/Course/Classroom already do this, Sections should match)

    // Extract catch blocks from each view
    const getCatchBlock = (source: string) => {
      const match = source.match(/catch\s*\(error\)\s*\{[\s\S]*?\n\s*\}/)
      return match ? match[0] : ''
    }

    const sectionsCatch = getCatchBlock(sectionsSource)
    const subjectCatch = getCatchBlock(subjectSource)
    const courseCatch = getCatchBlock(courseSource)
    const classroomCatch = getCatchBlock(classroomSource)

    // Sibling views keep modal open in catch (no modal close or clear)
    expect(subjectCatch).not.toContain('showDeleteModal.value = false')
    expect(subjectCatch).not.toContain('subjectToDelete.value = null')

    expect(courseCatch).not.toContain('showDeleteModal.value = false')
    expect(courseCatch).not.toContain('courseToDelete.value = null')

    expect(classroomCatch).not.toContain('showDeleteModal.value = false')
    expect(classroomCatch).not.toContain('classroomToDelete.value = null')

    // Sections should match this pattern
    expect(sectionsCatch).not.toContain('showDeleteModal.value = false')
    expect(sectionsCatch).not.toContain('sectionToDelete.value = null')
  })
})
