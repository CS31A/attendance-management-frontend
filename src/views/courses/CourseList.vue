<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCourseStore } from '@/stores/courseStore'

const router = useRouter()
const courseStore = useCourseStore()

const showDeleteDialog = ref(false)
const courseToDelete = ref(null)

// Check if user is admin (adjust based on your auth implementation)
const isAdmin = computed(() => {
  const userRole = localStorage.getItem('user_role')
  return userRole === 'Admin'
})

onMounted(() => {
  courseStore.fetchCourses()
})

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function editCourse(id) {
  router.push(`/courses/edit/${id}`)
}

function confirmDelete(course) {
  courseToDelete.value = course
  showDeleteDialog.value = true
}

async function handleDelete() {
  if (!courseToDelete.value)
    return

  try {
    await courseStore.deleteCourse(courseToDelete.value.id)
    showDeleteDialog.value = false
    courseToDelete.value = null
  }
  catch {
    // Error is already handled in store
  }
}
</script>

<template>
  <div class="course-list">
    <div class="header">
      <h1>Course Management</h1>
      <button
        v-if="isAdmin"
        class="btn-primary"
        @click="$router.push('/courses/create')"
      >
        Create Course
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="courseStore.loading" class="loading">
      Loading courses...
    </div>

    <!-- Error State -->
    <div v-if="courseStore.error" class="error-message">
      {{ courseStore.error }}
    </div>

    <!-- Empty State -->
    <div v-if="!courseStore.loading && !courseStore.hasCourses" class="empty-state">
      No courses found. Create your first course to get started.
    </div>

    <!-- Course Table -->
    <div v-if="!courseStore.loading && courseStore.hasCourses" class="course-table">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Course Name</th>
            <th>Created At</th>
            <th>Updated At</th>
            <th v-if="isAdmin">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="course in courseStore.sortedCourses" :key="course.id">
            <td>{{ course.id }}</td>
            <td>{{ course.name }}</td>
            <td>{{ formatDate(course.createdAt) }}</td>
            <td>{{ formatDate(course.updatedAt) }}</td>
            <td v-if="isAdmin" class="actions">
              <button
                class="btn-edit"
                @click="editCourse(course.id)"
              >
                Edit
              </button>
              <button
                class="btn-delete"
                @click="confirmDelete(course)"
              >
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Delete Confirmation Dialog -->
    <div v-if="showDeleteDialog" class="dialog-overlay" @click="showDeleteDialog = false">
      <div class="dialog" @click.stop>
        <h3>Confirm Delete</h3>
        <p>Are you sure you want to delete "{{ courseToDelete?.name }}"?</p>
        <div class="dialog-actions">
          <button class="btn-cancel" @click="showDeleteDialog = false">
            Cancel
          </button>
          <button class="btn-delete" @click="handleDelete">
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Add your styles here */
.course-list {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.loading, .error-message, .empty-state {
  padding: 20px;
  text-align: center;
}

.error-message {
  color: #dc3545;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
}

.course-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.actions {
  display: flex;
  gap: 8px;
}

.btn-primary, .btn-edit, .btn-delete, .btn-cancel {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-edit {
  background-color: #ffc107;
  color: #000;
}

.btn-delete {
  background-color: #dc3545;
  color: white;
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dialog {
  background: white;
  padding: 24px;
  border-radius: 8px;
  max-width: 400px;
  width: 100%;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}
</style>
