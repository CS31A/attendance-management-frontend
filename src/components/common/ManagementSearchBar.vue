<script setup lang="ts">
import { Search, X } from 'lucide-vue-next'
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  placeholder?: string
  resultCount?: number | null
  debounceDelay?: number
  resultLabel?: string
}>(), {
  placeholder: 'Search',
  resultCount: null,
  debounceDelay: 300,
  resultLabel: 'result',
})

const model = defineModel<string>({ default: '' })

const localQuery = ref(model.value)
const isSearching = ref(false)
const hasActiveSearch = computed(() => localQuery.value.trim().length > 0)
const resultsText = computed(() => {
  if (props.resultCount === null)
    return ''

  const suffix = props.resultCount === 1 ? '' : 's'
  return `${props.resultCount} ${props.resultLabel}${suffix} found`
})

let debounceTimer: ReturnType<typeof setTimeout> | null = null

function clearPendingSearch() {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
}

function clearSearch() {
  clearPendingSearch()
  localQuery.value = ''
  model.value = ''
  isSearching.value = false
}

watch(() => model.value, (value) => {
  if (value !== localQuery.value) {
    clearPendingSearch()
    localQuery.value = value
    isSearching.value = false
  }
})

watch(localQuery, (value) => {
  clearPendingSearch()

  if (value === model.value) {
    isSearching.value = false
    return
  }

  isSearching.value = true
  debounceTimer = setTimeout(() => {
    model.value = value
    isSearching.value = false
    debounceTimer = null
  }, props.debounceDelay)
})

onBeforeUnmount(() => {
  clearPendingSearch()
})
</script>

<template>
  <div class="live-search-container">
    <div class="search-input-wrapper" :class="{ 'is-searching': isSearching, 'has-value': hasActiveSearch }">
      <Search class="search-icon" :size="18" />
      <input
        v-model="localQuery"
        type="text"
        :placeholder="placeholder"
        class="live-search-input"
      >
      <div v-if="isSearching" class="search-spinner">
        <div class="spinner" />
      </div>
      <button
        v-else-if="hasActiveSearch"
        type="button"
        class="clear-search-btn"
        title="Clear search"
        @click="clearSearch"
      >
        <X :size="16" />
      </button>
    </div>
    <div v-if="hasActiveSearch && !isSearching && resultCount !== null" class="search-results-info">
      <span class="results-count">{{ resultsText }}</span>
    </div>
  </div>
</template>

<style scoped>
.live-search-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
}

.search-icon {
  position: absolute;
  left: 0.875rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-gray-400);
  pointer-events: none;
  transition: color 0.2s ease;
}

.search-input-wrapper.is-searching .search-icon,
.search-input-wrapper.has-value .search-icon {
  color: var(--color-primary);
}

.live-search-input {
  width: 100%;
  padding: 0.625rem 2.5rem 0.625rem 2.75rem;
  border: 2px solid var(--color-gray-200);
  border-radius: 12px;
  font-size: 0.875rem;
  background: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.live-search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 8px 25px rgba(30, 58, 138, 0.2);
  transform: translateY(-2px);
}

.search-input-wrapper.is-searching .live-search-input {
  border-color: var(--color-primary-light);
}

.search-spinner {
  position: absolute;
  right: 0.875rem;
  top: 50%;
  transform: translateY(-50%);
}

.spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid var(--color-gray-200);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.clear-search-btn {
  position: absolute;
  right: 0.625rem;
  top: 50%;
  transform: translateY(-50%);
  background: var(--color-gray-100);
  border: none;
  border-radius: 50%;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-gray-500);
  transition: all 0.2s ease;
}

.clear-search-btn:hover {
  background: var(--color-gray-200);
  color: var(--color-gray-700);
}

.search-results-info {
  padding-left: 0.25rem;
}

.results-count {
  font-size: 0.75rem;
  color: var(--color-gray-500);
  font-weight: 500;
}
</style>
