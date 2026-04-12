<script setup lang="ts">
import type { SectionDto, SectionPayload } from '@/api/sections'
import type { EntityId } from '@/types'
import type { HandleErrorableModal } from '@/types/ui'
import { AlertTriangle, Plus } from 'lucide-vue-next'
import { computed, defineAsyncComponent, onMounted, reactive, ref } from 'vue'
import { getSchedulesBySection } from '@/api/schedules'
import sectionsApi from '@/api/sections'
import BaseButton from '@/components/common/BaseButton.vue'
import BulkDataActions from '@/components/common/BulkDataActions.vue'
import DeleteModal from '@/components/common/DeleteModal.vue'
import SkeletonLoader from '@/components/common/SkeletonLoader.vue'
import Toast from '@/components/common/Toast.vue'
import { useSectionStore } from '@/stores/sectionStore'
import { getErrorMessage } from '@/utils/httpError'

const SectionModal = defineAsyncComponent(() => import('@/components/SectionModal.vue'))
const EnrollmentModal = defineAsyncComponent(() => import('@/components/sections/EnrollmentModal.vue'))
const SectionTableSection = defineAsyncComponent(() => import('@/components/tables/SectionTableSection.vue'))

type ToastType = 'success' | 'error' | 'warning' | 'info'

const sectionsStore = useSectionStore()
const showModal = ref(false)
const showEnrollmentModal = ref(false)
const selectedSection = ref<SectionDto | null>(null)
const selectedEnrollmentSection = ref<SectionDto | null>(null)
const modalRef = ref<HandleErrorableModal | null>(null)

// Delete modal state
const showDeleteModal = ref(false)
const sectionToDelete = ref<SectionDto | null>(null)
const isDeleting = ref(false)

// Pagination state
const currentPage = ref(1)
const itemsPerPage = ref(10)

// Computed values
const sections = computed(() => sectionsStore.getSections)
const totalSections = computed(() => sectionsStore.getNumberOfSections)
const totalPages = computed(() => Math.ceil(totalSections.value / itemsPerPage.value))
const hasNextPage = computed(() => currentPage.value < totalPages.value)
const hasPreviousPage = computed(() => currentPage.value > 1)

// Paginated sections
const paginatedSections = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return sections.value?.slice(start, end) || []
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
  selectedSection.value = null
  showModal.value = true
}

function openEditModal(section: SectionDto) {
  selectedSection.value = { ...section }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  selectedSection.value = null
}

function openEnrollmentModal(section: SectionDto) {
  selectedEnrollmentSection.value = section
  showEnrollmentModal.value = true
}

function closeEnrollmentModal() {
  showEnrollmentModal.value = false
  selectedEnrollmentSection.value = null
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

async function handleSaveSection(sectionData: SectionPayload) {
  try {
    if (selectedSection.value) {
      // Edit mode
      await sectionsStore.updateSection(selectedSection.value.id, sectionData)
      showToast('Section updated successfully', 'success')
    }
    else {
      // Create mode
      await sectionsStore.addSection(sectionData)
      showToast('Section created successfully', 'success')
    }
    closeModal()
  }
  catch (error) {
    modalRef.value?.handleError?.(getErrorMessage(error, 'Failed to save section'))
  }
}

async function handleDeleteSection(id: EntityId) {
  const section = sectionsStore.sections.find(s => s.id === id)
  if (!section)
    return

  // Check for dependencies before allowing delete
  try {
    const [schedules, hasStudents, hasEnrollments] = await Promise.all([
      getSchedulesBySection(id),
      sectionsApi.hasStudentsInSection(id).then(r => r.data),
      sectionsApi.hasEnrollmentsInSection(id).then(r => r.data),
    ])

    if (schedules.length > 0) {
      showToast(
        `Cannot delete: Section has ${schedules.length} schedule(s). Remove schedules first.`,
        'error',
        5000,
      )
      return
    }

    if (hasStudents) {
      showToast(
        'Cannot delete: Section has assigned students. Reassign students first.',
        'error',
        5000,
      )
      return
    }

    if (hasEnrollments) {
      showToast(
        'Cannot delete: Section has student enrollments. Remove enrollments first.',
        'error',
        5000,
      )
      return
    }
  }
  catch (error) {
    // Log error for debugging; allow delete attempt as backend will enforce constraints
    console.error('Failed to check section dependencies:', error)
    showToast(
      'Warning: Could not verify section dependencies. Proceed with caution.',
      'warning',
      4000,
    )
  }

  sectionToDelete.value = section
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!sectionToDelete.value)
    return

  isDeleting.value = true
  try {
    await sectionsStore.deleteSection(sectionToDelete.value.id)
    showToast('Section deleted successfully', 'success')
    // Adjust pagination if needed
    if (paginatedSections.value.length === 0 && currentPage.value > 1) {
      currentPage.value--
    }
    showDeleteModal.value = false
    sectionToDelete.value = null
  }
  catch (error) {
    showToast(`Failed to delete section: ${getErrorMessage(error, 'Delete request failed')}`, 'error')
  }
  finally {
    isDeleting.value = false
  }
}

function cancelDelete() {
  showDeleteModal.value = false
  sectionToDelete.value = null
}

async function refreshSections() {
  await sectionsStore.fetchSections()
}

onMounted(async () => {
  try {
    await sectionsStore.fetchSections()
  }
  catch {
    // Error handled silently
  }
})
</script>

<template>
  <div class="section-management">
    <!-- Skeleton loader when loading -->
    <template v-if="sectionsStore.loading">
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
    <div v-else-if="sectionsStore.error" class="error-message">
      <div class="error-content">
        <AlertTriangle class="error-icon" :size="24" />
        <p>{{ sectionsStore.error }}</p>
        <BaseButton variant="secondary" size="small" @click="sectionsStore.fetchSections">
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
              Section Management
            </h1>
            <p class="page-subtitle">
              Manage Sections
            </p>
          </div>
          <div class="header-actions">
            <BulkDataActions entity="sections" title="Sections" @imported="refreshSections" @success="showToast($event, 'success')" @error="showToast($event, 'error')" />
            <BaseButton variant="primary" :icon="Plus" @click="openAddModal">
              Add Section
            </BaseButton>
          </div>
        </div>
      </div>

      <SectionTableSection
        :sections="paginatedSections"
        title="All Sections"
        :pagination="{
          currentPage,
          totalPages,
          hasNextPage,
          hasPreviousPage,
          totalSections,
          itemsPerPage,
        }"
        @next-page="handleNextPage"
        @previous-page="handlePreviousPage"
        @go-to-page="handleGoToPage"
        @set-items-per-page="handleSetItemsPerPage"
        @edit="openEditModal"
        @delete="handleDeleteSection"
        @manage-enrollments="openEnrollmentModal"
      />
    </div>

    <!-- Modal -->
    <SectionModal
      v-if="showModal"
      ref="modalRef"
      :section="selectedSection"
      :loading="sectionsStore.loading"
      @save="handleSaveSection"
      @cancel="closeModal"
    />

    <!-- Enrollment Modal -->
    <EnrollmentModal
      v-if="showEnrollmentModal && selectedEnrollmentSection"
      :section="selectedEnrollmentSection"
      @close="closeEnrollmentModal"
    />

    <!-- Delete Modal -->
    <DeleteModal
      :show="showDeleteModal"
      title="Delete Section"
      message="Are you sure you want to delete this section? This action cannot be undone."
      :item-name="sectionToDelete ? String(sectionToDelete.name || sectionToDelete.sectionName || sectionToDelete.code || '') : ''"
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
.section-management {
  min-height: 100vh;
  background: var(--color-slate-100);
  padding: 1rem;
  position: relative;
  overflow-x: hidden;
}

.section-management::before {
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

.header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}
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

/* Skeleton Loading */
.skeleton-table {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
</style>
