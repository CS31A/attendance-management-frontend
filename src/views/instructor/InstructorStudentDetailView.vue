<script setup lang="ts">
import type { InstructorStudentEnrollment } from '@/types/instructor'
import { AlertTriangle, ArrowLeft, RefreshCw, User } from 'lucide-vue-next'
import { computed, defineAsyncComponent, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Toast from '@/components/common/Toast.vue'
import { useToast } from '@/composables/useToast'
import { useInstructorStore } from '@/stores/instructorStore'
import { getErrorMessage } from '@/utils/httpError'
import { parseStudentRouteParam } from '@/utils/studentRoute'

const SkeletonLoader = defineAsyncComponent(() => import('@/components/common/SkeletonLoader.vue'))

const route = useRoute()
const router = useRouter()
const instructorStore = useInstructorStore()

const errorMessage = ref('')

const studentDetail = computed(() => instructorStore.currentStudentDetail)
const loading = computed(() => instructorStore.loading)

const studentId = computed(() => {
  const rawStudentId = Array.isArray(route.params.studentId) ? route.params.studentId[0] : route.params.studentId
  return parseStudentRouteParam(rawStudentId as string | undefined)
})
const fromSectionId = computed(() => route.query.fromSectionId as string | undefined)
const isInvalidStudentLink = ref(false)

const { toast, showToast, closeToast } = useToast()

function getEnrollmentType(enrollmentType: string): string {
  if (enrollmentType === 'Irregular' || enrollmentType === 'Retake') {
    return enrollmentType
  }
  return 'Regular'
}

function getStatusClass(enrollmentType: string) {
  return {
    Regular: 'status-regular',
    Irregular: 'status-irregular',
    Retake: 'status-retake',
  }[getEnrollmentType(enrollmentType)] ?? 'status-regular'
}

function formatAttendanceRate(rate: number) {
  return `${rate.toFixed(1)}%`
}

function getEnrollmentKey(enrollment: InstructorStudentEnrollment, index: number) {
  return `${enrollment.subjectId}-${enrollment.sectionId}-${index}`
}

function goBack() {
  if (fromSectionId.value) {
    router.push(`/instructor/classes/sections/${fromSectionId.value}`)
  }
  else {
    router.push('/instructor/classes')
  }
}

async function loadStudentDetail() {
  errorMessage.value = ''
  isInvalidStudentLink.value = false

  if (studentId.value == null) {
    instructorStore.clearStudentDetail()
    errorMessage.value = 'Invalid student details link.'
    isInvalidStudentLink.value = true
    return
  }

  try {
    await instructorStore.fetchStudentDetail(studentId.value)
  }
  catch (error) {
    console.error('Failed to load student detail:', error)
    const message = getErrorMessage(error, 'Failed to load student detail. Please try again.')
    showToast(message, 'error')
    errorMessage.value = message
  }
}

watch(studentId, loadStudentDetail, { immediate: true })

onUnmounted(() => {
  instructorStore.clearStudentDetail()
})
</script>

<template>
  <div class="student-detail-view">
    <div class="detail-header">
      <button class="back-button" @click="goBack">
        <ArrowLeft :size="20" />
        <span>{{ fromSectionId ? 'Back to Section' : 'Back to My Classes' }}</span>
      </button>
      <h1 class="page-title">
        Student Details
      </h1>
    </div>

    <div v-if="loading && !studentDetail" class="loading-skeleton">
      <SkeletonLoader type="rectangle" :height="80" style="margin-bottom: 1rem; width: 100%;" />
      <SkeletonLoader v-for="i in 2" :key="i" type="rectangle" :height="150" style="margin-bottom: 1rem; width: 100%;" />
    </div>

    <div v-else-if="errorMessage" class="error-state">
      <AlertTriangle :size="48" class="error-icon" />
      <h3>{{ isInvalidStudentLink ? 'Invalid Student Link' : 'Failed to Load Student' }}</h3>
      <p>{{ errorMessage }}</p>
      <button class="btn-retry" @click="loadStudentDetail">
        <RefreshCw :size="18" />
        <span>Retry</span>
      </button>
    </div>

    <div v-else-if="!studentDetail && !loading" class="empty-state">
      <User :size="64" class="empty-icon" />
      <h3>Student Not Found</h3>
      <p>The requested student could not be found.</p>
    </div>

    <template v-if="studentDetail">
      <div class="identity-card">
        <div class="identity-header">
          <div class="identity-avatar">
            <User :size="32" />
          </div>
          <div class="identity-info">
            <h2 class="student-name">
              {{ studentDetail.firstname }} {{ studentDetail.lastname }}
            </h2>
            <div class="identity-meta">
              <span class="meta-item">ID: {{ studentDetail.studentId }}</span>
              <span class="meta-divider">·</span>
              <span class="meta-item">{{ studentDetail.sectionName ?? 'N/A' }}</span>
              <span class="meta-divider">·</span>
              <span class="meta-item">{{ studentDetail.courseName ?? 'N/A' }}</span>
            </div>
          </div>
          <span class="status-badge" :class="getStatusClass(studentDetail.enrollmentType)">
            {{ getEnrollmentType(studentDetail.enrollmentType) }}
          </span>
        </div>
      </div>

      <div class="detail-card">
        <h3 class="card-title">
          Enrollments
        </h3>
        <div v-if="!studentDetail.enrollments.length" class="no-data">
          <p>No enrollment records found.</p>
        </div>
        <div v-else class="enrollments-table">
          <table>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Section</th>
                <th>Enrollment Type</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(enrollment, index) in studentDetail.enrollments" :key="getEnrollmentKey(enrollment, index)">
                <td>
                  <div class="enrollment-subject">
                    <span class="subject-name">{{ enrollment.subjectName }}</span>
                    <span class="subject-code">{{ enrollment.subjectCode }}</span>
                  </div>
                </td>
                <td>{{ enrollment.sectionName }}</td>
                <td>
                  <span class="status-badge" :class="getStatusClass(enrollment.enrollmentType)">
                    {{ getEnrollmentType(enrollment.enrollmentType) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="detail-card">
        <h3 class="card-title">
          Attendance Summary
        </h3>
        <div class="attendance-grid">
          <div class="attendance-stat">
            <span class="stat-label">Total Sessions</span>
            <span class="stat-value">{{ studentDetail.attendanceSummary.totalSessions }}</span>
          </div>
          <div class="attendance-stat">
            <span class="stat-label">Present</span>
            <span class="stat-value stat-present">{{ studentDetail.attendanceSummary.presentCount }}</span>
          </div>
          <div class="attendance-stat">
            <span class="stat-label">Absent</span>
            <span class="stat-value stat-absent">{{ studentDetail.attendanceSummary.absentCount }}</span>
          </div>
          <div class="attendance-stat">
            <span class="stat-label">Late</span>
            <span class="stat-value stat-late">{{ studentDetail.attendanceSummary.lateCount }}</span>
          </div>
          <div class="attendance-stat attendance-rate-stat">
            <span class="stat-label">Attendance Rate</span>
            <span class="stat-value stat-rate">{{ formatAttendanceRate(studentDetail.attendanceSummary.attendanceRate) }}</span>
          </div>
        </div>
      </div>
    </template>

    <Toast
      :show="toast.show"
      :message="toast.message"
      :type="toast.type"
      :duration="toast.duration"
      @close="closeToast"
    />
  </div>
</template>

<style scoped>
.student-detail-view {
  padding: 1rem;
  max-width: 1400px;
  margin: 0 auto;
}

.detail-header {
  margin-bottom: 1.5rem;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
  background: none;
  border: none;
  color: var(--color-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s;
  margin-bottom: 0.75rem;
}

.back-button:hover {
  color: var(--color-secondary-light);
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-gray-900);
  margin: 0;
}

.loading-skeleton {
  padding: 1rem 0;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.error-icon {
  color: var(--color-error);
  margin-bottom: 1rem;
}

.error-state h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-gray-900);
  margin: 0 0 0.5rem 0;
}

.error-state p {
  font-size: 1rem;
  color: var(--color-gray-500);
  margin: 0 0 1.5rem 0;
  max-width: 500px;
}

.btn-retry {
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
  transition: background 0.2s;
}

.btn-retry:hover {
  background: var(--color-secondary-light);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.empty-icon {
  color: var(--color-gray-400);
  margin-bottom: 1.5rem;
}

.empty-state h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-gray-900);
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  font-size: 1rem;
  color: var(--color-gray-500);
  margin: 0;
  max-width: 500px;
}

.identity-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.identity-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.identity-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--color-gray-100);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-gray-500);
  flex-shrink: 0;
}

.identity-info {
  flex: 1;
  min-width: 0;
}

.student-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-gray-900);
  margin: 0 0 0.25rem 0;
}

.identity-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  font-size: 0.875rem;
  color: var(--color-gray-500);
}

.meta-divider {
  color: var(--color-gray-300);
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.status-regular {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.status-irregular {
  background: var(--color-warning-light);
  color: var(--color-warning);
}

.status-retake {
  background: color-mix(in srgb, var(--color-secondary) 18%, white);
  color: var(--color-secondary);
}

.detail-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-gray-900);
  margin: 0 0 1rem 0;
}

.enrollments-table {
  overflow-x: auto;
}

.enrollments-table table {
  width: 100%;
  border-collapse: collapse;
}

.enrollments-table thead {
  background: var(--color-gray-50);
}

.enrollments-table th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 0.813rem;
  font-weight: 600;
  color: var(--color-gray-700);
  border-bottom: 2px solid var(--color-gray-200);
}

.enrollments-table td {
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: var(--color-gray-900);
  border-bottom: 1px solid var(--color-gray-200);
}

.enrollments-table tbody tr:last-child td {
  border-bottom: none;
}

.enrollment-subject {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.subject-name {
  font-weight: 600;
}

.subject-code {
  font-size: 0.813rem;
  color: var(--color-gray-500);
}

.no-data {
  padding: 2rem;
  text-align: center;
  color: var(--color-gray-500);
  background: var(--color-gray-50);
  border-radius: 8px;
}

.no-data p {
  margin: 0;
}

.attendance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
}

.attendance-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 1rem;
  background: var(--color-gray-50);
  border-radius: 8px;
}

.stat-label {
  font-size: 0.813rem;
  color: var(--color-gray-500);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-gray-900);
}

.stat-present {
  color: var(--color-success);
}

.stat-absent {
  color: var(--color-error);
}

.stat-late {
  color: var(--color-warning);
}

.attendance-rate-stat {
  grid-column: 1 / -1;
  background: var(--color-secondary);
  color: white;
}

.attendance-rate-stat .stat-label {
  color: rgba(255, 255, 255, 0.85);
}

.attendance-rate-stat .stat-value {
  color: white;
  font-size: 2rem;
}

@media (max-width: 768px) {
  .student-detail-view {
    padding: 0.75rem;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .identity-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .enrollments-table th,
  .enrollments-table td {
    padding: 0.625rem 0.75rem;
    font-size: 0.813rem;
  }

  .attendance-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .student-detail-view {
    padding: 0.5rem;
  }

  .page-title {
    font-size: 1.25rem;
  }

  .student-name {
    font-size: 1.125rem;
  }

  .identity-meta {
    font-size: 0.75rem;
  }

  .attendance-grid {
    grid-template-columns: 1fr 1fr;
  }

  .stat-value {
    font-size: 1.25rem;
  }

  .status-badge {
    font-size: 0.688rem;
    padding: 0.188rem 0.5rem;
  }
}
</style>
