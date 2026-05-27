import { computed, ref } from 'vue'

/**
 * Provides a reactive loading state with a counter-based approach.
 * Supports concurrent async operations — loading stays true until all complete.
 *
 * @returns loading - computed ref, true when any operation is in-flight
 * @returns withLoading - wraps an async function, manages loading state automatically
 *
 * @example
 * const { loading, withLoading } = useLoadingState()
 *
 * const fetchItems = () => withLoading(async () => {
 *   const data = await api.getAll()
 *   items.value = data
 * })
 */
export function useLoadingState() {
  const loadingCount = ref(0)
  const loading = computed(() => loadingCount.value > 0)
  // Generation counter: resetLoading increments this, withLoading captures it.
  // finally blocks only decrement if generation still matches — prevents
  // abandoned operations from corrupting the counter after a reset.
  let generation = 0

  async function withLoading<T>(fn: () => Promise<T>, onError?: (err: unknown) => void): Promise<T> {
    const capturedGeneration = generation
    loadingCount.value += 1
    try {
      return await fn()
    }
    catch (err) {
      try {
        onError?.(err)
      }
      catch {
        // Swallow onError failures — original error always propagates
      }
      throw err
    }
    finally {
      // Only decrement if resetLoading hasn't been called since we started
      if (capturedGeneration === generation) {
        loadingCount.value = Math.max(0, loadingCount.value - 1)
      }
    }
  }

  function resetLoading() {
    generation += 1
    loadingCount.value = 0
  }

  return { loading, withLoading, resetLoading }
}
