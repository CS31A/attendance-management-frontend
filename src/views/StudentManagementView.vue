<script setup>
import { AlertTriangle, GraduationCap, Plus, Trash2, UserPlus } from 'lucide-vue-next'
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import SkeletonLoader from '@/components/common/SkeletonLoader.vue'
import { useStudentStore } from '@/stores/studentStore'

const StudentModal = defineAsyncComponent(() => import('@/components/StudentModal.vue'))
const StudentTableSection = defineAsyncComponent(() => import('@/components/tables/StudentTableSection.vue'))
const SearchBar = defineAsyncComponent(() => import('@/components/common/SearchBar.vue'))

const router = useRouter()
const studentStore = useStudentStore()

const showEditModal = ref(false)
const editingStudent = ref(null)
const searchQuery = ref('')
const activeTab = ref('active') // 'active' or 'deleted'
const modalError = ref(null)

onMounted(async () => {
  try {
    await studentStore.fetchStudents()
  }
  catch (error) {
    console.error('Failed to load students:', error)
  }
})

// Computed
const activeStudents = computed(() =>
  studentStore.students.filter(s => !s.deletedAt),
)

const deletedStudents = computed(() =>
  studentStore.students.filter(s => s.deletedAt),
)

const displayedStudents = computed(() => {
  const students = activeTab.value === 'active' ? activeStudents.value : deletedStudents.value
  if (!searchQuery.value) {
    return students
  }

  const query = searchQuery.value.toLowerCase()
  return students.filter((student) => {
    return (
      student.firstName?.toLowerCase().includes(query)
      || student.lastName?.toLowerCase().includes(query)
      || student.studentId?.toLowerCase().includes(query)
      || student.email?.toLowerCase().includes(query)
      || student.section?.toLowerCase().includes(query)
    )
  })
})

// Modal Handlers
function openEditModal(student) {
  editingStudent.value = { ...student }
  modalError.value = null
  showEditModal.value = true
}

function closeModal() {
  showEditModal.value = false
  editingStudent.value = null
  modalError.value = null
}

function navigateToUserManagement() {
  router.push('/users')
}

async function handleUpdateStudent(studentData) {
  try {
    await studentStore.updateStudent(editingStudent.value.id, studentData)
    closeModal()
  }
  catch (error) {
    modalError.value = error.response?.data?.message || 'Failed to update student'
  }
}

async function handleDeleteStudent(student) {
  if (confirm(`Are you sure you want to delete ${student.firstName} ${student.lastName}? This action can be undone by restoring the student.`)) {
    try {
      await studentStore.deleteStudent(student.id)
    }
    catch (error) {
      alert(`Failed to delete student: ${error.response?.data?.message || error.message}`)
    }
  }
}

async function handleRestoreStudent(student) {
  if (confirm(`Are you sure you want to restore ${student.firstName} ${student.lastName}?`)) {
    try {
      await studentStore.restoreStudent(student.id)
    }
    catch (error) {
      alert(`Failed to restore student: ${error.response?.data?.message || error.message}`)
    }
  }
}
</script>

<template>
  <div class="student-management">
    <!-- Loading State -->
    <div v-if="studentStore.loading && !studentStore.students.length" class="loading-skeleton">
      <!-- Header skeleton -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-text">
            <SkeletonLoader type="text" :height="40" :width="300" style="margin-bottom: 0.5rem;" />
            <SkeletonLoader type="text" :height="20" :width="200" />
          </div>
          <SkeletonLoader type="rectangle" :height="50" :width="250" />
        </div>
      </div>

      <!-- Controls skeleton -->
      <div class="controls-section">
        <div class="tabs" style="border: none; margin-bottom: 0;">
          <SkeletonLoader type="rectangle" :height="40" :width="150" style="margin-right: 1rem;" />
          <SkeletonLoader type="rectangle" :height="40" :width="150" />
        </div>
        <SkeletonLoader type="rectangle" :height="50" style="width: 100%; max-width: 500px; margin-top: 1rem;" />
      </div>

      <!-- Table skeleton -->
      <div class="skeleton-table">
        <SkeletonLoader type="rectangle" :height="50" style="margin-bottom: 1rem; width: 100%;" />
        <SkeletonLoader v-for="i in 5" :key="i" type="rectangle" :height="70" style="margin-bottom: 0.5rem; width: 100%;" />
      </div>
    </div>

    <!-- Error message -->
    <div v-else-if="studentStore.error" class="error-message">
      <div class="error-content">
        <AlertTriangle class="error-icon" size="24" />
        <p>{{ studentStore.error }}</p>
        <button class="retry-btn" @click="studentStore.fetchStudents">
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
              Student Management
            </h1>
            <p class="page-subtitle">
              Manage student records and information
            </p>
          </div>
          <button class="btn-add" @click="navigateToUserManagement">
            <UserPlus class="icon" size="20" />
            <span>Create Student (User Management)</span>
          </button>
        </div>
      </div>

      <!-- Tabs and Search -->
      <div class="controls-section">
        <!-- Tabs -->
        <div class="tabs">
          <button
            class="tab"
            :class="{ active: activeTab === 'active' }"
            @click="activeTab = 'active'"
          >
            <GraduationCap :size="18" />
            <span>Active Students</span>
            <span class="badge">{{ activeStudents.length }}</span>
          </button>
          <button
            class="tab"
            :class="{ active: activeTab === 'deleted' }"
            @click="activeTab = 'deleted'"
          >
            <Trash2 :size="18" />
            <span>Deleted Students</span>
            <span class="badge">{{ deletedStudents.length }}</span>
          </button>
        </div>

        <!-- Search -->
        <SearchBar
          v-model="searchQuery"
          placeholder="Search by name, student ID, email, or section..."
          class="student-search-bar"
        />
      </div>

      <!-- Students Table -->
      <StudentTableSection
        v-if="displayedStudents.length > 0"
        :students="displayedStudents"
        :loading="studentStore.loading"
        :show-deleted="activeTab === 'deleted'"
        @edit="openEditModal"
        @delete="handleDeleteStudent"
        @restore="handleRestoreStudent"
      />

      <!-- Empty State -->
      <div v-else class="empty-state">
        <div class="empty-icon-container">
          <GraduationCap class="empty-icon" size="48" />
        </div>
        <h3 class="empty-title">
          {{ activeTab === 'active' ? 'No Active Students Found' : 'No Deleted Students' }}
        </h3>
        <p class="empty-description">
          {{ searchQuery
            ? 'Try adjusting your search query'
            : activeTab === 'active'
              ? 'Get started by creating your first student through User Management'
              : 'No students have been deleted yet'
          }}
        </p>
        <button v-if="!searchQuery && activeTab === 'active'" class="btn-empty-action" @click="navigateToUserManagement">
          <Plus class="icon" size="20" />
          <span>Create Your First Student</span>
        </button>
      </div>
    </div>

    <!-- Edit Student Modal -->
    <StudentModal
      v-if="showEditModal"
      :is-open="showEditModal"
      :student="editingStudent"
      :loading="studentStore.loading"
      :error="modalError"
      @close="closeModal"
      @submit="handleUpdateStudent"
    />
  </div>
</template>

<style scoped>
/* Main Container */
.student-management {
  min-height: 100vh;
  background: var(--color-slate-100);
  padding: 2rem;
  position: relative;
  overflow-x: hidden;
}

.student-management::before {
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

/* Loading Overlay */
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

/* Error Message */
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

.error-icon {
  color: var(--color-error-dark);
}

.retry-btn {
  background: white;
  border: 1px solid var(--color-error-light);
  color: var(--color-error-darkest);
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  background: var(--color-error-bg);
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
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  color: white;
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px -1px rgba(30, 58, 138, 0.2);
  border: none;
  cursor: pointer;
}

.btn-add:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(30, 58, 138, 0.3);
}

.btn-add .icon {
  flex-shrink: 0;
}

/* Controls Section */
.controls-section {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--color-gray-200);
}

/* Tabs */
.tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid var(--color-gray-200);
  padding-bottom: 0.5rem;
}

.tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: transparent;
  color: var(--color-gray-500);
  border-radius: 8px 8px 0 0;
  font-weight: 500;
  transition: all 0.2s ease;
  position: relative;
  border: none;
  cursor: pointer;
}

.tab:hover {
  color: var(--color-primary);
  background: var(--color-slate-100);
}

.tab.active {
  color: var(--color-primary);
  background: var(--color-info-bg);
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: -0.5rem;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--color-primary);
}

.tab .badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
  height: 1.5rem;
  padding: 0 0.5rem;
  background: var(--color-gray-200);
  color: var(--color-gray-700);
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.tab.active .badge {
  background: var(--color-primary);
  color: white;
}

.student-search-bar {
  max-width: 500px;
}

/* Empty State */
.empty-state {
  background: white;
  border-radius: 16px;
  padding: 4rem 2rem;
  text-align: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--color-gray-200);
}

.empty-icon-container {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, var(--color-info-bg) 0%, var(--color-info-lighter) 100%);
  border-radius: 50%;
  margin-bottom: 1.5rem;
}

.empty-icon {
  color: var(--color-primary);
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-gray-800);
  margin-bottom: 0.5rem;
}

.empty-description {
  color: var(--color-gray-500);
  margin-bottom: 2rem;
}

.btn-empty-action {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  color: white;
  border-radius: 12px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px -1px rgba(30, 58, 138, 0.2);
  border: none;
  cursor: pointer;
}

.btn-empty-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(30, 58, 138, 0.3);
}

/* Responsive */
@media (max-width: 768px) {
  .student-management {
    padding: 1rem;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .header-content {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-add {
    width: 100%;
    justify-content: center;
  }

  .tabs {
    flex-direction: column;
    gap: 0.5rem;
  }

  .tab {
    border-radius: 8px;
  }

  .tab.active::after {
    display: none;
  }

  .search-box {
    max-width: 100%;
  }
}
</style>
