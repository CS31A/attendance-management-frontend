<script setup>
import { BookOpen, Calendar, Edit, Trash2 } from 'lucide-vue-next'

defineProps({
  sections: {
    type: Array,
    required: true
  }
})

defineEmits(['edit', 'delete'])

// Get section name - handle different possible field names
const getSectionName = (section) => {
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

<template>
  <div class="table-wrapper">
    <table class="sections-table">
      <thead>
        <tr>
          <th class="th-id">ID</th>
          <th class="th-name">Section Name</th>
          <th class="th-course">Course ID</th>
          <th class="th-created">Created</th>
          <th class="th-actions">Actions</th> 
        </tr>
      </thead>
      <tbody>
        <tr v-for="section in sections" :key="section.id" class="section-row">
          <td class="td-id">
            <span class="id-text">{{ section.id }}</span>
          </td>
          <td class="td-name">
            <div class="name-cell">
              <BookOpen class="section-icon" size="18" />
              <span class="section-name">{{ getSectionName(section) }}</span>
            </div>
          </td>
          <td class="td-course">
            <span class="course-badge">{{ section.courseId }}</span>
          </td>
          <td class="td-created">
            <div class="created-cell">
              <Calendar class="date-icon" size="16" />
              <span class="date-text">{{ formatDate(section?.createdAt) }}</span>
            </div>
          </td>
          <td class="td-actions">
            <div class="action-buttons">
              <button class="btn-edit" @click="$emit('edit', section)" title="Edit Section">
                <Edit class="btn-icon" size="16" />
              </button>
              <button class="btn-delete" @click="$emit('delete', section.id)" title="Delete Section">
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

/* Sections Table */
.sections-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

/* Table Header */
.sections-table thead {
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
}

.sections-table th {
  padding: 1rem 1.5rem;
  text-align: left;
  font-weight: 600;
  color: white;
  font-size: 0.875rem;
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
  border-bottom: 1px solid #e5e7eb;
  transition: background-color 0.2s ease;
}

.sections-table tbody tr:hover {
  background-color: #f8fafc;
}

.sections-table td {
  padding: 1rem 1.5rem;
  vertical-align: middle;
}

/* ID Column */
.td-id {
  color: #6b7280;
  font-family: monospace;
  font-weight: 600;
}

/* Name Column */
.td-name {
  font-weight: 600;
  color: #1f2937;
}

.name-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.section-icon {
  color: #1e3a8a;
  flex-shrink: 0;
}

.section-name {
  font-size: 0.875rem;
}

/* Course Column */
.td-course {
  color: #4b5563;
}

.course-badge {
  background: #f3f4f6;
  color: #374151;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
}

/* Created Column */
.td-created {
  text-align: left;
  color: #6b7280;
}

.created-cell {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.5rem;
}

.date-icon {
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

/* Responsive Table */
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
    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
    z-index: 10;
  }

  .td-name {
    background: white;
    border-right: 2px solid #e5e7eb;
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
    border-left: 2px solid #e5e7eb;
    z-index: 5;
  }

  .th-actions {
    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
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
</style>
