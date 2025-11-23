<script setup>
import { AlertTriangle, BookOpen, Hash, X } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'

const props = defineProps({
  subject: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['save', 'cancel'])

// Form data
const name = ref('')
const code = ref('')
const errorMessage = ref('')

// Initialize form if editing
watch(() => props.subject, (newSubject) => {
  if (newSubject) {
    name.value = newSubject.name || ''
    code.value = newSubject.code || ''
  }
  else {
    name.value = ''
    code.value = ''
  }
}, { immediate: true })

// Computed properties
const isEditMode = computed(() => !!props.subject)
const modalTitle = computed(() => isEditMode.value ? 'Edit Subject' : 'Create Subject')
const submitButtonText = computed(() => isEditMode.value ? 'Save Changes' : 'Create Subject')

const isFormValid = computed(() => {
  return (
    name.value && name.value.length >= 2
    && code.value && code.value.length >= 5
  )
})

// Main form submission
function handleSubmit() {
  errorMessage.value = ''

  // Validation
  if (name.value.length < 2) {
    errorMessage.value = 'Subject name must be at least 2 characters'
    return
  }
  if (code.value.length < 5) {
    errorMessage.value = 'Subject code must be at least 5 characters'
    return
  }

  const subjectData = {
    name: name.value,
    code: code.value,
  }

  emit('save', subjectData)
}

// Handle error from parent
function handleError(error) {
  errorMessage.value = error
}

// Expose methods to parent
defineExpose({ handleError })
</script>

<template>
  <div class="overlay">
    <div class="modal">
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
        <!-- Name Field -->
        <div class="form-group">
          <label>Subject Name *</label>
          <div class="input-wrapper">
            <BookOpen class="input-icon" size="18" />
            <input
              v-model="name"
              type="text"
              placeholder="Enter subject name (min 2 chars)"
              required
              minlength="2"
            >
          </div>
          <small class="helper-text info">Must be at least 2 characters</small>
        </div>

        <!-- Code Field -->
        <div class="form-group">
          <label>Subject Code *</label>
          <div class="input-wrapper">
            <Hash class="input-icon" size="18" />
            <input
              v-model="code"
              type="text"
              placeholder="Enter subject code (min 5 chars)"
              required
              minlength="5"
            >
          </div>
          <small class="helper-text info">Must be at least 5 characters</small>
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
  max-width: 420px;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;
}

.modal-header {
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
  padding: 1.25rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  color: #374151;
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
  color: #9ca3af;
  pointer-events: none;
}

.form-group input {
  display: block;
  width: 100%;
  padding: 0.75rem 1rem;
  padding-left: 2.5rem; /* Space for icon */
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 0.95rem;
  outline: none;
  transition: all 0.2s;
  background-color: #f9fafb;
}

.form-group input:focus {
  border-color: #1e3a8a;
  background-color: white;
  box-shadow: 0 0 0 4px rgba(30, 58, 138, 0.1);
}

.helper-text {
  display: block;
  margin-top: 0.375rem;
  font-size: 0.75rem;
}

.helper-text.info {
  color: #6b7280;
}

.actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.btn-submit {
  flex: 1;
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
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
  color: #4b5563;
  border: 1px solid #e5e7eb;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background-color: #f3f4f6;
  border-color: #d1d5db;
  color: #1f2937;
}

.error-message {
  background: #fef2f2;
  border-left: 4px solid #ef4444;
  padding: 1rem;
  margin: 0;
}

.error-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.error-icon {
  color: #ef4444;
  flex-shrink: 0;
}

.error-content p {
  margin: 0;
  color: #b91c1c;
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
  }

  .actions {
    flex-direction: column-reverse;
  }

  .btn-submit, .btn-cancel {
    width: 100%;
  }
}
</style>
