<script setup lang="ts">
import type { FormFieldConfig, FormOption } from '@/types/ui'
/**
 * FormModal - A generic, reusable modal component for creating and editing entities
 * Refactored to use BaseModal
 *
 * @component
 * @example
 * // Basic usage
 * <FormModal
 *   :show="showModal"
 *   :entity="selectedEntity"
 *   title="Classroom"
 *   :fields="classroomFields"
 *   @save="handleSave"
 *   @cancel="closeModal"
 * />
 *
 * @example
 * // With read-only info section
 * <FormModal
 *   :show="showModal"
 *   :entity="selectedEntity"
 *   title="Instructor"
 *   :fields="instructorFields"
 *   :info-section="{
 *     title: 'User Information',
 *     note: 'To update email, please use User Management.',
 *     fields: [
 *       { label: 'Email', value: instructor.email },
 *       { label: 'User ID', value: instructor.id }
 *     ]
 *   }"
 *   @save="handleSave"
 *   @cancel="closeModal"
 * />
 *
 * @example
 * // Field configuration example
 * const classroomFields = [
 *   {
 *     name: 'name',              // Property name in form data
 *     label: 'Classroom Name',   // Display label
 *     type: 'text',              // Input type: text, email, number, password, time, select, textarea, custom
 *     icon: DoorOpen,            // Lucide icon component (optional)
 *     placeholder: 'Enter name', // Placeholder text
 *     required: true,            // Required field validation
 *     minlength: 2,              // Min length for text inputs
 *     maxlength: 100,            // Max length for text inputs
 *     helperText: 'Helper text', // Informational text below field
 *     default: '',               // Default value for new entities
 *
 *     // For select fields
 *     options: [                 // Static options array
 *       { value: '1', label: 'Option 1' },
 *       { value: '2', label: 'Option 2' }
 *     ],
 *     // OR async options function
 *     options: async () => {
 *       const data = await api.getData()
 *       return data.map(item => ({ value: item.id, label: item.name }))
 *     },
 *
 *     // Conditional visibility
 *     show: (formData) => formData.someField === 'value',
 *
 *     // Conditional disabled state
 *     disabled: (formData) => formData.someField === 'value',
 *
 *     // Custom validation
 *     validation: (value, formData) => {
 *       if (value < formData.minValue) return 'Error message'
 *       return null // No error
 *     },
 *
 *     // For custom components
 *     component: MyCustomComponent,
 *     props: { customProp: 'value' },
 *
 *     // Grid layout class (optional)
 *     grid: 'col-span-2'
 *   }
 * ]
 */
import { AlertTriangle, Loader2 } from 'lucide-vue-next'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { getErrorMessage } from '@/utils/httpError'
import BaseModal from '../common/BaseModal.vue'

interface InfoSectionField {
  label: string
  value: string | number | null | undefined
}

interface InfoSection {
  title?: string
  note?: string
  fields: InfoSectionField[]
}

const props = defineProps({
  /** Controls modal visibility */
  show: {
    type: Boolean,
    required: true,
  },
  /** Entity to edit (null for create mode) */
  entity: {
    type: Object,
    default: null,
  },
  /** Entity name for modal title (e.g., "Classroom", "Subject") */
  title: {
    type: String,
    required: true,
  },
  /** Array of field configuration objects (see JSDoc example above) */
  fields: {
    type: Array as () => FormFieldConfig[],
    required: true,
  },
  /** Custom submit button text (overrides default) */
  submitText: {
    type: String,
    default: null,
  },
  /** Modal size: 'small' (380px), 'medium' (420px), 'large' (520px) */
  size: {
    type: String,
    default: 'medium',
    validator: (value: string) => {
      return ['small', 'medium', 'large'].includes(value)
    },
  },
  /**
   * Read-only information section displayed before form fields
   * @example
   * {
   *   title: 'User Information',
   *   note: 'To update email or username, please use User Management.',
   *   fields: [
   *     { label: 'Email', value: 'user@example.com' },
   *     { label: 'User ID', value: '12345' }
   *   ]
   * }
   */
  infoSection: {
    type: Object as () => InfoSection | null,
    default: null,
  },
  /** Loading state for form submission */
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits<{
  save: [payload: Record<string, unknown>]
  cancel: []
}>()

// Map old sizes to BaseModal sizes
const modalSize = computed(() => {
  const map = {
    small: 'sm',
    medium: 'md',
    large: 'lg',
  } as const
  if (props.size in map) {
    return map[props.size as keyof typeof map]
  }
  return 'md'
})

// Generate a unique ID for the form to link with submit button in footer
const formId = computed(() => `form-modal-${props.title.toLowerCase().replace(/\s+/g, '-')}`)

// Form state
const formData = reactive<Record<string, string | number | null | undefined>>({})
const errorMessage = ref('')
const loadingOptions = ref<Record<string, FormOption[]>>({})
const loadingFields = ref(new Set<string>())
const optionsLoadError = ref<Record<string, string | null>>({})

// Computed properties
const isEditMode = computed(() => !!props.entity)

const modalTitle = computed(() => {
  if (isEditMode.value) {
    return `Edit ${props.title}`
  }
  return `Create ${props.title}`
})

const submitButtonText = computed(() => {
  if (props.submitText) {
    return props.submitText
  }
  return isEditMode.value ? 'Save Changes' : `Create ${props.title}`
})

// Visible fields (respecting show() functions)
const visibleFields = computed(() => {
  return props.fields.filter((field) => {
    if (!field.show)
      return true
    return field.show(formData)
  })
})

// Field-level validation errors
const fieldErrors = computed(() => {
  const errors: Record<string, string> = {}
  visibleFields.value.forEach((field) => {
    if (field.validation) {
      const error = field.validation(formData[field.name], formData)
      if (error)
        errors[field.name] = error
    }
  })
  return errors
})

// Form validity check
const isFormValid = computed(() => {
  // Check all required fields are filled
  const allRequiredFilled = visibleFields.value
    .filter(f => f.required)
    .every(f => formData[f.name] != null && formData[f.name] !== '')

  // Check no validation errors
  const noErrors = Object.keys(fieldErrors.value).length === 0

  return allRequiredFilled && noErrors
})

// Initialize/reset form when entity changes
watch(() => props.entity, (newEntity) => {
  // Clear form data first
  Object.keys(formData).forEach((key) => {
    delete formData[key]
  })

  // Initialize form data from fields
  props.fields.forEach((field) => {
    const rawValue = newEntity
      ? newEntity[field.name] ?? field.default ?? ''
      : field.default ?? ''

    const normalizedValue = typeof rawValue === 'string' || typeof rawValue === 'number'
      ? rawValue
      : rawValue == null
        ? ''
        : String(rawValue)

    if (newEntity) {
      // Edit mode: populate from entity
      formData[field.name] = normalizedValue
    }
    else {
      // Create mode: use default or empty
      formData[field.name] = normalizedValue
    }
  })

  // Clear error message
  errorMessage.value = ''
}, { immediate: true })

/**
 * Get options for select fields (handles both static and async)
 * @param {object} field - Field configuration object
 * @returns {Array} Array of option objects with value and label
 */
function getFieldOptions(field: FormFieldConfig): FormOption[] {
  if (!field.options)
    return []

  // Static array of options
  if (Array.isArray(field.options)) {
    return field.options
  }

  // Async function - return cached results
  if (typeof field.options === 'function') {
    return loadingOptions.value[field.name] || []
  }

  return []
}

/**
 * Check if a field is currently loading options
 * @param {string} fieldName - Name of the field
 * @returns {boolean} True if field is loading async options
 */
function isFieldLoading(fieldName: string): boolean {
  return loadingFields.value.has(fieldName)
}

/**
 * Check if a field has a load error
 * @param {string} fieldName - Name of the field
 * @returns {boolean} True if field failed to load options
 */
function hasLoadError(fieldName: string): boolean {
  return !!optionsLoadError.value[fieldName]
}

/**
 * Load async options on mount
 * Loads all fields with async options in parallel and tracks loading state
 */
onMounted(async () => {
  const asyncFields = props.fields.filter(f => typeof f.options === 'function')

  if (asyncFields.length > 0) {
    // Mark all async fields as loading
    asyncFields.forEach(field => loadingFields.value.add(field.name))

    // Load all async options in parallel
    await Promise.all(
      asyncFields.map(async (field) => {
        try {
          if (typeof field.options !== 'function') {
            return
          }
          const options = await field.options()
          loadingOptions.value[field.name] = options
          optionsLoadError.value[field.name] = null
        }
        catch (error) {
          console.error(`Error loading options for field "${field.name}":`, error)
          optionsLoadError.value[field.name] = getErrorMessage(error, 'Failed to load options')
          loadingOptions.value[field.name] = []
        }
        finally {
          loadingFields.value.delete(field.name)
        }
      }),
    )
  }
})

/**
 * Handle form submission
 * Validates form and emits save event with form data
 */
function handleSubmit() {
  errorMessage.value = ''

  if (!isFormValid.value) {
    errorMessage.value = 'Please fill in all required fields correctly'
    return
  }

  // Build submit data from visible fields only
  const submitData: Record<string, unknown> = {}
  visibleFields.value.forEach((field) => {
    submitData[field.name] = formData[field.name]
  })

  emit('save', submitData)
}

/**
 * Handle error from parent (called via ref)
 * @param {string} error - Error message to display
 */
function handleError(error?: string | null) {
  errorMessage.value = error ?? ''
}

// Expose methods to parent component
defineExpose({ handleError })
</script>

<template>
  <BaseModal
    :show="show"
    :title="modalTitle"
    :size="modalSize"
    @close="$emit('cancel')"
  >
    <!-- Error Message Display -->
    <div v-if="errorMessage" class="error-message">
      <div class="error-content">
        <AlertTriangle class="error-icon" :size="20" />
        <p>{{ errorMessage }}</p>
      </div>
    </div>

    <!-- Modal Body -->
    <form :id="formId" @submit.prevent="handleSubmit">
      <!-- Read-only Info Section -->
      <div v-if="infoSection" class="info-section">
        <h3 v-if="infoSection.title" class="info-title">
          {{ infoSection.title }}
        </h3>
        <div class="info-fields">
          <div
            v-for="(field, index) in infoSection.fields"
            :key="index"
            class="info-row"
          >
            <span class="info-label">{{ field.label }}:</span>
            <span class="info-value">{{ field.value }}</span>
          </div>
        </div>
        <p v-if="infoSection.note" class="info-note">
          {{ infoSection.note }}
        </p>
      </div>

      <!-- Dynamic field rendering -->
      <div
        v-for="field in visibleFields"
        :key="field.name"
        class="form-group"
        :class="field.grid"
      >
        <label>
          {{ field.label }}
          <span v-if="field.required">*</span>
        </label>

        <!-- Text/Email/Number/Password/Time inputs -->
        <div
          v-if="['text', 'email', 'number', 'password', 'time'].includes(field.type)"
          class="input-wrapper"
        >
          <component :is="field.icon" v-if="field.icon" class="input-icon" :size="18" />
          <input
            v-model="formData[field.name]"
            :type="field.type"
            :placeholder="field.placeholder"
            :required="field.required"
            :minlength="field.minlength"
            :maxlength="field.maxlength"
            :min="field.min"
            :max="field.max"
            :disabled="field.disabled ? field.disabled(formData) : false"
          >
        </div>

        <!-- Select dropdown -->
        <div v-else-if="field.type === 'select'" class="input-wrapper">
          <component :is="field.icon" v-if="field.icon && !isFieldLoading(field.name)" class="input-icon" :size="18" />
          <Loader2 v-if="isFieldLoading(field.name)" class="input-icon loading-spinner" :size="18" />
          <select
            v-model="formData[field.name]"
            :required="field.required"
            :disabled="field.disabled ? field.disabled(formData) : isFieldLoading(field.name)"
          >
            <option value="" disabled>
              <template v-if="isFieldLoading(field.name)">
                Loading options...
              </template>
              <template v-else-if="hasLoadError(field.name)">
                Failed to load options
              </template>
              <template v-else>
                {{ field.placeholder || 'Select an option' }}
              </template>
            </option>
            <option
              v-for="opt in getFieldOptions(field)"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </option>
          </select>
        </div>

        <!-- Load error message for select fields -->
        <small v-if="hasLoadError(field.name)" class="helper-text error">
          {{ optionsLoadError[field.name] }}
        </small>

        <!-- Textarea -->
        <div v-else-if="field.type === 'textarea'" class="input-wrapper">
          <component :is="field.icon" v-if="field.icon" class="input-icon" :size="18" />
          <textarea
            v-model="formData[field.name]"
            :placeholder="field.placeholder"
            :required="field.required"
            :minlength="field.minlength"
            :maxlength="field.maxlength"
            :disabled="field.disabled ? field.disabled(formData) : false"
            rows="4"
          />
        </div>

        <!-- Custom component -->
        <component
          :is="field.component"
          v-else-if="field.type === 'custom'"
          v-model="formData[field.name]"
          v-bind="field.props"
        />

        <!-- Helper text -->
        <small v-if="field.helperText" class="helper-text info">
          {{ field.helperText }}
        </small>

        <!-- Field-specific error -->
        <small v-if="fieldErrors[field.name]" class="helper-text error">
          {{ fieldErrors[field.name] }}
        </small>
      </div>
    </form>

    <template #footer>
      <button type="button" class="btn-cancel" :disabled="loading" @click="$emit('cancel')">
        Cancel
      </button>
      <button :form="formId" type="submit" class="btn-submit" :disabled="!isFormValid || loading">
        <Loader2 v-if="loading" class="loading-spinner-btn" :size="18" />
        <span v-else>{{ submitButtonText }}</span>
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-gray-700);
  margin-bottom: 0.5rem;
}

.input-wrapper {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-gray-400);
  pointer-events: none;
}

.form-group input,
.form-group select,
.form-group textarea {
  display: block;
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-gray-200);
  border-radius: 0.5rem;
  font-size: 0.95rem;
  outline: none;
  transition: all 0.2s;
  background-color: var(--color-gray-50);
}

.form-group input,
.form-group select {
  padding-left: 2.5rem; /* Space for icon */
}

.form-group textarea {
  padding-left: 1rem;
  resize: vertical;
  font-family: inherit;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: var(--color-primary);
  background-color: white;
  box-shadow: 0 0 0 4px rgba(30, 58, 138, 0.1);
}

.helper-text {
  display: block;
  margin-top: 0.375rem;
  font-size: 0.75rem;
}

.helper-text.info {
  color: var(--color-gray-500);
}

.helper-text.error {
  color: var(--color-error);
  font-weight: 500;
}

.btn-submit {
  padding: 0.625rem 1.25rem;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 6px -1px rgba(30, 58, 138, 0.2);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 8px -1px rgba(30, 58, 138, 0.3);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-cancel {
  background-color: white;
  color: var(--color-gray-600);
  border: 1px solid var(--color-gray-200);
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background-color: var(--color-gray-100);
  border-color: var(--color-gray-300);
  color: var(--color-gray-800);
}

.error-message {
  background: var(--color-error-bg);
  border-left: 4px solid var(--color-error);
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.error-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.error-icon {
  color: var(--color-error);
  flex-shrink: 0;
}

.error-content p {
  margin: 0;
  color: var(--color-error-darker);
  font-size: 0.875rem;
  font-weight: 500;
}

.loading-spinner {
  animation: spin-centered 1s linear infinite;
  color: var(--color-primary);
}

.loading-spinner-btn {
  animation: spin 1s linear infinite;
}

/* Info Section Styles */
.info-section {
  background: var(--color-gray-50);
  border: 1px solid var(--color-gray-200);
  border-radius: 0.75rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.info-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-gray-700);
  margin: 0 0 0.75rem 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-fields {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-row {
  display: flex;
  gap: 0.5rem;
  align-items: baseline;
}

.info-label {
  font-weight: 600;
  color: var(--color-gray-600);
  min-width: 100px;
  font-size: 0.875rem;
}

.info-value {
  color: var(--color-gray-800);
  font-size: 0.875rem;
  word-break: break-word;
}

.info-note {
  margin: 0.75rem 0 0 0;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-gray-200);
  font-size: 0.8125rem;
  color: var(--color-gray-500);
  font-style: italic;
  line-height: 1.4;
}

@keyframes spin-centered {
  from { transform: translateY(-50%) rotate(0deg); }
  to { transform: translateY(-50%) rotate(360deg); }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 640px) {
  .btn-submit, .btn-cancel {
    width: 100%;
  }
}
</style>
