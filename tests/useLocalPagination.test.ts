import { describe, expect, it } from 'vitest'
import { computed, nextTick, ref } from 'vue'
import { useLocalPagination } from '@/composables/useLocalPagination'

/**
 * useLocalPagination supports two usage modes:
 *
 * 1. **Client-side pagination** (preferred for in-memory data):
 *    Pass only `items`. The composable auto-derives totalItems, totalPages,
 *    and paginatedItems from the array length and slice.
 *    Example: useLocalPagination({ items: myArray })
 *
 * 2. **Server-side pagination** (for large datasets):
 *    Pass only `totalItems` (and optionally `itemsPerPage`). The caller is
 *    responsible for fetching the correct page of data externally.
 *    paginatedItems will be an empty array in this mode.
 *    Example: useLocalPagination({ totalItems: ref(100) })
 *
 * Do NOT pass both `items` and `totalItems` — the composable prioritizes
 * items.length when items is provided, making totalItems redundant.
 */
describe('useLocalPagination', () => {
  describe('server-side mode (totalItems only)', () => {
    it('uses page 1 and default page size 10', () => {
      const totalItems = ref(100)
      const pagination = useLocalPagination({ totalItems })

      expect(pagination.currentPage.value).toBe(1)
      expect(pagination.itemsPerPage.value).toBe(10)
    })

    it('calculates totalPages correctly based on totalItems', () => {
      const totalItems = ref(95)
      const pagination = useLocalPagination({ totalItems })

      expect(pagination.totalPages.value).toBe(10)
    })
  })

  describe('custom itemsPerPage (server-side mode)', () => {
    it('respects custom page size', () => {
      const totalItems = ref(100)
      const pagination = useLocalPagination({ totalItems, itemsPerPage: 25 })

      expect(pagination.itemsPerPage.value).toBe(25)
      expect(pagination.totalPages.value).toBe(4)
    })

    it('handles larger page sizes', () => {
      const totalItems = ref(50)
      const pagination = useLocalPagination({ totalItems, itemsPerPage: 100 })

      expect(pagination.itemsPerPage.value).toBe(100)
      expect(pagination.totalPages.value).toBe(1)
    })
  })

  describe('computed pagination state', () => {
    it('hasNextPage reacts to changing totalItems', () => {
      const totalItems = ref(15)
      const pagination = useLocalPagination({ totalItems, itemsPerPage: 10 })

      expect(pagination.hasNextPage.value).toBe(true)

      totalItems.value = 10
      expect(pagination.hasNextPage.value).toBe(false)

      totalItems.value = 25
      expect(pagination.hasNextPage.value).toBe(true)
    })

    it('hasPreviousPage is false on page 1', () => {
      const totalItems = ref(100)
      const pagination = useLocalPagination({ totalItems })

      expect(pagination.hasPreviousPage.value).toBe(false)
    })

    it('hasPreviousPage becomes true after navigating forward', () => {
      const totalItems = ref(100)
      const pagination = useLocalPagination({ totalItems })

      pagination.nextPage()
      expect(pagination.hasPreviousPage.value).toBe(true)
    })

    it('totalPages reacts to totalItems changes', () => {
      const totalItems = ref(50)
      const pagination = useLocalPagination({ totalItems, itemsPerPage: 10 })

      expect(pagination.totalPages.value).toBe(5)

      totalItems.value = 55
      expect(pagination.totalPages.value).toBe(6)

      totalItems.value = 49
      expect(pagination.totalPages.value).toBe(5)
    })

    it('works with computed totalItems getter', () => {
      const items = ref(75)
      const totalItems = computed(() => items.value)
      const pagination = useLocalPagination({ totalItems, itemsPerPage: 20 })

      expect(pagination.totalPages.value).toBe(4)

      items.value = 60
      expect(pagination.totalPages.value).toBe(3)
    })
  })

  describe('client-side mode (items array)', () => {
    it('returns paginatedItems when an items array is provided', () => {
      const items = ref(Array.from({ length: 12 }, (_, index) => `item-${index + 1}`))
      const pagination = useLocalPagination({ items, itemsPerPage: 5 })

      expect(pagination.paginatedItems.value).toEqual([
        'item-1',
        'item-2',
        'item-3',
        'item-4',
        'item-5',
      ])
    })

    it('recomputes paginatedItems when currentPage changes', () => {
      const items = ref(Array.from({ length: 12 }, (_, index) => `item-${index + 1}`))
      const pagination = useLocalPagination({ items, itemsPerPage: 5 })

      pagination.goToPage(2)

      expect(pagination.paginatedItems.value).toEqual([
        'item-6',
        'item-7',
        'item-8',
        'item-9',
        'item-10',
      ])
    })

    it('recomputes paginatedItems when itemsPerPage changes', () => {
      const items = ref(Array.from({ length: 12 }, (_, index) => `item-${index + 1}`))
      const pagination = useLocalPagination({ items, itemsPerPage: 5 })

      pagination.goToPage(2)
      pagination.setItemsPerPage(4)

      expect(pagination.currentPage.value).toBe(1)
      expect(pagination.paginatedItems.value).toEqual([
        'item-1',
        'item-2',
        'item-3',
        'item-4',
      ])
    })

    it('recomputes paginatedItems when the items array changes', async () => {
      const items = ref(Array.from({ length: 6 }, (_, index) => `item-${index + 1}`))
      const pagination = useLocalPagination({ items, itemsPerPage: 3 })

      pagination.goToPage(2)
      expect(pagination.paginatedItems.value).toEqual(['item-4', 'item-5', 'item-6'])

      items.value = ['new-1', 'new-2']
      await nextTick()

      expect(pagination.currentPage.value).toBe(1)
      expect(pagination.paginatedItems.value).toEqual(['new-1', 'new-2'])
    })
  })

  describe('nextPage', () => {
    it('advances to the next page', () => {
      const totalItems = ref(100)
      const pagination = useLocalPagination({ totalItems })

      pagination.nextPage()
      expect(pagination.currentPage.value).toBe(2)
    })

    it('stops at the last page boundary', () => {
      const totalItems = ref(25)
      const pagination = useLocalPagination({ totalItems, itemsPerPage: 10 })

      expect(pagination.totalPages.value).toBe(3)

      pagination.nextPage()
      expect(pagination.currentPage.value).toBe(2)

      pagination.nextPage()
      expect(pagination.currentPage.value).toBe(3)

      pagination.nextPage()
      expect(pagination.currentPage.value).toBe(3)
    })

    it('prevents advancing when already at last page', () => {
      const totalItems = ref(5)
      const pagination = useLocalPagination({ totalItems, itemsPerPage: 10 })

      pagination.nextPage()
      pagination.nextPage()
      expect(pagination.currentPage.value).toBe(1)
    })
  })

  describe('previousPage', () => {
    it('goes to the previous page', () => {
      const totalItems = ref(100)
      const pagination = useLocalPagination({ totalItems })

      pagination.nextPage()
      pagination.nextPage()
      expect(pagination.currentPage.value).toBe(3)

      pagination.previousPage()
      expect(pagination.currentPage.value).toBe(2)
    })

    it('stops at page 1 boundary', () => {
      const totalItems = ref(100)
      const pagination = useLocalPagination({ totalItems })

      pagination.previousPage()
      pagination.previousPage()
      expect(pagination.currentPage.value).toBe(1)
    })

    it('works correctly after navigating forward and back', () => {
      const totalItems = ref(100)
      const pagination = useLocalPagination({ totalItems })

      pagination.nextPage()
      pagination.nextPage()
      expect(pagination.currentPage.value).toBe(3)

      pagination.previousPage()
      pagination.previousPage()
      pagination.previousPage()
      expect(pagination.currentPage.value).toBe(1)
    })
  })

  describe('goToPage', () => {
    it('navigates to a specific valid page', () => {
      const totalItems = ref(100)
      const pagination = useLocalPagination({ totalItems })

      pagination.goToPage(5)
      expect(pagination.currentPage.value).toBe(5)
    })

    it('ignores page numbers below 1', () => {
      const totalItems = ref(100)
      const pagination = useLocalPagination({ totalItems })

      pagination.goToPage(0)
      expect(pagination.currentPage.value).toBe(1)

      pagination.goToPage(-1)
      expect(pagination.currentPage.value).toBe(1)
    })

    it('ignores page numbers above totalPages', () => {
      const totalItems = ref(30)
      const pagination = useLocalPagination({ totalItems, itemsPerPage: 10 })

      pagination.goToPage(10)
      expect(pagination.currentPage.value).toBe(1)
    })

    it('allows going to the last page', () => {
      const totalItems = ref(100)
      const pagination = useLocalPagination({ totalItems, itemsPerPage: 10 })

      pagination.goToPage(10)
      expect(pagination.currentPage.value).toBe(10)
    })
  })

  describe('setItemsPerPage', () => {
    it('updates page size', () => {
      const totalItems = ref(100)
      const pagination = useLocalPagination({ totalItems, itemsPerPage: 10 })

      pagination.setItemsPerPage(25)
      expect(pagination.itemsPerPage.value).toBe(25)
    })

    it('resets to page 1 when changing page size', () => {
      const totalItems = ref(100)
      const pagination = useLocalPagination({ totalItems })

      pagination.goToPage(5)
      expect(pagination.currentPage.value).toBe(5)

      pagination.setItemsPerPage(25)
      expect(pagination.currentPage.value).toBe(1)
    })

    it('recalculates totalPages with new page size', () => {
      const totalItems = ref(100)
      const pagination = useLocalPagination({ totalItems, itemsPerPage: 10 })

      expect(pagination.totalPages.value).toBe(10)

      pagination.setItemsPerPage(50)
      expect(pagination.totalPages.value).toBe(2)
    })
  })

  describe('resetToFirstPage', () => {
    it('returns to page 1 from any page', () => {
      const totalItems = ref(100)
      const pagination = useLocalPagination({ totalItems })

      pagination.goToPage(8)
      expect(pagination.currentPage.value).toBe(8)

      pagination.resetToFirstPage()
      expect(pagination.currentPage.value).toBe(1)
    })

    it('stays at page 1 when already there', () => {
      const totalItems = ref(100)
      const pagination = useLocalPagination({ totalItems })

      pagination.resetToFirstPage()
      expect(pagination.currentPage.value).toBe(1)
    })
  })

  describe('edge cases', () => {
    it('handles 0 totalItems correctly (server-side mode)', () => {
      const totalItems = ref(0)
      const pagination = useLocalPagination({ totalItems })

      expect(pagination.totalPages.value).toBe(0)
      expect(pagination.hasNextPage.value).toBe(false)
      expect(pagination.hasPreviousPage.value).toBe(false)
    })

    it('handles total counts smaller than page size (server-side mode)', () => {
      const totalItems = ref(5)
      const pagination = useLocalPagination({ totalItems, itemsPerPage: 10 })

      expect(pagination.totalPages.value).toBe(1)
      expect(pagination.hasNextPage.value).toBe(false)
      expect(pagination.hasPreviousPage.value).toBe(false)
    })

    it('handles exactly 1 page worth of totalItems (server-side mode)', () => {
      const totalItems = ref(10)
      const pagination = useLocalPagination({ totalItems, itemsPerPage: 10 })

      expect(pagination.totalPages.value).toBe(1)
      expect(pagination.hasNextPage.value).toBe(false)
    })

    it('handles just over 1 page worth of totalItems (server-side mode)', () => {
      const totalItems = ref(11)
      const pagination = useLocalPagination({ totalItems, itemsPerPage: 10 })

      expect(pagination.totalPages.value).toBe(2)
      expect(pagination.hasNextPage.value).toBe(true)
    })

    it('handles dynamic totalItems updates that reduce current page validity (server-side mode)', async () => {
      const totalItems = ref(100)
      const pagination = useLocalPagination({ totalItems, itemsPerPage: 10 })

      pagination.goToPage(10)
      expect(pagination.currentPage.value).toBe(10)

      totalItems.value = 50
      expect(pagination.totalPages.value).toBe(5)
      await nextTick()
      // currentPage should be clamped to the new totalPages
      expect(pagination.currentPage.value).toBe(5)
    })

    it('returns an empty paginatedItems array when using server-side mode (no items provided)', () => {
      const totalItems = ref(10)
      const pagination = useLocalPagination({ totalItems })

      expect(pagination.paginatedItems.value).toEqual([])
    })
  })
})
