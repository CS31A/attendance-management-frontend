<script setup lang="ts">
import type { EntityId } from '@/types'
import { AlertTriangle, BookOpen, Loader2, X } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { useCourseStore } from '@/stores/courseStore'

const props = defineProps<{
  section?: {
    name?: string
    courseId?: EntityId
    [key: string]: unknown
  } | null
  loading?: boolean
}>()

const emit = defineEmits<{
  save: [sectionData: { name: string, courseId: EntityId }]
  cancel: []
}>()

const courseStore = useCourseStore()

// Form data
const name = ref('')
const courseId = ref<EntityId | ''>('')
const errorMessage = ref('')

// Initialize form if editing
watch(() => props.section, (newSection) => {
  if (newSection) {
    name.value = newSection.name || ''
    courseId.value = newSection.courseId || ''
  }
  else {
    name.value = ''
    courseId.value = ''
  }
}, { immediate: true })

// Fetch courses on mount
onMounted(async () => {
  if (!courseStore.hasCourses) {
    await courseStore.fetchCourses()
  }
})

// Computed properties
const isEditMode = computed(() => !!props.section)
const modalTitle = computed(() => isEditMode.value ? 'Edit Section' : 'Create Section')
const submitButtonText = computed(() => isEditMode.value ? 'Save Changes' : 'Create Section')

const isFormValid = computed(() => {
  return name.value && name.value.length >= 4 && courseId.value
})

// Main form submission
function handleSubmit() {
  errorMessage.value = ''

  // Validation
  if (name.value.length < 4) {
    errorMessage.value = 'Section name must be at least 4 characters'
    return
  }

  if (!courseId.value) {
    errorMessage.value = 'Course ID is required'
    return
  }

  const sectionData = {
    name: name.value,
    courseId: courseId.value as EntityId,
  }

  emit('save', sectionData)
}

// Handle error from parent
function handleError(error: string) {
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
        <button type="button" class="btn-close" :disabled="loading" @click="$emit('cancel')">
          <X :size="24" />
        </button>
      </div>

      <!-- Error Message Display -->
      <div v-if="errorMessage" class="error-message">
        <div class="error-content">
          <AlertTriangle class="error-icon" :size="20" />
          <p>{{ errorMessage }}</p>
        </div>
      </div>

      <!-- Modal Body -->
      <form class="modal-body" @submit.prevent="handleSubmit">
        <!-- Name Field -->
        <div class="form-group">
          <label>Section Name *</label>
          <div class="input-wrapper">
            <BookOpen class="input-icon" :size="18" />
            <input
              v-model="name"
              type="text"
              placeholder="Enter section name (e.g. BSIT 3A)"
              required
              minlength="4"
            >
          </div>
          <small class="helper-text info">Must be at least 4 characters</small>
        </div>

        <!-- Course Field -->
        <div class="form-group">
          <label>Course *</label>
          <select
            v-model="courseId"
            class="form-select"
            required
            :disabled="courseStore.loading"
          >
            <option value="" disabled>
              Select a course
            </option>
            <option v-for="course in courseStore.sortedCourses" :key="course.id" :value="course.id">
              {{ course.name }}
            </option>
          </select>
          <small v-if="courseStore.loading" class="helper-text info">Loading courses...</small>
          <small v-else-if="!courseStore.hasCourses" class="helper-text error">No courses available</small>
          <small v-else class="helper-text info">Select the course this section belongs to</small>
        </div>

        <!-- Actions -->
        <div class="actions">
          <button type="submit" class="btn-submit" :disabled="!isFormValid || loading">
            <Loader2 v-if="loading" class="loading-spinner-btn" :size="18" />
            <span v-else>{{ submitButtonText }}</span>
          </button>
          <button type="button" class="btn-cancel" :disabled="loading" @click="$emit('cancel')">
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
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
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
  display: flex;
  align-items: center;
  justify-content: center;
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
.form-group select {
  display: block;
  width: 100%;
  padding: 0.75rem 1rem;
  padding-left: 2.5rem; /* Space for icon */
  border: 1px solid var(--color-gray-200);
  border-radius: 0.5rem;
  font-size: 0.95rem;
  outline: none;
  transition: all 0.2s;
  background-color: var(--color-gray-50);
}

/* Adjust padding for inputs/selects without icons */
.form-group input[type="number"],
.form-group select {
  padding-left: 1rem;
}

.form-group input:focus,
.form-group select:focus {
  border-color: var(--color-primary);
  background-color: white;
  box-shadow: 0 0 0 4px rgba(30, 58, 138, 0.1);
}

.form-group select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  }

  .actions {
    flex-direction: column-reverse;
  }

  .btn-submit, .btn-cancel {
    width: 100%;
  }
}
</style>
