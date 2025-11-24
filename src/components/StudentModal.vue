<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  student: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: null,
  },
})

const emit = defineEmits(['close', 'submit'])

const formData = ref({
  section: '',
})

// Watch for changes to the student prop
watch(() => props.student, (newStudent) => {
  if (newStudent) {
    formData.value = {
      section: newStudent.section || '',
    }
  }
  else {
    resetForm()
  }
}, { immediate: true })

function resetForm() {
  formData.value = {
    section: '',
  }
}

function closeModal() {
  resetForm()
  emit('close')
}

function handleSubmit() {
  emit('submit', formData.value)
}
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
    <div class="modal-container">
      <!-- Header -->
      <div class="modal-header">
        <h2 class="modal-title">
          Edit Student Information
        </h2>
        <button class="close-btn" @click="closeModal">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Body -->
      <form class="modal-body" @submit.prevent="handleSubmit">
        <!-- Student Info (Read-only) -->
        <div class="info-section">
          <div class="info-row">
            <span class="info-label">Name:</span>
            <span class="info-value">{{ student?.firstName }} {{ student?.lastName }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Student ID:</span>
            <span class="info-value">{{ student?.studentId }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Email:</span>
            <span class="info-value">{{ student?.email }}</span>
          </div>
          <p class="info-note">
            To update name, email, or student ID, please use User Management.
          </p>
        </div>

        <!-- Section (Editable) -->
        <div class="form-group">
          <label for="section" class="form-label">
            Section
          </label>
          <input
            id="section"
            v-model="formData.section"
            type="text"
            class="form-input"
            placeholder="Enter section (optional)"
          >
        </div>

        <!-- Error Message -->
        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <button
            type="button"
            class="btn-cancel"
            @click="closeModal"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="btn-submit"
            :disabled="loading"
          >
            {{ loading ? 'Saving...' : 'Update' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  backdrop-filter: blur(4px);
}

.modal-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  width: 100%;
  max-width: 500px;
  margin: 1rem;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-gray-200);
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-gray-800);
}

.close-btn {
  color: var(--color-gray-400);
  transition: color 0.2s;
}

.close-btn:hover {
  color: var(--color-gray-600);
}

.modal-body {
  padding: 1.5rem;
}

.info-section {
  background: var(--color-gray-50);
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.info-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.info-row:last-of-type {
  margin-bottom: 0;
}

.info-label {
  font-weight: 500;
  color: var(--color-gray-500);
  min-width: 100px;
}

.info-value {
  color: var(--color-gray-800);
}

.info-note {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-gray-200);
  font-size: 0.875rem;
  color: var(--color-gray-500);
  font-style: italic;
}

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-gray-700);
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--color-gray-300);
  border-radius: 6px;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.1);
}

.error-message {
  background: var(--color-error-bg);
  border: 1px solid var(--color-error-light);
  color: var(--color-error-dark);
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 1rem;
}

.btn-cancel {
  padding: 0.625rem 1.25rem;
  background: var(--color-gray-100);
  color: var(--color-gray-700);
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: var(--color-gray-200);
}

.btn-submit {
  padding: 0.625rem 1.25rem;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  color: white;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.4);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
