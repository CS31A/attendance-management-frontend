<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import CreateUserModal from '@/components/CreateUserModal.vue'
import EditUserModal from '@/components/EditUserModal.vue'
import UserTableSection from '@/components/tables/UserTableSection.vue'
import { useUserStore } from '@/stores/userStore'

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
  } catch (error) {
    console.error('Failed to load users:', error)
  }
})

const filteredUsers = computed(() => 
  userStore.filteredUsers(searchQuery.value, selectedRole.value)
)

const paginatedUsers = computed(() => 
  userStore.paginatedUsers(searchQuery.value, selectedRole.value)
)

const filteredInstructors = computed(() => 
  paginatedUsers.value.filter(u => u.role === 'Instructor')
)

const filteredStudents = computed(() => 
  paginatedUsers.value.filter(u => u.role === 'Student')
)

// Pagination computed properties
const totalPages = computed(() => 
  userStore.totalPages(searchQuery.value, selectedRole.value)
)

const hasNextPage = computed(() => 
  userStore.hasNextPage(searchQuery.value, selectedRole.value)
)

const hasPreviousPage = computed(() => 
  userStore.hasPreviousPage
)

const currentPage = computed(() => 
  userStore.currentPage
)

const totalUsers = computed(() => 
  filteredUsers.value.length
)

const getRoleColor = (role) => {
  const colors = {
    Instructor: 'instructor-badge',
    Student: 'student-badge'
  }
  return colors[role] || 'default-badge'
}

const getRoleIcon = (role) => {
  const icons = {
    Instructor: 'M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z',
    Student: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222'
  }
  return icons[role] || ''
}

const handleCreateUser = async (userData) => {
  const result = await userStore.createUser(userData)
  if (result.success) {
    showAddUser.value = false
  } else {
    createModal.value?.handleError(result.error)
  }
}

const handleUpdateUser = async (updatedUserData) => {
  const result = await userStore.updateUser(editingUser.value.id, updatedUserData)
  if (result.success) {
    showEditUser.value = false
    editingUser.value = null
  } else {
    editModal.value?.handleError(result.error)
  }
}

const handleCancel = () => {
  showAddUser.value = false
  showEditUser.value = false
  editingUser.value = null
}

const deleteUser = async (id) => {
  if (!confirm('Are you sure you want to delete this user?')) {
    return
  }
  
  const userToDelete = userStore.users.find(u => u.id === id)
  const result = await userStore.deleteUser(id, userToDelete.role)
  
  if (!result.success) {
    console.error('Delete error:', result.error)
  }
}

const handleEditUser = (user) => {
  editingUser.value = user
  showEditUser.value = true
}

// Pagination methods
const nextPage = () => {
  userStore.nextPage(searchQuery.value, selectedRole.value)
}

const previousPage = () => {
  userStore.previousPage()
}

const goToPage = (page) => {
  userStore.goToPage(page, searchQuery.value, selectedRole.value)
}

const setItemsPerPage = (itemsPerPage) => {
  userStore.setItemsPerPage(itemsPerPage)
}

// Reset pagination when search or filter changes
watch([searchQuery, selectedRole], () => {
  userStore.setCurrentPage(1)
})
</script>
<template>
  <div class="user-management">
    <!-- Loading overlay -->
    <div v-if="userStore.loading" class="loading-overlay">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>Loading...</p>
      </div>
    </div>
    
    <!-- Error message -->
    <div v-if="userStore.error" class="error-message">
      <div class="error-content">
        <svg class="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <p>{{ userStore.error }}</p>
        <button @click="userStore.fetchUsers" class="retry-btn">Retry</button>
      </div>
    </div>
    
    <!-- Main content - only show if we have users or no error -->
    <div v-else-if="userStore.users.length > 0 || !userStore.error" class="container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-text">
            <h1 class="page-title">User Management</h1>
            <p class="page-subtitle">Manage teachers and students</p>
          </div>
          <button @click="showAddUser = true" class="btn-add-user">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            <span>Add User</span>
          </button>
        </div>
      </div>

      <!-- Filters Section -->
      <div class="filters-section">
        <div class="search-box">
          <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Search by name or email..."
            class="search-input"
          />
        </div>

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
          itemsPerPage: userStore.itemsPerPage
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
          <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
          </svg>
        </div>
        <h3 class="empty-title">No Users Found</h3>
        <p class="empty-description">
          {{ searchQuery ? 'Try adjusting your search or filters' : 'Get started by adding your first user' }}
        </p>
        <button v-if="!searchQuery" @click="showAddUser = true" class="btn-empty-action">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          <span>Add Your First User</span>
        </button>
      </div>

    </div>
    
    <!-- Empty state -->
    <div v-else class="empty-state">
      <p>No users found</p>
    </div>

    <!-- Create User Modal -->
    <CreateUserModal
      v-if="showAddUser"
      @create="handleCreateUser"
      @cancel="handleCancel"
      ref="createModal"
    />

    <!-- Edit User Modal -->
    <EditUserModal
      v-if="showEditUser"
      :user="editingUser"
      @update="handleUpdateUser"
      @cancel="handleCancel"
      ref="editModal"
    />
  </div>
</template>

<style scoped>
/* Main Container */
.user-management {
  min-height: 100vh;
  background: #f8fafc;
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
  animation: slideInDown 0.6s ease-out;
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
  color: #1e3a8a;
  margin: 0 0 0.5rem 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-subtitle {
  font-size: 1.1rem;
  color: #6b7280;
  margin: 0;
  font-weight: 300;
}

.btn-add-user {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #1e3a8a;
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
  background: #1e40af;
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
  animation: slideInUp 0.8s ease-out;
}

.search-box {
  flex: 1;
  position: relative;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.25rem;
  height: 1.25rem;
  color: #9ca3af;
  pointer-events: none;
  transition: color 0.2s ease;
}

.search-input {
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 3rem;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  font-size: 1rem;
  background: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #1e3a8a;
  box-shadow: 0 8px 25px rgba(30, 58, 138, 0.2);
  transform: translateY(-2px);
}

.search-input:focus + .search-icon {
  color: #1e3a8a;
}

.role-filter {
  min-width: 180px;
}

.filter-select {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  font-size: 1rem;
  background: white;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  font-weight: 500;
  color: #374151;
  transition: all 0.3s ease;
}
.filter-select:focus {
  outline: none;
  border-color: #1e3a8a;
  box-shadow: 0 8px 25px rgba(30, 58, 138, 0.2);
  transform: translateY(-2px);
}

/* Users Grid */
.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  animation: fadeInUp 0.8s ease-out;
}

/* User Card */
.user-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  animation: slideInUp 0.5s ease-out backwards;
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
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
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
  color: #1e40af;
}

.student-badge {
  background-color: rgba(16, 185, 129, 0.2);
  color: #065f46;
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
  background: #f9fafb;
  border-radius: 8px;
}

.info-icon {
  width: 1.125rem;
  height: 1.125rem;
  color: #6b7280;
  flex-shrink: 0;
}

.info-text {
  font-size: 0.9rem;
  color: #4b5563;
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
  background: #ef4444;
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
  background: #dc2626;
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
  animation: fadeIn 0.8s ease-out;
}

.empty-icon-container {
  display: inline-flex;
  padding: 1.5rem;
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
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
  color: #1f2937;
  margin: 0 0 0.75rem 0;
}

.empty-description {
  font-size: 1.1rem;
  color: #6b7280;
  margin: 0 0 2rem 0;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.btn-empty-action {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
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

/* Loading Overlay */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading-spinner {
  text-align: center;
  color: white;
}

.spinner {
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid #1e3a8a;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Error Message */
.error-message {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #ef4444;
  color: white;
  padding: 15px 25px;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  z-index: 999;
  display: flex;
  align-items: center;
  gap: 10px;
  animation: fadeIn 0.5s ease-out;
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

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
}

.items-per-page {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.items-per-page label {
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
}

.items-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.items-select:focus {
  outline: none;
  border-color: #1e3a8a;
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
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  color: #475569;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(.disabled) {
  background: #e2e8f0;
  border-color: #cbd5e1;
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
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  color: #475569;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover {
  background: #e2e8f0;
  border-color: #cbd5e1;
}

.page-btn.active {
  background: #1e3a8a;
  border-color: #1e3a8a;
  color: white;
}

.page-ellipsis {
  color: #9ca3af;
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

