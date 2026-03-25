<script setup>
import { AlertTriangle, Plus, Users, X } from 'lucide-vue-next'
import { computed, defineAsyncComponent, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import ConfirmationModal from '@/components/common/ConfirmationModal.vue'
import DeleteModal from '@/components/common/DeleteModal.vue'
import SkeletonLoader from '@/components/common/SkeletonLoader.vue'
import Toast from '@/components/common/Toast.vue'
import { useUserStore } from '@/stores/userStore'

const CreateUserModal = defineAsyncComponent(() => import('@/components/CreateUserModal.vue'))
const EditUserModal = defineAsyncComponent(() => import('@/components/EditUserModal.vue'))
const UserTableSection = defineAsyncComponent(() => import('@/components/tables/UserTableSection.vue'))
const CustomDropdown = defineAsyncComponent(() => import('@/components/common/CustomDropdown.vue'))

const userStore = useUserStore()

const showAddUser = ref(false)
const showEditUser = ref(false)
const editingUser = ref(null)
const searchQuery = ref('')
const debouncedSearchQuery = ref('')
const isSearching = ref(false)
const selectedRole = ref('All Roles')
const viewMode = ref('Active') // 'Active', 'Archived', 'All'
const createModal = ref(null)
const editModal = ref(null)

// Debounce timer reference
let debounceTimer = null
const DEBOUNCE_DELAY = 300 // milliseconds

// Debounced search handler
function handleSearchInput(value) {
  searchQuery.value = value
  isSearching.value = true

  // Clear previous timer
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  // Set new timer
  debounceTimer = setTimeout(() => {
    debouncedSearchQuery.value = value
    isSearching.value = false
  }, DEBOUNCE_DELAY)
}

// Clear search
function clearSearch() {
  searchQuery.value = ''
  debouncedSearchQuery.value = ''
  isSearching.value = false
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
}

// Cleanup on unmount
onUnmounted(() => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
})

// Delete modal state
const showDeleteModal = ref(false)
const userToDelete = ref(null)
const isDeleting = ref(false)
const deleteType = ref('soft') // 'soft' or 'hard'

// Restore modal state
const showRestoreModal = ref(false)
const userToRestore = ref(null)
const isRestoring = ref(false)

const roleFilters = ['All Roles', 'Instructor', 'Student']

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
  userStore.filteredUsers(debouncedSearchQuery.value, selectedRole.value),
)

const paginatedUsers = computed(() =>
  userStore.paginatedUsers(debouncedSearchQuery.value, selectedRole.value),
)

const filteredInstructors = computed(() =>
  paginatedUsers.value.filter(u => u.role === 'Instructor'),
)

const filteredStudents = computed(() =>
  paginatedUsers.value.filter(u => u.role === 'Student'),
)

// Pagination computed properties
const totalPages = computed(() =>
  userStore.totalPages(debouncedSearchQuery.value, selectedRole.value),
)

const hasNextPage = computed(() =>
  userStore.hasNextPage(debouncedSearchQuery.value, selectedRole.value),
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
  searchQuery.value.length > 0,
)

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

async function handleCreateUser(userData) {
  const result = await userStore.createUser(userData)
  if (result.success) {
    showAddUser.value = false
    showToast('User created successfully', 'success')
  }
  else {
    createModal.value?.handleError(result.error)
  }
}

async function handleUpdateUser(updatedUserData) {
  const id = editingUser.value.userId || editingUser.value.id
  const result = await userStore.updateUser(id, updatedUserData)
  if (result.success) {
    showEditUser.value = false
    editingUser.value = null
    showToast('User updated successfully', 'success')
  }
  else {
    editModal.value?.handleError(result.error)
  }
}

function handleCancel() {
  showAddUser.value = false
  showEditUser.value = false
  editingUser.value = null
}

function handleSoftDeleteUser(user) {
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

function handleHardDeleteUser(user) {
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

function handleRestoreUser(user) {
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

function handleEditUser(user) {
  editingUser.value = user
  showEditUser.value = true
}

// Pagination methods
function nextPage() {
  userStore.nextPage(debouncedSearchQuery.value, selectedRole.value)
}

function previousPage() {
  userStore.previousPage()
}

function goToPage(page) {
  userStore.goToPage(page, debouncedSearchQuery.value, selectedRole.value)
}

function setItemsPerPage(itemsPerPage) {
  userStore.setItemsPerPage(itemsPerPage)
}

// Reset pagination when debounced search or filter changes
watch([debouncedSearchQuery, selectedRole], () => {
  userStore.setCurrentPage(1)
})
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

    <!-- Error message -->
    <div v-else-if="userStore.error" class="error-message">
      <div class="error-content">
        <AlertTriangle class="error-icon" size="24" />
        <p>{{ userStore.error }}</p>
        <BaseButton
          variant="ghost"
          size="small"
          @click="userStore.fetchUsers(viewMode)"
        >
          Retry
        </BaseButton>
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
          <BaseButton
            variant="primary"
            :icon="Plus"
            @click="showAddUser = true"
          >
            Add User
          </BaseButton>
        </div>
      </div>

      <!-- Filters Section -->
      <div class="filters-section">
        <div class="live-search-container">
          <div class="search-input-wrapper" :class="{ 'is-searching': isSearching, 'has-value': hasActiveSearch }">
            <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              :value="searchQuery"
              type="text"
              placeholder="Search by name or email..."
              class="live-search-input"
              @input="handleSearchInput($event.target.value)"
            >
            <div v-if="isSearching" class="search-spinner">
              <div class="spinner" />
            </div>
            <button
              v-else-if="hasActiveSearch"
              type="button"
              class="clear-search-btn"
              title="Clear search"
              @click="clearSearch"
            >
              <X size="16" />
            </button>
          </div>
          <div v-if="hasActiveSearch && !isSearching" class="search-results-info">
            <span class="results-count">{{ totalUsers }} result{{ totalUsers !== 1 ? 's' : '' }} found</span>
          </div>
        </div>

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
      />

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
      />

      <!-- Empty State -->
      <div v-if="filteredUsers.length === 0" class="empty-state">
        <div class="empty-icon-container">
          <Users class="empty-icon" size="48" />
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

/* Live Search Styles */
.live-search-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
}

.search-icon {
  position: absolute;
  left: 0.875rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.125rem;
  height: 1.125rem;
  color: var(--color-gray-400);
  pointer-events: none;
  transition: color 0.2s ease;
}

.search-input-wrapper.is-searching .search-icon,
.search-input-wrapper.has-value .search-icon {
  color: var(--color-primary);
}

.live-search-input {
  width: 100%;
  padding: 0.625rem 2.5rem 0.625rem 2.75rem;
  border: 2px solid var(--color-gray-200);
  border-radius: 12px;
  font-size: 0.875rem;
  background: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.live-search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 8px 25px rgba(30, 58, 138, 0.2);
  transform: translateY(-2px);
}

.search-input-wrapper.is-searching .live-search-input {
  border-color: var(--color-primary-light);
}

.search-spinner {
  position: absolute;
  right: 0.875rem;
  top: 50%;
  transform: translateY(-50%);
}

.spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid var(--color-gray-200);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.clear-search-btn {
  position: absolute;
  right: 0.625rem;
  top: 50%;
  transform: translateY(-50%);
  background: var(--color-gray-100);
  border: none;
  border-radius: 50%;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-gray-500);
  transition: all 0.2s ease;
}

.clear-search-btn:hover {
  background: var(--color-gray-200);
  color: var(--color-gray-700);
}

.search-results-info {
  padding-left: 0.25rem;
}

.results-count {
  font-size: 0.75rem;
  color: var(--color-gray-500);
  font-weight: 500;
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

  .live-search-container {
    order: 1;
  }

  .role-filter {
    order: 2;
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

  .search-input {
    padding: 0.75rem 1rem 0.75rem 2.5rem;
    font-size: 0.9rem;
  }

  .filter-select {
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
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

  .search-input {
    padding: 0.625rem 0.875rem 0.625rem 2.25rem;
    font-size: 0.85rem;
  }

  .search-icon {
    width: 1rem;
    height: 1rem;
    left: 0.75rem;
  }

  .filter-select {
    padding: 0.625rem 0.875rem;
    font-size: 0.85rem;
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

  .search-input {
    padding: 0.5rem 0.75rem 0.5rem 2rem;
    font-size: 0.8rem;
  }

  .search-icon {
    width: 0.875rem;
    height: 0.875rem;
    left: 0.625rem;
  }

  .filter-select {
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
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
