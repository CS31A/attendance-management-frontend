<script setup lang="ts">
import type { EntityId } from '@/types'

import { AlertTriangle, ArrowLeft, BookOpen, ChevronDown, ChevronUp, RefreshCw, Users } from 'lucide-vue-next'
import { computed, defineAsyncComponent, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Toast from '@/components/common/Toast.vue'
import FingerprintStatusBadge from '@/components/fingerprint/FingerprintStatusBadge.vue'
import { useToast } from '@/composables/useToast'
import { useInstructorStore } from '@/stores/instructorStore'
import { getErrorMessage } from '@/utils/httpError'

const SkeletonLoader = defineAsyncComponent(() => import('@/components/common/SkeletonLoader.vue'))
const FingerprintEnrollmentModal = defineAsyncComponent(() => import('@/components/fingerprint/FingerprintEnrollmentModal.vue'))

const route = useRoute()
const router = useRouter()
const instructorStore = useInstructorStore()

const enrollmentTypeFilters = ['All', 'Regular', 'Irregular', 'Retake'] as const
type EnrollmentTypeFilter = typeof enrollmentTypeFilters[number]

const errorMessage = ref('')
const selectedEnrollmentFilter = ref<EnrollmentTypeFilter>('All')
const expandedClasses = ref<Set<EntityId>>(new Set())

const sectionDetail = computed(() => instructorStore.currentSectionDetail)
const loading = computed(() => instructorStore.loading)
const isInvalidSectionLink = ref(false)

const showEnrollmentModal = ref(false)
const selectedStudent = ref<{ studentId: EntityId, name: string } | null>(null)

// Extract sectionId from route params as EntityId (string from router)
const sectionId = computed(() => {
  const rawSectionId = Array.isArray(route.params.sectionId) ? route.params.sectionId[0] : route.params.sectionId
  // Route params are always strings, which is compatible with EntityId
  return rawSectionId as EntityId | undefined
})

// Validate that sectionId exists and is not empty
const isValidSectionId = computed(() => {
  const id = sectionId.value
  return id !== undefined && id !== null && id !== ''
})

const { toast, showToast, closeToast } = useToast()

function getEnrollmentType(student: { isRegular: boolean, enrollmentType: string }): Exclude<EnrollmentTypeFilter, 'All'> {
  if (student.enrollmentType === 'Irregular' || student.enrollmentType === 'Retake') {
    return student.enrollmentType as Exclude<EnrollmentTypeFilter, 'All'>
  }
  return 'Regular'
}

function getStudentStatusClass(student: { isRegular: boolean, enrollmentType: string }) {
  const enrollmentType = getEnrollmentType(student)
  return {
    Regular: 'status-regular',
    Irregular: 'status-irregular',
    Retake: 'status-retake',
  }[enrollmentType]
}

function getFilteredStudents<T extends { isRegular: boolean, enrollmentType: string }>(students: T[]) {
  if (selectedEnrollmentFilter.value === 'All') {
    return students
  }
  return students.filter(student => getEnrollmentType(student) === selectedEnrollmentFilter.value)
}

const filteredHandledClasses = computed(() => {
  return sectionDetail.value?.handledClasses.map(handledClass => ({
    ...handledClass,
    filteredStudents: getFilteredStudents(handledClass.students),
  })) ?? []
})

const filteredHomeSectionStudents = computed(() => {
  return sectionDetail.value ? getFilteredStudents(sectionDetail.value.homeSectionStudents) : []
})

function toggleClassExpansion(scheduleId: EntityId) {
  const newSet = new Set(expandedClasses.value)
  if (newSet.has(scheduleId)) {
    newSet.delete(scheduleId)
  }
  else {
    newSet.add(scheduleId)
  }
  expandedClasses.value = newSet
}

function isClassExpanded(scheduleId: EntityId) {
  return expandedClasses.value.has(scheduleId)
}

function navigateToStudent(studentId: EntityId) {
  router.push(`/instructor/students/${studentId}?fromSectionId=${sectionId.value}`)
}

function goBack() {
  router.push('/instructor/classes')
}

function openEnrollmentModal(student: { studentId: EntityId, name: string }) {
  selectedStudent.value = student
  showEnrollmentModal.value = true
}

function handleEnrollmentSuccess() {
  showEnrollmentModal.value = false
  selectedStudent.value = null
  // Refresh section detail to update hasFingerprint status
  if (route.params.sectionId) {
    instructorStore.fetchSectionDetail(route.params.sectionId as string)
  }
}

function handleEnrollmentError(message: string) {
  console.error('Enrollment error:', message)
}

async function loadSectionDetail() {
  errorMessage.value = ''
  isInvalidSectionLink.value = false

  if (!isValidSectionId.value) {
    instructorStore.clearSectionDetail()
    errorMessage.value = 'Invalid section details link.'
    isInvalidSectionLink.value = true
    return
  }

  try {
    await instructorStore.fetchSectionDetail(sectionId.value!)
  }
  catch (error) {
    console.error('Failed to load section detail:', error)
    const message = getErrorMessage(error, 'Failed to load section detail. Please try again.')
    showToast(message, 'error')
    errorMessage.value = message
  }
}

watch(sectionId, loadSectionDetail, { immediate: true })

onUnmounted(() => {
  instructorStore.clearSectionDetail()
})
</script>

<template>
  <div class="section-detail-view">
    <div class="detail-header">
      <button class="back-button" @click="goBack">
        <ArrowLeft :size="20" />
        <span>Back to My Classes</span>
      </button>
      <div v-if="sectionDetail" class="header-content">
        <h1 class="page-title">
          {{ sectionDetail.sectionName }}
        </h1>
        <p class="page-subtitle">
          {{ sectionDetail.courseName }}
        </p>
      </div>
    </div>

    <div v-if="loading && !sectionDetail" class="loading-skeleton">
      <SkeletonLoader type="rectangle" :height="60" style="margin-bottom: 1rem; width: 100%;" />
      <SkeletonLoader v-for="i in 3" :key="i" type="rectangle" :height="120" style="margin-bottom: 1rem; width: 100%;" />
    </div>

    <div v-else-if="errorMessage" class="error-state">
      <AlertTriangle :size="48" class="error-icon" />
      <h3>{{ isInvalidSectionLink ? 'Invalid Section Link' : 'Failed to Load Section' }}</h3>
      <p>{{ errorMessage }}</p>
      <button class="btn-retry" @click="loadSectionDetail">
        <RefreshCw :size="18" />
        <span>Retry</span>
      </button>
    </div>

    <div v-else-if="!sectionDetail && !loading" class="empty-state">
      <BookOpen :size="64" class="empty-icon" />
      <h3>Section Not Found</h3>
      <p>The requested section could not be found.</p>
    </div>

    <template v-if="sectionDetail">
      <div class="summary-cards">
        <div class="summary-card">
          <BookOpen :size="24" class="summary-icon" />
          <div class="summary-info">
            <span class="summary-label">Handled Classes</span>
            <span class="summary-value">{{ sectionDetail.handledClasses.length }}</span>
          </div>
        </div>
        <div class="summary-card">
          <Users :size="24" class="summary-icon" />
          <div class="summary-info">
            <span class="summary-label">Home Section Students</span>
            <span class="summary-value">{{ sectionDetail.homeSectionStudents.length }}</span>
          </div>
        </div>
      </div>

      <div class="enrollment-filters" role="group" aria-label="Filter students by enrollment type">
        <button
          v-for="filter in enrollmentTypeFilters"
          :key="filter"
          type="button"
          class="filter-button"
          :class="{ active: selectedEnrollmentFilter === filter }"
          @click="selectedEnrollmentFilter = filter"
        >
          {{ filter }}
        </button>
      </div>

      <div class="handled-classes-area">
        <h2 class="area-title">
          Handled Classes
        </h2>
        <div v-if="!sectionDetail.handledClasses.length" class="no-data">
          <p>No handled classes for this section.</p>
        </div>
        <div v-else class="handled-classes-list">
          <div
            v-for="handledClass in filteredHandledClasses"
            :key="handledClass.scheduleId"
            class="handled-class-card"
          >
            <button
              type="button"
              class="handled-class-header"
              :aria-expanded="isClassExpanded(handledClass.scheduleId)"
              :aria-controls="`handled-class-${handledClass.scheduleId}`"
              @click="toggleClassExpansion(handledClass.scheduleId)"
            >
              <div class="handled-class-info">
                <div class="subject-info">
                  <h3 class="subject-name">
                    {{ handledClass.subjectName }}
                  </h3>
                  <span class="subject-code">{{ handledClass.subjectCode }}</span>
                </div>
                <div class="schedule-info">
                  <span class="schedule-day">{{ handledClass.dayOfWeek }}</span>
                  <span class="schedule-time">{{ handledClass.timeIn }} - {{ handledClass.timeOut }}</span>
                  <span class="classroom-name">{{ handledClass.classroomName }}</span>
                </div>
              </div>
              <div class="handled-class-meta">
                <span class="student-count">{{ handledClass.studentCount }} Student{{ handledClass.studentCount !== 1 ? 's' : '' }}</span>
                <component
                  :is="isClassExpanded(handledClass.scheduleId) ? ChevronUp : ChevronDown"
                  :size="20"
                  class="expand-icon"
                />
              </div>
            </button>

            <div
              v-if="isClassExpanded(handledClass.scheduleId)"
              :id="`handled-class-${handledClass.scheduleId}`"
              class="handled-class-students"
            >
              <div v-if="handledClass.filteredStudents.length > 0" class="students-table">
                <table>
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Name</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="student in handledClass.filteredStudents"
                      :key="student.studentId"
                      class="student-row"
                      @click="navigateToStudent(student.studentId)"
                    >
                      <td>{{ student.studentId }}</td>
                      <td>
                        <FingerprintStatusBadge
                          :has-fingerprint="student.hasFingerprint"
                          :student-id="student.studentId"
                          @click.stop="openEnrollmentModal({ studentId: student.studentId, name: `${student.firstname} ${student.lastname}` })"
                        />
                        {{ student.firstname }} {{ student.lastname }}
                      </td>
                      <td>
                        <span class="status-badge" :class="getStudentStatusClass(student)">
                          {{ getEnrollmentType(student) }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="no-students">
                <p>
                  {{ selectedEnrollmentFilter === 'All'
                    ? 'No students enrolled in this class'
                    : `No ${selectedEnrollmentFilter.toLowerCase()} students enrolled in this class` }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="home-section-panel">
        <h2 class="area-title">
          Home Section Students
        </h2>
        <div v-if="!filteredHomeSectionStudents.length" class="no-data">
          <p>
            {{ selectedEnrollmentFilter === 'All'
              ? 'No home section students found.'
              : `No ${selectedEnrollmentFilter.toLowerCase()} home section students found.` }}
          </p>
        </div>
        <div v-else class="students-table">
          <table>
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="student in filteredHomeSectionStudents"
                :key="student.studentId"
                class="student-row"
                @click="navigateToStudent(student.studentId)"
              >
                <td>{{ student.studentId }}</td>
                <td>
                  <FingerprintStatusBadge
                    :has-fingerprint="student.hasFingerprint"
                    :student-id="student.studentId"
                    @click.stop="openEnrollmentModal({ studentId: student.studentId, name: `${student.firstname} ${student.lastname}` })"
                  />
                  {{ student.firstname }} {{ student.lastname }}
                </td>
                <td>
                  <span class="status-badge" :class="getStudentStatusClass(student)">
                    {{ getEnrollmentType(student) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
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

    <FingerprintEnrollmentModal
      v-if="showEnrollmentModal && selectedStudent"
      :show="showEnrollmentModal"
      :student-id="selectedStudent.studentId"
      :student-name="selectedStudent.name"
      @close="showEnrollmentModal = false; selectedStudent = null"
      @enrolled="handleEnrollmentSuccess"
      @error="handleEnrollmentError"
    />
  </div>
</template>

<style scoped>
.section-detail-view {
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

.header-content {
  flex: 1;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-gray-900);
  margin: 0 0 0.25rem 0;
}

.page-subtitle {
  font-size: 0.875rem;
  color: var(--color-gray-500);
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

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.summary-icon {
  color: var(--color-secondary);
  flex-shrink: 0;
}

.summary-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.summary-label {
  font-size: 0.875rem;
  color: var(--color-gray-500);
  font-weight: 500;
}

.summary-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-gray-900);
}

.enrollment-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.filter-button {
  border: 1px solid var(--color-gray-300);
  background: white;
  color: var(--color-gray-700);
  border-radius: 999px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}

.filter-button:hover {
  border-color: var(--color-secondary);
  color: var(--color-secondary);
}

.filter-button.active {
  background: var(--color-secondary);
  border-color: var(--color-secondary);
  color: white;
}

.area-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-gray-900);
  margin: 0 0 1rem 0;
}

.handled-classes-area {
  margin-bottom: 2rem;
}

.handled-classes-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.handled-class-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.handled-class-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem;
  width: 100%;
  border: none;
  background: white;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s;
}

.handled-class-header:hover {
  background: var(--color-gray-50);
}

.handled-class-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}

.subject-info {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.subject-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-gray-900);
  margin: 0;
}

.subject-code {
  font-size: 0.813rem;
  color: var(--color-gray-500);
  font-weight: 500;
}

.schedule-info {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  font-size: 0.813rem;
}

.schedule-day {
  padding: 0.25rem 0.75rem;
  background: var(--color-secondary);
  color: white;
  border-radius: 6px;
  font-weight: 500;
}

.schedule-time {
  color: var(--color-gray-600);
  font-weight: 500;
}

.classroom-name {
  padding: 0.25rem 0.75rem;
  background: var(--color-gray-100);
  color: var(--color-gray-700);
  border-radius: 6px;
  font-weight: 500;
}

.handled-class-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.student-count {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-gray-700);
  white-space: nowrap;
}

.expand-icon {
  color: var(--color-gray-400);
  transition: color 0.2s;
}

.handled-class-header:hover .expand-icon {
  color: var(--color-gray-600);
}

.handled-class-students {
  border-top: 1px solid var(--color-gray-200);
}

.students-table {
  overflow-x: auto;
}

.students-table table {
  width: 100%;
  border-collapse: collapse;
}

.students-table thead {
  background: var(--color-gray-50);
}

.students-table th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 0.813rem;
  font-weight: 600;
  color: var(--color-gray-700);
  border-bottom: 2px solid var(--color-gray-200);
}

.students-table td {
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: var(--color-gray-900);
  border-bottom: 1px solid var(--color-gray-200);
}

.students-table tbody tr:last-child td {
  border-bottom: none;
}

.student-row {
  cursor: pointer;
  transition: background 0.15s;
}

.student-row:hover {
  background: var(--color-gray-50);
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

.no-students {
  padding: 1rem;
  text-align: center;
  color: var(--color-gray-500);
  font-size: 0.875rem;
  background: var(--color-gray-50);
  border-radius: 8px;
}

.no-students p {
  margin: 0;
}

.no-data {
  padding: 2rem;
  text-align: center;
  color: var(--color-gray-500);
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.no-data p {
  margin: 0;
}

.home-section-panel {
  margin-bottom: 2rem;
}

@media (max-width: 1024px) {
  .handled-class-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .handled-class-meta {
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 768px) {
  .section-detail-view {
    padding: 0.75rem;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .summary-cards {
    grid-template-columns: 1fr;
  }

  .students-table th,
  .students-table td {
    padding: 0.625rem 0.75rem;
    font-size: 0.813rem;
  }

  .students-table th:first-child,
  .students-table td:first-child {
    display: none;
  }
}

@media (max-width: 480px) {
  .section-detail-view {
    padding: 0.5rem;
  }

  .page-title {
    font-size: 1.25rem;
  }

  .page-subtitle {
    font-size: 0.75rem;
  }

  .summary-card {
    padding: 1rem;
  }

  .summary-value {
    font-size: 1.25rem;
  }

  .subject-name {
    font-size: 0.938rem;
  }

  .schedule-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .students-table {
    font-size: 0.75rem;
  }

  .status-badge {
    font-size: 0.688rem;
    padding: 0.188rem 0.5rem;
  }
}
</style>
