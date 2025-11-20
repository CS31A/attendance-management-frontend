<script setup>
import { computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useCourseStore } from '@/stores/courseStore'

const router = useRouter()
const courseStore = useCourseStore()

const formData = reactive({
  name: '',
})

const validationError = reactive({
  name: '',
})

const isFormValid = computed(() => {
  return formData.name.length >= 20 && formData.name.length <= 100
})

function validateForm() {
  let isValid = true

  // Reset errors
  validationError.name = ''

  // Validate name
  if (!formData.name) {
    validationError.name = 'Course name is required'
    isValid = false
  }
  else if (formData.name.length < 20) {
    validationError.name = 'Course name must be at least 20 characters'
    isValid = false
  }
  else if (formData.name.length > 100) {
    validationError.name = 'Course name must not exceed 100 characters'
    isValid = false
  }

  return isValid
}

async function handleSubmit() {
  if (!validateForm()) {
    return
  }

  try {
    await courseStore.createCourse(formData)
    router.push('/courses')
  }
  catch {
    // Error is handled in store
  }
}
</script>

<template>
  <div class="course-create">
    <h1>Create New Course</h1>

    <form @submit.prevent="handleSubmit">
      <!-- Course Name -->
      <div class="form-group">
        <label for="name">Course Name *</label>
        <input
          id="name"
          v-model="formData.name"
          type="text"
          placeholder="Enter course name (min 20 characters)"
          :disabled="courseStore.loading"
          required
          minlength="20"
          maxlength="100"
        >
        <small class="help-text">
          {{ formData.name.length }}/100 characters (minimum 20 required)
        </small>
        <span v-if="validationError.name" class="error">
          {{ validationError.name }}
        </span>
      </div>

      <!-- Error Display -->
      <div v-if="courseStore.error" class="error-message">
        {{ courseStore.error }}
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button
          type="button"
          class="btn-cancel"
          :disabled="courseStore.loading"
          @click="$router.back()"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="btn-submit"
          :disabled="courseStore.loading || !isFormValid"
        >
          {{ courseStore.loading ? 'Creating...' : 'Create Course' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
/* Add your styles here */
.course-create {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.help-text {
  display: block;
  margin-top: 4px;
  color: #6c757d;
  font-size: 12px;
}

.error {
  display: block;
  color: #dc3545;
  font-size: 12px;
  margin-top: 4px;
}

.error-message {
  padding: 12px;
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  margin-bottom: 20px;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-submit, .btn-cancel {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-submit {
  background-color: #28a745;
  color: white;
}

.btn-submit:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.btn-cancel {
  background-color: #6c757d;
  color: white;
}
</style>
