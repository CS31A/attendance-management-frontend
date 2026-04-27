<script setup lang="ts">
import { ArchiveRestore, ArchiveX, Calendar, Edit, Eye, GraduationCap, Mail, MoreVertical, Trash2, User } from 'lucide-vue-next'
import { formatShortTableDate as formatDate } from '@/utils/date'
import { onMounted, onUnmounted, ref } from 'vue'

interface User {
  userId?: string | number
  id?: string | number
  role?: string
  firstName?: string
  lastname?: string
  firstname?: string
  lastName?: string
  name?: string
  fullName?: string
  email?: string
  sectionId?: string
  section?: string
  sectionName?: string
  createdAt?: string
}

defineProps<{
  users: User[]
  showRestore?: boolean
}>()

defineEmits(['edit', 'softDelete', 'delete', 'restore', 'view'])

// Dropdown state
const openDropdownId = ref<string | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)

function toggleDropdown(userId: string) {
  openDropdownId.value = openDropdownId.value === userId ? null : userId
}

function closeDropdown() {
  openDropdownId.value = null
}

function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Get role icon component
function _getRoleIcon(role: string) {
  const icons: Record<string, any> = {
    Instructor: GraduationCap,
    Student: User,
  }
  return icons[role] || User
}

// Get user name - handle different possible field names
function getUserName(user: any) {
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
function _getUserSection(user: any) {
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
            <div ref="dropdownRef" class="app-cell-actions">
              <button
                class="app-btn-icon app-btn-ellipsis"
                title="Actions"
                @click="toggleDropdown(String(user.userId || user.id))"
              >
                <MoreVertical :size="16" />
              </button>
              <transition name="dropdown-fade">
                <div
                  v-if="openDropdownId === String(user.userId || user.id)"
                  class="actions-dropdown"
                >
                  <button
                    class="dropdown-item"
                    @click="$emit('edit', user); closeDropdown()"
                  >
                    <Edit :size="14" />
                    <span>Edit</span>
                  </button>
                  <button
                    v-if="user.role === 'Student'"
                    class="dropdown-item"
                    @click="$emit('view', user); closeDropdown()"
                  >
                    <Eye :size="14" />
                    <span>View Details</span>
                  </button>
                  <button
                    v-if="showRestore"
                    class="dropdown-item"
                    @click="$emit('restore', user); closeDropdown()"
                  >
                    <ArchiveRestore :size="14" />
                    <span>Restore</span>
                  </button>
                  <button
                    v-else
                    class="dropdown-item"
                    @click="$emit('softDelete', user); closeDropdown()"
                  >
                    <ArchiveX :size="14" />
                    <span>Archive</span>
                  </button>
                  <button
                    class="dropdown-item dropdown-item-danger"
                    @click="$emit('delete', user); closeDropdown()"
                  >
                    <Trash2 :size="14" />
                    <span>Delete</span>
                  </button>
                </div>
              </transition>
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

/* Actions Dropdown Styles */
.app-cell-actions {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.app-btn-ellipsis {
  color: var(--color-gray-600);
  background: transparent;
  border: none;
  padding: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.app-btn-ellipsis:hover {
  background: var(--color-gray-100);
  color: var(--color-primary);
}

.actions-dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 0.5rem);
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--color-gray-200);
  overflow: hidden;
  z-index: 100;
  min-width: 160px;
  padding: 0.25rem;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.625rem 0.875rem;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  color: var(--color-gray-700);
  font-weight: 500;
  text-align: left;
}

.dropdown-item:hover {
  background: var(--color-gray-50);
  color: var(--color-primary);
}

.dropdown-item-danger {
  color: var(--color-error);
}

.dropdown-item-danger:hover {
  background: rgba(220, 38, 38, 0.1);
  color: var(--color-error);
}

/* Dropdown Transition */
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: all 0.2s ease;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
