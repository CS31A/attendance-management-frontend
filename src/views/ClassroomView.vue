<script setup lang="ts">
import type { ClassroomDto, ClassroomPayload } from '@/api/classrooms'
import type { EntityId } from '@/types'
import type { FormFieldConfig, HandleErrorableModal } from '@/types/ui'
import { AlertTriangle, DoorOpen, Plus } from 'lucide-vue-next'
import { computed, defineAsyncComponent, onMounted, reactive, ref } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import DeleteModal from '@/components/common/DeleteModal.vue'
import FormModal from '@/components/common/FormModal.vue'
import Toast from '@/components/common/Toast.vue'
import { useClassroomStore } from '@/stores/classroomStore'

const ClassroomTableSection = defineAsyncComponent(() => import('@/components/tables/ClassroomTableSection.vue'))
const SkeletonLoader = defineAsyncComponent(() => import('@/components/common/SkeletonLoader.vue'))

type ToastType = 'success' | 'error'

// Field configuration for FormModal
const classroomFields: FormFieldConfig[] = [
  {
    name: 'name',
    label: 'Classroom Name',
    type: 'text',
    icon: DoorOpen,
    placeholder: 'Enter classroom name',
    required: true,
    minlength: 2,
    maxlength: 100,
    helperText: 'Must be 2-100 characters',
  },
]

const classroomStore = useClassroomStore()
const showModal = ref(false)
const selectedClassroom = ref<ClassroomDto | null>(null)
const modalRef = ref<HandleErrorableModal | null>(null)

// Delete modal state
const showDeleteModal = ref(false)
const classroomToDelete = ref<ClassroomDto | null>(null)
const isDeleting = ref(false)

// Pagination state
const currentPage = ref(1)
const itemsPerPage = ref(10)

// Computed values
const classrooms = computed(() => classroomStore.sortedClassrooms)
const totalClassrooms = computed(() => classrooms.value.length)
const totalPages = computed(() => Math.ceil(totalClassrooms.value / itemsPerPage.value))
const hasNextPage = computed(() => currentPage.value < totalPages.value)
const hasPreviousPage = computed(() => currentPage.value > 1)

// Paginated classrooms
const paginatedClassrooms = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return classrooms.value.slice(start, end)
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

function handleGoToPage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

function handleSetItemsPerPage(value: number) {
  itemsPerPage.value = value
  currentPage.value = 1 // Reset to first page
}

// Modal Handlers
function openAddModal() {
  selectedClassroom.value = null
  showModal.value = true
}

function openEditModal(classroom: ClassroomDto) {
  selectedClassroom.value = { ...classroom }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  selectedClassroom.value = null
}

// Toast state and helpers
const toast = reactive({
  show: false,
  message: '',
  type: 'success',
  duration: 3000,
})

function showToast(message: string, type: ToastType = 'success', duration = 3000) {
  toast.message = message
  toast.type = type
  toast.duration = duration
  toast.show = true
}

function closeToast() {
  toast.show = false
}

async function handleSaveClassroom(classroomData: ClassroomPayload) {
  try {
    if (selectedClassroom.value) {
      // Edit mode
      await classroomStore.updateClassroom(selectedClassroom.value.id, classroomData)
      showToast('Classroom updated successfully', 'success')
    }
    else {
      // Create mode
      await classroomStore.createClassroom(classroomData)
      showToast('Classroom created successfully', 'success')
    }
    closeModal()
  }
  catch (error) {
    modalRef.value?.handleError?.(error.response?.data?.message || 'Failed to save classroom')
  }
}

function handleDeleteClassroom(id: EntityId) {
  const classroom = classroomStore.classrooms.find(c => c.id === id)
  if (classroom) {
    classroomToDelete.value = classroom
    showDeleteModal.value = true
  }
}

async function confirmDelete() {
  if (!classroomToDelete.value)
    return

  isDeleting.value = true
  try {
    await classroomStore.deleteClassroom(classroomToDelete.value.id)
    showToast('Classroom deleted successfully', 'success')
    // Adjust pagination if needed
    if (paginatedClassrooms.value.length === 0 && currentPage.value > 1) {
      currentPage.value--
    }
    showDeleteModal.value = false
    classroomToDelete.value = null
  }
  catch (error) {
    showToast(`Failed to delete classroom: ${error.response?.data?.message || error.message}`, 'error')
  }
  finally {
    isDeleting.value = false
  }
}

function cancelDelete() {
  showDeleteModal.value = false
  classroomToDelete.value = null
}

onMounted(async () => {
  try {
    await classroomStore.fetchClassrooms()
  }
  catch {
    // Error handled silently
  }
})
</script>

<template>
  <div class="classroom-management">
    <!-- Loading State -->
    <template v-if="classroomStore.loading">
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
    <div v-else-if="classroomStore.error" class="error-message">
      <div class="error-content">
        <AlertTriangle class="error-icon" :size="24" />
        <p>{{ classroomStore.error }}</p>
        <BaseButton variant="secondary" size="small" @click="classroomStore.fetchClassrooms">
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
              Classroom Management
            </h1>
            <p class="page-subtitle">
              Manage Classrooms
            </p>
          </div>
          <BaseButton variant="primary" :icon="Plus" @click="openAddModal">
            Add Classroom
          </BaseButton>
        </div>
      </div>

      <ClassroomTableSection
        :classrooms="paginatedClassrooms"
        title="All Classrooms"
        :pagination="{
          currentPage,
          totalPages,
          hasNextPage,
          hasPreviousPage,
          totalClassrooms,
          itemsPerPage,
        }"
        @next-page="handleNextPage"
        @previous-page="handlePreviousPage"
        @go-to-page="handleGoToPage"
        @set-items-per-page="handleSetItemsPerPage"
        @edit="openEditModal"
        @delete="handleDeleteClassroom"
      />
    </div>

    <!-- Modal -->
    <FormModal
      ref="modalRef"
      :show="showModal"
      :entity="selectedClassroom ?? undefined"
      title="Classroom"
      :fields="classroomFields"
      :loading="classroomStore.loading"
      @save="handleSaveClassroom"
      @cancel="closeModal"
    />

    <!-- Delete Modal -->
    <DeleteModal
      :show="showDeleteModal"
      title="Delete Classroom"
      message="Are you sure you want to delete this classroom? This action cannot be undone."
      :item-name="classroomToDelete ? classroomToDelete.name : ''"
      :is-deleting="isDeleting"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
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
.classroom-management {
  min-height: 100vh;
  background: var(--color-slate-100);
  padding: 1rem;
  position: relative;
  overflow-x: hidden;
}

.classroom-management::before {
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
</style>
