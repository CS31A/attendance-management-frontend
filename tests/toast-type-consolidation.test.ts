import type { ToastType } from '@/composables/useToast'

import { describe, expect, it } from 'vitest'

import { useToast } from '@/composables/useToast'

describe('toast-type-consolidation', () => {
  describe('ToastType export', () => {
    it('useToast composable is exported and callable', () => {
      expect(typeof useToast).toBe('function')
    })

    it('returns object with expected shape', () => {
      const result = useToast()

      expect(result).toHaveProperty('toast')
      expect(result).toHaveProperty('showToast')
      expect(result).toHaveProperty('closeToast')
    })

    it('showToast is a function', () => {
      const { showToast } = useToast()
      expect(typeof showToast).toBe('function')
    })

    it('closeToast is a function', () => {
      const { closeToast } = useToast()
      expect(typeof closeToast).toBe('function')
    })

    it('toast is a reactive object with show, message, type, duration', () => {
      const { toast } = useToast()

      expect(toast).toHaveProperty('show')
      expect(toast).toHaveProperty('message')
      expect(toast).toHaveProperty('type')
      expect(toast).toHaveProperty('duration')
    })
  })

  describe('ToastType values', () => {
    it('accepts all valid ToastType values', () => {
      const validTypes: ToastType[] = ['success', 'error', 'warning', 'info']
      const { toast, showToast } = useToast()

      for (const type of validTypes) {
        showToast('test', type)
        expect(toast.type).toBe(type)
      }
    })

    it('showToast defaults to success type', () => {
      const { toast, showToast } = useToast()
      showToast('default test')
      expect(toast.type).toBe('success')
    })
  })
})
