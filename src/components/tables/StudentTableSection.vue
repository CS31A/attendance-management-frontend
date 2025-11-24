<script setup>
import { ChevronLeft, ChevronRight, Edit, GraduationCap, RotateCcw, Trash2 } from 'lucide-vue-next'
import { computed, ref } from 'vue'

const props = defineProps({
  students: {
    type: Array,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  itemsPerPage: {
    type: Number,
    default: 10,
  },
  showDeleted: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['edit', 'delete', 'restore'])

const currentPage = ref(1)

const totalPages = computed(() => {
  return Math.ceil(props.students.length / props.itemsPerPage)
})

const startIndex = computed(() => {
  return (currentPage.value - 1) * props.itemsPerPage
})

const endIndex = computed(() => {
  return startIndex.value + props.itemsPerPage
})

const paginatedStudents = computed(() => {
  return props.students.slice(startIndex.value, endIndex.value)
})

const displayedPages = computed(() => {
  const pages = []
  const maxPagesToShow = 5
  let startPage = Math.max(1, currentPage.value - Math.floor(maxPagesToShow / 2))
  const endPage = Math.min(totalPages.value, startPage + maxPagesToShow - 1)

  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1)
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }

  return pages
})

function previousPage() {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

function goToPage(page) {
  currentPage.value = page
}
</script>

<template>
  <div class="table-section">
    <div class="table-header">
      <div class="table-title">
        <GraduationCap class="table-icon" size="24" />
        <h2>All Students ({{ students.length }})</h2>
      </div>
    </div>

    <div class="table-container">
      <div class="table-wrapper">
        <table class="students-table">
          <thead>
            <tr>
              <th class="th-id">
                ID
              </th>
              <th class="th-name">
                Name
              </th>
              <th class="th-student-id">
                Student ID
              </th>
              <th class="th-email">
                Email
              </th>
              <th class="th-section">
                Section
              </th>
              <th class="th-actions">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading" class="text-center">
              <td colspan="6" class="td-loading">
                Loading students...
              </td>
            </tr>
            <tr v-else-if="!students || students.length === 0" class="text-center">
              <td colspan="6" class="td-empty">
                No students found
              </td>
            </tr>
            <tr v-for="student in paginatedStudents" v-else :key="student.id" class="student-row">
              <td class="td-id">
                <span class="id-text">{{ student.id }}</span>
              </td>
              <td class="td-name">
                <span class="student-name">{{ student.firstName }} {{ student.lastName }}</span>
              </td>
              <td class="td-student-id">
                <span class="student-id-badge">{{ student.studentId }}</span>
              </td>
              <td class="td-email">
                {{ student.email }}
              </td>
              <td class="td-section">
                {{ student.section || '-' }}
              </td>
              <td class="td-actions">
                <div class="action-buttons">
                  <button
                    v-if="!showDeleted"
                    class="btn-edit"
                    title="Edit Student"
                    @click="$emit('edit', student)"
                  >
                    <Edit class="btn-icon" size="16" />
                  </button>
                  <button
                    v-if="!showDeleted"
                    class="btn-delete"
                    title="Delete Student"
                    @click="$emit('delete', student)"
                  >
                    <Trash2 class="btn-icon" size="16" />
                  </button>
                  <button
                    v-if="showDeleted"
                    class="btn-restore"
                    title="Restore Student"
                    @click="$emit('restore', student)"
                  >
                    <RotateCcw class="btn-icon" size="16" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Controls -->
      <div v-if="students && students.length > 0" class="pagination-section">
        <div class="pagination-info">
          <span class="pagination-text">
            Showing {{ startIndex + 1 }} to
            {{ Math.min(endIndex, students.length) }} of
            {{ students.length }} students
          </span>
        </div>

        <div class="pagination-controls">
          <button
            :disabled="currentPage === 1"
            class="pagination-btn"
            :class="{ disabled: currentPage === 1 }"
            @click="previousPage"
          >
            <ChevronLeft class="pagination-icon" size="16" />
            Previous
          </button>

          <div class="page-numbers">
            <button
              v-for="page in displayedPages"
              :key="page"
              class="page-btn"
              :class="{ active: page === currentPage }"
              @click="goToPage(page)"
            >
              {{ page }}
            </button>
          </div>

          <button
            :disabled="currentPage === totalPages"
            class="pagination-btn"
            :class="{ disabled: currentPage === totalPages }"
            @click="nextPage"
          >
            Next
            <ChevronRight class="pagination-icon" size="16" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.table-section {
  margin-bottom: 2rem;
  animation: fadeIn 0.8s ease-out;
}

.table-header {
  margin-bottom: 1rem;
}

.table-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.table-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #1e3a8a;
}

.table-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: #1e3a8a;
}

.table-title h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.table-wrapper {
  overflow-x: auto;
}

/* Students Table */
.students-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

/* Table Header */
.students-table thead {
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
}

.students-table th {
  padding: 1rem 1.5rem;
  text-align: left;
  font-weight: 600;
  color: white;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.th-id { width: 5%; min-width: 50px; }
.th-name { width: 25%; }
.th-student-id { width: 15%; }
.th-email { width: 25%; }
.th-section { width: 15%; }
.th-actions { width: 15%; text-align: center; }

/* Table Body */
.students-table tbody tr {
  border-bottom: 1px solid #e5e7eb;
  transition: background-color 0.2s ease;
}

.students-table tbody tr:hover {
  background-color: #f8fafc;
}

.students-table td {
  padding: 1rem 1.5rem;
  vertical-align: middle;
}

.td-loading, .td-empty {
  text-align: center;
  color: #6b7280;
  padding: 2rem;
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

/* Student ID Column */
.student-id-badge {
  background: #f3f4f6;
  color: #374151;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  font-family: monospace;
}

/* Email Column */
.td-email {
  color: #4b5563;
}

/* Section Column */
.td-section {
  color: #4b5563;
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
.btn-delete,
.btn-restore {
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

.btn-restore {
  background: #f0fdf4;
  color: #166534;
}

.btn-restore:hover {
  background: #dcfce7;
  color: #15803d;
}

.btn-icon {
  width: 1rem;
  height: 1rem;
}

/* Pagination Styles */
.pagination-section {
  background: #f8fafc;
  border-top: 1px solid #e5e7eb;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.pagination-info {
  display: flex;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.pagination-text {
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.pagination-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  color: #475569;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(.disabled) {
  background: #e2e8f0;
  border-color: #cbd5e1;
}

.pagination-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-icon {
  width: 1rem;
  height: 1rem;
}

.page-numbers {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.page-btn {
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  color: #475569;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover {
  background: #e2e8f0;
  border-color: #cbd5e1;
}

.page-btn.active {
  background: #1e3a8a;
  border-color: #1e3a8a;
  color: white;
}

/* Responsive */
@media (max-width: 768px) {
  .table-section {
    margin-bottom: 1.5rem;
  }

  .table-container {
    border-radius: 12px;
  }

  .table-title h2 {
    font-size: 1.25rem;
  }

  .pagination-section {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
    padding: 1rem;
  }

  .pagination-info {
    justify-content: center;
  }

  .pagination-controls {
    justify-content: center;
  }

  .students-table {
    min-width: 800px;
  }
}
</style>
