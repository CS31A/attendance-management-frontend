<template>
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
            <div class="avatar-circle" :class="user?.role?.toLowerCase() || 'default'">
              <svg class="avatar-icon" fill="currentColor" viewBox="0 0 24 24">
                <path :d="getRoleIcon(user?.role || '')" />
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
              <span class="email-text">{{ user?.email || '⚠️ Email Missing' }}</span>
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
              <span class="date-text">{{ formatDate(user?.createdAt) }}</span>
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

// Format date for display
const formatDate = (value) => {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  }).format(date)
}
</script>

<style scoped>
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
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
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
  min-width: 150px;
}

.th-email {
  min-width: 200px;
}

.th-section {
  width: 100px;
  text-align: center;
}

.th-joined {
  width: 120px;
  text-align: center;
}

.th-actions {
  width: 120px;
  text-align: center;
}

/* Table Body */
.users-table tbody tr {
  border-bottom: 1px solid #e5e7eb;
  transition: background-color 0.2s ease;
}

.users-table tbody tr:hover {
  background-color: #f8fafc;
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
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  color: white;
  font-weight: 600;
}

.avatar-circle.instructor {
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
}

.avatar-circle.student {
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
}

.avatar-circle.default {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
}

.avatar-icon {
  width: 1.25rem;
  height: 1.25rem;
}

/* Name Column */
.td-name {
  font-weight: 600;
  color: #1f2937;
}

.user-name {
  font-size: 0.875rem;
}

/* Email Column */
.td-email {
  color: #6b7280;
}

.email-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.email-icon {
  width: 1rem;
  height: 1rem;
  color: #9ca3af;
  flex-shrink: 0;
}

.email-text {
  font-size: 0.875rem;
}

/* Section Column */
.td-section {
  text-align: center;
}

.section-text {
  background: #f3f4f6;
  color: #374151;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
}

/* Joined Column */
.td-joined {
  text-align: center;
  color: #6b7280;
}

.joined-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.date-icon {
  width: 1rem;
  height: 1rem;
  color: #9ca3af;
  flex-shrink: 0;
}

.date-text {
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
  background: #eff6ff;
  color: #1e3a8a;
}

.btn-edit:hover {
  background: #dbeafe;
  color: #1e40af;
}

.btn-delete {
  background: #fef2f2;
  color: #dc2626;
}

.btn-delete:hover {
  background: #fecaca;
  color: #b91c1c;
}

.btn-icon {
  width: 1rem;
  height: 1rem;
}

/* Responsive Table with Sticky Columns */
@media (max-width: 768px) {
  .table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    border-radius: 12px;
  }
  
  .users-table {
    min-width: 700px; /* Increased to ensure Actions column is visible */
  }
  
  /* Sticky first column (Avatar + Name) */
  .th-avatar,
  .td-avatar {
    position: sticky;
    left: 0;
    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
    z-index: 10;
  }
  
  .td-avatar {
    background: white;
    border-right: 2px solid #e5e7eb;
  }
  
  .th-name,
  .td-name {
    position: sticky;
    left: 80px; /* Width of avatar column */
    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
    z-index: 10;
  }
  
  .td-name {
    background: white;
    border-right: 2px solid #e5e7eb;
  }
  
  /* Adjust header colors for sticky columns */
  .th-avatar,
  .th-name {
    color: white;
  }
}

@media (max-width: 640px) {
  .table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  .users-table {
    min-width: 600px; /* Increased to ensure Actions column is visible */
  }
  
  /* Make avatar and name columns stickier on smaller screens */
  .th-avatar,
  .td-avatar {
    left: 0;
    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
  }
  
  .td-avatar {
    background: white;
  }
  
  .th-name,
  .td-name {
    left: 60px; /* Smaller avatar width on mobile */
    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
  }
  
  .td-name {
    background: white;
  }
  
  /* Adjust column widths for mobile - ensure Actions column is accessible */
  .th-avatar,
  .td-avatar {
    width: 60px;
    min-width: 60px;
  }
  
  .th-name,
  .td-name {
    width: 100px; /* Reduced to make room for other columns */
    min-width: 100px;
  }
  
  .th-email,
  .td-email {
    width: 120px; /* Reduced to make room for Actions */
    min-width: 120px;
  }
  
  .th-section,
  .td-section {
    width: 70px; /* Reduced to make room for Actions */
    min-width: 70px;
  }
  
  .th-joined,
  .td-joined {
    width: 90px; /* Reduced to make room for Actions */
    min-width: 90px;
  }
  
  .th-actions,
  .td-actions {
    width: 120px; /* Increased to ensure buttons are accessible */
    min-width: 120px;
    position: sticky;
    right: 0; /* Stick to the right side */
    background: white;
    border-left: 2px solid #e5e7eb;
    z-index: 5;
  }
  
  .th-actions {
    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
    color: white;
  }
  
  /* Adjust padding for mobile */
  .users-table th,
  .users-table td {
    padding: 0.5rem 0.375rem; /* Reduced padding to fit more content */
  }
  
  .avatar-circle {
    width: 1.75rem; /* Slightly smaller */
    height: 1.75rem;
  }
  
  .avatar-icon {
    width: 0.875rem;
    height: 0.875rem;
  }
  
  .btn-edit,
  .btn-delete {
    padding: 0.25rem; /* Smaller buttons */
    margin: 0 0.125rem; /* Small margin between buttons */
  }
  
  .btn-icon {
    width: 0.75rem; /* Smaller icons */
    height: 0.75rem;
  }
  
  /* Make action buttons more compact */
  .action-buttons {
    gap: 0.25rem;
    justify-content: center;
  }
  
  /* Ensure text doesn't wrap in action column */
  .user-name,
  .email-text,
  .section-text,
  .date-text {
    font-size: 0.75rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
