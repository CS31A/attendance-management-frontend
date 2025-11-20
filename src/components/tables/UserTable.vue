<script setup>
import { Calendar, Edit, GraduationCap, Mail, Trash2, User } from 'lucide-vue-next'

defineProps({
  users: {
    type: Array,
    required: true,
  },
})

defineEmits(['edit', 'delete'])

// Get role icon component
function _getRoleIcon(role) {
  const icons = {
    Instructor: GraduationCap,
    Student: User,
  }
  return icons[role] || User
}

// Get user name - handle different possible field names
function getUserName(user) {
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
function _getUserSection(user) {
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
function formatDate(value) {
  if (!value)
    return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime()))
    return 'N/A'

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date)
}
</script>

<template>
  <div class="table-wrapper">
    <table class="users-table">
      <thead>
        <tr>
          <!-- <th class="th-avatar">Avatar</th> -->
          <th class="th-name">
            Name
          </th>
          <th class="th-email">
            Email
          </th>
          <th class="th-role">
            Role
          </th>
          <!-- <th class="th-section">Section</th> -->
          <th class="th-joined">
            Joined
          </th>
          <th class="th-actions">
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.id" class="user-row">
          <!-- <td class="td-avatar">
            <div class="avatar-circle" :class="user?.role?.toLowerCase() || 'default'">
              <component :is="getRoleIcon(user?.role || '')" class="avatar-icon" size="20" />
            </div>
          </td> -->
          <td class="td-name">
            <div class="name-cell">
              <span class="user-name">{{ getUserName(user) }}</span>
            </div>
          </td>
          <td class="td-email">
            <div class="email-cell">
              <Mail class="email-icon" size="16" />
              <span class="email-text">{{ user?.email || '⚠️ Email Missing' }}</span>
            </div>
          </td>
          <td class="td-role">
            <div class="role-cell">
              <span class="role-text">{{ user.role }}</span>
            </div>
          </td>
          <!-- <td class="td-section">
            <div class="section-cell">
              <span class="section-text">{{ getUserSection(user) }}</span>
            </div>
          </td> -->
          <td class="td-joined">
            <div class="joined-cell">
              <Calendar class="date-icon" size="16" />
              <span class="date-text">{{ formatDate(user?.createdAt) }}</span>
            </div>
          </td>
          <td class="td-actions">
            <div class="action-buttons">
              <button class="btn-edit" title="Edit User" @click="$emit('edit', user)">
                <Edit class="btn-icon" size="16" />
              </button>
              <button class="btn-delete" title="Delete User" @click="$emit('delete', user.id)">
                <Trash2 class="btn-icon" size="16" />
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

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
/* .td-avatar {
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
} */

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
  /* .th-avatar,
  .td-avatar {
    position: sticky;
    left: 0;
    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
    z-index: 10;
  }

  .td-avatar {
    background: white;
    border-right: 2px solid #e5e7eb;
  } */

  .th-name,
  .td-name {
    position: sticky;
    left: 0; /* Reset to 0 since avatar column is removed */
    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
    z-index: 10;
  }

  .td-name {
    background: white;
    border-right: 2px solid #e5e7eb;
  }

  /* Adjust header colors for sticky columns */
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
  /* .th-avatar,
  .td-avatar {
    left: 0;
    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
  }

  .td-avatar {
    background: white;
  } */

  .th-name,
  .td-name {
    left: 0; /* Reset to 0 since avatar column is removed */
    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
  }

  .td-name {
    background: white;
  }

  /* Adjust column widths for mobile - ensure Actions column is accessible */
  /* .th-avatar,
  .td-avatar {
    width: 60px;
    min-width: 60px;
  } */

  .th-name,
  .td-name {
    width: 120px; /* Increased since avatar column is removed */
    min-width: 120px;
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

  /* .avatar-circle {
    width: 1.75rem; / Slightly smaller
    height: 1.75rem;
  }

  .avatar-icon {
    width: 0.875rem;
    height: 0.875rem;
  } */

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
