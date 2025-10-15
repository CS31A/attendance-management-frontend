<template>
    <div class="table-container">
      <div class="table-wrapper">
        <table class="users-table">
          <thead>
            <tr>
              <th class="th-avatar">Avatar</th>
              <th class="th-name">Name</th>
              <th class="th-email">Email</th>
              <th class="th-section">Section</th>
              <th class="th-joined">Joined</th>
              <th class="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id" class="user-row">
              <td class="td-avatar">
                <div class="avatar-circle" :class="user.role.toLowerCase()">
                  <svg class="avatar-icon" fill="currentColor" viewBox="0 0 24 24">
                    <path :d="getRoleIcon(user.role)" />
                  </svg>
                </div>
              </td>
              <td class="td-name">
                <div class="name-cell">
                  <span class="user-name">{{ getUserName(user) }}</span>
                </div>
              </td>
              <td class="td-email">
                <div class="email-cell">
                  <svg class="email-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                  <span class="email-text">{{ user.email }}</span>
                </div>
              </td>
              <td class="td-section">
                <div class="section-cell">
                  <span class="section-text">{{ getUserSection(user) }}</span>
                </div>
              </td>
              <td class="td-joined">
                <div class="joined-cell">
                  <svg class="date-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  <span class="date-text">{{ user.createdAt }}</span>
                </div>
              </td>
              <td class="td-actions">
                <div class="action-buttons">
                  <button class="btn-edit" @click="$emit('edit', user)" title="Edit User">
                    <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </button>
                  <button class="btn-delete" @click="$emit('delete', user.id)" title="Delete User">
                    <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </template>
  
  <script setup>
  defineProps({
    users: {
      type: Array,
      required: true
    }
  })
  
  defineEmits(['edit', 'delete'])
  
  // Get role icon
  const getRoleIcon = (role) => {
    const icons = {
      Instructor: 'M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z',
      Student: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222'
    }
    return icons[role] || ''
  }

  // Get user name - handle different possible field names
  const getUserName = (user) => {
    // Try different possible field name combinations
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    if (user.firstname && user.lastname) {
      return `${user.firstname} ${user.lastname}`
    }
    if (user.name) {
      return user.name
    }
    if (user.fullName) {
      return user.fullName
    }
    // Fallback to email if no name found
    return user.email || 'Unknown User'
  }

  // Get user section - handle different possible field names
  const getUserSection = (user) => {
    if (user.sectionId) {
      return user.sectionId
    }
    if (user.section) {
      return user.section
    }
    if (user.sectionName) {
      return user.sectionName
    }
    return '-'
  }
  </script>
  
<style scoped>
/* Table Container */
.table-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
  overflow: hidden;
  animation: fadeIn 0.8s ease-out;
}

.table-wrapper {
  overflow-x: auto;
}

/* Users Table */
.users-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

/* Table Header */
.users-table thead {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.users-table th {
  padding: 1rem 1.5rem;
  text-align: left;
  font-weight: 600;
  color: white;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.th-avatar {
  width: 80px;
  text-align: center;
}

.th-name {
  min-width: 200px;
}

.th-email {
  min-width: 250px;
}

.th-section {
  width: 100px;
  text-align: center;
}

.th-joined {
  width: 140px;
}

.th-actions {
  width: 120px;
  text-align: center;
}

/* Table Body */
.users-table tbody tr {
  border-bottom: 1px solid #f1f5f9;
  transition: all 0.2s ease;
}

.users-table tbody tr:hover {
  background: #f8fafc;
  transform: scale(1.01);
}

.users-table tbody tr:last-child {
  border-bottom: none;
}

.users-table td {
  padding: 1rem 1.5rem;
  vertical-align: middle;
}

/* Avatar Column */
.td-avatar {
  text-align: center;
}

.avatar-circle {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.avatar-circle.instructor {
  background: #dbeafe;
  color: #3b82f6;
}

.avatar-circle.student {
  background: #dcfce7;
  color: #16a34a;
}

.avatar-icon {
  width: 1.25rem;
  height: 1.25rem;
}

/* Name Column */
.td-name {
  min-width: 200px;
}

.name-cell {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.875rem;
}

/* Email Column */
.td-email {
  min-width: 250px;
}

.email-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.email-icon {
  width: 1rem;
  height: 1rem;
  color: #6b7280;
  flex-shrink: 0;
}

.email-text {
  color: #4b5563;
  font-size: 0.875rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Section Column */
.td-section {
  text-align: center;
}

.section-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

.section-text {
  color: #4b5563;
  font-size: 0.875rem;
  font-weight: 500;
  background: #f1f5f9;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  min-width: 2rem;
  text-align: center;
}

/* Joined Column */
.td-joined {
  width: 140px;
}

.joined-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-icon {
  width: 1rem;
  height: 1rem;
  color: #6b7280;
  flex-shrink: 0;
}

.date-text {
  color: #4b5563;
  font-size: 0.875rem;
}

/* Actions Column */
.td-actions {
  text-align: center;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.btn-edit,
.btn-delete {
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-edit {
  background: #f3f4f6;
  color: #6b7280;
}

.btn-edit:hover {
  background: #e5e7eb;
  color: #374151;
  transform: translateY(-1px);
}

.btn-delete {
  background: #fef2f2;
  color: #dc2626;
}

.btn-delete:hover {
  background: #fecaca;
  color: #b91c1c;
  transform: translateY(-1px);
}

.btn-icon {
  width: 1rem;
  height: 1rem;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Responsive */
@media (max-width: 768px) {
  .table-wrapper {
    overflow-x: scroll;
  }

  .users-table {
    min-width: 600px;
  }

  .users-table th,
  .users-table td {
    padding: 0.75rem 1rem;
  }
}
</style>