<script setup>
import { AlertTriangle, Calendar, Mail, Plus, Trash2, User, UserPlus, Users } from 'lucide-vue-next'
import { computed, defineAsyncComponent, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@/components/common/BaseButton.vue'
import DeleteModal from '@/components/common/DeleteModal.vue'
import DetailsModal from '@/components/common/DetailsModal.vue'
import FormModal from '@/components/common/FormModal.vue'
import SkeletonLoader from '@/components/common/SkeletonLoader.vue'
import Toast from '@/components/common/Toast.vue'
import { useInstructorStore } from '@/stores/instructorStore'

const InstructorTableSection = defineAsyncComponent(() => import('@/components/tables/InstructorTableSection.vue'))
const SearchBar = defineAsyncComponent(() => import('@/components/common/SearchBar.vue'))

const router = useRouter()
const instructorStore = useInstructorStore()

const showEditModal = ref(false)
const editingInstructor = ref(null)
const searchQuery = ref('')
const activeTab = ref('active') // 'active' or 'deleted'
const modalError = ref(null)
const formModalRef = ref(null)

// Instructor form field configuration
const instructorFields = [
  {
    name: 'firstname',
    label: 'First Name',
    type: 'text',
    icon: User,
    placeholder: 'Enter first name',
    required: true,
    maxlength: 100,
  },
  {
    name: 'lastname',
    label: 'Last Name',
    type: 'text',
    icon: User,
    placeholder: 'Enter last name',
    required: true,
    maxlength: 100,
  },
]

// Info section for the edit modal
const instructorInfoSection = computed(() => {
  if (!editingInstructor.value)
    return null

  return {
    title: 'User Information',
    note: 'To update email or username, please use User Management.',
    fields: [
      { label: 'Email', value: editingInstructor.value.email },
      { label: 'User ID', value: editingInstructor.value.instructorId },
    ],
  }
})

// Delete modal state
const showDeleteModal = ref(false)
const instructorToDelete = ref(null)
const isDeleting = ref(false)
const deleteType = ref('soft') // 'soft' or 'hard'

// Details modal state
const showDetailsModal = ref(false)
const selectedInstructor = ref(null)
const instructorDetails = ref([])

onMounted(async () => {
  try {
    await instructorStore.fetchInstructors()
  }
  catch (error) {
    console.error('Failed to load instructors:', error)
  }
})

// Computed
const activeInstructors = computed(() =>
  instructorStore.instructors.filter(i => !i.deletedAt),
)

const deletedInstructors = computed(() =>
  instructorStore.instructors.filter(i => i.deletedAt),
)

const displayedInstructors = computed(() => {
  const instructors = activeTab.value === 'active' ? activeInstructors.value : deletedInstructors.value
  if (!searchQuery.value) {
    return instructors
  }

  const query = searchQuery.value.toLowerCase()
  return instructors.filter((instructor) => {
    return (
      instructor.firstName?.toLowerCase().includes(query)
      || instructor.lastName?.toLowerCase().includes(query)
      || instructor.email?.toLowerCase().includes(query)
    )
  })
})

// Modal Handlers
function openEditModal(instructor) {
  editingInstructor.value = { ...instructor }
  modalError.value = null
  showEditModal.value = true
}

function closeModal() {
  showEditModal.value = false
  editingInstructor.value = null
  modalError.value = null
}

function navigateToUserManagement() {
  router.push('/users')
}

function handleViewSchedule(instructor) {
  router.push({ path: '/schedules', query: { instructorId: instructor.id } })
}

// Toast state and helpers
const toast = reactive({
  show: false,
  message: '',
  type: 'success',
  duration: 3000,
})

function showToast(message, type = 'success', duration = 3000) {
  toast.message = message
  toast.type = type
  toast.duration = duration
  toast.show = true
}

function closeToast() {
  toast.show = false
}

async function handleUpdateInstructor(instructorData) {
  try {
    await instructorStore.updateInstructor(editingInstructor.value.id, instructorData)
    closeModal()
    showToast('Instructor updated successfully', 'success')
  }
  catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to update instructor'
    // Pass error to FormModal
    if (formModalRef.value) {
      formModalRef.value.handleError(errorMessage)
    }
  }
}

function handleSoftDeleteInstructor(instructor) {
  instructorToDelete.value = instructor
  deleteType.value = 'soft'
  showDeleteModal.value = true
}

function handleHardDeleteInstructor(instructor) {
  instructorToDelete.value = instructor
  deleteType.value = 'hard'
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!instructorToDelete.value)
    return

  isDeleting.value = true
  try {
    if (deleteType.value === 'soft') {
      await instructorStore.softDeleteInstructor(instructorToDelete.value.id)
      showToast('Instructor soft deleted successfully', 'success')
    }
    else {
      await instructorStore.hardDeleteInstructor(instructorToDelete.value.id)
      showToast('Instructor permanently deleted', 'success')
    }
    showDeleteModal.value = false
    instructorToDelete.value = null
  }
  catch (error) {
    const action = deleteType.value === 'soft' ? 'soft delete' : 'permanently delete'
    showToast(`Failed to ${action} instructor: ${error.response?.data?.message || error.message}`, 'error')
  }
  finally {
    isDeleting.value = false
  }
}

function cancelDelete() {
  showDeleteModal.value = false
  instructorToDelete.value = null
}

async function handleRestoreInstructor(instructor) {
  if (confirm(`Are you sure you want to restore ${instructor.firstName} ${instructor.lastName}?`)) {
    try {
      await instructorStore.restoreInstructor(instructor.id)
      showToast('Instructor restored successfully', 'success')
    }
    catch (error) {
      showToast(`Failed to restore instructor: ${error.response?.data?.message || error.message}`, 'error')
    }
  }
}

// View instructor details handler
function handleViewInstructor(instructor) {
  selectedInstructor.value = instructor

  // Format instructor data into display items
  instructorDetails.value = [
    {
      label: 'ID',
      value: instructor.id,
      icon: null,
    },
    {
      label: 'First Name',
      value: instructor.firstName,
      icon: User,
    },
    {
      label: 'Last Name',
      value: instructor.lastName,
      icon: User,
    },
    {
      label: 'Email',
      value: instructor.email,
      icon: Mail,
      fullWidth: true,
    },
    {
      label: 'User ID',
      value: instructor.instructorId,
      fullWidth: true,
    },
    {
      label: 'Created At',
      value: instructor.createdAt ? new Date(instructor.createdAt).toLocaleString() : '-',
      icon: Calendar,
      fullWidth: true,
    },
    {
      label: 'Updated At',
      value: instructor.updatedAt ? new Date(instructor.updatedAt).toLocaleString() : '-',
      icon: Calendar,
      fullWidth: true,
    },
  ]

  // Add deleted status if applicable
  if (instructor.deletedAt) {
    instructorDetails.value.push({
      label: 'Deleted At',
      value: new Date(instructor.deletedAt).toLocaleString(),
      icon: Calendar,
      badge: true,
      badgeClass: 'error',
      fullWidth: true,
    })
  }

  showDetailsModal.value = true
}

function closeDetailsModal() {
  showDetailsModal.value = false
  selectedInstructor.value = null
  instructorDetails.value = []
}
</script>

<template>
  <div class="instructor-management">
    <!-- Loading State -->
    <div v-if="instructorStore.loading && !instructorStore.instructors.length" class="loading-skeleton">
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
    <div v-else-if="instructorStore.error" class="error-message">
      <div class="error-content">
        <AlertTriangle class="error-icon" size="24" />
        <p>{{ instructorStore.error }}</p>
        <BaseButton variant="secondary" size="small" @click="instructorStore.fetchInstructors">
          Retry
        </BaseButton>
      </div>
    </div>

    <div v-else class="container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-text">
            <h1 class="page-title">
              Instructor Management
            </h1>
            <p class="page-subtitle">
              Manage instructor records and information
            </p>
          </div>
          <BaseButton variant="primary" :icon="UserPlus" @click="navigateToUserManagement">
            Create Instructor (User Management)
          </BaseButton>
        </div>
      </div>

      <!-- Tabs and Search -->
      <div class="controls-section">
        <!-- Tabs -->
        <div class="tabs">
          <BaseButton
            :variant="activeTab === 'active' ? 'primary' : 'ghost'"
            size="small"
            :icon="Users"
            @click="activeTab = 'active'"
          >
            Active Instructors ({{ activeInstructors.length }})
          </BaseButton>
          <BaseButton
            :variant="activeTab === 'deleted' ? 'primary' : 'ghost'"
            size="small"
            :icon="Trash2"
            @click="activeTab = 'deleted'"
          >
            Deleted Instructors ({{ deletedInstructors.length }})
          </BaseButton>
        </div>

        <!-- Search -->
        <SearchBar
          v-model="searchQuery"
          placeholder="Search by name or email..."
          class="instructor-search-bar"
        />
      </div>

      <!-- Instructors Table -->
      <InstructorTableSection
        v-if="displayedInstructors.length > 0"
        :instructors="displayedInstructors"
        :loading="instructorStore.loading"
        :show-deleted="activeTab === 'deleted'"
        @view="handleViewInstructor"
        @view-schedule="handleViewSchedule"
        @edit="openEditModal"
        @soft-delete="handleSoftDeleteInstructor"
        @delete="handleHardDeleteInstructor"
        @restore="handleRestoreInstructor"
      />

      <!-- Empty State -->
      <div v-else class="empty-state">
        <div class="empty-icon-container">
          <Users class="empty-icon" size="48" />
        </div>
        <h3 class="empty-title">
          {{ activeTab === 'active' ? 'No Active Instructors Found' : 'No Deleted Instructors' }}
        </h3>
        <p class="empty-description">
          {{ searchQuery
            ? 'Try adjusting your search query'
            : activeTab === 'active'
              ? 'Get started by creating your first instructor through User Management'
              : 'No instructors have been deleted yet'
          }}
        </p>
        <BaseButton v-if="!searchQuery && activeTab === 'active'" variant="primary" :icon="Plus" @click="navigateToUserManagement">
          Create Your First Instructor
        </BaseButton>
      </div>
    </div>

    <!-- Edit Instructor Modal -->
    <FormModal
      ref="formModalRef"
      :show="showEditModal"
      :entity="editingInstructor"
      title="Instructor"
      :fields="instructorFields"
      :info-section="instructorInfoSection"
      size="medium"
      :loading="instructorStore.loading"
      @save="handleUpdateInstructor"
      @cancel="closeModal"
    />

    <!-- Delete Modal -->
    <DeleteModal
      :show="showDeleteModal"
      :title="deleteType === 'soft' ? 'Soft Delete Instructor' : 'Permanently Delete Instructor'"
      :message="deleteType === 'soft'
        ? 'Mark this instructor as deleted? This action can be undone by restoring the instructor.'
        : 'Permanently delete this instructor? This action cannot be undone and will remove all related data.'"
      :item-name="instructorToDelete ? `${instructorToDelete.firstName || instructorToDelete.firstname} ${instructorToDelete.lastName || instructorToDelete.lastname}` : ''"
      :is-deleting="isDeleting"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />

    <!-- Details Modal -->
    <DetailsModal
      :show="showDetailsModal"
      :title="selectedInstructor ? `${selectedInstructor.firstName} ${selectedInstructor.lastName}` : 'Instructor Details'"
      :items="instructorDetails"
      :icon="Users"
      icon-color="var(--color-primary)"
      @close="closeDetailsModal"
    />

    <!-- Toast Notification -->
    <Toast
      :show="toast.show"
      :message="toast.message"
      :type="toast.type"
      :duration="toast.duration"
      @close="closeToast"
    />
  </div>
</template>

<style scoped>
/* Main Container */
.instructor-management {
  min-height: 100vh;
  background: var(--color-slate-100);
  padding: 1rem;
  position: relative;
  overflow-x: hidden;
}

.instructor-management::before {
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

/* Header */
.page-header {
  margin-bottom: 1rem;
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
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--color-primary);
  margin: 0 0 0.25rem 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-subtitle {
  font-size: 0.875rem;
  color: var(--color-gray-500);
  margin: 0;
  font-weight: 300;
}

/* Controls Section */
.controls-section {
  background: white;
  border-radius: 16px;
  padding: 0.75rem;
  margin-bottom: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--color-gray-200);
}

/* Tabs */
.tabs {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.instructor-search-bar {
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

/* Responsive */
@media (max-width: 768px) {
  .instructor-management {
    padding: 1rem;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .header-content {
    flex-direction: column;
    align-items: stretch;
  }

  .tabs {
    flex-direction: column;
    gap: 0.5rem;
  }

  .search-box {
    max-width: 100%;
  }
}
</style>
