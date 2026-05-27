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
