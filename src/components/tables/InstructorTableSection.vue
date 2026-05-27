<script setup>
import { ArchiveX, Calendar, ChevronLeft, ChevronRight, Edit, Eye, RotateCcw, Trash2, Users } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { LOCALE } from '@/utils/constants'
import { parseUtcDate } from '@/utils/date'

const props = defineProps({
  instructors: {
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

defineEmits(['edit', 'softDelete', 'delete', 'restore', 'view', 'viewSchedule'])

const currentPage = ref(1)

const totalPages = computed(() => {
  return Math.ceil(props.instructors.length / props.itemsPerPage)
})

const startIndex = computed(() => {
  return (currentPage.value - 1) * props.itemsPerPage
})

const endIndex = computed(() => {
  return startIndex.value + props.itemsPerPage
})

const paginatedInstructors = computed(() => {
  return props.instructors.slice(startIndex.value, endIndex.value)
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

function formatCreatedAt(value) {
  const parsed = parseUtcDate(value)
  return parsed ? parsed.toLocaleDateString(LOCALE.DEFAULT) : '-'
}
</script>

<template>
  <div class="table-section">
    <div class="table-header">
      <div class="table-title">
        <Users class="table-icon" :size="24" />
        <h2>All Instructors ({{ instructors.length }})</h2>
      </div>
    </div>

    <div class="table-container">
      <div class="table-wrapper">
        <table class="instructors-table">
          <thead>
            <tr>
              <th class="th-id">
                ID
              </th>
              <th class="th-name">
                Name
              </th>
              <th class="th-email">
                Email
              </th>
              <th class="th-created">
                Created At
              </th>
              <th class="th-actions">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading" class="text-center">
              <td colspan="5" class="td-loading">
                Loading instructors...
              </td>
            </tr>
            <tr v-else-if="!instructors || instructors.length === 0" class="text-center">
              <td colspan="5" class="td-empty">
                No instructors found
              </td>
            </tr>
            <tr v-for="instructor in paginatedInstructors" v-else :key="instructor.id" class="instructor-row">
              <td class="td-id">
                <span class="id-text">{{ instructor.id }}</span>
              </td>
              <td class="td-name">
                <span class="instructor-name">{{ instructor.firstName }} {{ instructor.lastName }}</span>
              </td>
              <td class="td-email">
                {{ instructor.email }}
              </td>
              <td class="td-created">
                {{ formatCreatedAt(instructor.createdAt) }}
              </td>
              <td class="td-actions">
                <div class="action-buttons">
                  <button
                    v-if="!showDeleted"
                    class="btn-view"
                    title="View Instructor Details"
                    @click="$emit('view', instructor)"
                  >
                    <Eye class="btn-icon" :size="16" />
                  </button>
                  <button
                    v-if="!showDeleted"
                    class="btn-schedule"
                    title="View Schedule"
                    @click="$emit('viewSchedule', instructor)"
                  >
                    <Calendar class="btn-icon" :size="16" />
                  </button>
                  <button
                    v-if="!showDeleted"
                    class="btn-edit"
                    title="Edit Instructor"
                    @click="$emit('edit', instructor)"
                  >
                    <Edit class="btn-icon" :size="16" />
                  </button>
                  <button
                    v-if="!showDeleted"
                    class="btn-soft-delete"
                    title="Soft Delete (Can be restored)"
                    @click="$emit('softDelete', instructor)"
                  >
                    <ArchiveX class="btn-icon" :size="16" />
                  </button>
                  <button
                    v-if="!showDeleted"
                    class="btn-delete"
                    title="Permanently Delete"
                    @click="$emit('delete', instructor)"
                  >
                    <Trash2 class="btn-icon" :size="16" />
                  </button>
                  <button
                    v-if="showDeleted"
                    class="btn-restore"
                    title="Restore Instructor"
                    @click="$emit('restore', instructor)"
                  >
                    <RotateCcw class="btn-icon" :size="16" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Controls -->
      <div v-if="instructors && instructors.length > 0" class="pagination-section">
        <div class="pagination-info">
          <span class="pagination-text">
            Showing {{ startIndex + 1 }} to
            {{ Math.min(endIndex, instructors.length) }} of
            {{ instructors.length }} instructors
          </span>
        </div>

        <div class="pagination-controls">
          <button
            :disabled="currentPage === 1"
            class="pagination-btn"
            :class="{ disabled: currentPage === 1 }"
            @click="previousPage"
          >
            <ChevronLeft class="pagination-icon" :size="16" />
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
            <ChevronRight class="pagination-icon" :size="16" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.table-section {
  margin-bottom: 2rem;
}

.table-header {
  margin-bottom: 1rem;
}

.table-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--color-gray-200);
  overflow: hidden;
}

.table-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--color-primary);
}

.table-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--color-primary);
}

.table-title h2 {
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.table-wrapper {
  overflow-x: auto;
}

/* Instructors Table */
.instructors-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

/* Table Header */
.instructors-table thead {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
}

.instructors-table th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: white;
  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.th-id { width: 8%; min-width: 60px; }
.th-name { width: 30%; }
.th-email { width: 30%; }
.th-created { width: 15%; }
.th-actions { width: 17%; text-align: center; }

/* Table Body */
.instructors-table tbody tr {
  border-bottom: 1px solid var(--color-gray-200);
  transition: background-color 0.2s ease;
}

.instructors-table tbody tr:hover {
  background-color: var(--color-slate-100);
}

.instructors-table td {
  padding: 0.75rem 1rem;
  vertical-align: middle;
  font-size: 0.8125rem;
}

.td-loading, .td-empty {
  text-align: center;
  color: var(--color-gray-500);
  padding: 2rem;
}

/* ID Column */
.td-id {
  color: var(--color-gray-500);
  font-family: monospace;
  font-weight: 600;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Name Column */
.td-name {
  font-weight: 600;
  color: var(--color-gray-800);
}

.instructor-name {
  display: inline-block;
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Email Column */
.td-email {
  color: var(--color-gray-600);
}

/* Created Column */
.td-created {
  color: var(--color-gray-600);
  font-size: 0.8125rem;
}

/* Actions Column */
.td-actions {
  text-align: center;
}

.action-buttons {
  display: flex;
  gap: 0.375rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-view,
.btn-schedule,
.btn-edit,
.btn-soft-delete,
.btn-delete,
.btn-restore {
  padding: 0.375rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-view {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%);
  color: #2563eb;
}

.btn-view:hover {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.15) 100%);
  color: #1d4ed8;
}

.btn-schedule {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%);
  color: #9333ea;
}

.btn-schedule:hover {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(147, 51, 234, 0.15) 100%);
  color: #7e22ce;
}

.btn-edit {
  background: var(--color-info-bg);
  color: var(--color-primary);
}

.btn-edit:hover {
  background: var(--color-info-lighter);
  color: var(--color-primary-light);
}

.btn-soft-delete {
  background: linear-gradient(135deg, rgba(251, 146, 60, 0.1) 0%, rgba(249, 115, 22, 0.1) 100%);
  color: #f97316;
}

.btn-soft-delete:hover {
  background: linear-gradient(135deg, rgba(251, 146, 60, 0.15) 0%, rgba(249, 115, 22, 0.15) 100%);
  color: #ea580c;
}

.btn-delete {
  background: var(--color-error-bg);
  color: var(--color-error-dark);
}

.btn-delete:hover {
  background: var(--color-error-light);
  color: var(--color-error-darker);
}

.btn-restore {
  background: var(--color-success-bg);
  color: rgb(22, 101, 52);
}

.btn-restore:hover {
  background: var(--color-success-bg);
  color: rgb(21, 128, 61);
}

.btn-icon {
  width: 1rem;
  height: 1rem;
}

/* Pagination Styles */
.pagination-section {
  background: var(--color-slate-100);
  border-top: 1px solid var(--color-gray-200);
  padding: 1rem;
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
  color: var(--color-gray-500);
  font-size: 0.8125rem;
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
  padding: 0.375rem 0.75rem;
  background: var(--color-slate-100);
  border: 1px solid var(--color-slate-200);
  border-radius: 0.5rem;
  color: var(--color-slate-600);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(.disabled) {
  background: var(--color-slate-200);
  border-color: var(--color-slate-300);
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
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-slate-100);
  border: 1px solid var(--color-slate-200);
  border-radius: 0.5rem;
  color: var(--color-slate-600);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover {
  background: var(--color-slate-200);
  border-color: var(--color-slate-300);
}

.page-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
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

  .instructors-table {
    min-width: 800px;
  }

  .action-buttons {
    flex-direction: column;
    gap: 0.25rem;
  }
}
</style>
