import type { MaybeRefOrGetter } from 'vue'
import { computed, ref, toValue } from 'vue'

export interface UseLocalPaginationOptions {
  totalItems: MaybeRefOrGetter<number>
  itemsPerPage?: number
}

export function useLocalPagination(options: UseLocalPaginationOptions) {
  const currentPage = ref(1)
  const itemsPerPage = ref(options.itemsPerPage ?? 10)

  const totalPages = computed(() => Math.ceil(toValue(options.totalItems) / itemsPerPage.value))
  const hasNextPage = computed(() => currentPage.value < totalPages.value)
  const hasPreviousPage = computed(() => currentPage.value > 1)

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
    totalPages,
    hasNextPage,
    hasPreviousPage,
    nextPage,
    previousPage,
    goToPage,
    setItemsPerPage,
    resetToFirstPage,
  }
}
