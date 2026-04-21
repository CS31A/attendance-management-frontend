<script setup lang="ts">
import type { SectionDto, SectionPayload } from '@/api/sections'
import { AlertTriangle, Plus } from 'lucide-vue-next'
import { computed, defineAsyncComponent, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import sectionsApi from '@/api/sections'
import BaseButton from '@/components/common/BaseButton.vue'
import BulkDataActions from '@/components/common/BulkDataActions.vue'
import DeleteModal from '@/components/common/DeleteModal.vue'
import SkeletonLoader from '@/components/common/SkeletonLoader.vue'
import Toast from '@/components/common/Toast.vue'
import { useCrudModal } from '@/composables/useCrudModal'
import { useLocalPagination } from '@/composables/useLocalPagination'
import { useModalState } from '@/composables/useModalState'
import { createSectionDeleteFlow } from '@/composables/useSectionDeleteFlow'
import { useToast } from '@/composables/useToast'
import { useSectionStore } from '@/stores/sectionStore'

const SectionModal = defineAsyncComponent(() => import('@/components/SectionModal.vue'))
const SectionTableSection = defineAsyncComponent(() => import('@/components/tables/SectionTableSection.vue'))

const sectionsStore = useSectionStore()
const { showModal, selectedEntity: selectedSection, modalRef } = useModalState<SectionDto>()
const router = useRouter()

const sections = computed(() => sectionsStore.getSections)

const {
  currentPage,
  itemsPerPage,
  totalItems: totalSections,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  paginatedItems: paginatedSections,
  nextPage: handleNextPage,
  previousPage: handlePreviousPage,
  goToPage: handleGoToPage,
  setItemsPerPage: handleSetItemsPerPage,
} = useLocalPagination({ items: sections })

function openEnrollmentModal(section: SectionDto) {
  router.push(`/sections/${section.id}/enrollments`)
}

const { toast, showToast, closeToast } = useToast()

const { handleSave: handleSaveSection, openAddModal, openEditModal, closeModal } = useCrudModal<SectionPayload, SectionDto>({
  entity: selectedSection,
  showModal,
  modalRef,
  showToast,
  createFn: data => sectionsStore.addSection(data),
  updateFn: (id, data) => sectionsStore.updateSection(id, data),
  entityLabel: 'Section',
})

const {
  showDeleteModal,
  sectionToDelete,
  isDeleting,
  isDeletionChecking,
  handleDeleteSection,
  confirmDelete,
  cancelDelete,
} = createSectionDeleteFlow({
  sectionsStore,
  sectionsApi,
  showToast,
  onDeleteSuccess: () => {
    if (paginatedSections.value.length === 0 && currentPage.value > 1) {
      currentPage.value--
    }
  },
})

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
        :is-deletion-checking="isDeletionChecking"
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
