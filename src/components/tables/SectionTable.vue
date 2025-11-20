<script setup>
import { BookOpen, Users, Calendar, Edit, Trash2 } from 'lucide-vue-next'

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

// Get section code
const getSectionCode = (section) => {
  if (section.code) {
    return section.code
  }
  if (section.sectionCode) {
    return section.sectionCode
  }
  return '-'
}

// Get subject or course
const getSubject = (section) => {
  if (section.subject) {
    return section.subject
  }
  if (section.subjectName) {
    return section.subjectName
  }
  if (section.course) {
    return section.course
  }
  if (section.courseName) {
    return section.courseName
  }
  return '-'
}

// Get instructor name
const getInstructor = (section) => {
  if (section.instructorName) {
    return section.instructorName
  }
  if (section.instructor) {
    return section.instructor
  }
  return '-'
}

// Get student count
const getStudentCount = (section) => {
  if (section.studentCount !== undefined) {
    return section.studentCount
  }
  if (section.enrolledStudents !== undefined) {
    return section.enrolledStudents
  }
  if (section.students && Array.isArray(section.students)) {
    return section.students.length
  }
  return 0
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
          <th class="th-name">Section Name</th>
          <th class="th-code">Code</th>
          <th class="th-subject">Subject</th>
          <th class="th-instructor">Instructor</th>
          <th class="th-students">Students</th>
          <th class="th-created">Created</th>
          <th class="th-actions">Actions</th> 
        </tr>
      </thead>
      <tbody>
        <tr v-for="section in sections" :key="section.id" class="section-row">
          <td class="td-name">
            <div class="name-cell">
              <BookOpen class="section-icon" size="18" />
              <span class="section-name">{{ getSectionName(section) }}</span>
            </div>
          </td>
          <td class="td-code">
            <span class="code-badge">{{ getSectionCode(section) }}</span>
          </td>
          <td class="td-subject">
            <span class="subject-text">{{ getSubject(section) }}</span>
          </td>
          <td class="td-instructor">
            <div class="instructor-cell">
              <Users class="instructor-icon" size="16" />
              <span class="instructor-text">{{ getInstructor(section) }}</span>
            </div>
          </td>
          <td class="td-students">
            <div class="student-count">
              <span class="count-badge">{{ getStudentCount(section) }}</span>
            </div>
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

.th-name {
  min-width: 200px;
}

.th-code {
  width: 120px;
}

.th-subject {
  min-width: 180px;
}

.th-instructor {
  min-width: 150px;
}

.th-students {
  width: 100px;
  text-align: center;
}

.th-created {
  width: 130px;
  text-align: center;
}

.th-actions {
  width: 120px;
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

/* Code Column */
.td-code {
  text-align: center;
}

.code-badge {
  background: #eff6ff;
  color: #1e3a8a;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  font-family: monospace;
}

/* Subject Column */
.td-subject {
  color: #4b5563;
}

.subject-text {
  font-size: 0.875rem;
}

/* Instructor Column */
.td-instructor {
  color: #6b7280;
}

.instructor-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.instructor-icon {
  color: #9ca3af;
  flex-shrink: 0;
}

.instructor-text {
  font-size: 0.875rem;
}

/* Students Column */
.td-students {
  text-align: center;
}

.student-count {
  display: flex;
  justify-content: center;
}

.count-badge {
  background: #f0fdf4;
  color: #16a34a;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  min-width: 40px;
  text-align: center;
}

/* Created Column */
.td-created {
  text-align: center;
  color: #6b7280;
}

.created-cell {
  display: flex;
  align-items: center;
  justify-content: center;
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
    min-width: 800px;
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
    min-width: 700px;
  }

  .th-name,
  .td-name {
    width: 150px;
    min-width: 150px;
  }

  .th-actions,
  .td-actions {
    width: 120px;
    min-width: 120px;
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
  .subject-text,
  .instructor-text,
  .date-text {
    font-size: 0.75rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
