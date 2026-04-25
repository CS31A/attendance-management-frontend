<script setup lang="ts">
import type { EntityId } from '@/types'
import { Calendar, ChevronLeft, ChevronRight, Edit, Trash2 } from 'lucide-vue-next'

interface Schedule {
  id: EntityId
  subject?: { name?: string, code?: string, [key: string]: unknown } | null
  subjectName?: string
  subjectCode?: string
  section?: { name?: string, [key: string]: unknown } | null
  sectionName?: string
  dayOfWeek?: string
  timeIn?: string
  timeOut?: string
  classroom?: { name?: string, [key: string]: unknown } | null
  classroomName?: string
  instructor?: { firstName?: string, firstname?: string, lastName?: string, lastname?: string, [key: string]: unknown } | null
  instructorFirstName?: string
  instructorLastName?: string
  [key: string]: unknown
}

interface Pagination {
  currentPage: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  totalSchedules: number
  itemsPerPage: number
}

defineProps<{
  schedules: Schedule[]
  title: string
  pagination?: Pagination | null
}>()

defineEmits<{
  edit: [schedule: Schedule]
  delete: [id: EntityId]
  nextPage: []
  previousPage: []
  goToPage: [page: number]
  setItemsPerPage: [itemsPerPage: number]
}>()

function formatTime(time: string | null | undefined): string {
  if (!time)
    return '-'
  // Handle both HH:mm and HH:mm:ss formats
  const [hours, minutes] = time.split(':')
  const hour = Number.parseInt(hours, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const formattedHour = hour % 12 || 12
  return `${formattedHour}:${minutes} ${ampm}`
}

function getInstructorName(schedule: Schedule): string {
  const instructor = schedule.instructor || {}
  const firstName = instructor.firstName || instructor.firstname || schedule.instructorFirstName || ''
  const lastName = instructor.lastName || instructor.lastname || schedule.instructorLastName || ''
  const fullName = `${firstName} ${lastName}`.trim()
  return fullName || '-'
}
</script>

<template>
  <div class="table-section">
    <div class="table-header">
      <div class="table-title">
        <Calendar class="table-icon" :size="24" />
        <h2>{{ title }} ({{ pagination ? pagination.totalSchedules : schedules.length }})</h2>
      </div>
    </div>

    <div class="table-container">
      <!-- Table -->
      <div class="table-wrapper">
        <table class="schedule-table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Section</th>
              <th>Day</th>
              <th>Time</th>
              <th>Classroom</th>
              <th>Instructor</th>
              <th class="actions-col">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="schedules.length === 0">
              <td colspan="7" class="empty-state">
                <Calendar class="empty-icon" :size="48" />
                <p>No schedules found</p>
              </td>
            </tr>
            <tr v-for="schedule in schedules" :key="schedule.id">
              <td>
                <div class="subject-info">
                  <span class="subject-name">{{ schedule.subject?.name || schedule.subjectName || '-' }}</span>
                  <span class="subject-code">{{ schedule.subject?.code || schedule.subjectCode || '' }}</span>
                </div>
              </td>
              <td>{{ schedule.section?.name || schedule.sectionName || '-' }}</td>
              <td>
                <span class="day-badge">{{ schedule.dayOfWeek }}</span>
              </td>
              <td>
                <span class="time-slot">
                  {{ formatTime(schedule.timeIn) }} - {{ formatTime(schedule.timeOut) }}
                </span>
              </td>
              <td>{{ schedule.classroom?.name || schedule.classroomName || '-' }}</td>
              <td>
                <span class="instructor-name">{{ getInstructorName(schedule) }}</span>
              </td>
              <td class="actions-col">
                <div class="action-buttons">
                  <button
                    class="btn-action btn-edit"
                    title="Edit schedule"
                    @click="$emit('edit', schedule)"
                  >
                    <Edit :size="16" />
                  </button>
                  <button
                    class="btn-action btn-delete"
                    title="Delete schedule"
                    @click="$emit('delete', schedule.id)"
                  >
                    <Trash2 :size="16" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Controls -->
      <div v-if="pagination" class="pagination-section">
        <div class="pagination-info">
          <span class="pagination-text">
            Showing {{ (pagination.currentPage - 1) * pagination.itemsPerPage + 1 }} to
            {{ Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalSchedules) }} of
            {{ pagination.totalSchedules }} schedules
          </span>
          <div class="items-per-page">
            <label for="itemsPerPage">Show:</label>
            <select
              id="itemsPerPage"
              :value="pagination.itemsPerPage"
              class="items-select"
              @change="$emit('setItemsPerPage', parseInt(($event.target as HTMLSelectElement).value))"
            >
              <option value="5">
                5
              </option>
              <option value="10">
                10
              </option>
              <option value="20">
                20
              </option>
              <option value="50">
                50
              </option>
            </select>
          </div>
        </div>

        <div class="pagination-controls">
          <button
            :disabled="!pagination.hasPreviousPage"
            class="pagination-btn"
            :class="{ disabled: !pagination.hasPreviousPage }"
            @click="$emit('previousPage')"
          >
            <ChevronLeft class="pagination-icon" :size="16" />
            Previous
          </button>

          <div class="page-numbers">
            <button
              v-for="page in Math.min(5, pagination.totalPages)"
              :key="page"
              class="page-btn"
              :class="{ active: page === pagination.currentPage }"
              @click="$emit('goToPage', page)"
            >
              {{ page }}
            </button>
            <span v-if="pagination.totalPages > 5" class="page-ellipsis">...</span>
            <button
              v-if="pagination.totalPages > 5 && pagination.currentPage < pagination.totalPages - 2"
              class="page-btn"
              @click="$emit('goToPage', pagination.totalPages)"
            >
              {{ pagination.totalPages }}
            </button>
          </div>

          <button
            :disabled="!pagination.hasNextPage"
            class="pagination-btn"
            :class="{ disabled: !pagination.hasNextPage }"
            @click="$emit('nextPage')"
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

.table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
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
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Table Styles */
.schedule-table {
  width: 100%;
  border-collapse: collapse;
}

/* Table Header */
.schedule-table thead {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
}

.schedule-table th {
  padding: 0.625rem 0.875rem;
  text-align: left;
  font-weight: 600;
  color: white;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.schedule-table td {
  padding: 0.625rem 0.875rem;
  border-bottom: 1px solid var(--color-gray-200);
  vertical-align: middle;
}

.schedule-table tbody tr:hover {
  background: var(--color-slate-100);
}

.schedule-table tbody tr:last-child td {
  border-bottom: none;
}

.actions-col {
  text-align: center;
  width: 100px;
}

/* Subject Info */
.subject-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.subject-name {
  font-weight: 600;
  color: var(--color-gray-800);
  font-size: 0.8125rem;
}

.subject-code {
  font-size: 0.6875rem;
  color: var(--color-gray-500);
}

/* Day Badge */
.day-badge {
  display: inline-block;
  padding: 0.1875rem 0.625rem;
  background: linear-gradient(135deg, rgb(224, 231, 255) 0%, rgb(199, 210, 254) 100%);
  color: rgb(55, 48, 163);
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

/* Time Slot */
.time-slot {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.8125rem;
  color: var(--color-gray-700);
  background: var(--color-gray-100);
  padding: 0.1875rem 0.4375rem;
  border-radius: 0.375rem;
}

/* Instructor Name */
.instructor-name {
  color: var(--color-gray-700);
  font-weight: 500;
  font-size: 0.8125rem;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 0.375rem;
  justify-content: center;
}

.btn-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-edit {
  background: var(--color-info-lighter);
  color: var(--color-primary-light);
}

.btn-edit:hover {
  background: var(--color-primary-light);
  color: white;
  transform: translateY(-1px);
}

.btn-delete {
  background: var(--color-error-lighter);
  color: var(--color-error-dark);
}

.btn-delete:hover {
  background: var(--color-error-dark);
  color: white;
  transform: translateY(-1px);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem 1rem !important;
  color: var(--color-gray-400);
}

.empty-icon {
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
  font-size: 1rem;
}

/* Pagination Styles */
.pagination-section {
  background: var(--color-slate-100);
  border-top: 1px solid var(--color-gray-200);
  padding: 0.875rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.875rem;
}

.pagination-info {
  display: flex;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.pagination-text {
  color: var(--color-gray-500);
  font-size: 0.75rem;
  font-weight: 500;
}

.items-per-page {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.items-per-page label {
  color: var(--color-gray-500);
  font-size: 0.75rem;
  font-weight: 500;
}

.items-select {
  padding: 0.3125rem 0.4375rem;
  border: 1px solid var(--color-gray-300);
  border-radius: 0.5rem;
  font-size: 0.75rem;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.items-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.1);
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.pagination-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.3125rem 0.625rem;
  background: var(--color-slate-100);
  border: 1px solid var(--color-slate-200);
  border-radius: 0.5rem;
  color: var(--color-slate-600);
  font-size: 0.75rem;
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
  width: 1.75rem;
  height: 1.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-slate-100);
  border: 1px solid var(--color-slate-200);
  border-radius: 0.5rem;
  color: var(--color-slate-600);
  font-size: 0.75rem;
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

.page-ellipsis {
  color: var(--color-gray-400);
  font-size: 0.75rem;
  padding: 0 0.375rem;
}

/* Responsive */
@media (max-width: 1024px) {
  .schedule-table {
    display: block;
    overflow-x: auto;
  }
}

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

  .schedule-table th,
  .schedule-table td {
    padding: 0.5rem 0.625rem;
    font-size: 0.75rem;
  }

  .schedule-table {
    min-width: 700px;
  }

  .table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  /* Sticky first column for better mobile experience */
  .schedule-table th:first-child,
  .schedule-table td:first-child {
    position: sticky;
    left: 0;
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
    z-index: 10;
  }

  .schedule-table td:first-child {
    background: white;
    border-right: 2px solid var(--color-gray-200);
  }

  .schedule-table th:first-child {
    color: white;
  }

  .pagination-section {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
    padding: 0.75rem;
  }

  .pagination-info {
    justify-content: center;
    flex-direction: column;
    gap: 0.75rem;
  }

  .pagination-controls {
    justify-content: center;
  }

  .page-numbers {
    flex-wrap: wrap;
    justify-content: center;
  }

  .pagination-btn {
    padding: 0.25rem 0.5rem;
    font-size: 0.6875rem;
  }

  .page-btn {
    width: 1.5rem;
    height: 1.5rem;
    font-size: 0.6875rem;
  }
}

@media (max-width: 640px) {
  .table-section {
    margin-bottom: 1rem;
  }

  .table-title h2 {
    font-size: 1.125rem;
  }

  .schedule-table {
    min-width: 600px;
  }

  .schedule-table th,
  .schedule-table td {
    padding: 0.4375rem 0.5rem;
    font-size: 0.6875rem;
  }

  /* Sticky actions column for mobile */
  .actions-col,
  .schedule-table td:last-child {
    position: sticky;
    right: 0;
    background: white;
    border-left: 2px solid var(--color-gray-200);
    z-index: 5;
    min-width: 80px;
  }

  .schedule-table th:last-child {
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
    color: white;
  }

  .btn-action {
    width: 24px;
    height: 24px;
  }

  .action-buttons {
    gap: 0.25rem;
  }

  .subject-name {
    font-size: 0.75rem;
  }

  .subject-code {
    font-size: 0.625rem;
  }

  .day-badge {
    padding: 0.125rem 0.5rem;
    font-size: 0.6875rem;
  }

  .time-slot {
    font-size: 0.75rem;
    padding: 0.125rem 0.375rem;
  }

  .instructor-name {
    font-size: 0.75rem;
  }

  .pagination-section {
    padding: 0.625rem;
  }

  .pagination-text {
    font-size: 0.6875rem;
  }

  .pagination-btn {
    padding: 0.1875rem 0.375rem;
    font-size: 0.625rem;
  }

  .pagination-icon {
    width: 0.75rem;
    height: 0.75rem;
  }

  .page-btn {
    width: 1.375rem;
    height: 1.375rem;
    font-size: 0.625rem;
  }
}

/* Extra small screens */
@media (max-width: 480px) {
  .table-title h2 {
    font-size: 1rem;
  }

  .schedule-table {
    min-width: 500px;
  }

  .schedule-table th,
  .schedule-table td {
    padding: 0.375rem 0.4375rem;
    font-size: 0.625rem;
  }

  .btn-action {
    width: 20px;
    height: 20px;
  }

  .action-buttons {
    gap: 0.1875rem;
  }

  .pagination-section {
    padding: 0.5rem;
    gap: 0.5rem;
  }

  .pagination-info {
    gap: 0.5rem;
  }
}

/* Very small screens */
@media (max-width: 320px) {
  .table-title h2 {
    font-size: 0.875rem;
  }

  .schedule-table {
    min-width: 450px;
  }

  .schedule-table th,
  .schedule-table td {
    padding: 0.3125rem 0.375rem;
    font-size: 0.5625rem;
  }

  .pagination-section {
    padding: 0.4375rem;
  }

  .pagination-text,
  .items-per-page label {
    font-size: 0.625rem;
  }

  .pagination-btn {
    padding: 0.125rem 0.25rem;
    font-size: 0.5625rem;
  }

  .page-btn {
    width: 1.25rem;
    height: 1.25rem;
    font-size: 0.5625rem;
  }
}
</style>
