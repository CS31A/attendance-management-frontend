<script setup lang="ts">
import type { EnrollmentDto } from '@/api/enrollments'
import type { StudentAttendanceReportDto } from '@/api/reports'
import { AlertTriangle, ArrowLeft, Calendar, Clock, GraduationCap, Mail, User } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getStatusClass, getStatusLabel } from '@/api/attendance'
import { fetchStudentAttendanceReport } from '@/api/reports'
import BaseButton from '@/components/common/BaseButton.vue'
import SkeletonLoader from '@/components/common/SkeletonLoader.vue'
import { useEnrollmentStore } from '@/stores/enrollmentStore'
import { useUserStore } from '@/stores/userStore'
import { formatShortTableDate } from '@/utils/date'
import { parseStudentRouteParam, resolveStudentProfileId } from '@/utils/studentRoute'

const route = useRoute()
const router = useRouter()
const studentId = computed(() => parseStudentRouteParam(route.params.studentId as string | undefined))

const enrollmentStore = useEnrollmentStore()
const userStore = useUserStore()

const loading = ref(true)
const error = ref('')
const report = ref<StudentAttendanceReportDto | null>(null)
const enrollments = ref<EnrollmentDto[]>([])

// Base student identity from user store context
const studentUser = computed(() => {
  if (studentId.value == null)
    return undefined

  return userStore.getUsers.find(u => resolveStudentProfileId(u) === studentId.value)
})

// Derived display values
const displayTitle = computed(() => {
  if (studentUser.value) {
    return `${studentUser.value.firstName || ''} ${studentUser.value.lastName || ''}`.trim() || studentUser.value.username || 'Student Details'
  }
  if (report.value?.studentName) {
    return report.value.studentName
  }
  return 'Student Details'
})

const displayEmail = computed(() => studentUser.value?.email || 'N/A')
const displayJoinedDate = computed(() => {
  if (studentUser.value?.createdAt) {
    return formatShortTableDate(studentUser.value.createdAt)
  }
  return '-'
})

async function fetchData() {
  loading.value = true
  error.value = ''
  report.value = null
  enrollments.value = []

  try {
    if (studentId.value == null) {
      error.value = 'Invalid student details link.'
      return
    }

    // If user list is empty (e.g. direct nav), try to fetch users first
    if (userStore.getUsers.length === 0) {
      await userStore.fetchUsers('All')
    }

    const [enrollmentData, reportData] = await Promise.all([
      enrollmentStore.fetchStudentEnrollments(studentId.value),
      fetchStudentAttendanceReport(studentId.value).catch((err) => {
        // Attendance report might 404 if no records, handle gracefully
        if (err.response?.status === 404)
          return null
        throw err
      }),
    ])

    enrollments.value = enrollmentData
    report.value = reportData
  }
  catch (err) {
    console.error('Failed to load student details:', err)
    error.value = 'Failed to load student details. Please try again.'
  }
  finally {
    loading.value = false
  }
}

watch(studentId, () => {
  fetchData()
}, { immediate: true })

function goBack() {
  router.push('/users')
}
</script>

<template>
  <div class="student-detail-view">
    <!-- Header -->
    <div class="page-header">
      <BaseButton variant="ghost" class="back-button" :icon="ArrowLeft" @click="goBack">
        Back to Users
      </BaseButton>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-skeleton">
      <SkeletonLoader type="rectangle" :height="120" style="margin-bottom: 2rem; border-radius: 12px;" />

      <div class="dashboard-grid">
        <SkeletonLoader type="rectangle" :height="400" style="border-radius: 12px;" />
        <SkeletonLoader type="rectangle" :height="400" style="border-radius: 12px;" />
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <AlertTriangle class="error-icon" :size="48" />
      <h3>Error Loading Student</h3>
      <p>{{ error }}</p>
      <BaseButton variant="primary" @click="fetchData">
        Retry
      </BaseButton>
    </div>

    <!-- Content -->
    <div v-else class="content-container">
      <!-- Student Summary Profile Panel -->
      <div class="profile-card panel">
        <div class="profile-header">
          <div class="avatar-circle">
            <User :size="32" class="avatar-icon" />
          </div>
          <div class="profile-info">
            <h1 class="profile-name">
              {{ displayTitle }}
            </h1>
            <div class="profile-meta">
              <span class="meta-item">
                <Mail :size="14" /> {{ displayEmail }}
              </span>
              <span class="meta-item">
                <GraduationCap :size="14" /> Role: Student
              </span>
              <span class="meta-item">
                <Calendar :size="14" /> Joined: {{ displayJoinedDate }}
              </span>
              <span v-if="studentUser?.sectionId" class="meta-item badge">
                Section: {{ studentUser.sectionId }}
              </span>
              <span v-if="studentUser?.isRegular !== undefined" class="meta-item badge" :class="studentUser.isRegular ? 'badge-primary' : 'badge-warning'">
                {{ studentUser.isRegular ? 'Regular' : 'Irregular' }}
              </span>
            </div>
          </div>
        </div>

        <!-- KPI Cards -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">
              Attendance Rate
            </div>
            <div class="kpi-value" :class="(report?.attendancePercentage ?? 0) >= 80 ? 'text-success' : 'text-danger'">
              {{ report?.attendancePercentage ?? 0 }}%
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">
              Total Sessions
            </div>
            <div class="kpi-value">
              {{ report?.totalSessions ?? 0 }}
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">
              Present
            </div>
            <div class="kpi-value text-success">
              {{ report?.presentCount ?? 0 }}
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">
              Absent
            </div>
            <div class="kpi-value text-danger">
              {{ report?.absentCount ?? 0 }}
            </div>
          </div>
        </div>
      </div>

      <div class="dashboard-grid">
        <!-- Enrollments Panel -->
        <div class="panel enrollments-panel">
          <h2 class="panel-title">
            Enrolled Sections
          </h2>
          <div v-if="enrollments.length === 0" class="empty-state-panel">
            <GraduationCap :size="32" class="text-gray-400" />
            <p>No active enrollments for this student.</p>
          </div>
          <div v-else class="table-responsive">
            <table class="app-table basic-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Section</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="enrollment in enrollments" :key="enrollment.id || enrollment.enrollmentId">
                  <td>{{ enrollment.subjectName || enrollment.subject || '-' }}</td>
                  <td>{{ enrollment.sectionName || enrollment.section || enrollment.sectionId || '-' }}</td>
                  <td>{{ enrollment.enrollmentType || 'Regular' }}</td>
                  <td>{{ formatShortTableDate(enrollment.enrollmentDate) }}</td>
                  <td>
                    <span class="status-badge" :class="enrollment.status === 'Active' ? 'badge-success' : 'badge-gray'">
                      {{ enrollment.status || 'Active' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Attendance History Panel -->
        <div class="panel attendance-panel">
          <h2 class="panel-title">
            Attendance History
          </h2>
          <div v-if="!report || !report.attendanceRecords || report.attendanceRecords.length === 0" class="empty-state-panel">
            <Calendar :size="32" class="text-gray-400" />
            <p>No attendance records found.</p>
          </div>
          <div v-else class="table-responsive">
            <table class="app-table basic-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Subject</th>
                  <th>Section</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="record in report.attendanceRecords" :key="record.id">
                  <td>{{ formatShortTableDate(record.sessionDate) }}</td>
                  <td>{{ record.subjectName || '-' }}</td>
                  <td>{{ record.sectionName || '-' }}</td>
                  <td>
                    <div v-if="record.checkInTime" class="time-cell">
                      <Clock :size="14" /> {{ new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
                    </div>
                    <span v-else class="text-gray-400">-</span>
                  </td>
                  <td>
                    <div class="status-cell">
                      <span class="status-text" :class="getStatusClass(record.status.toLowerCase())">
                        {{ getStatusLabel(record.status.toLowerCase()) }}
                      </span>
                      <span v-if="record.isManualEntry" class="manual-badge" title="Manual Entry">M</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.student-detail-view {
  min-height: 100vh;
  background: var(--color-slate-100);
  padding: 1rem;
  position: relative;
}

.student-detail-view::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="10" cy="60" r="0.5" fill="white" opacity="0.1"/><circle cx="90" cy="40" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
  pointer-events: none;
}

.page-header {
  margin-bottom: 1.5rem;
  position: relative;
  z-index: 1;
}

.back-button {
  color: var(--color-slate-600);
  font-weight: 500;
}

.back-button:hover {
  background: var(--bg-hover);
  color: var(--color-primary);
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  text-align: center;
  color: var(--text-secondary);
  position: relative;
  z-index: 1;
}

.error-icon {
  color: var(--color-danger);
  margin-bottom: 1rem;
}

.error-state h3 {
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.content-container {
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.panel {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-primary);
  overflow: hidden;
  margin-bottom: 1.5rem;
}

.panel-title {
  padding: 1.25rem 1.5rem;
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-primary);
  background: var(--bg-primary);
}

.profile-card {
  padding: 1.5rem;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.avatar-circle {
  width: 5rem;
  height: 5rem;
  border-radius: 50%;
  background: var(--color-primary-light);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-sm);
}

.avatar-icon {
  opacity: 0.9;
}

.profile-info {
  flex: 1;
}

.profile-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.profile-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.badge {
  padding: 0.25rem 0.625rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
  background: var(--bg-hover);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
}

.badge-primary {
  background: var(--color-primary);
  color: white;
  border: none;
}

.badge-warning {
  background: var(--color-warning);
  color: white;
  border: none;
}

.badge-success {
  background: var(--color-success);
  color: white;
  border: none;
}

.badge-gray {
  background: var(--color-gray-200);
  color: var(--text-secondary);
  border: none;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-primary);
}

.kpi-card {
  background: var(--bg-primary);
  padding: 1rem;
  border-radius: var(--radius-md);
  text-align: center;
  border: 1px solid var(--border-primary);
}

.kpi-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.kpi-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}

.text-success { color: var(--color-success) !important; }
.text-danger { color: var(--color-danger) !important; }
.text-gray-400 { color: var(--color-gray-400); }

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.table-responsive {
  overflow-x: auto;
}

.basic-table {
  width: 100%;
  border-collapse: collapse;
}

.basic-table th {
  background: var(--color-slate-50);
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--border-primary);
}

.basic-table td {
  padding: 0.875rem 1rem;
  font-size: 0.875rem;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-primary);
}

.basic-table tr:last-child td {
  border-bottom: none;
}

.basic-table tbody tr:hover {
  background: var(--bg-hover);
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
}

.empty-state-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: var(--text-tertiary);
  text-align: center;
}

.empty-state-panel p {
  margin-top: 1rem;
  font-size: 0.875rem;
}

.time-cell {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--text-secondary);
}

.status-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-text {
  font-weight: 600;
  text-transform: capitalize;
}

.status-present { color: var(--color-success); }
.status-absent { color: var(--color-danger); }
.status-late { color: var(--color-warning); }
.status-excused { color: var(--color-info); }

.manual-badge {
  font-size: 0.625rem;
  font-weight: 700;
  background: var(--color-slate-200);
  color: var(--color-slate-600);
  padding: 0.125rem 0.375rem;
  border-radius: var(--radius-sm);
}

@media (max-width: 640px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }

  .profile-meta {
    justify-content: center;
  }
}
</style>
