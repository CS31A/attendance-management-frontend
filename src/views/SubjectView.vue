<script setup lang="ts">
import type { SubjectDto, SubjectPayload } from '@/api/subjects'
import type { FormFieldConfig } from '@/types/ui'
import { AlertTriangle, BookOpen, Hash, Plus } from 'lucide-vue-next'
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BulkDataActions from '@/components/common/BulkDataActions.vue'
import DeleteModal from '@/components/common/DeleteModal.vue'
import FormModal from '@/components/common/FormModal.vue'
import ManagementSearchBar from '@/components/common/ManagementSearchBar.vue'
import Toast from '@/components/common/Toast.vue'
import { useCrudModal } from '@/composables/useCrudModal'
import { useLocalPagination } from '@/composables/useLocalPagination'
import { useModalState } from '@/composables/useModalState'
import { createSubjectDeleteFlow } from '@/composables/useSubjectDeleteFlow'
import { useToast } from '@/composables/useToast'
import { useSubjectStore } from '@/stores/subjectStore'
import { matchesSearchQuery } from '@/utils/search'

const SubjectTableSection = defineAsyncComponent(() => import('@/components/tables/SubjectTableSection.vue'))
const SkeletonLoader = defineAsyncComponent(() => import('@/components/common/SkeletonLoader.vue'))

// Field configuration for FormModal
const subjectFields: FormFieldConfig[] = [
  {
    name: 'name',
    label: 'Subject Name',
    type: 'text',
    icon: BookOpen,
    placeholder: 'Enter subject name',
    required: true,
    minlength: 2,
    helperText: 'Must be at least 2 characters',
  },
  {
    name: 'code',
    label: 'Subject Code',
    type: 'text',
    icon: Hash,
    placeholder: 'Enter subject code',
    required: true,
    minlength: 5,
    helperText: 'Must be at least 5 characters',
  },
]

const subjectStore = useSubjectStore()
const { showModal, selectedEntity: selectedSubject, modalRef } = useModalState<SubjectDto>()

const subjects = computed(() => subjectStore.sortedSubjects)
const searchQuery = ref('')
const filteredSubjects = computed(() =>
  subjects.value.filter(subject =>
    matchesSearchQuery(searchQuery.value, [subject.id, subject.code, subject.name]),
  ),
)

const {
  currentPage,
  itemsPerPage,
  totalItems: totalSubjects,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  paginatedItems: paginatedSubjects,
  nextPage: handleNextPage,
  previousPage: handlePreviousPage,
  goToPage: handleGoToPage,
  setItemsPerPage: handleSetItemsPerPage,
  resetToFirstPage,
} = useLocalPagination({ items: filteredSubjects })

const { toast, showToast, closeToast } = useToast()

const { handleSave: handleSaveSubject, openAddModal, openEditModal, closeModal } = useCrudModal<SubjectPayload, SubjectDto>({
  entity: selectedSubject,
  showModal,
  modalRef,
  showToast,
  createFn: data => subjectStore.createSubject(data),
  updateFn: (id, data) => subjectStore.updateSubject(id, data),
  entityLabel: 'Subject',
})

const {
  showDeleteModal,
  subjectToDelete,
  isDeleting,
  isDeletionChecking,
  handleDeleteSubject,
  confirmDelete,
  cancelDelete,
} = createSubjectDeleteFlow({
  subjectsStore: subjectStore,
  showToast,
  onDeleteSuccess: () => {
    if (paginatedSubjects.value.length === 0 && currentPage.value > 1) {
      currentPage.value--
    }
  },
})

async function refreshSubjects() {
  await subjectStore.fetchSubjects()
}

onMounted(async () => {
  try {
    await subjectStore.fetchSubjects()
  }
  catch {
    // Error handled silently
  }
})

watch(searchQuery, () => {
  resetToFirstPage()
})
</script>

<template>
  <div class="subject-management">
    <!-- Loading State -->
    <template v-if="subjectStore.loading">
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
    <div v-else-if="subjectStore.error" class="error-message">
      <div class="error-content">
        <AlertTriangle class="error-icon" :size="24" />
        <p>{{ subjectStore.error }}</p>
        <BaseButton variant="secondary" size="small" @click="subjectStore.fetchSubjects">
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
              Subject Management
            </h1>
            <p class="page-subtitle">
              Manage Subjects
            </p>
          </div>
          <div class="header-actions">
            <BulkDataActions entity="subjects" title="Subjects" @imported="refreshSubjects" @success="showToast($event, 'success')" @error="showToast($event, 'error')" />
            <BaseButton variant="primary" :icon="Plus" @click="openAddModal">
              Add Subject
            </BaseButton>
          </div>
        </div>
      </div>

      <div class="management-toolbar">
        <ManagementSearchBar
          v-model="searchQuery"
          placeholder="Search subjects by code, name, or ID..."
          :result-count="totalSubjects"
        />
      </div>

      <SubjectTableSection
        :subjects="paginatedSubjects"
        title="All Subjects"
        :pagination="totalSubjects > 0 ? {
          currentPage,
          totalPages,
          hasNextPage,
          hasPreviousPage,
          totalSubjects,
          itemsPerPage,
        } : null"
        :is-deletion-checking="isDeletionChecking"
        @next-page="handleNextPage"
        @previous-page="handlePreviousPage"
        @go-to-page="handleGoToPage"
        @set-items-per-page="handleSetItemsPerPage"
        @edit="openEditModal"
        @delete="handleDeleteSubject"
      />
    </div>

    <!-- Modal -->
    <FormModal
      ref="modalRef"
      :show="showModal"
      :entity="selectedSubject ?? undefined"
      title="Subject"
      :fields="subjectFields"
      :loading="subjectStore.loading"
      @save="handleSaveSubject"
      @cancel="closeModal"
    />

    <!-- Delete Modal -->
    <DeleteModal
      :show="showDeleteModal"
      title="Delete Subject"
      message="Are you sure you want to delete this subject? This action cannot be undone."
      :item-name="subjectToDelete ? `${subjectToDelete.code} - ${subjectToDelete.name}` : ''"
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
.subject-management {
  min-height: 100vh;
  background: var(--color-slate-100);
  padding: 1rem;
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

.header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}
.page-header {
  margin-bottom: 1rem;
}

.management-toolbar {
  margin-bottom: 1rem;
  max-width: 28rem;
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
