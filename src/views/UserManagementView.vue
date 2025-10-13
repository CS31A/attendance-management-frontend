<script setup>
import { ref, computed } from 'vue'
import CreateUserModal from '@/components/CreateUserModal.vue'

// All users (teachers and students only)
const users = ref([])
const showAddUser = ref(false)
const searchQuery = ref('')
const selectedRole = ref('All Roles')

// Role filters (removed Admin)
const roleFilters = ['All Roles', 'Teacher', 'Student']

// Filter users by role and search
const filteredUsers = computed(() => {
  let filtered = users.value

  // Filter by role
  if (selectedRole.value !== 'All Roles') {
    filtered = filtered.filter(u => u.role === selectedRole.value)
  }

  // Filter by search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(u => 
      u.firstName.toLowerCase().includes(query) ||
      u.lastName.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query)
    )
  }

  return filtered
})

// Get role color
const getRoleColor = (role) => {
  const colors = {
    Teacher: 'teacher-badge',
    Student: 'student-badge'
  }
  return colors[role] || 'default-badge'
}

// Get role icon
const getRoleIcon = (role) => {
  const icons = {
    Teacher: 'M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z',
    Student: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222'
  }
  return icons[role] || ''
}

// Handle user creation from modal
const handleCreateUser = (userData) => {
  const newUser = {
    id: Date.now(),
    ...userData,
    createdAt: new Date().toLocaleDateString()
  }

  users.value.push(newUser)
  showAddUser.value = false
  alert(`${newUser.role} account created successfully!`)
}

// Handle modal cancel
const handleCancel = () => {
  showAddUser.value = false
}

// Delete user
const deleteUser = (id) => {
  if (confirm('Are you sure you want to delete this user?')) {
    users.value = users.value.filter(u => u.id !== id)
    alert('User deleted successfully!')
  }
}
</script>

<template>
  <div class="user-management">
    <div class="container">
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

      <!-- Users Grid -->
      <div class="users-grid" v-if="filteredUsers.length > 0">
        <div v-for="user in filteredUsers" :key="user.id" class="user-card">
          <!-- Card Header -->
          <div class="card-header">
            <div class="user-info">
              <div class="avatar-container">
                <svg class="avatar-icon" fill="currentColor" viewBox="0 0 24 24">
                  <path :d="getRoleIcon(user.role)" />
                </svg>
              </div>
              <div class="user-details">
                <h3 class="user-name">{{ user.firstName }} {{ user.lastName }}</h3>
                <span class="role-badge" :class="getRoleColor(user.role)">
                  {{ user.role }}
                </span>
              </div>
            </div>
          </div>

          <!-- Card Body -->
          <div class="card-body">
            <div class="info-item">
              <svg class="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              <span class="info-text">{{ user.email }}</span>
            </div>

            <div class="info-item">
              <svg class="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <span class="info-text">Joined {{ user.createdAt }}</span>
            </div>

            <button @click="deleteUser(user.id)" class="btn-delete">
              <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
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

    <!-- Modal Component -->
    <CreateUserModal
      v-if="showAddUser"
      @create="handleCreateUser"
      @cancel="handleCancel"
    />
  </div>
</template>

<style scoped>
/* Main Container */
.user-management {
  min-height: 100vh;
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
  padding: 2rem;
  position: relative;
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
  color: white;
  margin: 0 0 0.5rem 0;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  background: linear-gradient(45deg, #ffffff, #e0e7ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-subtitle {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  font-weight: 300;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.btn-add-user {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.95);
  color: #667eea;
  border: none;
  padding: 0.875rem 1.75rem;
  border-radius: 16px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-add-user:hover {
  background: rgba(255, 255, 255, 1);
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
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
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.role-filter {
  min-width: 180px;
}

.filter-select {
  width: 100%;
  padding: 0.875rem 1rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  background: white;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  font-weight: 500;
  color: #374151;
  transition: all 0.3s ease;
}

.filter-select:focus {
  outline: none;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

/* Users Grid */
.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  animation: fadeIn 0.8s ease-out;
}

/* User Card */
.user-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
  transition: all 0.3s ease;
  animation: fadeInUp 0.5s ease-out backwards;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

.teacher-badge {
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);
}

.btn-empty-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px rgba(102, 126, 234, 0.4);
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
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

/* Responsive */
@media (max-width: 768px) {
  .user-management {
    padding: 1rem;
  }

  .page-title {
    font-size: 2rem;
  }

  .filters-section {
    flex-direction: column;
  }

  .role-filter {
    min-width: 100%;
  }

  .users-grid {
    grid-template-columns: 1fr;
  }

  .header-content {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-add-user {
    justify-content: center;
  }
}
</style>