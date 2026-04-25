<script setup lang="ts">
import type { EntityId } from '@/types'
import { BookOpen, Calendar, Edit, Trash2, Users } from 'lucide-vue-next'
import { formatShortTableDate as formatDate } from '@/utils/date'

interface Section {
  id: EntityId
  name?: string
  sectionName?: string
  code?: string
  courseId?: EntityId
  createdAt?: string
  [key: string]: unknown
}

defineProps<{
  sections: Section[]
  isDeletionChecking?: boolean
}>()

defineEmits<{
  edit: [section: Section]
  delete: [id: EntityId]
  manageEnrollments: [section: Section]
}>()

// Get section name - handle different possible field names
function getSectionName(section: Section): string {
  if (section.name) {
    return section.name
  }
  if (section.sectionName) {
    return section.sectionName
  }
  if (section.code) {
    return section.code
  }
  return `Section ${section.id}`
}
</script>

<template>
  <div class="table-wrapper">
    <table class="sections-table">
      <thead>
        <tr>
          <th class="th-id">
            ID
          </th>
          <th class="th-name">
            Section Name
          </th>
          <th class="th-course">
            Course ID
          </th>
          <th class="th-created">
            Created
          </th>
          <th class="th-actions">
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="section in sections" :key="section.id" class="section-row">
          <td class="td-id">
            <span class="id-text">{{ section.id }}</span>
          </td>
          <td class="td-name">
            <div class="name-cell">
              <BookOpen class="section-icon" :size="18" />
              <span class="section-name">{{ getSectionName(section) }}</span>
            </div>
          </td>
          <td class="td-course">
            <span class="course-badge">{{ section.courseId }}</span>
          </td>
          <td class="td-created">
            <div class="created-cell">
              <Calendar class="date-icon" :size="16" />
              <span class="date-text">{{ formatDate(section?.createdAt) }}</span>
            </div>
          </td>
          <td class="td-actions">
            <div class="action-buttons">
              <button class="btn-enroll" title="Manage Enrollments" @click="$emit('manageEnrollments', section)">
                <Users class="btn-icon" :size="16" />
              </button>
              <button class="btn-edit" title="Edit Section" @click="$emit('edit', section)">
                <Edit class="btn-icon" :size="16" />
              </button>
              <button
                class="btn-delete"
                title="Delete Section"
                :disabled="isDeletionChecking"
                @click="$emit('delete', section.id)"
              >
                <Trash2 class="btn-icon" :size="16" />
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

/* Sections Table */
.sections-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

/* Table Header */
.sections-table thead {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
}

.sections-table th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: white;
  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.th-id {
  width: 8%;
  min-width: 60px;
}

.th-name {
  width: 35%;
}

.th-course {
  width: 15%;
}

.th-created {
  width: 25%;
  text-align: left;
}

.th-actions {
  width: 15%;
  text-align: center;
}

/* Table Body */
.sections-table tbody tr {
  border-bottom: 1px solid var(--color-gray-200);
  transition: background-color 0.2s ease;
}

.sections-table tbody tr:hover {
  background-color: var(--color-slate-100);
}

.sections-table td {
  padding: 0.75rem 1rem;
  vertical-align: middle;
}

/* ID Column */
.td-id {
  color: var(--color-gray-500);
  font-family: monospace;
  font-weight: 600;
}

/* Name Column */
.td-name {
  font-weight: 600;
  color: var(--color-gray-800);
}

.name-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-icon {
  color: var(--color-primary);
  flex-shrink: 0;
}

.section-name {
  font-size: 0.8125rem;
}

/* Course Column */
.td-course {
  color: var(--color-gray-600);
}

.course-badge {
  background: var(--color-gray-100);
  color: var(--color-gray-700);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

/* Created Column */
.td-created {
  text-align: left;
  color: var(--color-gray-500);
}

.created-cell {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.375rem;
}

.date-icon {
  color: var(--color-gray-400);
  flex-shrink: 0;
}

.date-text {
  font-size: 0.8125rem;
  white-space: nowrap;
}

/* Actions Column */
.td-actions {
  text-align: center;
}

.action-buttons {
  display: flex;
  gap: 0.375rem;
  justify-content: center;
}

.btn-enroll,
.btn-edit,
.btn-delete {
  padding: 0.375rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-enroll {
  background: var(--color-success-bg);
  color: rgb(22, 101, 52);
}

.btn-enroll:hover {
  background: var(--color-success-bg);
  color: rgb(21, 128, 61);
}

.btn-edit {
  background: var(--color-info-bg);
  color: var(--color-primary);
}

.btn-edit:hover {
  background: var(--color-info-lighter);
  color: var(--color-primary-light);
}

.btn-delete {
  background: var(--color-error-bg);
  color: var(--color-error-dark);
}

.btn-delete:hover:not(:disabled) {
  background: var(--color-error-light);
  color: var(--color-error-darker);
}

.btn-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  width: 1rem;
  height: 1rem;
}

/* Responsive Table */
@media (max-width: 1024px) {
  .table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    border-radius: 12px;
  }

  .sections-table {
    min-width: 600px;
  }
}

@media (max-width: 768px) {
  .table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    border-radius: 12px;
  }

  .sections-table {
    min-width: 500px;
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
  .sections-table {
    min-width: 100%;
  }

  .th-name,
  .td-name {
    width: auto;
    min-width: 120px;
  }

  .th-actions,
  .td-actions {
    width: 100px;
    min-width: 100px;
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

  .sections-table th,
  .sections-table td {
    padding: 0.5rem 0.75rem;
  }

  .btn-edit,
  .btn-delete {
    padding: 0.375rem;
  }

  .btn-icon {
    width: 0.875rem;
    height: 0.875rem;
  }

  .action-buttons {
    gap: 0.375rem;
  }

  .section-name,
  .date-text {
    font-size: 0.75rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

/* Extra small screens */
@media (max-width: 480px) {
  .sections-table {
    min-width: 450px;
  }

  .sections-table th,
  .sections-table td {
    padding: 0.375rem 0.5rem;
  }

  .th-name,
  .td-name {
    min-width: 100px;
  }

  .th-actions,
  .td-actions {
    min-width: 90px;
  }

  .btn-enroll,
  .btn-edit,
  .btn-delete {
    padding: 0.25rem;
  }

  .btn-icon {
    width: 0.75rem;
    height: 0.75rem;
  }

  .action-buttons {
    gap: 0.25rem;
  }
}

/* Very small screens */
@media (max-width: 320px) {
  .sections-table {
    min-width: 400px;
  }

  .sections-table th,
  .sections-table td {
    padding: 0.3125rem 0.375rem;
    font-size: 0.6875rem;
  }

  .section-name,
  .date-text {
    font-size: 0.6875rem;
  }

  .th-name,
  .td-name {
    min-width: 80px;
  }

  .th-actions,
  .td-actions {
    min-width: 80px;
  }

  .action-buttons {
    gap: 0.1875rem;
  }
}
</style>
