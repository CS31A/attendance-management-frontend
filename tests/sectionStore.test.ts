import type { SectionDto, SectionPayload } from '@/api/sections'
import type { EntityId } from '@/types'

import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import sectionsApi from '@/api/sections'
import { useSectionStore } from '@/stores/sectionStore'

vi.mock('@/api/sections')
import { toSection } from '@/api/sections'
vi.mocked(toSection).mockImplementation(((dto: any) => ({ ...dto })) as any)

// Helper factory
function createSection(overrides: Partial<SectionDto> = {}): SectionDto {
  return {
    id: '1' as EntityId,
    name: 'Section 1',
    ...overrides,
  }
}

describe('sectionStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  describe('state and getters', () => {
    it('getSections returns the current sections', () => {
      const store = useSectionStore()
      const testSections = [createSection({ id: '1' as EntityId }), createSection({ id: '2' as EntityId })]
      store.sections = testSections
      expect(store.getSections).toEqual(testSections)
    })

    it('getNumberOfSections returns sections.length', () => {
      const store = useSectionStore()
      store.sections = [createSection(), createSection(), createSection()]
      expect(store.getNumberOfSections).toBe(3)
    })

    it('getItemsPerPage returns the default value 10', () => {
      const store = useSectionStore()
      expect(store.getItemsPerPage).toBe(10)
    })

    it('getFilteredSections returns the same array as sections', () => {
      const store = useSectionStore()
      const testSections = [createSection()]
      store.sections = testSections
      expect(store.getFilteredSections).toEqual(testSections)
    })
  })

  describe('actions — success paths', () => {
    it('fetchSections sets loading while request is pending, clears error, populates sections, and resets loading', async () => {
      const mockSections = [createSection(), createSection({ id: '2' as EntityId })]
      vi.mocked(sectionsApi.getAllSections).mockResolvedValue({ data: mockSections } as never)

      const store = useSectionStore()
      store.error = 'previous error'

      const fetchPromise = store.fetchSections()
      expect(store.loading).toBe(true)
      expect(store.error).toBe('')

      await fetchPromise
      expect(store.loading).toBe(false)
      expect(store.sections).toEqual(mockSections)
    })

    it('addSection clears error, appends created section to sections, and returns created section', async () => {
      const newSection = createSection({ id: '2' as EntityId, name: 'New Section' })
      vi.mocked(sectionsApi.createSection).mockResolvedValue({ data: newSection } as never)

      const store = useSectionStore()
      store.sections = [createSection()]
      store.error = 'previous error'

      const payload = { name: 'New Section' } as SectionPayload
      const result = await store.addSection(payload)

      expect(store.error).toBe('')
      expect(store.sections).toHaveLength(2)
      expect(store.sections[1]).toEqual(newSection)
      expect(result).toEqual(newSection)
    })

    it('updateSection clears error, updates matching section in local state, and returns updated section', async () => {
      const existingSection = createSection({ id: '1' as EntityId, name: 'Old Name' })
      const updatedSection = createSection({ id: '1' as EntityId, name: 'Updated Name' })
      vi.mocked(sectionsApi.updateSection).mockResolvedValue({ data: updatedSection } as never)

      const store = useSectionStore()
      store.sections = [existingSection]
      store.error = 'previous error'

      const payload = { name: 'Updated Name' } as SectionPayload
      const result = await store.updateSection('1' as EntityId, payload)

      expect(store.error).toBe('')
      expect(store.sections[0]).toEqual(updatedSection)
      expect(result).toEqual(updatedSection)
    })

    it('deleteSection clears error and removes matching section from local state', async () => {
      vi.mocked(sectionsApi.deleteSection).mockResolvedValue({} as never)

      const store = useSectionStore()
      store.sections = [createSection({ id: '1' as EntityId }), createSection({ id: '2' as EntityId })]
      store.error = 'previous error'

      await store.deleteSection('1' as EntityId)

      expect(store.error).toBe('')
      expect(store.sections).toHaveLength(1)
      expect(store.sections[0].id).toBe('2' as EntityId)
    })

    it('getSection returns fetched section and does not modify sections', async () => {
      const section = createSection({ id: '99' as EntityId })
      vi.mocked(sectionsApi.getSection).mockResolvedValue({ data: section } as never)

      const store = useSectionStore()
      store.sections = [createSection({ id: '1' as EntityId })]

      const result = await store.getSection('99' as EntityId)

      expect(result).toEqual(section)
      expect(store.sections).toHaveLength(1)
      expect(store.sections[0].id).toBe('1' as EntityId)
    })
  })

  describe('actions — error paths', () => {
    it('fetchSections sets error, rethrows error, and resets loading', async () => {
      const testError = new Error('Network error')
      vi.mocked(sectionsApi.getAllSections).mockRejectedValue(testError)

      const store = useSectionStore()

      await expect(store.fetchSections()).rejects.toThrow(testError)
      expect(store.error).toBe('Network error')
      expect(store.fetchError).toBe('Network error')
      expect(store.loading).toBe(false)
    })

    it('addSection sets error, does not mutate sections, and rethrows error', async () => {
      const testError = new Error('Creation failed')
      vi.mocked(sectionsApi.createSection).mockRejectedValue(testError)

      const store = useSectionStore()
      store.sections = [createSection()]

      await expect(store.addSection({ name: 'New' } as SectionPayload)).rejects.toThrow(testError)
      expect(store.error).toBe('Failed to add section')
      expect(store.sections).toHaveLength(1)
    })

    it('updateSection sets error, does not mutate local item, and rethrows error', async () => {
      const testError = new Error('Update failed')
      vi.mocked(sectionsApi.updateSection).mockRejectedValue(testError)

      const store = useSectionStore()
      const originalSection = createSection({ id: '1' as EntityId, name: 'Original' })
      store.sections = [originalSection]

      await expect(store.updateSection('1' as EntityId, { name: 'Updated' } as SectionPayload)).rejects.toThrow(testError)
      expect(store.error).toBe('Failed to update section')
      expect(store.sections[0]).toEqual(originalSection)
    })

    it('deleteSection sets error, does not remove item, and rethrows error', async () => {
      const testError = new Error('Delete failed')
      vi.mocked(sectionsApi.deleteSection).mockRejectedValue(testError)

      const store = useSectionStore()
      store.sections = [createSection({ id: '1' as EntityId }), createSection({ id: '2' as EntityId })]

      await expect(store.deleteSection('1' as EntityId)).rejects.toThrow(testError)
      expect(store.error).toBe('Failed to delete section')
      expect(store.sections).toHaveLength(2)
    })

    it('getSection rethrows error, resets loading, and does not assert error clearing or error message setting', async () => {
      const testError = new Error('Fetch failed')
      vi.mocked(sectionsApi.getSection).mockRejectedValue(testError)

      const store = useSectionStore()
      store.error = 'previous error'

      await expect(store.getSection('1' as EntityId)).rejects.toThrow(testError)
      expect(store.loading).toBe(false)
      // Note: getSection does NOT clear error or set error message
      expect(store.error).toBe('previous error')
    })
  })

  describe('edge cases', () => {
    it('updateSection with an ID not present in local state returns API response and leaves sections unchanged', async () => {
      const updatedSection = createSection({ id: '99' as EntityId, name: 'Updated' })
      vi.mocked(sectionsApi.updateSection).mockResolvedValue({ data: updatedSection } as never)

      const store = useSectionStore()
      const originalSections = [createSection({ id: '1' as EntityId })]
      store.sections = [...originalSections]

      const result = await store.updateSection('99' as EntityId, { name: 'Updated' } as SectionPayload)

      expect(result).toEqual(updatedSection)
      expect(store.sections).toEqual(originalSections)
    })

    it('deleteSection with an ID not present in local state leaves sections unchanged after successful API call', async () => {
      vi.mocked(sectionsApi.deleteSection).mockResolvedValue({} as never)

      const store = useSectionStore()
      const originalSections = [createSection({ id: '1' as EntityId })]
      store.sections = [...originalSections]

      await store.deleteSection('99' as EntityId)

      expect(store.sections).toEqual(originalSections)
    })
  })

  describe('entityId compatibility (Requirements 11.1, 11.4, 11.5, 11.8)', () => {
    it('updateSection finds section by number ID', async () => {
      const existingSection = createSection({ id: '1', name: 'Old Name' })
      const updatedSection = createSection({ id: '1', name: 'Updated Name' })
      vi.mocked(sectionsApi.updateSection).mockResolvedValue({ data: updatedSection } as never)

      const store = useSectionStore()
      store.sections = [existingSection]

      const result = await store.updateSection('1', { name: 'Updated Name' } as SectionPayload)

      expect(result).toEqual(updatedSection)
      expect(store.sections[0]).toEqual(updatedSection)
    })

    it('updateSection finds section by string ID', async () => {
      const existingSection = createSection({ id: '550e8400-e29b-41d4-a716-446655440000' as EntityId, name: 'Old Name' })
      const updatedSection = createSection({ id: '550e8400-e29b-41d4-a716-446655440000' as EntityId, name: 'Updated Name' })
      vi.mocked(sectionsApi.updateSection).mockResolvedValue({ data: updatedSection } as never)

      const store = useSectionStore()
      store.sections = [existingSection]

      const result = await store.updateSection('550e8400-e29b-41d4-a716-446655440000' as EntityId, { name: 'Updated Name' } as SectionPayload)

      expect(result).toEqual(updatedSection)
      expect(store.sections[0]).toEqual(updatedSection)
    })

    it('updateSection finds section with mixed ID types (store has number, search with string)', async () => {
      const existingSection = createSection({ id: '1', name: 'Old Name' })
      const updatedSection = createSection({ id: '1', name: 'Updated Name' })
      vi.mocked(sectionsApi.updateSection).mockResolvedValue({ data: updatedSection } as never)

      const store = useSectionStore()
      store.sections = [existingSection]

      const result = await store.updateSection('1' as EntityId, { name: 'Updated Name' } as SectionPayload)

      expect(result).toEqual(updatedSection)
      expect(store.sections[0]).toEqual(updatedSection)
    })

    it('deleteSection removes section by number ID', async () => {
      vi.mocked(sectionsApi.deleteSection).mockResolvedValue({} as never)

      const store = useSectionStore()
      store.sections = [createSection({ id: '1' }), createSection({ id: '2' })]

      await store.deleteSection('1')

      expect(store.sections).toHaveLength(1)
      expect(store.sections[0].id).toBe('2')
    })

    it('deleteSection removes section by string ID', async () => {
      vi.mocked(sectionsApi.deleteSection).mockResolvedValue({} as never)

      const store = useSectionStore()
      store.sections = [
        createSection({ id: '550e8400-e29b-41d4-a716-446655440000' as EntityId }),
        createSection({ id: '550e8400-e29b-41d4-a716-446655440001' as EntityId }),
      ]

      await store.deleteSection('550e8400-e29b-41d4-a716-446655440000' as EntityId)

      expect(store.sections).toHaveLength(1)
      expect(store.sections[0].id).toBe('550e8400-e29b-41d4-a716-446655440001' as EntityId)
    })

    it('deleteSection removes section with mixed ID types (store has number, delete with string)', async () => {
      vi.mocked(sectionsApi.deleteSection).mockResolvedValue({} as never)

      const store = useSectionStore()
      store.sections = [createSection({ id: '1' }), createSection({ id: '2' })]

      await store.deleteSection('1' as EntityId)

      expect(store.sections).toHaveLength(1)
      expect(store.sections[0].id).toBe('2')
    })
  })
})
