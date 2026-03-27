export interface HandleErrorableModal {
  handleError?: (message?: string) => void
}

export interface FormOption {
  value: string | number
  label: string
}

export interface FormFieldConfig {
  name: string
  label: string
  type: string
  icon?: object | null
  placeholder?: string
  required?: boolean
  minlength?: number
  maxlength?: number
  min?: number | string
  max?: number | string
  default?: unknown
  grid?: string
  helperText?: string
  component?: object | null
  props?: Record<string, unknown>
  options?: FormOption[] | (() => Promise<FormOption[]>)
  show?: (formData: Record<string, unknown>) => boolean
  disabled?: (formData: Record<string, unknown>) => boolean
  validation?: (value: unknown, formData: Record<string, unknown>) => string | null
}
