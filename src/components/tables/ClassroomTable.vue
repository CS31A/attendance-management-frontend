<script setup lang="ts">
import type { EntityId } from '@/types'
import { Calendar, DoorOpen, Edit, Trash2 } from 'lucide-vue-next'
import { formatShortTableDate as formatDate } from '@/utils/date'

interface Classroom {
  id: EntityId
  name: string
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

defineProps<{
  classrooms: Classroom[]
}>()

defineEmits<{
  edit: [classroom: Classroom]
  delete: [id: EntityId]
}>()
</script>

<template>
  <div class="table-wrapper">
    <table class="classrooms-table">
      <thead>
        <tr>
          <th class="th-id">
            ID
          </th>
          <th class="th-name">
            Classroom Name
          </th>
          <th class="th-created">
            Created
          </th>
          <th class="th-updated">
            Updated
          </th>
          <th class="th-actions">
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="classroom in classrooms" :key="classroom.id" class="classroom-row">
          <td class="td-id">
            <span class="id-text">{{ classroom.id }}</span>
          </td>
          <td class="td-name">
            <div class="name-cell">
              <DoorOpen class="classroom-icon" :size="18" />
              <span class="classroom-name">{{ classroom.name }}</span>
            </div>
          </td>
          <td class="td-created">
            <div class="date-cell">
              <Calendar class="date-icon" :size="16" />
              <span class="date-text">{{ formatDate(classroom?.createdAt) }}</span>
            </div>
          </td>
          <td class="td-updated">
            <div class="date-cell">
              <Calendar class="date-icon" :size="16" />
              <span class="date-text">{{ formatDate(classroom?.updatedAt) }}</span>
            </div>
          </td>
          <td class="td-actions">
            <div class="action-buttons">
              <button class="btn-edit" title="Edit Classroom" @click="$emit('edit', classroom)">
                <Edit class="btn-icon" :size="16" />
              </button>
              <button class="btn-delete" title="Delete Classroom" @click="$emit('delete', classroom.id)">
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

/* Classrooms Table */
.classrooms-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

/* Table Header */
.classrooms-table thead {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
}

.classrooms-table th {
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
  width: 40%;
}

.th-created, .th-updated {
  width: 20%;
  text-align: left;
}

.th-actions {
  width: 12%;
  text-align: center;
}

/* Table Body */
.classrooms-table tbody tr {
  border-bottom: 1px solid var(--color-gray-200);
  transition: background-color 0.2s ease;
}

.classrooms-table tbody tr:hover {
  background-color: var(--color-slate-100);
}

.classrooms-table td {
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

.classroom-icon {
  color: var(--color-primary);
  flex-shrink: 0;
}

.classroom-name {
  font-size: 0.8125rem;
}

/* Date Columns */
.td-created, .td-updated {
  text-align: left;
  color: var(--color-gray-500);
}

.date-cell {
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

.btn-delete:hover {
  background: var(--color-error-light);
  color: var(--color-error-darker);
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

  .classrooms-table {
    min-width: 700px;
  }
}

@media (max-width: 768px) {
  .table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    border-radius: 12px;
  }

  .classrooms-table {
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
    border-right: 2px solid var(--color-gray-200);
  }

  .th-name {
    color: white;
  }
}

@media (max-width: 640px) {
  .classrooms-table {
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

  .classrooms-table th,
  .classrooms-table td {
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

  .classroom-name,
  .date-text {
    font-size: 0.75rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

/* Extra small screens */
@media (max-width: 480px) {
  .classrooms-table {
    min-width: 500px;
  }

  .classrooms-table th,
  .classrooms-table td {
    padding: 0.375rem 0.5rem;
  }

  .th-name,
  .td-name {
    min-width: 100px;
  }

  .th-actions,
  .td-actions {
    min-width: 80px;
  }

  .btn-edit,
  .btn-delete {
    padding: 0.25rem;
  }

  .btn-icon {
    width: 0.75rem;
    height: 0.75rem;
  }
}

/* Very small screens */
@media (max-width: 320px) {
  .classrooms-table {
    min-width: 450px;
  }

  .classrooms-table th,
  .classrooms-table td {
    padding: 0.3125rem 0.375rem;
    font-size: 0.6875rem;
  }

  .classroom-name,
  .date-text {
    font-size: 0.6875rem;
  }

  .th-name,
  .td-name {
    min-width: 80px;
  }

  .th-actions,
  .td-actions {
    min-width: 70px;
  }
}
</style>
