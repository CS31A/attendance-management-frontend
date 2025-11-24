<script setup>
import { AlertTriangle, Loader2, Plus, Users } from 'lucide-vue-next'
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue'
import { useUserStore } from '@/stores/userStore'

const CreateUserModal = defineAsyncComponent(() => import('@/components/CreateUserModal.vue'))
const EditUserModal = defineAsyncComponent(() => import('@/components/EditUserModal.vue'))
const UserTableSection = defineAsyncComponent(() => import('@/components/tables/UserTableSection.vue'))
const SearchBar = defineAsyncComponent(() => import('@/components/common/SearchBar.vue'))

const userStore = useUserStore()

const showAddUser = ref(false)
const showEditUser = ref(false)
const editingUser = ref(null)
const searchQuery = ref('')
const selectedRole = ref('All Roles')
const createModal = ref(null)
const editModal = ref(null)

const roleFilters = ['All Roles', 'Instructor', 'Student']

onMounted(async () => {
  try {
    await userStore.fetchUsers()
  }
  catch (error) {
    console.error('Failed to load users:', error)
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

async function handleCreateUser(userData) {
  const result = await userStore.createUser(userData)
  if (result.success) {
    showAddUser.value = false
  }
  else {
    createModal.value?.handleError(result.error)
  }
}

async function handleUpdateUser(updatedUserData) {
  const result = await userStore.updateUser(editingUser.value.id, updatedUserData)
  if (result.success) {
    showEditUser.value = false
    editingUser.value = null
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

async function deleteUser(id) {
  if (!confirm('Are you sure you want to delete this user?')) {
    return
  }

  const userToDelete = userStore.users.find(u => u.id === id)
  const result = await userStore.deleteUser(id, userToDelete.role)

  if (!result.success) {
    console.error('Delete error:', result.error)
  }
}

function handleEditUser(user) {
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

function goToPage(page) {
  userStore.goToPage(page, searchQuery.value, selectedRole.value)
}

function setItemsPerPage(itemsPerPage) {
  userStore.setItemsPerPage(itemsPerPage)
}

// Reset pagination when search or filter changes
watch([searchQuery, selectedRole], () => {
  userStore.setCurrentPage(1)
})
</script>

<template>
  <div class="user-management">
    <!-- Loading State -->
    <div v-if="userStore.loading && !userStore.users.length" class="loading-state">
      <Loader2 class="spinner" size="40" />
      <p>Loading users...</p>
    </div>

    <!-- Error message -->
    <div v-else-if="userStore.error" class="error-message">
      <div class="error-content">
        <AlertTriangle class="error-icon" size="24" />
        <p>{{ userStore.error }}</p>
        <button class="retry-btn" @click="userStore.fetchUsers">
          Retry
        </button>
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
              Manage teachers and students
            </p>
          </div>
          <button class="btn-add-user" @click="showAddUser = true">
            <Plus class="icon" size="20" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      <!-- Filters Section -->
      <div class="filters-section">
        <SearchBar
          v-model="searchQuery"
          placeholder="Search by name or email..."
        />

        <div class="role-filter">
          <select v-model="selectedRole" class="filter-select">
            <option v-for="filter in roleFilters" :key="filter" :value="filter">
              {{ filter }}
            </option>
          </select>
        </div>
      </div>

      <!-- All Roles Table -->
      <UserTableSection
        v-if="selectedRole === 'All Roles' && filteredUsers.length > 0"
        :users="paginatedUsers"
        title="All Users"
        role="All"
        :pagination="{
          currentPage,
          totalPages,
          hasNextPage,
          hasPreviousPage,
          totalUsers,
          itemsPerPage: userStore.itemsPerPage,
        }"
        @edit="handleEditUser"
        @delete="deleteUser"
        @next-page="nextPage"
        @previous-page="previousPage"
        @go-to-page="goToPage"
        @set-items-per-page="setItemsPerPage"
      />

      <!-- Teachers Table -->
      <UserTableSection
        v-if="selectedRole === 'Instructor' && filteredInstructors.length > 0"
        :users="filteredInstructors"
        title="Instructors"
        role="Instructor"
        @edit="handleEditUser"
        @delete="deleteUser"
      />

      <!-- Students Table -->
      <UserTableSection
        v-if="selectedRole === 'Student' && filteredStudents.length > 0"
        :users="filteredStudents"
        title="Students"
        role="Student"
        @edit="handleEditUser"
        @delete="deleteUser"
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
          {{ searchQuery ? 'Try adjusting your search or filters' : 'Get started by adding your first user' }}
        </p>
        <button v-if="!searchQuery" class="btn-empty-action" @click="showAddUser = true">
          <Plus class="icon" size="20" />
          <span>Add Your First User</span>
        </button>
      </div>
    </div>

    <!-- Create User Modal -->
    <CreateUserModal
      v-if="showAddUser"
      ref="createModal"
      @create="handleCreateUser"
      @cancel="handleCancel"
    />

    <!-- Edit User Modal -->
    <EditUserModal
      v-if="showEditUser"
      ref="editModal"
      :user="editingUser"
      @update="handleUpdateUser"
      @cancel="handleCancel"
    />
  </div>
</template>

<style scoped>
/* Main Container */
.user-management {
  min-height: 100vh;
  background: var(--color-slate-100);
  padding: 2rem;
  position: relative;
  overflow-x: hidden;
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

.btn-add-user {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 0.875rem 1.75rem;
  border-radius: 16px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 8px 25px rgba(30, 58, 138, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-add-user:hover {
  background: var(--color-primary-light);
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 15px 35px rgba(30, 58, 138, 0.4);
}

.icon {
  width: 1.25rem;
  height: 1.25rem;
}

/* Filters Section */
.filters-section {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.role-filter {
  min-width: 180px;
}

.filter-select {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid var(--color-gray-200);
  border-radius: 16px;
  font-size: 1rem;
  background: white;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  font-weight: 500;
  color: var(--color-gray-700);
  transition: all 0.3s ease;
}
.filter-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 8px 25px rgba(30, 58, 138, 0.2);
  transform: translateY(-2px);
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

.btn-empty-action {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(30, 58, 138, 0.3);
}

.btn-empty-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px rgba(30, 58, 138, 0.4);
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: var(--color-gray-500);
}

.spinner {
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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

.retry-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid white;
  padding: 8px 15px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  background: rgba(255, 255, 255, 0.3);
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

  .btn-add-user {
    justify-content: center;
    width: 100%;
  }

  .filters-section {
    flex-direction: column;
    gap: 1rem;
  }

  .search-box {
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

  .btn-add-user {
    padding: 0.75rem 1.5rem;
    font-size: 0.9rem;
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

  .btn-add-user {
    padding: 0.625rem 1.25rem;
    font-size: 0.85rem;
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

  .btn-empty-action {
    padding: 0.75rem 1.5rem;
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

  .btn-add-user {
    padding: 0.5rem 1rem;
    font-size: 0.8rem;
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

  .btn-empty-action {
    padding: 0.625rem 1.25rem;
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
