import type { SubjectDto, SubjectPayload } from '@/api/subjects'
import type { EntityId } from '@/types'

import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import subjectApi from '@/api/subjects'
import { useSubjectStore } from '@/stores/subjectStore'
import { getErrorMessage, getValidationErrorMessages } from '@/utils/httpError'

vi.mock('@/api/subjects')
vi.mock('@/utils/httpError')
import { toSubject } from '@/api/subjects'
vi.mocked(toSubject).mockImplementation(((dto: any) => ({ ...dto })) as any)
vi.mock('@/utils/httpError')

// Helper factory
function createSubject(overrides: Partial<SubjectDto> = {}): SubjectDto {
  return {
    id: '1' as EntityId,
    name: 'Subject 1',
    ...overrides,
  }
}

describe('subjectStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  describe('state and getters', () => {
    it('hasSubjects returns false when empty', () => {
      const store = useSubjectStore()
      store.subjects = []
      expect(store.hasSubjects).toBe(false)
    })

    it('hasSubjects returns true when subjects exist', () => {
      const store = useSubjectStore()
      store.subjects = [createSubject()]
      expect(store.hasSubjects).toBe(true)
    })

    it('sortedSubjects returns subjects sorted by name', () => {
      const store = useSubjectStore()
      store.subjects = [
        createSubject({ id: '2' as EntityId, name: 'Zulu' }),
        createSubject({ id: '1' as EntityId, name: 'Alpha' }),
        createSubject({ id: '3' as EntityId, name: 'Bravo' }),
      ]
      expect(store.sortedSubjects.map(s => s.name)).toEqual(['Alpha', 'Bravo', 'Zulu'])
    })

    it('sortedSubjects returns empty array when subjects is empty', () => {
      const store = useSubjectStore()
      store.subjects = []
      expect(store.sortedSubjects).toEqual([])
    })

    it('sortedSubjects handles missing names with (name || "")', () => {
      const store = useSubjectStore()
      store.subjects = [
        createSubject({ id: '1' as EntityId, name: undefined }),
        createSubject({ id: '2' as EntityId, name: 'Beta' }),
      ]
      const sorted = store.sortedSubjects
      expect(sorted[0].name).toBe('Beta')
      expect(sorted[1].name).toBeUndefined()
    })
  })

  describe('actions — success paths', () => {
    it('fetchSubjects clears error, populates subjects, and resets loading', async () => {
      const mockSubjects = [createSubject(), createSubject({ id: '2' as EntityId })]
      vi.mocked(subjectApi.getAllSubjects).mockResolvedValue({ data: mockSubjects } as never)

      const store = useSubjectStore()
      store.error = 'previous error'

      await store.fetchSubjects()

      expect(store.error).toBe('')
      expect(store.subjects).toEqual(mockSubjects)
      expect(store.loading).toBe(false)
    })

    it('fetchSubject clears error, sets currentSubject, and resets loading', async () => {
      const subject = createSubject({ id: '99' as EntityId })
      vi.mocked(subjectApi.getSubjectById).mockResolvedValue({ data: subject } as never)

      const store = useSubjectStore()
      store.error = 'previous error'

      await store.fetchSubject('99' as EntityId)

      expect(store.error).toBe('')
      expect(store.currentSubject).toEqual(subject)
      expect(store.loading).toBe(false)
    })

    it('createSubject clears error, appends subject to subjects, and returns created subject', async () => {
      const newSubject = createSubject({ id: '2' as EntityId, name: 'New Subject' })
      vi.mocked(subjectApi.createSubject).mockResolvedValue({ data: newSubject } as never)

      const store = useSubjectStore()
      store.subjects = [createSubject()]
      store.error = 'previous error'

      const payload = { name: 'New Subject' } as SubjectPayload
      const result = await store.createSubject(payload)

      expect(store.error).toBe('')
      expect(store.subjects).toHaveLength(2)
      expect(store.subjects[1]).toEqual(newSubject)
      expect(result).toEqual(newSubject)
    })

    it('updateSubject clears error, updates matching subject in local state, and returns updated subject', async () => {
      const existingSubject = createSubject({ id: '1' as EntityId, name: 'Old Name' })
      const updatedSubject = createSubject({ id: '1' as EntityId, name: 'Updated Name' })
      vi.mocked(subjectApi.updateSubject).mockResolvedValue({ data: updatedSubject } as never)

      const store = useSubjectStore()
      store.subjects = [existingSubject]
      store.error = 'previous error'

      const payload = { name: 'Updated Name' } as SubjectPayload
      const result = await store.updateSubject('1' as EntityId, payload)

      expect(store.error).toBe('')
      expect(store.subjects[0]).toEqual(updatedSubject)
      expect(result).toEqual(updatedSubject)
    })

    it('deleteSubject clears error and removes matching subject from local state', async () => {
      vi.mocked(subjectApi.deleteSubject).mockResolvedValue({} as never)

      const store = useSubjectStore()
      store.subjects = [createSubject({ id: '1' as EntityId }), createSubject({ id: '2' as EntityId })]
      store.error = 'previous error'

      await store.deleteSubject('1' as EntityId)

      expect(store.error).toBe('')
      expect(store.subjects).toHaveLength(1)
      expect(store.subjects[0].id).toBe('2' as EntityId)
    })
  })

  describe('actions — error paths', () => {
    it('fetchSubjects sets error using getErrorMessage, does not rethrow, and resets loading', async () => {
      const testError = new Error('Network error')
      vi.mocked(subjectApi.getAllSubjects).mockRejectedValue(testError)
      vi.mocked(getErrorMessage).mockReturnValue('Failed to fetch subjects: Network error')

      const store = useSubjectStore()

      await store.fetchSubjects()

      expect(getErrorMessage).toHaveBeenCalledWith(testError, 'Failed to fetch subjects')
      expect(store.error).toBe('Failed to fetch subjects: Network error')
      expect(store.loading).toBe(false)
    })

    it('fetchSubject sets error using getErrorMessage, does not rethrow, leaves currentSubject unchanged', async () => {
      const testError = new Error('Not found')
      vi.mocked(subjectApi.getSubjectById).mockRejectedValue(testError)
      vi.mocked(getErrorMessage).mockReturnValue('Subject with ID 99 not found')

      const store = useSubjectStore()
      store.currentSubject = createSubject({ id: '1' as EntityId })

      await store.fetchSubject('99' as EntityId)

      expect(getErrorMessage).toHaveBeenCalledWith(testError, 'Subject with ID 99 not found')
      expect(store.error).toBe('Subject with ID 99 not found')
      expect(store.loading).toBe(false)
      expect(store.currentSubject).toEqual(createSubject({ id: '1' as EntityId }))
    })

    it('createSubject sets fallback error from getErrorMessage, overrides with joined validation messages when present, does not mutate subjects, and rethrows error', async () => {
      const testError = new Error('Validation failed')
      vi.mocked(subjectApi.createSubject).mockRejectedValue(testError)
      vi.mocked(getErrorMessage).mockReturnValue('Failed to create subject')
      vi.mocked(getValidationErrorMessages).mockReturnValue(['Name is required', 'Code is required'])

      const store = useSubjectStore()
      store.subjects = [createSubject()]

      await expect(store.createSubject({ name: 'New' } as SubjectPayload)).rejects.toThrow(testError)

      expect(getErrorMessage).toHaveBeenCalledWith(testError, 'Failed to create subject')
      expect(getValidationErrorMessages).toHaveBeenCalledWith(testError)
      expect(store.error).toBe('Name is required, Code is required')
      expect(store.subjects).toHaveLength(1)
    })

    it('createSubject uses fallback error when no validation errors present', async () => {
      const testError = new Error('Server error')
      vi.mocked(subjectApi.createSubject).mockRejectedValue(testError)
      vi.mocked(getErrorMessage).mockReturnValue('Failed to create subject: Server error')
      vi.mocked(getValidationErrorMessages).mockReturnValue([])

      const store = useSubjectStore()

      await expect(store.createSubject({ name: 'New' } as SubjectPayload)).rejects.toThrow(testError)

      expect(store.error).toBe('Failed to create subject: Server error')
    })

    it('updateSubject sets fallback error from getErrorMessage, overrides with joined validation messages when present, does not incorrectly mutate local state, and rethrows error', async () => {
      const testError = new Error('Validation failed')
      vi.mocked(subjectApi.updateSubject).mockRejectedValue(testError)
      vi.mocked(getErrorMessage).mockReturnValue('Failed to update subject')
      vi.mocked(getValidationErrorMessages).mockReturnValue(['Name is invalid'])

      const store = useSubjectStore()
      const originalSubject = createSubject({ id: '1' as EntityId, name: 'Original' })
      store.subjects = [originalSubject]

      await expect(store.updateSubject('1' as EntityId, { name: 'Updated' } as SubjectPayload)).rejects.toThrow(testError)

      expect(getErrorMessage).toHaveBeenCalledWith(testError, 'Failed to update subject')
      expect(getValidationErrorMessages).toHaveBeenCalledWith(testError)
      expect(store.error).toBe('Name is invalid')
      expect(store.subjects[0]).toEqual(originalSubject)
    })

    it('deleteSubject sets error using getErrorMessage, does not remove subject, and rethrows error', async () => {
      const testError = new Error('Delete failed')
      vi.mocked(subjectApi.deleteSubject).mockRejectedValue(testError)
      vi.mocked(getErrorMessage).mockReturnValue('Failed to delete subject: Delete failed')

      const store = useSubjectStore()
      store.subjects = [createSubject({ id: '1' as EntityId }), createSubject({ id: '2' as EntityId })]

      await expect(store.deleteSubject('1' as EntityId)).rejects.toThrow(testError)

      expect(getErrorMessage).toHaveBeenCalledWith(testError, 'Failed to delete subject')
      expect(store.error).toBe('Failed to delete subject: Delete failed')
      expect(store.subjects).toHaveLength(2)
    })
  })

  describe('edge cases', () => {
    it('updateSubject with ID not present in local state returns API response and leaves subjects unchanged', async () => {
      const updatedSubject = createSubject({ id: '99' as EntityId, name: 'Updated' })
      vi.mocked(subjectApi.updateSubject).mockResolvedValue({ data: updatedSubject } as never)

      const store = useSubjectStore()
      const originalSubjects = [createSubject({ id: '1' as EntityId })]
      store.subjects = [...originalSubjects]

      const result = await store.updateSubject('99' as EntityId, { name: 'Updated' } as SubjectPayload)

      expect(result).toEqual(updatedSubject)
      expect(store.subjects).toEqual(originalSubjects)
    })

    it('deleteSubject with ID not present in local state leaves subjects unchanged after successful API call', async () => {
      vi.mocked(subjectApi.deleteSubject).mockResolvedValue({} as never)

      const store = useSubjectStore()
      const originalSubjects = [createSubject({ id: '1' as EntityId })]
      store.subjects = [...originalSubjects]

      await store.deleteSubject('99' as EntityId)

      expect(store.subjects).toEqual(originalSubjects)
    })

    it('sortedSubjects with missing names sorts safely without throwing', () => {
      const store = useSubjectStore()
      store.subjects = [
        createSubject({ id: '1' as EntityId, name: undefined }),
        createSubject({ id: '2' as EntityId, name: null as never }),
        createSubject({ id: '3' as EntityId, name: 'Charlie' }),
      ]

      expect(() => store.sortedSubjects).not.toThrow()
      expect(store.sortedSubjects).toHaveLength(3)
    })
  })

  describe('entityId compatibility (Requirements 11.1, 11.4, 11.5, 11.8)', () => {
    it('updateSubject finds subject by number ID', async () => {
      const existingSubject = createSubject({ id: '1', name: 'Old Name' })
      const updatedSubject = createSubject({ id: '1', name: 'Updated Name' })
      vi.mocked(subjectApi.updateSubject).mockResolvedValue({ data: updatedSubject } as never)

      const store = useSubjectStore()
      store.subjects = [existingSubject]

      const result = await store.updateSubject('1', { name: 'Updated Name' } as SubjectPayload)

      expect(result).toEqual(updatedSubject)
      expect(store.subjects[0]).toEqual(updatedSubject)
    })

    it('updateSubject finds subject by string ID', async () => {
      const existingSubject = createSubject({ id: '550e8400-e29b-41d4-a716-446655440000' as EntityId, name: 'Old Name' })
      const updatedSubject = createSubject({ id: '550e8400-e29b-41d4-a716-446655440000' as EntityId, name: 'Updated Name' })
      vi.mocked(subjectApi.updateSubject).mockResolvedValue({ data: updatedSubject } as never)

      const store = useSubjectStore()
      store.subjects = [existingSubject]

      const result = await store.updateSubject('550e8400-e29b-41d4-a716-446655440000' as EntityId, { name: 'Updated Name' } as SubjectPayload)

      expect(result).toEqual(updatedSubject)
      expect(store.subjects[0]).toEqual(updatedSubject)
    })

    it('updateSubject finds subject with mixed ID types (store has number, search with string)', async () => {
      const existingSubject = createSubject({ id: '1', name: 'Old Name' })
      const updatedSubject = createSubject({ id: '1', name: 'Updated Name' })
      vi.mocked(subjectApi.updateSubject).mockResolvedValue({ data: updatedSubject } as never)

      const store = useSubjectStore()
      store.subjects = [existingSubject]

      const result = await store.updateSubject('1' as EntityId, { name: 'Updated Name' } as SubjectPayload)

      expect(result).toEqual(updatedSubject)
      expect(store.subjects[0]).toEqual(updatedSubject)
    })

    it('deleteSubject removes subject by number ID', async () => {
      vi.mocked(subjectApi.deleteSubject).mockResolvedValue({} as never)

      const store = useSubjectStore()
      store.subjects = [createSubject({ id: '1' }), createSubject({ id: '2' })]

      await store.deleteSubject('1')

      expect(store.subjects).toHaveLength(1)
      expect(store.subjects[0].id).toBe('2')
    })

    it('deleteSubject removes subject by string ID', async () => {
      vi.mocked(subjectApi.deleteSubject).mockResolvedValue({} as never)

      const store = useSubjectStore()
      store.subjects = [
        createSubject({ id: '550e8400-e29b-41d4-a716-446655440000' as EntityId }),
        createSubject({ id: '550e8400-e29b-41d4-a716-446655440001' as EntityId }),
      ]

      await store.deleteSubject('550e8400-e29b-41d4-a716-446655440000' as EntityId)

      expect(store.subjects).toHaveLength(1)
      expect(store.subjects[0].id).toBe('550e8400-e29b-41d4-a716-446655440001' as EntityId)
    })

    it('deleteSubject removes subject with mixed ID types (store has number, delete with string)', async () => {
      vi.mocked(subjectApi.deleteSubject).mockResolvedValue({} as never)

      const store = useSubjectStore()
      store.subjects = [createSubject({ id: '1' }), createSubject({ id: '2' })]

      await store.deleteSubject('1' as EntityId)

      expect(store.subjects).toHaveLength(1)
      expect(store.subjects[0].id).toBe('2')
    })
  })
})
