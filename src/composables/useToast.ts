import { reactive } from 'vue'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastState {
  show: boolean
  message: string
  type: ToastType
  duration: number
}

export function useToast() {
  const toast = reactive<ToastState>({
    show: false,
    message: '',
    type: 'success',
    duration: 3000,
  })

  function showToast(message: string, type: ToastType = 'success', duration = 3000) {
    toast.message = message
    toast.type = type
    toast.duration = duration
    toast.show = true
  }

  function closeToast() {
    toast.show = false
  }

  return { toast, showToast, closeToast }
}
