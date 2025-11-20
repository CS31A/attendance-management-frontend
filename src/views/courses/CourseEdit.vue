<template>
  <div class="course-edit">
    <h1>Edit Course</h1>

    <div v-if="loading" class="loading">Loading course data...</div>

    <form v-else @submit.prevent="handleSubmit">
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
        />
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
          @click="$router.back()"
          class="btn-cancel"
          :disabled="courseStore.loading"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          class="btn-submit"
          :disabled="courseStore.loading || !isFormValid"
        >
          {{ courseStore.loading ? 'Update Course' : 'Update Course' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useCourseStore } from '@/stores/courseStore';

const router = useRouter();
const route = useRoute();
const courseStore = useCourseStore();

const loading = ref(true);
const formData = reactive({
  name: '',
});

const validationError = reactive({
  name: '',
});

const isFormValid = computed(() => {
  return formData.name.length >= 20 && formData.name.length <= 100;
});

onMounted(async () => {
  const courseId = route.params.id;
  if (courseId) {
    await courseStore.fetchCourse(courseId);
    if (courseStore.currentCourse) {
      formData.name = courseStore.currentCourse.name;
    }
    loading.value = false;
  }
});

const validateForm = () => {
  let isValid = true;
  
  // Reset errors
  validationError.name = '';
  
  // Validate name
  if (!formData.name) {
    validationError.name = 'Course name is required';
    isValid = false;
  } else if (formData.name.length < 20) {
    validationError.name = 'Course name must be at least 20 characters';
    isValid = false;
  } else if (formData.name.length > 100) {
    validationError.name = 'Course name must not exceed 100 characters';
    isValid = false;
  }
  
  return isValid;
};

const handleSubmit = async () => {
  if (!validateForm()) {
    return;
  }
  
  try {
    await courseStore.updateCourse(route.params.id, formData);
    router.push('/courses');
  } catch (err) {
    // Error is handled in store
  }
};
</script>

<style scoped>
/* Add your styles here */
.course-edit {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.loading {
  text-align: center;
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
