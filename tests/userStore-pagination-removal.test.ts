import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { useUserStore } from '@/stores/userStore'

describe('userStore pagination removal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('should NOT export pagination state', () => {
    it.each([
      'currentPage',
      'itemsPerPage',
      'totalItems',
      'paginatedUsers',
      'totalPages',
      'hasNextPage',
      'hasPreviousPage',
    ])('should not have property %s', (property) => {
      const store = useUserStore()
      expect(store).not.toHaveProperty(property)
    })
  })

  describe('should NOT export pagination actions', () => {
    it.each([
      'setCurrentPage',
      'setItemsPerPage',
      'nextPage',
      'previousPage',
      'goToPage',
    ])('should not have method %s', (method) => {
      const store = useUserStore()
      expect(store).not.toHaveProperty(method)
    })
  })

  describe('should still export core CRUD state', () => {
    it.each([
      'users',
      'loading',
      'error',
      'fetchError',
    ])('should have property %s', (property) => {
      const store = useUserStore()
      expect(store).toHaveProperty(property)
    })
  })

  describe('should still export computed getters', () => {
    it.each([
      'getUsers',
      'instructors',
      'students',
      'filteredUsers',
    ])('should have property %s', (property) => {
      const store = useUserStore()
      expect(store).toHaveProperty(property)
    })
  })

  describe('should still export CRUD actions', () => {
    it.each([
      'fetchUsers',
      'createUser',
      'updateUser',
      'softDeleteUser',
      'hardDeleteUser',
      'restoreUser',
    ])('should have method %s', (method) => {
      const store = useUserStore()
      expect(typeof store[method as keyof typeof store]).toBe('function')
    })
  })
})
