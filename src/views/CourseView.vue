<script setup>
import { AlertTriangle, Plus } from 'lucide-vue-next'
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import { useCourseStore } from '@/stores/courseStore.js'

const CourseModal = defineAsyncComponent(() => import('@/components/CourseModal.vue'))
const CourseTableSection = defineAsyncComponent(() => import('@/components/tables/CourseTableSection.vue'))
const SkeletonLoader = defineAsyncComponent(() => import('@/components/common/SkeletonLoader.vue'))

const courseStore = useCourseStore()
const showModal = ref(false)
const selectedCourse = ref(null)
const modalRef = ref(null)

// Pagination state
const currentPage = ref(1)
const itemsPerPage = ref(10)

// Computed values
const courses = computed(() => courseStore.sortedCourses)
const totalCourses = computed(() => courses.value.length)
const totalPages = computed(() => Math.ceil(totalCourses.value / itemsPerPage.value))
const hasNextPage = computed(() => currentPage.value < totalPages.value)
const hasPreviousPage = computed(() => currentPage.value > 1)

// Paginated courses
const paginatedCourses = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return courses.value.slice(start, end)
})

// Pagination handlers
function handleNextPage() {
  if (hasNextPage.value) {
    currentPage.value++
  }
}

function handlePreviousPage() {
  if (hasPreviousPage.value) {
    currentPage.value--
  }
}

function handleGoToPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

function handleSetItemsPerPage(value) {
  itemsPerPage.value = value
  currentPage.value = 1 // Reset to first page
}

// Modal Handlers
function openAddModal() {
  selectedCourse.value = null
  showModal.value = true
}

function openEditModal(course) {
  selectedCourse.value = { ...course }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  selectedCourse.value = null
}

async function handleSaveCourse(courseData) {
  try {
    if (selectedCourse.value) {
      // Edit mode
      await courseStore.updateCourse(selectedCourse.value.id, courseData)
    }
    else {
      // Create mode
      await courseStore.createCourse(courseData)
    }
    closeModal()
  }
  catch (error) {
    if (modalRef.value) {
      modalRef.value.handleError(error.response?.data?.message || 'Failed to save course')
    }
  }
}

async function handleDeleteCourse(courseId) {
  if (confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
    try {
      await courseStore.deleteCourse(courseId)
      // Adjust pagination if needed
      if (paginatedCourses.value.length === 0 && currentPage.value > 1) {
        currentPage.value--
      }
    }
    catch (error) {
      alert(`Failed to delete course: ${error.response?.data?.message || error.message}`)
    }
  }
}

onMounted(async () => {
  try {
    await courseStore.fetchCourses()
  }
  catch {
    // Error handled silently
  }
})
</script>

<template>
  <div class="course-management">
    <!-- Loading State -->
    <template v-if="courseStore.loading">
      <div class="container">
        <!-- Header skeleton -->
        <div class="page-header">
          <div class="header-content">
            <div class="header-text">
              <SkeletonLoader type="text" :height="40" :width="300" style="margin-bottom: 0.5rem;" />
              <SkeletonLoader type="text" :height="20" :width="200" />
            </div>
            <SkeletonLoader type="rectangle" :height="50" :width="150" />
          </div>
        </div>

        <!-- Table skeleton -->
        <div class="skeleton-table">
          <SkeletonLoader type="rectangle" :height="50" style="margin-bottom: 1rem; width: 100%;" />
          <SkeletonLoader v-for="i in 5" :key="i" type="rectangle" :height="60" style="margin-bottom: 0.5rem; width: 100%;" />
        </div>
      </div>
    </template>

    <!-- Error message -->
    <div v-else-if="courseStore.error" class="error-message">
      <div class="error-content">
        <AlertTriangle class="error-icon" size="24" />
        <p>{{ courseStore.error }}</p>
        <button class="retry-btn" @click="courseStore.fetchCourses">
          Retry
        </button>
      </div>
    </div>

    <div v-else class="container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-text">
            <h1 class="page-title">
              Course Management
            </h1>
            <p class="page-subtitle">
              Manage Courses
            </p>
          </div>
          <button class="btn-add" @click="openAddModal">
            <Plus class="icon" size="20" />
            <span>Add Course</span>
          </button>
        </div>
      </div>

      <CourseTableSection
        :courses="paginatedCourses"
        title="All Courses"
        :pagination="{
          currentPage,
          totalPages,
          hasNextPage,
          hasPreviousPage,
          totalCourses,
          itemsPerPage,
        }"
        @next-page="handleNextPage"
        @previous-page="handlePreviousPage"
        @go-to-page="handleGoToPage"
        @set-items-per-page="handleSetItemsPerPage"
        @edit="openEditModal"
        @delete="handleDeleteCourse"
      />
    </div>

    <!-- Modal -->
    <CourseModal
      v-if="showModal"
      ref="modalRef"
      :course="selectedCourse"
      @save="handleSaveCourse"
      @cancel="closeModal"
    />
  </div>
</template>

<style scoped>
/* Main Container */
.course-management {
  min-height: 100vh;
  background: var(--color-slate-100);
  padding: 1.5rem;
  position: relative;
  overflow-x: hidden;
}

.course-management::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="10" cy="60" r="0.5" fill="white" opacity="0.1"/><circle cx="90" cy="40" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
  pointer-events: none;
}
.container {
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}
/* Header */
.page-header {
  margin-bottom: 1.5rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-text {
  flex: 1;
  min-width: 250px;
}

.page-title {
  font-size: 2rem;
  font-weight: 800;
  color: var(--color-primary);
  margin: 0 0 0.375rem 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-subtitle {
  font-size: 1rem;
  color: var(--color-gray-500);
  margin: 0;
  font-weight: 300;
}

.btn-add {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  color: white;
  border: none;
  padding: 0.625rem 1.25rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px -1px rgba(30, 58, 138, 0.2);
}

.btn-add:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(30, 58, 138, 0.3);
}

/* Error States */
.error-message {
  max-width: 600px;
  margin: 2rem auto;
  padding: 1rem;
  background: var(--color-error-bg);
  border: 1px solid var(--color-error-light);
  border-radius: 12px;
  color: var(--color-error-darkest);
}

.error-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: center;
}

.retry-btn {
  background: white;
  border: 1px solid var(--color-error-light);
  color: var(--color-error-darkest);
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
}
</style>
