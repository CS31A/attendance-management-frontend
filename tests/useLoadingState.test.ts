/**
 * Tests for useLoadingState composable.
 * Covers: counter concurrency, resetLoading race condition, onError safety.
 */
import { describe, expect, it, vi } from 'vitest'
import { useLoadingState } from '@/composables/useLoadingState'

describe('useLoadingState', () => {
  describe('basic loading counter', () => {
    it('loading starts false', () => {
      const { loading } = useLoadingState()
      expect(loading.value).toBe(false)
    })

    it('loading is true during withLoading execution', async () => {
      const { loading, withLoading } = useLoadingState()
      let loadingDuringExecution = false

      await withLoading(async () => {
        loadingDuringExecution = loading.value
      })

      expect(loadingDuringExecution).toBe(true)
      expect(loading.value).toBe(false)
    })

    it('loading stays true until all concurrent operations complete', async () => {
      const { loading, withLoading } = useLoadingState()
      let loadingAfterFirst = false

      const p1 = withLoading(async () => {
        await new Promise(r => setTimeout(r, 50))
      })
      const p2 = withLoading(async () => {
        await new Promise(r => setTimeout(r, 100))
        loadingAfterFirst = loading.value // p2 finishes after p1
      })

      await Promise.all([p1, p2])
      expect(loadingAfterFirst).toBe(true) // p1 done but p2 still running
      expect(loading.value).toBe(false)
    })

    it('withLoading returns the value from fn', async () => {
      const { withLoading } = useLoadingState()
      const result = await withLoading(async () => 42)
      expect(result).toBe(42)
    })
  })

  describe('onError callback', () => {
    it('onError is called when fn throws', async () => {
      const { withLoading } = useLoadingState()
      const onError = vi.fn()

      await expect(
        withLoading(async () => {
          throw new Error('boom')
        }, onError),
      ).rejects.toThrow('boom')

      expect(onError).toHaveBeenCalledWith(expect.any(Error))
      expect(onError).toHaveBeenCalledTimes(1)
    })

    it('error is re-thrown after onError', async () => {
      const { withLoading } = useLoadingState()

      await expect(
        withLoading(async () => {
          throw new Error('boom')
        }, () => {}),
      ).rejects.toThrow('boom')
    })

    it('loading resets even when fn throws', async () => {
      const { loading, withLoading } = useLoadingState()

      await expect(
        withLoading(async () => {
          throw new Error('boom')
        }),
      ).rejects.toThrow('boom')

      expect(loading.value).toBe(false)
    })

    it('original error propagates even if onError throws', async () => {
      const { withLoading } = useLoadingState()

      const onErrorThatThrows = () => {
        throw new Error('onError failed')
      }

      // Should propagate the ORIGINAL error, not onError's error
      await expect(
        withLoading(async () => {
          throw new Error('original error')
        }, onErrorThatThrows),
      ).rejects.toThrow('original error')
    })
  })

  describe('resetLoading race condition', () => {
    it('resetLoading during in-flight op: subsequent withLoading still tracks correctly', async () => {
      const { loading, withLoading, resetLoading } = useLoadingState()

      // Abandoned op finishes FIRST (50ms), newOp finishes SECOND (200ms)
      // Without generation tracking, abandoned's finally will decrement the counter
      // while newOp is still in-flight, making loading falsely false.
      const abandoned = withLoading(async () => {
        await new Promise(r => setTimeout(r, 50))
      })

      // Reset while abandoned op is in-flight
      resetLoading()
      expect(loading.value).toBe(false)

      // Start a NEW operation — loading should be true
      const newOp = withLoading(async () => {
        await new Promise(r => setTimeout(r, 200))
      })

      expect(loading.value).toBe(true)

      // Wait for abandoned op's finally to fire (at ~50ms)
      await abandoned.catch(() => {})

      // CRITICAL: loading must STILL be true because newOp is in-flight
      // Bug: without generation tracking, abandoned's finally decrements counter to 0
      expect(loading.value).toBe(true)

      await newOp
      // After newOp completes, loading should be false
      expect(loading.value).toBe(false)
    })

    it('resetLoading sets counter to 0', () => {
      const { loading, withLoading, resetLoading } = useLoadingState()

      // Simulate in-flight
      void withLoading(async () => {
        await new Promise(r => setTimeout(r, 1000))
      })

      resetLoading()
      expect(loading.value).toBe(false)
    })
  })
})
