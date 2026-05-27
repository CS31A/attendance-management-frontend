import { describe, expect, it } from 'vitest'

import { useLocalPagination } from '@/composables/useLocalPagination'

describe('useLocalPagination integration', () => {
  describe('should provide all required pagination properties', () => {
    const requiredProperties = [
      'currentPage',
      'itemsPerPage',
      'totalPages',
      'hasNextPage',
      'hasPreviousPage',
      'paginatedItems',
    ] as const

    it.each(requiredProperties)('should provide %s', (property) => {
      const pagination = useLocalPagination({ items: [] })
      expect(pagination).toHaveProperty(property)
    })
  })

  describe('should provide all required pagination actions', () => {
    const requiredActions = [
      'nextPage',
      'previousPage',
      'goToPage',
      'setItemsPerPage',
      'resetToFirstPage',
    ] as const

    it.each(requiredActions)('should provide %s', (action) => {
      const pagination = useLocalPagination({ items: [] })
      expect(typeof pagination[action]).toBe('function')
    })
  })

  describe('should provide totalItems', () => {
    it('should have totalItems property', () => {
      const pagination = useLocalPagination({ items: [] })
      expect(pagination).toHaveProperty('totalItems')
    })
  })

  describe('should work with items array', () => {
    it('should calculate pagination from items', () => {
      const items = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }))
      const pagination = useLocalPagination({ items, itemsPerPage: 10 })

      expect(pagination.totalItems.value).toBe(25)
      expect(pagination.totalPages.value).toBe(3)
      expect(pagination.paginatedItems.value).toHaveLength(10)
      expect(pagination.hasNextPage.value).toBe(true)
      expect(pagination.hasPreviousPage.value).toBe(false)
    })
  })

  describe('should work with totalItems count', () => {
    it('should calculate pagination from totalItems', () => {
      const pagination = useLocalPagination({ totalItems: 50, itemsPerPage: 15 })

      expect(pagination.totalItems.value).toBe(50)
      expect(pagination.totalPages.value).toBe(4)
    })
  })
})
