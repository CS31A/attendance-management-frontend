<script setup>
import { ArchiveRestore, ArchiveX, Calendar, Edit, GraduationCap, Mail, Trash2, User } from 'lucide-vue-next'

defineProps({
  users: {
    type: Array,
    required: true,
  },
  showRestore: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['edit', 'softDelete', 'delete', 'restore'])

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
  <div class="app-table-wrapper">
    <table class="app-table users-table">
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
        <tr v-for="user in users" :key="user.userId || user.id" class="user-row">
          <!-- <td class="td-avatar">
            <div class="avatar-circle" :class="user?.role?.toLowerCase() || 'default'">
              <component :is="getRoleIcon(user?.role || '')" class="avatar-icon" :size="20" />
            </div>
          </td> -->
          <td class="td-name">
            <div class="app-cell-name">
              <span class="user-name">{{ getUserName(user) }}</span>
            </div>
          </td>
          <td class="td-email">
            <div class="email-cell">
              <Mail class="email-icon" :size="16" />
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
            <div class="app-cell-date">
              <Calendar class="date-icon" :size="16" />
              <span class="date-text">{{ formatDate(user?.createdAt) }}</span>
            </div>
          </td>
          <td class="td-actions">
            <div class="app-cell-actions">
              <button class="app-btn-icon app-btn-edit" title="Edit User" @click="$emit('edit', user)">
                <Edit :size="16" />
              </button>
              <button v-if="showRestore" class="app-btn-icon app-btn-restore" title="Restore User" @click="$emit('restore', user)">
                <ArchiveRestore :size="16" />
              </button>
              <button v-else class="app-btn-icon app-btn-restore" title="Soft Delete (Can be restored)" @click="$emit('softDelete', user)">
                <ArchiveX :size="16" />
              </button>
              <button class="app-btn-icon app-btn-delete" title="Permanently Delete" @click="$emit('delete', user)">
                <Trash2 :size="16" />
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
/* Specific column widths */
.th-name { min-width: 150px; }
.th-email { min-width: 200px; }
.th-role { width: 120px; }
.th-section { width: 100px; text-align: center; }
.th-joined { width: 150px; text-align: center; }
.th-actions { width: 120px; text-align: center; }

/* Custom Cell Styles */
.email-cell {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--color-gray-500);
}

.email-icon {
  color: var(--color-gray-400);
  flex-shrink: 0;
}

.section-text {
  background: var(--color-gray-100);
  color: var(--color-gray-700);
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
}

/* Responsive Sticky Columns */
@media (max-width: 768px) {
  .users-table {
    min-width: 700px;
  }

  .th-name,
  .td-name {
    position: sticky;
    left: 0;
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
    z-index: 10;
  }

  .td-name {
    background: white;
    border-right: 2px solid var(--color-gray-200);
  }

  .th-name {
    color: white;
  }
}

@media (max-width: 640px) {
  .users-table {
    min-width: 600px;
  }

  .th-name,
  .td-name {
    position: sticky;
    left: 0;
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
    z-index: 10;
  }

  .td-name {
    background: white;
  }

  .th-name, .td-name { width: 120px; min-width: 120px; }
  .th-email, .td-email { width: 120px; min-width: 120px; }
  .th-section, .td-section { width: 70px; min-width: 70px; }
  .th-joined, .td-joined { width: 90px; min-width: 90px; }

  .th-actions,
  .td-actions {
    width: 120px;
    min-width: 120px;
    position: sticky;
    right: 0;
    background: white;
    border-left: 2px solid var(--color-gray-200);
    z-index: 5;
  }

  .th-actions {
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
    color: white;
  }

  /* Truncate text */
  .user-name,
  .email-text,
  .section-text,
  .date-text {
    font-size: 0.75rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
    display: block;
  }
}

@media (max-width: 480px) {
  .users-table {
    min-width: 550px;
  }
  .th-name, .td-name { min-width: 100px; }
  .th-actions, .td-actions { min-width: 100px; }
}

@media (max-width: 320px) {
  .users-table {
    min-width: 480px;
  }
  .th-name, .td-name { min-width: 80px; }
  .th-actions, .td-actions { min-width: 80px; }
  .user-name, .email-text, .date-text { font-size: 0.6875rem; }
}
</style>
