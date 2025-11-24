<script setup>
import { AlertTriangle, Plus } from 'lucide-vue-next'
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import { useSubjectStore } from '@/stores/subjectStore.js'

const SubjectModal = defineAsyncComponent(() => import('@/components/SubjectModal.vue'))
const SubjectTableSection = defineAsyncComponent(() => import('@/components/tables/SubjectTableSection.vue'))

const subjectStore = useSubjectStore()
const showModal = ref(false)
const selectedSubject = ref(null)
const modalRef = ref(null)

// Pagination state
const currentPage = ref(1)
const itemsPerPage = ref(10)

// Computed values
const subjects = computed(() => subjectStore.sortedSubjects)
const totalSubjects = computed(() => subjects.value.length)
const totalPages = computed(() => Math.ceil(totalSubjects.value / itemsPerPage.value))
const hasNextPage = computed(() => currentPage.value < totalPages.value)
const hasPreviousPage = computed(() => currentPage.value > 1)

// Paginated subjects
const paginatedSubjects = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return subjects.value.slice(start, end)
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
  selectedSubject.value = null
  showModal.value = true
}

function openEditModal(subject) {
  selectedSubject.value = { ...subject }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  selectedSubject.value = null
}

async function handleSaveSubject(subjectData) {
  try {
    if (selectedSubject.value) {
      // Edit mode
      await subjectStore.updateSubject(selectedSubject.value.id, subjectData)
    }
    else {
      // Create mode
      await subjectStore.createSubject(subjectData)
    }
    closeModal()
  }
  catch (error) {
    if (modalRef.value) {
      modalRef.value.handleError(error.response?.data?.message || 'Failed to save subject')
    }
  }
}

async function handleDeleteSubject(subjectId) {
  if (confirm('Are you sure you want to delete this subject? This action cannot be undone.')) {
    try {
      await subjectStore.deleteSubject(subjectId)
      // Adjust pagination if needed
      if (paginatedSubjects.value.length === 0 && currentPage.value > 1) {
        currentPage.value--
      }
    }
    catch (error) {
      alert(`Failed to delete subject: ${error.response?.data?.message || error.message}`)
    }
  }
}

onMounted(async () => {
  try {
    await subjectStore.fetchSubjects()
  }
  catch {
    // Error handled silently
  }
})
</script>

<template>
  <div class="subject-management">
    <!-- Loading overlay -->
    <div v-if="subjectStore.loading" class="loading-overlay">
      <div class="loading-spinner">
        <div class="spinner" />
        <p>Loading...</p>
      </div>
    </div>

    <!-- Error message -->
    <div v-if="subjectStore.error" class="error-message">
      <div class="error-content">
        <AlertTriangle class="error-icon" size="24" />
        <p>{{ subjectStore.error }}</p>
        <button class="retry-btn" @click="subjectStore.fetchSubjects">
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
              Subject Management
            </h1>
            <p class="page-subtitle">
              Manage Subjects
            </p>
          </div>
          <button class="btn-add" @click="openAddModal">
            <Plus class="icon" size="20" />
            <span>Add Subject</span>
          </button>
        </div>
      </div>

      <SubjectTableSection
        :subjects="paginatedSubjects"
        title="All Subjects"
        :pagination="{
          currentPage,
          totalPages,
          hasNextPage,
          hasPreviousPage,
          totalSubjects,
          itemsPerPage,
        }"
        @next-page="handleNextPage"
        @previous-page="handlePreviousPage"
        @go-to-page="handleGoToPage"
        @set-items-per-page="handleSetItemsPerPage"
        @edit="openEditModal"
        @delete="handleDeleteSubject"
      />
    </div>

    <!-- Modal -->
    <SubjectModal
      v-if="showModal"
      ref="modalRef"
      :subject="selectedSubject"
      @save="handleSaveSubject"
      @cancel="closeModal"
    />
  </div>
</template>

<style scoped>
/* Main Container */
.subject-management {
  min-height: 100vh;
  background: var(--color-slate-100);
  padding: 2rem;
  position: relative;
  overflow-x: hidden;
}

.subject-management::before {
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
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.header-text {
  flex: 1;
  min-width: 250px;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--color-primary);
  margin: 0 0 0.5rem 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-subtitle {
  font-size: 1.1rem;
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
  padding: 0.75rem 1.5rem;
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

/* Loading & Error States */
.loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 50;
  backdrop-filter: blur(4px);
}

.loading-spinner {
  text-align: center;
  color: var(--color-primary);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-slate-200);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

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

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
