<script setup>
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCheck,
  Clock,
  Loader2,
  MapPin,
  Save,
  Search,
  UserCheck,
  UserMinus,
  Users,
  UserX,
} from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { ATTENDANCE_STATUSES, getStatusLabel } from '@/api/attendance.js'

const props = defineProps({
  session: {
    type: Object,
    required: true,
  },
  attendance: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  stats: {
    type: Object,
    default: () => ({
      total: 0,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      excusedCount: 0,
      presentPercentage: 0,
    }),
  },
})

const emit = defineEmits(['submit', 'back'])

// Local state for attendance records
const localAttendance = ref([])
const searchQuery = ref('')
const submitting = ref(false)
const hasChanges = ref(false)

// Initialize local attendance from props
watch(() => props.attendance, (newAttendance) => {
  localAttendance.value = newAttendance.map(record => ({
    ...record,
    originalStatus: record.status,
  }))
  hasChanges.value = false
}, { immediate: true, deep: true })

// Computed
const filteredStudents = computed(() => {
  if (!searchQuery.value) {
    return localAttendance.value
  }
  const query = searchQuery.value.toLowerCase()
  return localAttendance.value.filter((record) => {
    return (
      record.studentName?.toLowerCase().includes(query)
      || record.studentId?.toString().includes(query)
      || record.studentNumber?.toLowerCase().includes(query)
    )
  })
})

const localStats = computed(() => {
  const total = localAttendance.value.length
  if (total === 0) {
    return {
      total: 0,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      excusedCount: 0,
      presentPercentage: 0,
    }
  }

  const presentCount = localAttendance.value.filter(r => r.status === ATTENDANCE_STATUSES.PRESENT).length
  const absentCount = localAttendance.value.filter(r => r.status === ATTENDANCE_STATUSES.ABSENT).length
  const lateCount = localAttendance.value.filter(r => r.status === ATTENDANCE_STATUSES.LATE).length
  const excusedCount = localAttendance.value.filter(r => r.status === ATTENDANCE_STATUSES.EXCUSED).length

  return {
    total,
    presentCount,
    absentCount,
    lateCount,
    excusedCount,
    presentPercentage: Math.round((presentCount / total) * 100),
  }
})

// Methods
function updateStatus(studentId, status) {
  const record = localAttendance.value.find(r => r.studentId === studentId)
  if (record) {
    record.status = status
    checkForChanges()
  }
}

function markAllAs(status) {
  localAttendance.value.forEach((record) => {
    record.status = status
  })
  checkForChanges()
}

function checkForChanges() {
  hasChanges.value = localAttendance.value.some(
    record => record.status !== record.originalStatus,
  )
}

async function handleSubmit() {
  submitting.value = true
  try {
    const attendanceData = localAttendance.value.map(record => ({
      studentId: record.studentId,
      status: record.status,
      notes: record.notes || '',
    }))
    emit('submit', attendanceData)

    // Update original status after successful submit
    localAttendance.value.forEach((record) => {
      record.originalStatus = record.status
    })
    hasChanges.value = false
  }
  finally {
    submitting.value = false
  }
}

function handleBack() {
  if (hasChanges.value) {
    if (!confirm('You have unsaved changes. Are you sure you want to go back?')) {
      return
    }
  }
  emit('back')
}

function formatDate(dateString) {
  if (!dateString)
    return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatTime(timeString) {
  if (!timeString)
    return 'N/A'
  return timeString.substring(0, 5)
}

function getStatusButtonClass(currentStatus, buttonStatus) {
  const isActive = currentStatus === buttonStatus
  const classes = ['status-btn', `status-btn-${buttonStatus}`]
  if (isActive) {
    classes.push('active')
  }
  return classes.join(' ')
}

// Check if session already has submitted attendance
const hasExistingAttendance = computed(() => {
  return props.attendance.some(record => record.id)
})

onMounted(() => {
  // If no attendance records exist, initialize with default absent status
  if (localAttendance.value.length === 0 && props.session.students) {
    localAttendance.value = props.session.students.map(student => ({
      studentId: student.id,
      studentName: student.name,
      studentNumber: student.studentNumber,
      status: ATTENDANCE_STATUSES.ABSENT,
      originalStatus: null,
      notes: '',
    }))
  }
})
</script>

<template>
  <div class="attendance-record">
    <!-- Session Info Card -->
    <div class="session-info-card">
      <div class="session-header">
        <button class="btn-back" @click="handleBack">
          <ArrowLeft size="20" />
          <span>Back</span>
        </button>
        <div class="session-title">
          <span class="course-code">{{ session.subjectCode }}</span>
          <h2>{{ session.subjectName }}</h2>
          <span class="section-name">{{ session.sectionName }}</span>
        </div>
      </div>

      <div class="session-meta">
        <div class="meta-item">
          <Calendar size="18" />
          <span>{{ formatDate(session.sessionDate) }}</span>
        </div>
        <div class="meta-item">
          <Clock size="18" />
          <span>{{ formatTime(session.scheduledStartTime) }} - {{ formatTime(session.scheduledEndTime) }}</span>
        </div>
        <div v-if="session.roomName" class="meta-item">
          <MapPin size="18" />
          <span>{{ session.roomName }}</span>
        </div>
        <div class="meta-item">
          <Users size="18" />
          <span>{{ localStats.total }} Students</span>
        </div>
      </div>
    </div>

    <!-- Stats Summary -->
    <div class="stats-summary">
      <div class="stat-card present">
        <UserCheck size="24" />
        <div class="stat-content">
          <span class="stat-value">{{ localStats.presentCount }}</span>
          <span class="stat-label">Present</span>
        </div>
      </div>
      <div class="stat-card absent">
        <UserX size="24" />
        <div class="stat-content">
          <span class="stat-value">{{ localStats.absentCount }}</span>
          <span class="stat-label">Absent</span>
        </div>
      </div>
      <div class="stat-card late">
        <Clock size="24" />
        <div class="stat-content">
          <span class="stat-value">{{ localStats.lateCount }}</span>
          <span class="stat-label">Late</span>
        </div>
      </div>
      <div class="stat-card excused">
        <UserMinus size="24" />
        <div class="stat-content">
          <span class="stat-value">{{ localStats.excusedCount }}</span>
          <span class="stat-label">Excused</span>
        </div>
      </div>
      <div class="stat-card percentage">
        <Check size="24" />
        <div class="stat-content">
          <span class="stat-value">{{ localStats.presentPercentage }}%</span>
          <span class="stat-label">Attendance Rate</span>
        </div>
      </div>
    </div>

    <!-- Actions Bar -->
    <div class="actions-bar">
      <div class="search-wrapper">
        <Search size="18" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search students..."
          class="search-input"
        >
      </div>

      <div class="quick-actions">
        <button class="btn-quick present" @click="markAllAs(ATTENDANCE_STATUSES.PRESENT)">
          <CheckCheck size="18" />
          <span>Mark All Present</span>
        </button>
        <button class="btn-quick absent" @click="markAllAs(ATTENDANCE_STATUSES.ABSENT)">
          <UserX size="18" />
          <span>Mark All Absent</span>
        </button>
      </div>

      <button
        class="btn-save"
        :disabled="submitting || loading || !hasChanges"
        @click="handleSubmit"
      >
        <Loader2 v-if="submitting" size="18" class="spinner" />
        <Save v-else size="18" />
        <span>{{ hasExistingAttendance ? 'Update Attendance' : 'Save Attendance' }}</span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <Loader2 class="spinner" size="40" />
      <p>Loading student list...</p>
    </div>

    <!-- Students Table -->
    <div v-else class="students-table-container">
      <table class="students-table">
        <thead>
          <tr>
            <th class="col-number">
              #
            </th>
            <th class="col-student">
              Student
            </th>
            <th class="col-status">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(record, index) in filteredStudents"
            :key="record.studentId"
            :class="{ 'row-changed': record.status !== record.originalStatus }"
          >
            <td class="col-number">
              {{ index + 1 }}
            </td>
            <td class="col-student">
              <div class="student-info">
                <span class="student-name">{{ record.studentName }}</span>
                <span v-if="record.studentNumber" class="student-id">{{ record.studentNumber }}</span>
              </div>
            </td>
            <td class="col-status">
              <div class="status-buttons">
                <button
                  :class="getStatusButtonClass(record.status, ATTENDANCE_STATUSES.PRESENT)"
                  :title="getStatusLabel(ATTENDANCE_STATUSES.PRESENT)"
                  @click="updateStatus(record.studentId, ATTENDANCE_STATUSES.PRESENT)"
                >
                  <UserCheck size="16" />
                  <span class="btn-label">Present</span>
                </button>
                <button
                  :class="getStatusButtonClass(record.status, ATTENDANCE_STATUSES.ABSENT)"
                  :title="getStatusLabel(ATTENDANCE_STATUSES.ABSENT)"
                  @click="updateStatus(record.studentId, ATTENDANCE_STATUSES.ABSENT)"
                >
                  <UserX size="16" />
                  <span class="btn-label">Absent</span>
                </button>
                <button
                  :class="getStatusButtonClass(record.status, ATTENDANCE_STATUSES.LATE)"
                  :title="getStatusLabel(ATTENDANCE_STATUSES.LATE)"
                  @click="updateStatus(record.studentId, ATTENDANCE_STATUSES.LATE)"
                >
                  <Clock size="16" />
                  <span class="btn-label">Late</span>
                </button>
                <button
                  :class="getStatusButtonClass(record.status, ATTENDANCE_STATUSES.EXCUSED)"
                  :title="getStatusLabel(ATTENDANCE_STATUSES.EXCUSED)"
                  @click="updateStatus(record.studentId, ATTENDANCE_STATUSES.EXCUSED)"
                >
                  <UserMinus size="16" />
                  <span class="btn-label">Excused</span>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty State -->
      <div v-if="!filteredStudents.length && searchQuery" class="empty-search">
        <p>No students match your search.</p>
      </div>
      <div v-else-if="!localAttendance.length" class="empty-students">
        <Users size="48" class="empty-icon" />
        <h3>No Students Enrolled</h3>
        <p>There are no students enrolled in this section.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.attendance-record {
  width: 100%;
}

/* Session Info Card */
.session-info-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.session-header {
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--color-gray-100);
  color: var(--color-gray-700);
  border: 1px solid var(--color-gray-300);
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back:hover {
  background: var(--color-gray-200);
}

.session-title {
  flex: 1;
}

.course-code {
  display: inline-block;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-secondary);
  background: rgb(238, 242, 255);
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.session-title h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-gray-900);
  margin: 0 0 0.25rem 0;
}

.section-name {
  font-size: 0.95rem;
  color: var(--color-gray-500);
}

.session-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  color: var(--color-gray-600);
}

.meta-item svg {
  color: var(--color-gray-400);
}

/* Stats Summary */
.stats-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  border-radius: 10px;
  padding: 1rem 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-card svg {
  flex-shrink: 0;
}

.stat-card.present {
  border-left: 4px solid var(--color-success);
}

.stat-card.present svg {
  color: var(--color-success);
}

.stat-card.absent {
  border-left: 4px solid var(--color-error);
}

.stat-card.absent svg {
  color: var(--color-error);
}

.stat-card.late {
  border-left: 4px solid var(--color-warning);
}

.stat-card.late svg {
  color: var(--color-warning);
}

.stat-card.excused {
  border-left: 4px solid var(--color-secondary-light);
}

.stat-card.excused svg {
  color: var(--color-secondary-light);
}

.stat-card.percentage {
  border-left: 4px solid var(--color-secondary);
}

.stat-card.percentage svg {
  color: var(--color-secondary);
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-gray-900);
  line-height: 1;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--color-gray-500);
  margin-top: 0.25rem;
}

/* Actions Bar */
.actions-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  flex-wrap: wrap;
}

.search-wrapper {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-gray-400);
}

.search-input {
  width: 100%;
  padding: 0.75rem 0.75rem 0.75rem 2.5rem;
  border: 1px solid var(--color-gray-300);
  border-radius: 8px;
  font-size: 0.95rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-secondary);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.quick-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-quick {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  border: 1px solid;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-quick.present {
  background: var(--color-success-bg);
  color: rgb(22, 101, 52);
  border-color: var(--color-success-light);
}

.btn-quick.present:hover {
  background: var(--color-success-bg);
}

.btn-quick.absent {
  background: var(--color-error-bg);
  color: var(--color-error-darkest);
  border-color: var(--color-error-light);
}

.btn-quick.absent:hover {
  background: var(--color-error-lighter);
}

.btn-save {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--color-secondary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-save:hover:not(:disabled) {
  background: var(--color-secondary-light);
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  color: var(--color-gray-500);
}

/* Students Table */
.students-table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.students-table {
  width: 100%;
  border-collapse: collapse;
}

.students-table th {
  background: var(--color-gray-50);
  padding: 1rem;
  text-align: left;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-gray-600);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--color-gray-200);
}

.students-table td {
  padding: 1rem;
  border-bottom: 1px solid var(--color-gray-200);
  vertical-align: middle;
}

.students-table tr:last-child td {
  border-bottom: none;
}

.students-table tr:hover {
  background: var(--color-gray-50);
}

.students-table tr.row-changed {
  background: var(--color-warning-bg);
}

.col-number {
  width: 60px;
  text-align: center;
  color: var(--color-gray-400);
  font-size: 0.9rem;
}

.col-student {
  min-width: 200px;
}

.student-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.student-name {
  font-weight: 500;
  color: var(--color-gray-900);
}

.student-id {
  font-size: 0.85rem;
  color: var(--color-gray-500);
}

.col-status {
  width: auto;
}

.status-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.status-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-gray-300);
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
  color: var(--color-gray-500);
}

.status-btn:hover {
  background: var(--color-gray-100);
}

.status-btn-present.active {
  background: var(--color-success-bg);
  border-color: var(--color-success);
  color: rgb(6, 95, 70);
}

.status-btn-absent.active {
  background: var(--color-error-lighter);
  border-color: var(--color-error);
  color: var(--color-error-darkest);
}

.status-btn-late.active {
  background: var(--color-warning-bg);
  border-color: var(--color-warning);
  color: rgb(146, 64, 14);
}

.status-btn-excused.active {
  background: rgb(224, 231, 255);
  border-color: var(--color-secondary-light);
  color: rgb(55, 48, 163);
}

.btn-label {
  display: none;
}

@media (min-width: 768px) {
  .btn-label {
    display: inline;
  }
}

/* Empty States */
.empty-search,
.empty-students {
  text-align: center;
  padding: 3rem;
  color: var(--color-gray-500);
}

.empty-icon {
  color: var(--color-gray-400);
  margin-bottom: 1rem;
}

.empty-students h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-gray-900);
  margin: 0 0 0.5rem 0;
}

.empty-students p {
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .session-header {
    flex-direction: column;
    gap: 1rem;
  }

  .btn-back {
    align-self: flex-start;
  }

  .session-meta {
    flex-direction: column;
    gap: 0.75rem;
  }

  .stats-summary {
    grid-template-columns: repeat(2, 1fr);
  }

  .actions-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-wrapper {
    width: 100%;
  }

  .quick-actions {
    justify-content: center;
  }

  .btn-save {
    width: 100%;
    justify-content: center;
  }

  .status-buttons {
    justify-content: flex-start;
  }

  .status-btn {
    padding: 0.5rem;
  }
}

@media (max-width: 480px) {
  .stats-summary {
    grid-template-columns: 1fr;
  }

  .quick-actions {
    flex-direction: column;
  }

  .btn-quick {
    width: 100%;
    justify-content: center;
  }
}
</style>
