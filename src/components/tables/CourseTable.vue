<script setup>
import { BookOpen, Calendar, Edit, Trash2 } from 'lucide-vue-next'

defineProps({
  courses: {
    type: Array,
    required: true,
  },
})

defineEmits(['edit', 'delete'])

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
    <table class="courses-table">
      <thead>
        <tr>
          <th class="th-id">
            ID
          </th>
          <th class="th-name">
            Course Name
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
        <tr v-for="course in courses" :key="course.id" class="course-row">
          <td class="td-id">
            <span class="id-text">{{ course.id }}</span>
          </td>
          <td class="td-name">
            <div class="name-cell">
              <BookOpen class="course-icon" size="18" />
              <span class="course-name">{{ course.name }}</span>
            </div>
          </td>
          <td class="td-created">
            <div class="date-cell">
              <Calendar class="date-icon" size="16" />
              <span class="date-text">{{ formatDate(course?.createdAt) }}</span>
            </div>
          </td>
          <td class="td-updated">
            <div class="date-cell">
              <Calendar class="date-icon" size="16" />
              <span class="date-text">{{ formatDate(course?.updatedAt) }}</span>
            </div>
          </td>
          <td class="td-actions">
            <div class="action-buttons">
              <button class="btn-edit" title="Edit Course" @click="$emit('edit', course)">
                <Edit class="btn-icon" size="16" />
              </button>
              <button class="btn-delete" title="Delete Course" @click="$emit('delete', course.id)">
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

/* Courses Table */
.courses-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

/* Table Header */
.courses-table thead {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
}

.courses-table th {
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

.th-created, .th-updated {
  width: 20%;
  text-align: left;
}

.th-actions {
  width: 15%;
  text-align: center;
}

/* Table Body */
.courses-table tbody tr {
  border-bottom: 1px solid var(--color-gray-200);
  transition: background-color 0.2s ease;
}

.courses-table tbody tr:hover {
  background-color: var(--color-slate-100);
}

.courses-table td {
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

.course-icon {
  color: var(--color-primary);
  flex-shrink: 0;
}

.course-name {
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
@media (max-width: 768px) {
  .table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    border-radius: 12px;
  }

  .courses-table {
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
  .courses-table {
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

  .courses-table th,
  .courses-table td {
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

  .course-name,
  .date-text {
    font-size: 0.75rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
