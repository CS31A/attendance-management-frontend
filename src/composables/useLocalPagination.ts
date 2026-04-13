import type { MaybeRefOrGetter } from 'vue'
import { computed, ref, toValue, watch } from 'vue'

export interface UseLocalPaginationOptions<T = unknown> {
  totalItems?: MaybeRefOrGetter<number>
  items?: MaybeRefOrGetter<readonly T[] | null | undefined>
  itemsPerPage?: number
}

export function useLocalPagination<T>(options: UseLocalPaginationOptions<T>) {
  const currentPage = ref(1)
  const itemsPerPage = ref(options.itemsPerPage ?? 10)
  const items = computed(() => (toValue(options.items) as readonly T[] | null | undefined) ?? [])
  const totalItems = computed(() => options.items ? items.value.length : toValue(options.totalItems ?? 0))

  const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))
  const hasNextPage = computed(() => currentPage.value < totalPages.value)
  const hasPreviousPage = computed(() => currentPage.value > 1)
  const paginatedItems = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value
    const end = start + itemsPerPage.value
    return items.value.slice(start, end)
  })

  watch(totalPages, (newTotalPages) => {
    if (currentPage.value > newTotalPages) {
      currentPage.value = Math.max(1, newTotalPages)
    }
  })

  function nextPage() {
    if (hasNextPage.value) {
      currentPage.value++
    }
  }

  function previousPage() {
    if (hasPreviousPage.value) {
      currentPage.value--
    }
  }

  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  }

  function setItemsPerPage(value: number) {
    itemsPerPage.value = value
    currentPage.value = 1
  }

  function resetToFirstPage() {
    currentPage.value = 1
  }

  return {
    currentPage,
    itemsPerPage,
    totalItems,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    paginatedItems,
    nextPage,
    previousPage,
    goToPage,
    setItemsPerPage,
    resetToFirstPage,
  }
}
