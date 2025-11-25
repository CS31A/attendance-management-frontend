<script setup>
import { AlertTriangle, X } from 'lucide-vue-next'
import { computed, onMounted, reactive, ref, watch } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  entity: {
    type: Object,
    default: null,
  },
  title: {
    type: String,
    required: true,
  },
  fields: {
    type: Array,
    required: true,
  },
  submitText: {
    type: String,
    default: null,
  },
  size: {
    type: String,
    default: 'medium',
    validator: (value) => {
      return ['small', 'medium', 'large'].includes(value)
    },
  },
})

const emit = defineEmits(['save', 'cancel'])

// Form state
const formData = reactive({})
const errorMessage = ref('')
const loadingOptions = ref({})

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
  const errors = {}
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
    if (newEntity) {
      // Edit mode: populate from entity
      formData[field.name] = newEntity[field.name] ?? field.default ?? ''
    }
    else {
      // Create mode: use default or empty
      formData[field.name] = field.default ?? ''
    }
  })

  // Clear error message
  errorMessage.value = ''
}, { immediate: true })

// Get options for select fields (handles both static and async)
function getFieldOptions(field) {
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

// Load async options on mount
onMounted(async () => {
  const asyncFields = props.fields.filter(f => typeof f.options === 'function')

  if (asyncFields.length > 0) {
    try {
      // Load all async options in parallel
      await Promise.all(
        asyncFields.map(async (field) => {
          const options = await field.options()
          loadingOptions.value[field.name] = options
        }),
      )
    }
    catch (error) {
      console.error('Error loading field options:', error)
    }
  }
})

// Handle form submission
function handleSubmit() {
  errorMessage.value = ''

  if (!isFormValid.value) {
    errorMessage.value = 'Please fill in all required fields correctly'
    return
  }

  // Build submit data from visible fields only
  const submitData = {}
  visibleFields.value.forEach((field) => {
    submitData[field.name] = formData[field.name]
  })

  emit('save', submitData)
}

// Handle error from parent (called via ref)
function handleError(error) {
  errorMessage.value = error
}

// Expose methods to parent
defineExpose({ handleError })
</script>

<template>
  <div v-if="show" class="overlay">
    <div class="modal" :class="`modal-${size}`">
      <!-- Modal Header -->
      <div class="modal-header">
        <h2>{{ modalTitle }}</h2>
        <button type="button" class="btn-close" @click="$emit('cancel')">
          <X size="24" />
        </button>
      </div>

      <!-- Error Message Display -->
      <div v-if="errorMessage" class="error-message">
        <div class="error-content">
          <AlertTriangle class="error-icon" size="20" />
          <p>{{ errorMessage }}</p>
        </div>
      </div>

      <!-- Modal Body -->
      <form class="modal-body" @submit.prevent="handleSubmit">
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
            <component :is="field.icon" v-if="field.icon" class="input-icon" size="18" />
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
            <component :is="field.icon" v-if="field.icon" class="input-icon" size="18" />
            <select
              v-model="formData[field.name]"
              :required="field.required"
              :disabled="field.disabled ? field.disabled(formData) : false"
            >
              <option value="" disabled>
                {{ field.placeholder || 'Select an option' }}
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

          <!-- Textarea -->
          <div v-else-if="field.type === 'textarea'" class="input-wrapper">
            <component :is="field.icon" v-if="field.icon" class="input-icon" size="18" />
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

        <!-- Actions -->
        <div class="actions">
          <button type="submit" class="btn-submit" :disabled="!isFormValid">
            {{ submitButtonText }}
          </button>
          <button type="button" class="btn-cancel" @click="$emit('cancel')">
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  padding: 1rem;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.2s ease-out;
}

.modal {
  background: white;
  border-radius: 1rem;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;
}

.modal-small {
  max-width: 380px;
}

.modal-medium {
  max-width: 420px;
}

.modal-large {
  max-width: 520px;
}

.modal-header {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  padding: 1.25rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 1;
}

.modal-header h2 {
  color: white;
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.btn-close {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: rotate(90deg);
}

.modal-body {
  padding: 1.5rem;
}

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

.actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.btn-submit {
  flex: 1;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 6px -1px rgba(30, 58, 138, 0.2);
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
  padding: 0.75rem 1.5rem;
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
  margin: 0;
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

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Responsive */
@media (max-width: 640px) {
  .modal {
    max-width: 100%;
    margin: 1rem;
    max-height: 85vh;
  }

  .modal-small,
  .modal-medium,
  .modal-large {
    max-width: 100%;
  }

  .actions {
    flex-direction: column-reverse;
  }

  .btn-submit, .btn-cancel {
    width: 100%;
  }
}
</style>
