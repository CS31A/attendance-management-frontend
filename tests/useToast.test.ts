import type { ToastType } from '@/composables/useToast'

import { describe, expect, it } from 'vitest'

import { useToast } from '@/composables/useToast'

describe('useToast', () => {
  describe('initial state', () => {
    it('matches defaults', () => {
      const { toast } = useToast()

      expect(toast.show).toBe(false)
      expect(toast.message).toBe('')
      expect(toast.type).toBe('success')
      expect(toast.duration).toBe(3000)
    })
  })

  describe('showToast', () => {
    it('sets message, default type, default duration, and shows toast', () => {
      const { toast, showToast } = useToast()

      showToast('Operation completed')

      expect(toast.show).toBe(true)
      expect(toast.message).toBe('Operation completed')
      expect(toast.type).toBe('success')
      expect(toast.duration).toBe(3000)
    })

    it('accepts custom type and duration', () => {
      const { toast, showToast } = useToast()

      showToast('Error occurred', 'error', 5000)

      expect(toast.show).toBe(true)
      expect(toast.message).toBe('Error occurred')
      expect(toast.type).toBe('error')
      expect(toast.duration).toBe(5000)
    })

    it('respects all toast types', () => {
      const types: ToastType[] = ['success', 'error', 'warning', 'info']

      for (const type of types) {
        const { toast, showToast } = useToast()
        showToast('Message', type)
        expect(toast.type).toBe(type)
      }
    })

    it('allows custom durations', () => {
      const { toast, showToast } = useToast()

      showToast('Quick message', 'info', 1000)
      expect(toast.duration).toBe(1000)

      const { toast: toast2, showToast: showToast2 } = useToast()
      showToast2('Long message', 'info', 10000)
      expect(toast2.duration).toBe(10000)
    })

    it('overwrites prior toast content cleanly', () => {
      const { toast, showToast } = useToast()

      showToast('First message', 'success', 1000)
      expect(toast.message).toBe('First message')
      expect(toast.type).toBe('success')
      expect(toast.duration).toBe(1000)
      expect(toast.show).toBe(true)

      showToast('Second message', 'error', 5000)
      expect(toast.message).toBe('Second message')
      expect(toast.type).toBe('error')
      expect(toast.duration).toBe(5000)
      expect(toast.show).toBe(true)

      showToast('Third message')
      expect(toast.message).toBe('Third message')
      expect(toast.type).toBe('success')
      expect(toast.duration).toBe(3000)
      expect(toast.show).toBe(true)
    })

    it('shows toast after being closed', () => {
      const { toast, showToast, closeToast } = useToast()

      showToast('First')
      expect(toast.show).toBe(true)

      closeToast()
      expect(toast.show).toBe(false)

      showToast('Second')
      expect(toast.show).toBe(true)
      expect(toast.message).toBe('Second')
    })
  })

  describe('closeToast', () => {
    it('sets show to false without mutating the last message', () => {
      const { toast, showToast, closeToast } = useToast()

      showToast('Important message', 'error', 5000)
      expect(toast.show).toBe(true)

      closeToast()

      expect(toast.show).toBe(false)
      expect(toast.message).toBe('Important message')
      expect(toast.type).toBe('error')
      expect(toast.duration).toBe(5000)
    })

    it('preserves type when closing', () => {
      const { toast, showToast, closeToast } = useToast()

      showToast('Warning message', 'warning')
      closeToast()

      expect(toast.type).toBe('warning')
    })

    it('can be called multiple times without error', () => {
      const { toast, showToast, closeToast } = useToast()

      showToast('Test')
      closeToast()
      closeToast()
      closeToast()

      expect(toast.show).toBe(false)
    })

    it('does not throw when closing without prior show', () => {
      const { toast, closeToast } = useToast()

      expect(() => closeToast()).not.toThrow()
      expect(toast.show).toBe(false)
    })
  })

  describe('reactive state behavior', () => {
    it('maintains independent state between multiple useToast instances', () => {
      const { toast: toast1, showToast: showToast1 } = useToast()
      const { toast: toast2, showToast: showToast2 } = useToast()

      showToast1('Message 1', 'success')
      showToast2('Message 2', 'error', 5000)

      expect(toast1.message).toBe('Message 1')
      expect(toast1.type).toBe('success')

      expect(toast2.message).toBe('Message 2')
      expect(toast2.type).toBe('error')
      expect(toast2.duration).toBe(5000)
    })

    it('state changes are reactive', () => {
      const { toast, showToast, closeToast } = useToast()

      expect(toast.show).toBe(false)

      showToast('Test')
      expect(toast.show).toBe(true)

      closeToast()
      expect(toast.show).toBe(false)
    })
  })
})
