import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { CrudApi } from '@/stores/createCrudStore'
import type { EntityId } from '@/types'

import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createCrudStore } from '@/stores/createCrudStore'

// --- Helpers ---

function createAxiosResponse<T>(data: T): AxiosResponse<T> {
  return { data, status: 200, statusText: 'OK', headers: {}, config: {} as InternalAxiosRequestConfig }
}

interface TestDto {
  id: EntityId
  name?: string | null
  [key: string]: unknown
}

interface TestPayload {
  name: string
}

function createMockApi(): CrudApi<TestDto, TestPayload> {
  return {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }
}

// --- Tests ---

describe('createCrudStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ------------------------------------------------------------------
  // 1. Sort comparator safety
  // ------------------------------------------------------------------
  describe('sortedEntities', () => {
    it('does not throw when DTOs have undefined name', async () => {
      const api = createMockApi()
      vi.mocked(api.getAll).mockResolvedValue(createAxiosResponse([
        { id: '1', name: undefined },
        { id: '2', name: 'Alice' },
      ]))

      const useStore = createCrudStore('sort-undef', 'item', api)
      const store = useStore()
      await store.fetchItems()

      expect(() => store.sortedItems).not.toThrow()
    })

    it('does not throw when DTOs have null name', async () => {
      const api = createMockApi()
      vi.mocked(api.getAll).mockResolvedValue(createAxiosResponse([
        { id: '1', name: null } as TestDto,
        { id: '2', name: 'Alice' },
      ]))

      const useStore = createCrudStore('sort-null', 'item', api)
      const store = useStore()
      await store.fetchItems()

      expect(() => store.sortedItems).not.toThrow()
    })

    it('sorts unnamed items after named items', async () => {
      const api = createMockApi()
      vi.mocked(api.getAll).mockResolvedValue(createAxiosResponse([
        { id: '1', name: 'Charlie' },
        { id: '2', name: null } as TestDto,
        { id: '3', name: 'Alice' },
        { id: '4' }, // name is undefined
      ]))

      const useStore = createCrudStore('sort-mixed', 'item', api)
      const store = useStore()
      await store.fetchItems()

      const sorted = store.sortedItems as TestDto[]
      const names = sorted.map(item => item.name)

      // Named items first, sorted alphabetically; unnamed last
      expect(names[0]).toBe('Alice')
      expect(names[1]).toBe('Charlie')
      expect(names[2] == null).toBe(true)
      expect(names[3] == null).toBe(true)
    })
  })

  // ------------------------------------------------------------------
  // 2. Custom sort key
  // ------------------------------------------------------------------
  describe('custom sort key', () => {
    it('uses custom sortKey when provided', async () => {
      const api = createMockApi()
      vi.mocked(api.getAll).mockResolvedValue(createAxiosResponse([
        { id: '1', title: 'Charlie' },
        { id: '2', title: 'Alice' },
        { id: '3', title: 'Bob' },
      ]))

      const useStore = createCrudStore('sortkey-basic', 'item', api, { sortKey: 'title' })
      const store = useStore()
      await store.fetchItems()

      const sorted = store.sortedItems as { id: string, title: string }[]
      expect(sorted.map(i => i.title)).toEqual(['Alice', 'Bob', 'Charlie'])
    })

    it('sorts by custom key with null/undefined values last', async () => {
      const api = createMockApi()
      vi.mocked(api.getAll).mockResolvedValue(createAxiosResponse([
        { id: '1', title: 'Charlie' },
        { id: '2', title: null },
        { id: '3', title: 'Alice' },
        { id: '4' }, // title undefined
      ]))

      const useStore = createCrudStore('sortkey-null', 'item', api, { sortKey: 'title' })
      const store = useStore()
      await store.fetchItems()

      const sorted = store.sortedItems as { id: string, title?: string | null }[]
      expect(sorted[0].title).toBe('Alice')
      expect(sorted[1].title).toBe('Charlie')
      expect(sorted[2].title == null).toBe(true)
      expect(sorted[3].title == null).toBe(true)
    })

    it('falls back to name when sortKey not provided', async () => {
      const api = createMockApi()
      vi.mocked(api.getAll).mockResolvedValue(createAxiosResponse([
        { id: '1', name: 'Charlie' },
        { id: '2', name: 'Alice' },
        { id: '3', name: 'Bob' },
      ]))

      const useStore = createCrudStore('sortkey-default', 'item', api)
      const store = useStore()
      await store.fetchItems()

      const sorted = store.sortedItems as TestDto[]
      expect(sorted.map(i => i.name)).toEqual(['Alice', 'Bob', 'Charlie'])
    })

    it('works with nested sortKey like schedule.day', async () => {
      const api = createMockApi()
      vi.mocked(api.getAll).mockResolvedValue(createAxiosResponse([
        { id: '1', schedule: { day: 'Wednesday' } },
        { id: '2', schedule: { day: 'Monday' } },
        { id: '3', schedule: { day: 'Friday' } },
      ]))

      const useStore = createCrudStore('sortkey-nested', 'item', api, { sortKey: 'schedule.day' })
      const store = useStore()
      await store.fetchItems()

      const sorted = store.sortedItems as { id: string, schedule: { day: string } }[]
      expect(sorted.map(i => i.schedule.day)).toEqual(['Friday', 'Monday', 'Wednesday'])
    })

    it('handles boolean field values without throwing', async () => {
      const api = createMockApi()
      vi.mocked(api.getAll).mockResolvedValue(createAxiosResponse([
        { id: '1', name: 'A', isActive: true },
        { id: '2', name: 'B', isActive: false },
        { id: '3', name: 'C', isActive: true },
      ]))

      const useStore = createCrudStore('sortkey-bool', 'item', api, { sortKey: 'isActive' })
      const store = useStore()
      await store.fetchItems()

      expect(() => store.sortedItems).not.toThrow()
      const sorted = store.sortedItems as { id: string, name: string, isActive: boolean }[]
      // String(false) = "false", String(true) = "true" — "false" < "true"
      expect(sorted[0].isActive).toBe(false)
      expect(sorted[1].isActive).toBe(true)
      expect(sorted[2].isActive).toBe(true)
    })

    it('handles numeric field values without throwing', async () => {
      const api = createMockApi()
      vi.mocked(api.getAll).mockResolvedValue(createAxiosResponse([
        { id: '1', name: 'A', priority: 3 },
        { id: '2', name: 'B', priority: 1 },
        { id: '3', name: 'C', priority: 2 },
      ]))

      const useStore = createCrudStore('sortkey-num', 'item', api, { sortKey: 'priority' })
      const store = useStore()
      await store.fetchItems()

      expect(() => store.sortedItems).not.toThrow()
      const sorted = store.sortedItems as { id: string, name: string, priority: number }[]
      expect(sorted[0].priority).toBe(1)
      expect(sorted[1].priority).toBe(2)
      expect(sorted[2].priority).toBe(3)
    })

    it('sorts multi-digit numbers numerically, not lexicographically', async () => {
      const api = createMockApi()
      vi.mocked(api.getAll).mockResolvedValue(createAxiosResponse([
        { id: '1', name: 'A', priority: 10 },
        { id: '2', name: 'B', priority: 2 },
        { id: '3', name: 'C', priority: 1 },
        { id: '4', name: 'D', priority: 9 },
      ]))

      const useStore = createCrudStore('sortkey-num-multidigit', 'item', api, { sortKey: 'priority' })
      const store = useStore()
      await store.fetchItems()

      const sorted = store.sortedItems as { id: string, name: string, priority: number }[]
      // Numeric order: 1, 2, 9, 10 — NOT lexicographic (1, 10, 2, 9)
      expect(sorted.map(i => i.priority)).toEqual([1, 2, 9, 10])
    })

    it('sorts negative numbers numerically', async () => {
      const api = createMockApi()
      vi.mocked(api.getAll).mockResolvedValue(createAxiosResponse([
        { id: '1', name: 'A', priority: '-1' },
        { id: '2', name: 'B', priority: '3' },
        { id: '3', name: 'C', priority: '-5' },
        { id: '4', name: 'D', priority: '0' },
      ]))

      const useStore = createCrudStore('sortkey-num-negative', 'item', api, { sortKey: 'priority' })
      const store = useStore()
      await store.fetchItems()

      const sorted = store.sortedItems as { id: string, name: string, priority: string }[]
      expect(sorted.map(i => i.priority)).toEqual(['-5', '-1', '0', '3'])
    })

    it('sorts decimal numbers numerically', async () => {
      const api = createMockApi()
      vi.mocked(api.getAll).mockResolvedValue(createAxiosResponse([
        { id: '1', name: 'A', priority: '1.5' },
        { id: '2', name: 'B', priority: '0.1' },
        { id: '3', name: 'C', priority: '2.9' },
        { id: '4', name: 'D', priority: '1.0' },
      ]))

      const useStore = createCrudStore('sortkey-num-decimal', 'item', api, { sortKey: 'priority' })
      const store = useStore()
      await store.fetchItems()

      const sorted = store.sortedItems as { id: string, name: string, priority: string }[]
      expect(sorted.map(i => i.priority)).toEqual(['0.1', '1.0', '1.5', '2.9'])
    })

    it('sorts mixed negative and decimal numbers numerically', async () => {
      const api = createMockApi()
      vi.mocked(api.getAll).mockResolvedValue(createAxiosResponse([
        { id: '1', name: 'A', priority: '-2.5' },
        { id: '2', name: 'B', priority: '0' },
        { id: '3', name: 'C', priority: '3.14' },
        { id: '4', name: 'D', priority: '-1' },
      ]))

      const useStore = createCrudStore('sortkey-num-mixed', 'item', api, { sortKey: 'priority' })
      const store = useStore()
      await store.fetchItems()

      const sorted = store.sortedItems as { id: string, name: string, priority: string }[]
      expect(sorted.map(i => i.priority)).toEqual(['-2.5', '-1', '0', '3.14'])
    })

    it('handles NaN values in numeric sort', async () => {
      const api = createMockApi()
      vi.mocked(api.getAll).mockResolvedValue(createAxiosResponse([
        { id: '1', name: 'A', priority: 1 },
        { id: '2', name: 'B', priority: Number.NaN },
        { id: '3', name: 'C', priority: 3 },
        { id: '4', name: 'D', priority: 2 },
      ]))

      const useStore = createCrudStore('sortkey-nan', 'item', api, { sortKey: 'priority' })
      const store = useStore()
      await store.fetchItems()

      const sorted = store.sortedItems as { id: string, name: string, priority: number }[]
      // NaN sorts last
      expect(sorted[sorted.length - 1].name).toBe('B')
      expect(sorted.slice(0, -1).map(i => i.priority)).toEqual([1, 2, 3])
    })

    it('handles mixed numeric and non-numeric strings', async () => {
      const api = createMockApi()
      vi.mocked(api.getAll).mockResolvedValue(createAxiosResponse([
        { id: '1', name: 'A', value: '42' },
        { id: '2', name: 'B', value: 'hello' },
        { id: '3', name: 'C', value: '10' },
        { id: '4', name: 'D', value: 'world' },
      ]))

      const useStore = createCrudStore('sortkey-mixed-strings', 'item', api, { sortKey: 'value' })
      const store = useStore()
      await store.fetchItems()

      const sorted = store.sortedItems as { id: string, name: string, value: string }[]
      // Numeric strings sort numerically, non-numeric sort lexicographically
      // Mixed: both fall to string comparison
      expect(sorted.map(i => i.value)).toEqual(['10', '42', 'hello', 'world'])
    })

    it('blocks prototype pollution in sortKey path', async () => {
      const api = createMockApi()
      vi.mocked(api.getAll).mockResolvedValue(createAxiosResponse([
        { id: '1', name: 'A', data: { __proto__: { polluted: 'yes' } } },
        { id: '2', name: 'B', data: { value: 'safe' } },
      ]))

      const useStore = createCrudStore('sortkey-proto', 'item', api, { sortKey: 'data.__proto__.polluted' })
      const store = useStore()
      await store.fetchItems()

      // Should not crash, should treat __proto__ as undefined
      const sorted = store.sortedItems
      expect(sorted).toHaveLength(2)
    })

    it('handles mixed types (string, boolean, number) for same sortKey', async () => {
      const api = createMockApi()
      vi.mocked(api.getAll).mockResolvedValue(createAxiosResponse([
        { id: '1', name: 'A', value: 'hello' },
        { id: '2', name: 'B', value: true },
        { id: '3', name: 'C', value: 42 },
        { id: '4', name: 'D' }, // value undefined
      ]))

      const useStore = createCrudStore('sortkey-mixed', 'item', api, { sortKey: 'value' })
      const store = useStore()
      await store.fetchItems()

      expect(() => store.sortedItems).not.toThrow()
    })
  })

  // ------------------------------------------------------------------
  // 2. Explicit plural parameter
  // ------------------------------------------------------------------
  describe('explicit plural parameter', () => {
    it('accepts a 4th parameter for explicit plural form', () => {
      const api = createMockApi()
      const useStore = createCrudStore('plural-keys', 'category', api, { plural: 'categories' })
      const store = useStore()

      // Dynamic keys should use the explicit plural, not naive 'categorys'
      expect(store).toHaveProperty('categories')
      expect(store).toHaveProperty('currentCategory')
      expect(store).toHaveProperty('sortedCategories')
      expect(store).toHaveProperty('hasCategories')
      expect(store).toHaveProperty('fetchCategories')
      expect(store).toHaveProperty('fetchCategory')
      expect(store).toHaveProperty('createCategory')
      expect(store).toHaveProperty('updateCategory')
      expect(store).toHaveProperty('deleteCategory')
    })

    it('uses explicit plural in fetch error messages', async () => {
      const api = createMockApi()
      // Throw null so getErrorMessage returns the fallback string
      vi.mocked(api.getAll).mockRejectedValue(null)
      vi.spyOn(console, 'error').mockImplementation(() => {})

      const useStore = createCrudStore('plural-err', 'category', api, { plural: 'categories' })
      const store = useStore()

      await store.fetchCategories()

      expect(store.error).toBe('Failed to fetch categories')
    })

    it('uses explicit plural in console.error logs', async () => {
      const api = createMockApi()
      vi.mocked(api.getAll).mockRejectedValue(new Error('network'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const useStore = createCrudStore('plural-log', 'category', api, { plural: 'categories' })
      const store = useStore()

      await store.fetchCategories()

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching categories:',
        expect.any(Error),
      )
    })
  })

  // ------------------------------------------------------------------
  // 3. Backward compatibility / existing behavior
  // ------------------------------------------------------------------
  describe('backward compatibility', () => {
    it('falls back to appending "s" when no explicit plural', () => {
      const api = createMockApi()
      const useStore = createCrudStore('compat', 'item', api)
      const store = useStore()

      expect(store).toHaveProperty('items')
      expect(store).toHaveProperty('currentItem')
      expect(store).toHaveProperty('sortedItems')
      expect(store).toHaveProperty('hasItems')
      expect(store).toHaveProperty('fetchItems')
      expect(store).toHaveProperty('fetchItem')
      expect(store).toHaveProperty('createItem')
      expect(store).toHaveProperty('updateItem')
      expect(store).toHaveProperty('deleteItem')
    })

    it('performs full CRUD lifecycle', async () => {
      const api = createMockApi()
      const item1: TestDto = { id: '1', name: 'Alpha' }
      const item2: TestDto = { id: '2', name: 'Beta' }
      const updated: TestDto = { id: '1', name: 'Alpha Updated' }

      vi.mocked(api.getAll).mockResolvedValue(createAxiosResponse([item1]))
      vi.mocked(api.create).mockResolvedValue(createAxiosResponse(item2))
      vi.mocked(api.update).mockResolvedValue(createAxiosResponse(updated))
      vi.mocked(api.delete).mockResolvedValue(createAxiosResponse(undefined as unknown))

      const useStore = createCrudStore('crud-lifecycle', 'item', api)
      const store = useStore()

      // Fetch all
      await store.fetchItems()
      expect(store.items).toHaveLength(1)
      expect(store.items[0]).toEqual(item1)

      // Create
      const created = await store.createItem({ name: 'Beta' })
      expect(created).toEqual(item2)
      expect(store.items).toHaveLength(2)

      // Update
      const result = await store.updateItem('1', { name: 'Alpha Updated' })
      expect(result).toEqual(updated)
      expect(store.items[0]).toEqual(updated)

      // Delete
      await store.deleteItem('1')
      expect(store.items).toHaveLength(1)
      expect(store.items[0]).toEqual(item2)
    })

    it('sets error and fetchError on fetchAll failure', async () => {
      const api = createMockApi()
      vi.mocked(api.getAll).mockRejectedValue(null)
      vi.spyOn(console, 'error').mockImplementation(() => {})

      const useStore = createCrudStore('err-fetch', 'item', api)
      const store = useStore()

      await store.fetchItems()

      expect(store.error).toBe('Failed to fetch items')
      expect(store.fetchError).toBe('Failed to fetch items')
    })

    it('sets error on createEntity failure and rethrows', async () => {
      const api = createMockApi()
      vi.mocked(api.create).mockRejectedValue(null)
      vi.spyOn(console, 'error').mockImplementation(() => {})

      const useStore = createCrudStore('err-create', 'item', api)
      const store = useStore()

      await expect(store.createItem({ name: 'x' })).rejects.toBeNull()
      expect(store.error).toBe('Failed to create item')
    })

    it('sets error on deleteEntity failure and rethrows', async () => {
      const api = createMockApi()
      vi.mocked(api.delete).mockRejectedValue(null)
      vi.spyOn(console, 'error').mockImplementation(() => {})

      const useStore = createCrudStore('err-delete', 'item', api)
      const store = useStore()

      await expect(store.deleteItem('1')).rejects.toBeNull()
      expect(store.error).toBe('Failed to delete item')
    })
  })
})
