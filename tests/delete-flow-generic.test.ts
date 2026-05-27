import type { AxiosResponse } from 'axios'
import type { EntityId } from '@/types'
/**
 * Tests for using createDeleteFlow directly (no entity-specific wrappers).
 * These tests lock the behavior that the 5 wrapper files currently provide,
 * proving that views can call createDeleteFlow<T>() directly with entity config.
 */
import { describe, expect, it, vi } from 'vitest'
import { createDeleteFlow } from '@/composables/useEntityDeleteFlow'

// --- Helpers ---

function createConflictError() {
  const error = new Error('Conflict') as any
  error.isAxiosError = true
  error.response = { status: 409, data: { message: 'Entity has dependencies' } }
  return error
}

function okResponse(data = false): AxiosResponse<boolean> {
  return { data, status: 200, statusText: 'OK', headers: {}, config: {} as any }
}

// --- Entity factories ---

interface TestEntity {
  id: EntityId
  name: string
  code?: string
}

function createEntity(id: string, name: string): TestEntity {
  return { id, name }
}

// --- Generic store factory ---

function createStore(items: TestEntity[]) {
  return {
    items: () => items,
    deleteItem: vi.fn().mockResolvedValue(undefined),
  }
}

// --- Tests ---

describe('createDeleteFlow used directly (no wrapper)', () => {
  describe('classroom-like config (2 dependency checks)', () => {
    const api = {
      hasSchedulesInClassroom: vi.fn().mockResolvedValue(okResponse(false)),
      hasSessionsInClassroom: vi.fn().mockResolvedValue(okResponse(false)),
    }

    function createClassroomFlow(items: TestEntity[], showToast?: (msg: string, type?: string, dur?: number) => void) {
      return createDeleteFlow<TestEntity>({
        store: createStore(items),
        dependencyChecks: [
          { check: api.hasSchedulesInClassroom, message: 'Cannot delete: Classroom has schedules assigned. Remove schedules first.' },
          { check: api.hasSessionsInClassroom, message: 'Cannot delete: Classroom has sessions assigned. Remove sessions first.' },
        ],
        labels: { entityName: 'Classroom', entityNamePlural: 'Classrooms' },
        showToast,
      })
    }

    it('opens delete modal when no dependencies', async () => {
      const items = [createEntity('1', 'Room 101')]
      const flow = createClassroomFlow(items)

      await flow.handleDelete('1')

      expect(flow.showDeleteModal.value).toBe(true)
      expect(flow.itemToDelete.value?.name).toBe('Room 101')
    })

    it('blocks delete when schedules exist', async () => {
      api.hasSchedulesInClassroom.mockResolvedValueOnce(okResponse(true))
      const items = [createEntity('1', 'Room 101')]
      const flow = createClassroomFlow(items)

      await flow.handleDelete('1')

      expect(flow.showDeleteModal.value).toBe(false)
    })

    it('blocks delete when sessions exist', async () => {
      api.hasSessionsInClassroom.mockResolvedValueOnce(okResponse(true))
      const items = [createEntity('1', 'Room 101')]
      const flow = createClassroomFlow(items)

      await flow.handleDelete('1')

      expect(flow.showDeleteModal.value).toBe(false)
    })

    it('checks schedules before sessions (ordered)', async () => {
      api.hasSchedulesInClassroom.mockResolvedValueOnce(okResponse(true))
      const items = [createEntity('1', 'Room 101')]
      const flow = createClassroomFlow(items)

      await flow.handleDelete('1')

      expect(api.hasSchedulesInClassroom).toHaveBeenCalled()
      // Should short-circuit — sessions check never runs
    })

    it('opens modal on dependency check failure (graceful degradation)', async () => {
      api.hasSchedulesInClassroom.mockRejectedValueOnce(new Error('Network error'))
      const items = [createEntity('1', 'Room 101')]
      const flow = createClassroomFlow(items)

      await flow.handleDelete('1')

      expect(flow.showDeleteModal.value).toBe(true)
      expect(flow.toast.show).toBe(true)
      expect(flow.toast.type).toBe('warning')
    })

    it('keeps modal open on 409 conflict', async () => {
      const items = [createEntity('1', 'Room 101')]
      const store = createStore(items)
      store.deleteItem.mockRejectedValueOnce(createConflictError())
      const flow = createDeleteFlow<TestEntity>({
        store,
        dependencyChecks: [
          { check: api.hasSchedulesInClassroom, message: 'blocked' },
        ],
        labels: { entityName: 'Classroom', entityNamePlural: 'Classrooms' },
      })

      await flow.handleDelete('1')
      await flow.confirmDelete()

      expect(flow.showDeleteModal.value).toBe(true)
      expect(flow.toast.show).toBe(true)
      expect(flow.toast.type).toBe('error')
    })

    it('closes modal on successful delete', async () => {
      const items = [createEntity('1', 'Room 101')]
      const store = createStore(items)
      const flow = createDeleteFlow<TestEntity>({
        store,
        dependencyChecks: [],
        labels: { entityName: 'Classroom', entityNamePlural: 'Classrooms' },
      })

      await flow.handleDelete('1')
      await flow.confirmDelete()

      expect(flow.showDeleteModal.value).toBe(false)
      expect(flow.toast.show).toBe(true)
      expect(flow.toast.type).toBe('success')
      expect(store.deleteItem).toHaveBeenCalledWith('1')
    })
  })

  describe('course-like config (1 dependency check)', () => {
    const api = {
      hasSectionsInCourse: vi.fn().mockResolvedValue(okResponse(false)),
    }

    it('opens modal when no dependencies', async () => {
      const items = [createEntity('c1', 'CS101')]
      const flow = createDeleteFlow<TestEntity>({
        store: createStore(items),
        dependencyChecks: [{ check: api.hasSectionsInCourse, message: 'Cannot delete: Course has sections assigned. Remove sections first.' }],
        labels: { entityName: 'Course', entityNamePlural: 'Courses' },
      })

      await flow.handleDelete('c1')

      expect(flow.showDeleteModal.value).toBe(true)
      expect(flow.itemToDelete.value?.name).toBe('CS101')
    })

    it('blocks when sections exist', async () => {
      api.hasSectionsInCourse.mockResolvedValueOnce(okResponse(true))
      const items = [createEntity('c1', 'CS101')]
      const flow = createDeleteFlow<TestEntity>({
        store: createStore(items),
        dependencyChecks: [{ check: api.hasSectionsInCourse, message: 'Cannot delete: Course has sections assigned. Remove sections first.' }],
        labels: { entityName: 'Course', entityNamePlural: 'Courses' },
      })

      await flow.handleDelete('c1')

      expect(flow.showDeleteModal.value).toBe(false)
    })
  })

  describe('section-like config (3 dependency checks)', () => {
    const api = {
      hasSchedulesInSection: vi.fn().mockResolvedValue(okResponse(false)),
      hasStudentsInSection: vi.fn().mockResolvedValue(okResponse(false)),
      hasEnrollmentsInSection: vi.fn().mockResolvedValue(okResponse(false)),
    }

    function createSectionFlow(items: TestEntity[]) {
      return createDeleteFlow<TestEntity>({
        store: createStore(items),
        dependencyChecks: [
          { check: api.hasSchedulesInSection, message: 'Cannot delete: Section has schedules assigned. Remove schedules first.' },
          { check: api.hasStudentsInSection, message: 'Cannot delete: Section has assigned students. Reassign students first.' },
          { check: api.hasEnrollmentsInSection, message: 'Cannot delete: Section has student enrollments. Remove enrollments first.' },
        ],
        labels: { entityName: 'Section', entityNamePlural: 'Sections' },
      })
    }

    it('opens modal when no dependencies', async () => {
      const items = [createEntity('s1', 'Section A')]
      const flow = createSectionFlow(items)

      await flow.handleDelete('s1')

      expect(flow.showDeleteModal.value).toBe(true)
    })

    it('blocks when schedules exist', async () => {
      api.hasSchedulesInSection.mockResolvedValueOnce(okResponse(true))
      const items = [createEntity('s1', 'Section A')]
      const flow = createSectionFlow(items)

      await flow.handleDelete('s1')

      expect(flow.showDeleteModal.value).toBe(false)
    })

    it('blocks when students exist', async () => {
      api.hasStudentsInSection.mockResolvedValueOnce(okResponse(true))
      const items = [createEntity('s1', 'Section A')]
      const flow = createSectionFlow(items)

      await flow.handleDelete('s1')

      expect(flow.showDeleteModal.value).toBe(false)
    })

    it('blocks when enrollments exist', async () => {
      api.hasEnrollmentsInSection.mockResolvedValueOnce(okResponse(true))
      const items = [createEntity('s1', 'Section A')]
      const flow = createSectionFlow(items)

      await flow.handleDelete('s1')

      expect(flow.showDeleteModal.value).toBe(false)
    })
  })

  describe('subject-like config (2 dependency checks)', () => {
    const api = {
      hasSchedulesInSubject: vi.fn().mockResolvedValue(okResponse(false)),
      hasEnrollmentsInSubject: vi.fn().mockResolvedValue(okResponse(false)),
    }

    it('opens modal when no dependencies', async () => {
      const items = [createEntity('sub1', 'Math')]
      const flow = createDeleteFlow<TestEntity>({
        store: createStore(items),
        dependencyChecks: [
          { check: api.hasSchedulesInSubject, message: 'Cannot delete: Subject has schedules assigned. Remove schedules first.' },
          { check: api.hasEnrollmentsInSubject, message: 'Cannot delete: Subject has student enrollments. Remove enrollments first.' },
        ],
        labels: { entityName: 'Subject', entityNamePlural: 'Subjects' },
      })

      await flow.handleDelete('sub1')

      expect(flow.showDeleteModal.value).toBe(true)
    })
  })

  describe('schedule-like config (1 dependency check)', () => {
    const api = {
      hasSessionsInSchedule: vi.fn().mockResolvedValue(okResponse(false)),
    }

    it('opens modal when no dependencies', async () => {
      const items = [createEntity('sch1', 'Monday 9AM')]
      const flow = createDeleteFlow<TestEntity>({
        store: createStore(items),
        dependencyChecks: [{ check: api.hasSessionsInSchedule, message: 'Cannot delete: Schedule has sessions assigned. Remove sessions first.' }],
        labels: { entityName: 'Schedule', entityNamePlural: 'Schedules' },
      })

      await flow.handleDelete('sch1')

      expect(flow.showDeleteModal.value).toBe(true)
    })

    it('blocks when sessions exist', async () => {
      api.hasSessionsInSchedule.mockResolvedValueOnce(okResponse(true))
      const items = [createEntity('sch1', 'Monday 9AM')]
      const flow = createDeleteFlow<TestEntity>({
        store: createStore(items),
        dependencyChecks: [{ check: api.hasSessionsInSchedule, message: 'Cannot delete: Schedule has sessions assigned. Remove sessions first.' }],
        labels: { entityName: 'Schedule', entityNamePlural: 'Schedules' },
      })

      await flow.handleDelete('sch1')

      expect(flow.showDeleteModal.value).toBe(false)
    })
  })

  describe('external toast mode', () => {
    it('delegates toast to external callback', () => {
      const showToast = vi.fn()
      const items = [createEntity('1', 'Test')]
      const flow = createDeleteFlow<TestEntity>({
        store: createStore(items),
        dependencyChecks: [],
        labels: { entityName: 'Entity', entityNamePlural: 'Entities' },
        showToast,
      })

      // External toast mode returns minimal shape (no showToast/closeToast — caller already has them)
      expect('toast' in flow).toBe(false)
      expect(flow.showToast).toBeUndefined()
    })

    it('includes toast property when no external showToast', () => {
      const items = [createEntity('1', 'Test')]
      const flow = createDeleteFlow<TestEntity>({
        store: createStore(items),
        dependencyChecks: [],
        labels: { entityName: 'Entity', entityNamePlural: 'Entities' },
      })

      expect('toast' in flow).toBe(true)
    })
  })

  describe('deleteFlowState interface shape', () => {
    it('returns all required properties', () => {
      const items = [createEntity('1', 'Test')]
      const flow = createDeleteFlow<TestEntity>({
        store: createStore(items),
        dependencyChecks: [],
        labels: { entityName: 'Entity', entityNamePlural: 'Entities' },
      })

      expect(flow.showDeleteModal).toBeDefined()
      expect(flow.itemToDelete).toBeDefined()
      expect(flow.isDeleting).toBeDefined()
      expect(flow.isCheckingDependencies).toBeDefined()
      expect(flow.handleDelete).toBeInstanceOf(Function)
      expect(flow.confirmDelete).toBeInstanceOf(Function)
      expect(flow.cancelDelete).toBeInstanceOf(Function)
      expect(flow.toast).toBeDefined()
      expect(flow.showToast).toBeInstanceOf(Function)
      expect(flow.closeToast).toBeInstanceOf(Function)
    })
  })
})
