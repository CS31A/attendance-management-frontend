<script setup lang="ts">
import type { ClassroomDto } from '@/api/classrooms'
import type { ScheduleDto, SchedulePayload } from '@/api/schedules'
import type { SectionDto } from '@/api/sections'
import type { SubjectDto } from '@/api/subjects'
import type { EntityId } from '@/types'
import type { FormFieldConfig, FormOption, HandleErrorableModal } from '@/types/ui'
import { AlertTriangle, BookOpen, Calendar, Clock, DoorOpen, GraduationCap, Plus, User, X } from 'lucide-vue-next'
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import classroomApi from '@/api/classrooms'
import sectionsApi from '@/api/sections'
import subjectApi from '@/api/subjects'
import AlertModal from '@/components/common/AlertModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BulkDataActions from '@/components/common/BulkDataActions.vue'
import DeleteModal from '@/components/common/DeleteModal.vue'
import FormModal from '@/components/common/FormModal.vue'
import Toast from '@/components/common/Toast.vue'
import { useCrudModal } from '@/composables/useCrudModal'
import { useEntityDelete } from '@/composables/useEntityDelete'
import { useLocalPagination } from '@/composables/useLocalPagination'
import { useToast } from '@/composables/useToast'
import { useScheduleStore } from '@/stores/scheduleStore'
import { useUserStore } from '@/stores/userStore'
import { getErrorMessage } from '@/utils/httpError'

const ScheduleList = defineAsyncComponent(() => import('@/components/schedules/ScheduleList.vue'))
const SkeletonLoader = defineAsyncComponent(() => import('@/components/common/SkeletonLoader.vue'))

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

function extractResponseData<T>(responseOrData: T | { data: T }): T {
  return (responseOrData && typeof responseOrData === 'object' && 'data' in responseOrData)
    ? responseOrData.data
    : responseOrData as T
}

// Field configuration for FormModal with async options
const scheduleFields: FormFieldConfig[] = [
  {
    name: 'timeIn',
    label: 'Time In',
    type: 'time',
    icon: Clock,
    required: true,
  },
  {
    name: 'timeOut',
    label: 'Time Out',
    type: 'time',
    icon: Clock,
    required: true,
    validation: (value: unknown, formData: Record<string, unknown>) => {
      const timeOut = typeof value === 'string' ? value : ''
      const timeIn = typeof formData.timeIn === 'string' ? formData.timeIn : ''
      if (timeOut && timeIn && timeOut <= timeIn) {
        return 'Time Out must be after Time In'
      }
      return null
    },
  },
  {
    name: 'dayOfWeek',
    label: 'Day of Week',
    type: 'select',
    icon: Calendar,
    required: true,
    placeholder: 'Select a day',
    options: [
      { value: 'Monday', label: 'Monday' },
      { value: 'Tuesday', label: 'Tuesday' },
      { value: 'Wednesday', label: 'Wednesday' },
      { value: 'Thursday', label: 'Thursday' },
      { value: 'Friday', label: 'Friday' },
      { value: 'Saturday', label: 'Saturday' },
      { value: 'Sunday', label: 'Sunday' },
    ],
  },
  {
    name: 'subjectId',
    label: 'Subject',
    type: 'select',
    icon: BookOpen,
    required: true,
    placeholder: 'Select a subject',
    options: async () => {
      const response = await subjectApi.getAllSubjects()
      const subjects = extractResponseData(response)
      return subjects.map((s: SubjectDto) => ({
        value: s.id,
        label: `${s.name} (${s.code})`,
      }))
    },
  },
  {
    name: 'classroomId',
    label: 'Classroom',
    type: 'select',
    icon: DoorOpen,
    required: true,
    placeholder: 'Select a classroom',
    options: async () => {
      const response = await classroomApi.getAllClassrooms()
      const classrooms = extractResponseData(response)
      return classrooms.map((c: ClassroomDto) => ({
        value: c.id,
        label: c.name || 'Unnamed Classroom',
      }))
    },
  },
  {
    name: 'sectionId',
    label: 'Section',
    type: 'select',
    icon: GraduationCap,
    required: true,
    placeholder: 'Select a section',
    options: async () => {
      const response = await sectionsApi.getAllSections()
      const sections = extractResponseData(response)
      return sections.map((s: SectionDto) => ({
        value: s.id,
        label: s.name || 'Unnamed Section',
      }))
    },
  },
  {
    name: 'instructorId',
    label: 'Instructor',
    type: 'select',
    icon: User,
    required: true,
    placeholder: 'Select an instructor',
    options: async () => {
      // Always fetch active users to ensure the list is fresh and filtered correctly
      // This handles cases where user might have navigated from 'Archived' view
      await userStore.fetchUsers('Active')
      return userStore.instructors.reduce<FormOption[]>((options, instructor) => {
        if (instructor.profileId === undefined || instructor.profileId === null)
          return options

        options.push({
          value: instructor.profileId,
          label: `${instructor.firstName || instructor.firstname || ''} ${instructor.lastName || instructor.lastname || ''}`.trim() || 'Unnamed Instructor',
        })
        return options
      }, [])
    },
  },
]

const scheduleStore = useScheduleStore()
const showModal = ref(false)
const selectedSchedule = ref<ScheduleDto | null>(null)
const modalRef = ref<HandleErrorableModal | null>(null)

// Modal state for alerts
const showAlertDialog = ref(false)
const alertModalConfig = ref({
  title: '',
  message: '',
  confirmText: '',
  cancelText: '',
})

// Instructor filter state
const filteredInstructorId = ref<EntityId | null>(null)
const filteredInstructorName = ref('')
const isLoadingInstructorFilter = ref(false)

const schedules = computed(() => {
  const allSchedules = scheduleStore.sortedSchedules

  if (filteredInstructorId.value) {
    return allSchedules.filter(schedule =>
      schedule.instructorId === filteredInstructorId.value,
    )
  }

  return allSchedules
})

const totalSchedules = computed(() => schedules.value.length)

const {
  currentPage,
  itemsPerPage,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  nextPage: handleNextPage,
  previousPage: handlePreviousPage,
  goToPage: handleGoToPage,
  setItemsPerPage: handleSetItemsPerPage,
} = useLocalPagination({ totalItems: totalSchedules })

const paginatedSchedules = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return schedules.value.slice(start, end)
})

const { toast, showToast, closeToast } = useToast()

const { handleSave: handleSaveSchedule, openAddModal, openEditModal, closeModal } = useCrudModal<SchedulePayload, ScheduleDto>({
  entity: selectedSchedule,
  showModal,
  modalRef,
  showToast,
  createFn: data => scheduleStore.createSchedule(data),
  updateFn: (id, data) => scheduleStore.updateSchedule(id, data),
  entityLabel: 'Schedule',
})

const { showDeleteModal, entityToDelete: scheduleToDelete, isDeleting, openDelete: openDeleteSchedule, confirmDelete, cancelDelete } = useEntityDelete<ScheduleDto>({
  findEntity: id => scheduleStore.schedules.find(s => s.id === id),
  deleteEntity: id => scheduleStore.deleteSchedule(id),
  getEntityId: entity => entity.id,
  showToast,
  getSuccessMessage: () => 'Schedule deleted successfully',
  getErrorMessage: error => `Failed to delete schedule: ${getErrorMessage(error, 'Delete request failed')}`,
  onDeleteSuccess: () => {
    if (paginatedSchedules.value.length === 0 && currentPage.value > 1) {
      currentPage.value--
    }
  },
})

function handleDeleteSchedule(id: EntityId) {
  openDeleteSchedule(id)
}

async function filterByInstructor(instructorId: string | null | undefined) {
  if (!instructorId)
    return

  const parsedInstructorId = Number.parseInt(instructorId, 10)
  if (Number.isNaN(parsedInstructorId))
    return

  isLoadingInstructorFilter.value = true
  try {
    if (userStore.users.length === 0) {
      await userStore.fetchUsers()
    }
    const instructor = userStore.users.find(i => i.id === parsedInstructorId || i.profileId === parsedInstructorId)

    if (instructor) {
      filteredInstructorId.value = parsedInstructorId
      filteredInstructorName.value = `${instructor.firstName || instructor.firstname || ''} ${instructor.lastName || instructor.lastname || ''}`.trim() || 'Instructor'
      currentPage.value = 1
    }
  }
  catch (error) {
    console.error('Failed to load instructor details:', error)
    showToast('Failed to load instructor filter', 'error')
  }
  finally {
    isLoadingInstructorFilter.value = false
  }
}

function clearInstructorFilter() {
  filteredInstructorId.value = null
  filteredInstructorName.value = ''
  currentPage.value = 1
  router.push({ path: '/schedules' })
}

async function refreshSchedules() {
  await scheduleStore.fetchSchedules()
}

onMounted(async () => {
  try {
    await scheduleStore.fetchSchedules()

    const instructorId = Array.isArray(route.query.instructorId)
      ? route.query.instructorId[0]
      : route.query.instructorId

    if (instructorId) {
      await filterByInstructor(instructorId)
    }
  }
  catch (error) {
    console.error('Failed to initialize schedules view:', error)
    showToast('Failed to load schedules. Please try again.', 'error')
  }
})
</script>

<template>
  <div class="schedule-management">
    <!-- Loading State -->
    <template v-if="scheduleStore.loading">
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
    <div v-else-if="scheduleStore.error" class="error-message">
      <div class="error-content">
        <AlertTriangle class="error-icon" :size="24" />
        <p>{{ scheduleStore.error }}</p>
        <BaseButton variant="secondary" size="small" @click="() => scheduleStore.fetchSchedules()">
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
              Schedule Management
            </h1>
            <p class="page-subtitle">
              Manage class schedules
            </p>
          </div>
          <div class="header-actions">
            <BulkDataActions entity="schedules" title="Schedules" @imported="refreshSchedules" @success="showToast($event, 'success')" @error="showToast($event, 'error')" />
            <BaseButton variant="primary" :icon="Plus" @click="openAddModal">
              Add Schedule
            </BaseButton>
          </div>
        </div>
      </div>

      <!-- Instructor Filter Badge -->
      <div v-if="filteredInstructorId" class="filter-badge-container">
        <div class="filter-badge">
          <div class="filter-badge-content">
            <User :size="16" />
            <span class="filter-label">Filtered by Instructor:</span>
            <span class="filter-value">{{ filteredInstructorName }}</span>
            <BaseButton
              variant="ghost"
              size="small"
              :icon="X"
              @click="clearInstructorFilter"
            >
              Clear Filter
            </BaseButton>
          </div>
        </div>
      </div>

      <ScheduleList
        :schedules="paginatedSchedules"
        title="All Schedules"
        :pagination="{
          currentPage,
          totalPages,
          hasNextPage,
          hasPreviousPage,
          totalSchedules,
          itemsPerPage,
        }"
        @next-page="handleNextPage"
        @previous-page="handlePreviousPage"
        @go-to-page="handleGoToPage"
        @set-items-per-page="handleSetItemsPerPage"
        @edit="openEditModal"
        @delete="handleDeleteSchedule"
      />
    </div>

    <!-- Modal -->
    <FormModal
      ref="modalRef"
      :show="showModal"
      :entity="selectedSchedule ?? undefined"
      title="Schedule"
      :fields="scheduleFields"
      size="large"
      :loading="scheduleStore.loading"
      @save="handleSaveSchedule"
      @cancel="closeModal"
    />

    <!-- Delete Modal -->
    <DeleteModal
      :show="showDeleteModal"
      title="Delete Schedule"
      message="Are you sure you want to delete this schedule? This action cannot be undone."
      :item-name="scheduleToDelete ? `${scheduleToDelete.subject?.name || scheduleToDelete.subjectName || 'Schedule'} - ${scheduleToDelete.section?.name || scheduleToDelete.sectionName || ''}` : ''"
      :is-deleting="isDeleting"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />

    <!-- Alert Modal -->
    <AlertModal
      :show="showAlertDialog"
      :title="alertModalConfig.title"
      :message="alertModalConfig.message"
      @confirm="showAlertDialog = false"
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
.schedule-management {
  min-height: 100vh;
  background: var(--color-slate-100);
  padding: 1rem;
  position: relative;
  overflow-x: hidden;
}

.schedule-management::before {
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

/* Filter Badge */
.filter-badge-container {
  margin-bottom: 1rem;
}

.filter-badge {
  background: linear-gradient(135deg, var(--color-info-bg) 0%, var(--color-info-lighter) 100%);
  border: 1px solid var(--color-info-light);
  border-radius: 12px;
  padding: 1rem 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.filter-badge-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  color: var(--color-info-darkest);
}

.filter-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-info-dark);
}

.filter-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-primary);
  padding: 0.25rem 0.75rem;
  background: white;
  border-radius: 6px;
  border: 1px solid var(--color-info-light);
}

/* Responsive Filter Badge */
@media (max-width: 768px) {
  .filter-badge-content {
    gap: 0.5rem;
  }

  .filter-label,
  .filter-value {
    font-size: 0.8125rem;
  }
}
</style>
