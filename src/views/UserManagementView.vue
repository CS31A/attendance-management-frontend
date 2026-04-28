<script setup lang="ts">
import type { InstructorSessionsReportDto } from '@/api/reports'
import type { CreateUserInput } from '@/stores/userStore'
import type { EntityId } from '@/types'
import type { HandleErrorableModal } from '@/types/ui'
import { Plus, Users } from 'lucide-vue-next'
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { fetchInstructorSessionsReport } from '@/api/reports'
import BaseButton from '@/components/common/BaseButton.vue'
import BulkDataActions from '@/components/common/BulkDataActions.vue'
import ConfirmationModal from '@/components/common/ConfirmationModal.vue'
import DeleteModal from '@/components/common/DeleteModal.vue'
import ManagementSearchBar from '@/components/common/ManagementSearchBar.vue'
import SkeletonLoader from '@/components/common/SkeletonLoader.vue'
import Toast from '@/components/common/Toast.vue'
import { useToast } from '@/composables/useToast'
import { useUserStore } from '@/stores/userStore'
import { resolveStudentProfileId } from '@/utils/studentRoute'

const CreateUserModal = defineAsyncComponent(() => import('@/components/CreateUserModal.vue'))
const EditUserModal = defineAsyncComponent(() => import('@/components/EditUserModal.vue'))
const UserTableSection = defineAsyncComponent(() => import('@/components/tables/UserTableSection.vue'))
const CustomDropdown = defineAsyncComponent(() => import('@/components/common/CustomDropdown.vue'))

type ManagedUser = ReturnType<typeof useUserStore>['users'][number]

const userStore = useUserStore()
const router = useRouter()

interface EditableUser {
  userId?: string | number
  id?: string | number
}

const showAddUser = ref(false)
const showEditUser = ref(false)
const editingUser = ref<EditableUser | null>(null)
const searchQuery = ref('')
const selectedRole = ref<'All Roles' | 'Instructor' | 'Student'>('All Roles')
const viewMode = ref<'Active' | 'Archived' | 'All'>('Active')
const createModal = ref<HandleErrorableModal | null>(null)
const editModal = ref<HandleErrorableModal | null>(null)
const selectedInstructorWorkloadId = ref('')
const instructorWorkload = ref<InstructorSessionsReportDto | null>(null)
const instructorWorkloadLoading = ref(false)
const instructorWorkloadError = ref('')

// Clear search
function clearSearch() {
  searchQuery.value = ''
}

// Delete modal state
const showDeleteModal = ref(false)
const userToDelete = ref<ManagedUser | null>(null)
const isDeleting = ref(false)
const deleteType = ref('soft') // 'soft' or 'hard'

// Restore modal state
const showRestoreModal = ref(false)
const userToRestore = ref<ManagedUser | null>(null)
const isRestoring = ref(false)

const roleFilters = ['All Roles', 'Instructor', 'Student']

async function refreshUsers() {
  await userStore.fetchUsers(viewMode.value)
}

onMounted(async () => {
  try {
    await userStore.fetchUsers(viewMode.value)
  }
  catch (error) {
    console.error('Failed to load users:', error)
  }
})

// Watch viewMode changes to fetch users
watch(viewMode, async (newMode) => {
  try {
    await userStore.fetchUsers(newMode)
    userStore.setCurrentPage(1)
  }
  catch (error) {
    console.error('Failed to fetch users for mode:', newMode, error)
  }
})

const filteredUsers = computed(() =>
  userStore.filteredUsers(searchQuery.value, selectedRole.value),
)

const paginatedUsers = computed(() =>
  userStore.paginatedUsers(searchQuery.value, selectedRole.value),
)

const filteredInstructors = computed(() =>
  paginatedUsers.value.filter(u => u.role === 'Instructor'),
)

const filteredStudents = computed(() =>
  paginatedUsers.value.filter(u => u.role === 'Student'),
)

const allFilteredInstructors = computed(() =>
  filteredUsers.value.filter(u => u.role === 'Instructor'),
)

const selectedInstructorWorkload = computed(() =>
  allFilteredInstructors.value.find(user => String(user.profileId ?? '') === selectedInstructorWorkloadId.value) ?? null,
)

const instructorWorkloadSummary = computed(() => {
  if (!instructorWorkload.value)
    return null

  const sessions = instructorWorkload.value.sessions || []
  const averageAttendanceRate = sessions.length
    ? sessions.reduce((sum, session) => sum + (Number(session.attendanceRate) || 0), 0) / sessions.length
    : 0

  return {
    totalSessions: instructorWorkload.value.totalSessions,
    averageAttendanceRate,
    sectionsCovered: new Set(sessions.map(session => session.sectionName).filter(Boolean)).size,
    mostRecentSession: sessions[0] ?? null,
  }
})

const workloadSessions = computed(() => instructorWorkload.value?.sessions ?? [])

// Pagination computed properties
const totalPages = computed(() =>
  userStore.totalPages(searchQuery.value, selectedRole.value),
)

const hasNextPage = computed(() =>
  userStore.hasNextPage(searchQuery.value, selectedRole.value),
)

const hasPreviousPage = computed(() =>
  userStore.hasPreviousPage,
)

const currentPage = computed(() =>
  userStore.currentPage,
)

const totalUsers = computed(() =>
  filteredUsers.value.length,
)

// Check if there's an active search
const hasActiveSearch = computed(() =>
  searchQuery.value.trim().length > 0,
)

// Toast state and helpers
const { toast, showToast, closeToast } = useToast()

function getInstructorDisplayName(user: ManagedUser): string {
  return `${user.firstName || user.firstname || ''} ${user.lastName || user.lastname || ''}`.trim() || 'Unnamed Instructor'
}

function getWorkloadRange(): { startDate: string, endDate: string } {
  const endDate = new Date()
  const startDate = new Date(endDate)
  startDate.setDate(endDate.getDate() - 29)

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  }
}

function formatAttendanceRate(value: number | undefined): string {
  return `${Number(value || 0).toFixed(1)}%`
}

function formatSessionDate(value: string | undefined): string {
  if (!value)
    return 'Unavailable'

  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

async function loadInstructorWorkload(instructorProfileId: string) {
  if (!instructorProfileId) {
    instructorWorkload.value = null
    instructorWorkloadError.value = ''
    return
  }

  instructorWorkloadLoading.value = true
  instructorWorkloadError.value = ''

  try {
    const { startDate, endDate } = getWorkloadRange()
    instructorWorkload.value = await fetchInstructorSessionsReport(instructorProfileId, { startDate, endDate })
  }
  catch (error) {
    console.error('Failed to load instructor workload:', error)
    instructorWorkload.value = null
    instructorWorkloadError.value = 'Unable to load workload data right now.'
  }
  finally {
    instructorWorkloadLoading.value = false
  }
}

async function handleCreateUser(userData: CreateUserInput) {
  const result = await userStore.createUser(userData)
  if (result.success) {
    showAddUser.value = false
    showToast('User created successfully', 'success')
  }
  else {
    if (createModal.value?.handleError) {
      createModal.value.handleError(result.error)
    }
  }
}

async function handleUpdateUser(updatedUserData: Record<string, unknown>) {
  if (!editingUser.value)
    return

  const id = (editingUser.value.userId || editingUser.value.id) as EntityId | undefined
  if (id == null)
    return

  const result = await userStore.updateUser(id, updatedUserData)
  if (result.success) {
    showEditUser.value = false
    editingUser.value = null
    showToast('User updated successfully', 'success')
  }
  else if (editModal.value?.handleError) {
    editModal.value.handleError(result.error)
  }
}

function handleCancel() {
  showAddUser.value = false
  showEditUser.value = false
  editingUser.value = null
}

function handleViewStudent(user: ManagedUser) {
  const studentProfileId = resolveStudentProfileId(user)
  if (studentProfileId != null) {
    router.push(`/users/students/${studentProfileId}`)
    return
  }

  showToast('Student details are unavailable for this record.', 'error')
}

function handleSoftDeleteUser(user: ManagedUser | null) {
  if (user) {
    userToDelete.value = user
    deleteType.value = 'soft'
    showDeleteModal.value = true
  }
  else {
    console.error('User not found for soft delete')
    showToast('User not found', 'error')
  }
}

function handleHardDeleteUser(user: ManagedUser | null) {
  if (user) {
    userToDelete.value = user
    deleteType.value = 'hard'
    showDeleteModal.value = true
  }
  else {
    console.error('User not found for hard delete')
    showToast('User not found', 'error')
  }
}

function handleRestoreUser(user: ManagedUser | null) {
  if (user) {
    userToRestore.value = user
    showRestoreModal.value = true
  }
  else {
    console.error('User not found for restore')
    showToast('User not found', 'error')
  }
}

async function confirmRestore() {
  if (!userToRestore.value)
    return

  isRestoring.value = true
  try {
    const id = userToRestore.value.userId || userToRestore.value.id

    if (!id) {
      console.error('User ID not found. User object:', userToRestore.value)
      showToast('Unable to restore: User ID not found', 'error')
      return
    }

    const result = await userStore.restoreUser(id)
    if (result.success) {
      showToast('User restored successfully', 'success')
      showRestoreModal.value = false
      userToRestore.value = null
      // Refresh list to ensure consistency
      await userStore.fetchUsers(viewMode.value)
    }
    else {
      showToast(result.error || 'Failed to restore user', 'error')
    }
  }
  catch (error) {
    console.error('Error restoring user:', error)
    showToast('An unexpected error occurred while restoring user', 'error')
  }
  finally {
    isRestoring.value = false
  }
}

function cancelRestore() {
  showRestoreModal.value = false
  userToRestore.value = null
}

async function confirmDelete() {
  if (!userToDelete.value)
    return

  isDeleting.value = true
  try {
    // API returns userId, not id
    const id = userToDelete.value.userId || userToDelete.value.id

    if (!id) {
      console.error('User ID not found. User object:', userToDelete.value)
      showToast('Unable to delete: User ID not found', 'error')
      return
    }

    let result
    if (deleteType.value === 'soft') {
      result = await userStore.softDeleteUser(id)
    }
    else {
      result = await userStore.hardDeleteUser(id)
    }

    if (result.success) {
      const action = deleteType.value === 'soft' ? 'soft deleted' : 'permanently deleted'
      showToast(`User ${action} successfully`, 'success')
      showDeleteModal.value = false
      userToDelete.value = null
      // Refresh list to ensure consistency
      await userStore.fetchUsers(viewMode.value)
    }
    else {
      showToast(result.error || `Failed to ${deleteType.value === 'soft' ? 'soft delete' : 'permanently delete'} user`, 'error')
    }
  }
  catch {
    showToast('An unexpected error occurred', 'error')
  }
  finally {
    isDeleting.value = false
  }
}

function cancelDelete() {
  showDeleteModal.value = false
  userToDelete.value = null
}

function handleEditUser(user: ManagedUser) {
  editingUser.value = user
  showEditUser.value = true
}

// Pagination methods
function nextPage() {
  userStore.nextPage(searchQuery.value, selectedRole.value)
}

function previousPage() {
  userStore.previousPage()
}

function goToPage(page: number) {
  userStore.goToPage(page, searchQuery.value, selectedRole.value)
}

function setItemsPerPage(itemsPerPage: number) {
  userStore.setItemsPerPage(itemsPerPage)
}

// Reset pagination when search or filter changes
watch([searchQuery, selectedRole], () => {
  userStore.setCurrentPage(1)
})

watch(allFilteredInstructors, (instructors) => {
  if (selectedRole.value !== 'Instructor' || instructors.length === 0) {
    selectedInstructorWorkloadId.value = ''
    instructorWorkload.value = null
    instructorWorkloadError.value = ''
    return
  }

  const hasSelectedInstructor = instructors.some(user => String(user.profileId ?? '') === selectedInstructorWorkloadId.value)
  if (!hasSelectedInstructor) {
    selectedInstructorWorkloadId.value = String(instructors[0].profileId ?? '')
  }
}, { immediate: true })

watch([selectedInstructorWorkloadId, selectedRole], async ([instructorId, role]) => {
  if (role !== 'Instructor' || !instructorId) {
    instructorWorkload.value = null
    instructorWorkloadError.value = ''
    return
  }

  await loadInstructorWorkload(instructorId)
}, { immediate: true })
</script>

<template>
  <div class="user-management">
    <!-- Loading State - Always show skeleton if loading, regardless of user count -->
    <div
      v-if="userStore.loading && !userStore.users.length"
      class="loading-skeleton"
    >
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

      <!-- Filters skeleton -->
      <div class="filters-section">
        <SkeletonLoader type="rectangle" :height="55" :width="400" style="flex: 1;" />
        <SkeletonLoader type="rectangle" :height="55" :width="180" />
      </div>

      <!-- Table skeleton -->
      <div class="skeleton-table">
        <SkeletonLoader type="rectangle" :height="50" style="margin-bottom: 1rem; width: 100%;" />
        <SkeletonLoader type="rectangle" :height="60" style="margin-bottom: 0.5rem; width: 100%;" />
        <SkeletonLoader type="rectangle" :height="60" style="margin-bottom: 0.5rem; width: 100%;" />
        <SkeletonLoader type="rectangle" :height="60" style="margin-bottom: 0.5rem; width: 100%;" />
        <SkeletonLoader type="rectangle" :height="60" style="margin-bottom: 0.5rem; width: 100%;" />
        <SkeletonLoader type="rectangle" :height="60" style="margin-bottom: 0.5rem; width: 100%;" />
      </div>

      <!-- Pagination skeleton -->
      <div class="pagination-section">
        <SkeletonLoader type="rectangle" :height="50" :width="300" style="margin-bottom: 1rem;" />
        <SkeletonLoader type="rectangle" :height="50" style="width: 100%;" />
      </div>
    </div>

    <!-- Main content -->
    <div v-else class="container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-text">
            <h1 class="page-title">
              User Management
            </h1>
            <p class="page-subtitle">
              Manage instructors and students
            </p>
          </div>
          <div class="header-actions">
            <BulkDataActions
              entity="users"
              title="Users"
              :export-params="{
                status: viewMode,
                role: selectedRole !== 'All Roles' ? selectedRole : undefined,
                search: searchQuery || undefined,
              }"
              @success="showToast($event, 'success')"
              @error="showToast($event, 'error')"
              @imported="refreshUsers"
            />
            <BaseButton
              variant="primary"
              :icon="Plus"
              @click="showAddUser = true"
            >
              Add User
            </BaseButton>
          </div>
        </div>
      </div>

      <!-- Filters Section -->
      <div class="filters-section">
        <ManagementSearchBar
          v-model="searchQuery"
          placeholder="Search by name or email..."
          :result-count="totalUsers"
        />

        <div class="role-filter">
          <CustomDropdown
            v-model="selectedRole"
            :options="roleFilters"
          />
        </div>

        <!-- View Mode Toggle -->
        <div class="view-toggle">
          <button
            class="toggle-btn"
            :class="{ active: viewMode === 'Active' }"
            @click="viewMode = 'Active'"
          >
            Active
          </button>
          <button
            class="toggle-btn"
            :class="{ active: viewMode === 'Archived' }"
            @click="viewMode = 'Archived'"
          >
            Archived
          </button>
          <button
            class="toggle-btn"
            :class="{ active: viewMode === 'All' }"
            @click="viewMode = 'All'"
          >
            All
          </button>
        </div>
      </div>

      <UserTableSection
        v-if="selectedRole === 'All Roles' && filteredUsers.length > 0"
        :users="paginatedUsers"
        :title="viewMode === 'Active' ? 'Active Users' : viewMode === 'Archived' ? 'Archived Users' : 'All Users'"
        role="All"
        :show-restore="viewMode === 'Archived'"
        :pagination="{
          currentPage,
          totalPages,
          hasNextPage,
          hasPreviousPage,
          totalUsers,
          itemsPerPage: userStore.itemsPerPage,
        }"
        @edit="handleEditUser"
        @soft-delete="handleSoftDeleteUser"
        @delete="handleHardDeleteUser"
        @restore="handleRestoreUser"
        @view="handleViewStudent"
        @next-page="nextPage"
        @previous-page="previousPage"
        @go-to-page="goToPage"
        @set-items-per-page="setItemsPerPage"
      />

      <!-- Instructors Table -->
      <UserTableSection
        v-if="selectedRole === 'Instructor' && filteredInstructors.length > 0"
        :users="filteredInstructors"
        title="Instructors"
        role="Instructor"
        :show-restore="viewMode === 'Archived'"
        @edit="handleEditUser"
        @soft-delete="handleSoftDeleteUser"
        @delete="handleHardDeleteUser"
        @restore="handleRestoreUser"
        @view="handleViewStudent"
      />

      <section
        v-if="selectedRole === 'Instructor' && allFilteredInstructors.length > 0"
        class="workload-overview"
      >
        <div class="workload-header">
          <div>
            <h2 class="workload-title">
              Instructor Workload
            </h2>
            <p class="workload-subtitle">
              Session activity overview for the last 30 days.
            </p>
          </div>

          <label class="workload-filter">
            <span>Instructor</span>
            <select v-model="selectedInstructorWorkloadId" class="workload-select">
              <option
                v-for="instructor in allFilteredInstructors"
                :key="instructor.userId || instructor.id"
                :value="String(instructor.profileId ?? '')"
              >
                {{ getInstructorDisplayName(instructor) }}
              </option>
            </select>
          </label>
        </div>

        <div v-if="instructorWorkloadLoading" class="workload-state">
          Loading workload data...
        </div>

        <div v-else-if="instructorWorkloadError" class="workload-state workload-state-error">
          {{ instructorWorkloadError }}
        </div>

        <template v-else-if="instructorWorkloadSummary">
          <div class="workload-metrics">
            <article class="workload-metric-card">
              <span class="metric-label">Instructor</span>
              <strong class="metric-value">{{ selectedInstructorWorkload ? getInstructorDisplayName(selectedInstructorWorkload) : 'Unavailable' }}</strong>
            </article>
            <article class="workload-metric-card">
              <span class="metric-label">Total Sessions</span>
              <strong class="metric-value">{{ instructorWorkloadSummary.totalSessions }}</strong>
            </article>
            <article class="workload-metric-card">
              <span class="metric-label">Average Attendance</span>
              <strong class="metric-value">{{ formatAttendanceRate(instructorWorkloadSummary.averageAttendanceRate) }}</strong>
            </article>
            <article class="workload-metric-card">
              <span class="metric-label">Sections Covered</span>
              <strong class="metric-value">{{ instructorWorkloadSummary.sectionsCovered }}</strong>
            </article>
          </div>

          <div v-if="workloadSessions.length > 0" class="workload-session-panel">
            <div class="session-panel-header">
              <h3>Recent Sessions</h3>
              <span class="session-panel-note">
                Latest: {{ instructorWorkloadSummary.mostRecentSession ? formatSessionDate(instructorWorkloadSummary.mostRecentSession.sessionDate) : 'Unavailable' }}
              </span>
            </div>

            <div class="session-table-wrapper">
              <table class="workload-session-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Schedule</th>
                    <th>Section</th>
                    <th>Status</th>
                    <th>Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="session in workloadSessions.slice(0, 5)"
                    :key="session.sessionId"
                  >
                    <td>{{ formatSessionDate(session.sessionDate) }}</td>
                    <td>{{ session.scheduleTitle }}</td>
                    <td>{{ session.sectionName }}</td>
                    <td>{{ session.status }}</td>
                    <td>{{ formatAttendanceRate(session.attendanceRate) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-else class="workload-state">
            No sessions found for this instructor in the last 30 days.
          </div>
        </template>
      </section>

      <!-- Students Table -->
      <UserTableSection
        v-if="selectedRole === 'Student' && filteredStudents.length > 0"
        :users="filteredStudents"
        title="Students"
        role="Student"
        :show-restore="viewMode === 'Archived'"
        @edit="handleEditUser"
        @soft-delete="handleSoftDeleteUser"
        @delete="handleHardDeleteUser"
        @restore="handleRestoreUser"
        @view="handleViewStudent"
      />

      <!-- Empty State -->
      <div v-if="filteredUsers.length === 0" class="empty-state">
        <div class="empty-icon-container">
          <Users class="empty-icon" :size="48" />
        </div>
        <h3 class="empty-title">
          No Users Found
        </h3>
        <p class="empty-description">
          {{ hasActiveSearch ? 'Try adjusting your search or filters' : 'Get started by adding your first user' }}
        </p>
        <BaseButton
          v-if="hasActiveSearch"
          variant="secondary"
          size="medium"
          @click="clearSearch"
        >
          Clear Search
        </BaseButton>
        <BaseButton
          v-else
          variant="primary"
          size="large"
          :icon="Plus"
          @click="showAddUser = true"
        >
          Add Your First User
        </BaseButton>
      </div>
    </div>

    <!-- Create User Modal -->
    <CreateUserModal
      v-if="showAddUser"
      ref="createModal"
      :loading="userStore.loading"
      @create="handleCreateUser"
      @cancel="handleCancel"
    />

    <!-- Edit User Modal -->
    <EditUserModal
      v-if="showEditUser"
      ref="editModal"
      :user="editingUser"
      :loading="userStore.loading"
      @update="handleUpdateUser"
      @cancel="handleCancel"
    />

    <!-- Delete Modal -->
    <DeleteModal
      :show="showDeleteModal"
      :title="deleteType === 'soft' ? 'Soft Delete User' : 'Permanently Delete User'"
      :message="deleteType === 'soft'
        ? 'Mark this user as deleted? This action can be undone.'
        : 'Permanently delete this user? This action cannot be undone and will remove all related data.'"
      :item-name="userToDelete ? `${userToDelete.firstName || userToDelete.firstname} ${userToDelete.lastName || userToDelete.lastname} (${userToDelete.username})` : ''"
      :is-deleting="isDeleting"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />

    <!-- Restore Confirmation Modal -->
    <ConfirmationModal
      :show="showRestoreModal"
      title="Restore User"
      message="Are you sure you want to restore this user? The user will be reactivated and moved to the Active users list."
      confirm-text="Restore"
      cancel-text="Cancel"
      @confirm="confirmRestore"
      @cancel="cancelRestore"
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
/* View Toggle */
.view-toggle {
  display: flex;
  background: var(--bg-primary);
  padding: 0.25rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-primary);
  gap: 0.25rem;
}

.toggle-btn {
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.toggle-btn:hover {
  color: var(--text-secondary);
  background: var(--bg-hover);
}

.toggle-btn.active {
  background: var(--color-primary-light);
  color: var(--text-white);
  font-weight: 600;
  box-shadow: var(--shadow-sm);
}

/* Main Container */
.user-management {
  min-height: 100vh;
  background: var(--color-slate-100);
  padding: 1rem;
  position: relative;
  overflow-x: hidden;
}

.loading-skeleton {
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.workload-overview {
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid var(--color-gray-200);
}

.workload-header {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
}

.workload-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0 0 0.25rem;
}

.workload-subtitle {
  margin: 0;
  color: var(--color-gray-500);
}

.workload-filter {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  min-width: 240px;
  color: var(--color-gray-500);
  font-size: 0.875rem;
  font-weight: 600;
}

.workload-select {
  border: 1px solid var(--color-gray-300);
  border-radius: 0.75rem;
  padding: 0.75rem 0.875rem;
  font-size: 0.95rem;
  color: var(--color-gray-700);
  background: white;
}

.workload-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.12);
}

.workload-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.workload-metric-card {
  background: linear-gradient(135deg, var(--color-slate-100) 0%, white 100%);
  border: 1px solid var(--color-gray-200);
  border-radius: 16px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.metric-label {
  color: var(--color-gray-500);
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.metric-value {
  color: var(--color-primary);
  font-size: 1.25rem;
  font-weight: 700;
}

.workload-session-panel {
  border: 1px solid var(--color-gray-200);
  border-radius: 16px;
  overflow: hidden;
}

.session-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: var(--color-slate-100);
  border-bottom: 1px solid var(--color-gray-200);
}

.session-panel-header h3 {
  margin: 0;
  color: var(--color-primary);
  font-size: 1rem;
}

.session-panel-note {
  color: var(--color-gray-500);
  font-size: 0.875rem;
}

.session-table-wrapper {
  overflow-x: auto;
}

.workload-session-table {
  width: 100%;
  border-collapse: collapse;
}

.workload-session-table th,
.workload-session-table td {
  padding: 0.9rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--color-gray-200);
}

.workload-session-table th {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-gray-500);
  background: rgba(248, 250, 252, 0.8);
}

.workload-state {
  padding: 1rem;
  border: 1px dashed var(--color-gray-300);
  border-radius: 16px;
  color: var(--color-gray-500);
  background: var(--color-slate-100);
}

.workload-state-error {
  color: var(--color-error);
  border-color: rgba(220, 38, 38, 0.3);
  background: rgba(254, 242, 242, 0.9);
}

.skeleton-table {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
  margin-bottom: 2rem;
}

.user-management::before {
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

/* Filters Section */
.filters-section {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.role-filter {
  min-width: 180px;
}
/* Users Grid */
.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

/* User Card */
.user-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
}

.user-card:nth-child(1) { animation-delay: 0.1s; }
.user-card:nth-child(2) { animation-delay: 0.2s; }
.user-card:nth-child(3) { animation-delay: 0.3s; }
.user-card:nth-child(4) { animation-delay: 0.4s; }
.user-card:nth-child(5) { animation-delay: 0.5s; }
.user-card:nth-child(6) { animation-delay: 0.6s; }

.user-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.1);
}

.card-header {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  padding: 1.5rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar-container {
  background: rgba(255, 255, 255, 0.25);
  padding: 0.75rem;
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.avatar-icon {
  width: 2rem;
  height: 2rem;
  color: white;
}

.user-details {
  flex: 1;
}

.user-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
  margin: 0 0 0.5rem 0;
}

.role-badge {
  display: inline-block;
  padding: 0.375rem 0.875rem;
  border-radius: 12px;
  font-size: 0.813rem;
  font-weight: 600;
}

.instructor-badge {
  background-color: rgba(59, 130, 246, 0.2);
  color: var(--color-primary-light);
}

.student-badge {
  background-color: var(--color-success-bg);
  color: var(--color-success);
}

.card-body {
  padding: 1.5rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  padding: 0.75rem;
  background: var(--color-gray-50);
  border-radius: 8px;
}

.info-icon {
  width: 1.125rem;
  height: 1.125rem;
  color: var(--color-gray-500);
  flex-shrink: 0;
}

.info-text {
  font-size: 0.9rem;
  color: var(--color-gray-600);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.btn-delete {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: var(--color-error);
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 0.5rem;
}

.btn-delete:hover {
  background: var(--color-error-dark);
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(239, 68, 68, 0.3);
}

.btn-icon {
  width: 1rem;
  height: 1rem;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
}

.empty-icon-container {
  display: inline-flex;
  padding: 1.5rem;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  border-radius: 50%;
  margin-bottom: 1.5rem;
}

.empty-icon {
  width: 3rem;
  height: 3rem;
  color: white;
}

.empty-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-gray-800);
  margin: 0 0 0.75rem 0;
}

.empty-description {
  font-size: 1.1rem;
  color: var(--color-gray-500);
  margin: 0 0 2rem 0;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

/* Error Message */
.error-message {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--color-error);
  color: white;
  padding: 15px 25px;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  z-index: 1002;
  display: flex;
  align-items: center;
  gap: 10px;
}

.error-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.error-icon {
  width: 24px;
  height: 24px;
  color: white;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .container {
    max-width: 100%;
    padding: 0 1rem;
  }

  .page-title {
    font-size: 2.25rem;
  }

  .filters-section {
    gap: 0.75rem;
  }
}

@media (max-width: 968px) {
  .user-management {
    padding: 1.5rem;
  }

  .page-title {
    font-size: 2rem;
  }

  .page-subtitle {
    font-size: 1rem;
  }

  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .filters-section {
    flex-direction: column;
    gap: 1rem;
  }

  .role-filter {
    min-width: 100%;
  }
}

@media (max-width: 768px) {
  .user-management {
    padding: 1rem;
  }

  .page-title {
    font-size: 1.75rem;
  }

  .page-subtitle {
    font-size: 0.95rem;
  }

  .empty-state {
    padding: 3rem 1.5rem;
  }

  .empty-title {
    font-size: 1.5rem;
  }

  .empty-description {
    font-size: 1rem;
  }
}

@media (max-width: 640px) {
  .user-management {
    padding: 0.75rem;
    min-height: auto;
    height: auto;
    overflow: visible;
  }

  .container {
    width: 100%;
    max-width: 100%;
    margin: 0;
    padding: 0;
  }

  .page-header {
    margin-bottom: 1.5rem;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .page-subtitle {
    font-size: 0.9rem;
  }

  .filters-section {
    margin-bottom: 1.5rem;
  }

  .empty-state {
    padding: 2rem 1rem;
  }

  .empty-icon-container {
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .empty-icon {
    width: 2rem;
    height: 2rem;
  }

  .empty-title {
    font-size: 1.25rem;
  }

  .empty-description {
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .user-management {
    padding: 0.5rem;
    min-height: auto;
    height: auto;
    overflow: visible;
  }

  .container {
    width: 100%;
    max-width: 100%;
    margin: 0;
    padding: 0;
  }

  .page-title {
    font-size: 1.25rem;
  }

  .page-subtitle {
    font-size: 0.85rem;
  }

  .filters-section {
    margin-bottom: 1rem;
  }

  .empty-state {
    padding: 1.5rem 0.75rem;
  }

  .empty-title {
    font-size: 1.125rem;
  }

  .empty-description {
    font-size: 0.85rem;
  }
}

/* Pagination Styles */
.pagination-section {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  margin-top: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.pagination-info {
  display: flex;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.pagination-text {
  color: var(--color-gray-500);
  font-size: 0.875rem;
  font-weight: 500;
}

.items-per-page {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.items-per-page label {
  color: var(--color-gray-500);
  font-size: 0.875rem;
  font-weight: 500;
}

.items-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-gray-300);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.items-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.1);
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.pagination-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--color-slate-100);
  border: 1px solid var(--color-slate-200);
  border-radius: 0.5rem;
  color: var(--color-slate-600);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(.disabled) {
  background: var(--color-slate-200);
  border-color: var(--color-slate-300);
}

.pagination-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-icon {
  width: 1rem;
  height: 1rem;
}

.page-numbers {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.page-btn {
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-slate-100);
  border: 1px solid var(--color-slate-200);
  border-radius: 0.5rem;
  color: var(--color-slate-600);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover {
  background: var(--color-slate-200);
  border-color: var(--color-slate-300);
}

.page-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.page-ellipsis {
  color: var(--color-gray-400);
  font-size: 0.875rem;
  padding: 0 0.5rem;
}

/* Responsive pagination */
@media (max-width: 768px) {
  .pagination-section {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }

  .pagination-info {
    justify-content: center;
  }

  .pagination-controls {
    justify-content: center;
  }

  .page-numbers {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>
