<script setup lang="ts">
import type { SectionDto } from '@/api/sections'
import type { EntityId } from '@/types'
import { AlertTriangle, ArrowLeft, Check, RefreshCw, Search, Trash2, UserPlus, X } from 'lucide-vue-next'
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '@/components/common/BaseButton.vue'
import BulkDataActions from '@/components/common/BulkDataActions.vue'
import SkeletonLoader from '@/components/common/SkeletonLoader.vue'
import { useEnrollmentStore } from '@/stores/enrollmentStore'
import { useSectionStore } from '@/stores/sectionStore'
import { useUserStore } from '@/stores/userStore'
import { LOCALE } from '@/utils/constants'
import { parseUtcDate } from '@/utils/qrcode'

const AddEnrollmentModal = defineAsyncComponent(() => import('@/components/sections/AddEnrollmentModal.vue'))

const route = useRoute()
const router = useRouter()

function parseSectionRouteParam(value: EntityId | undefined): number | null {
  if (typeof value === 'number') {
    return Number.isInteger(value) && value > 0 ? value : null
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null
  }

  return null
}

const sectionId = computed(() => {
  const rawSectionId = Array.isArray(route.params.sectionId) ? route.params.sectionId[0] : route.params.sectionId
  return parseSectionRouteParam(rawSectionId as EntityId | undefined)
})

const enrollmentStore = useEnrollmentStore()
const sectionStore = useSectionStore()
const userStore = useUserStore()

// State
const section = ref<SectionDto | null>(null)
const searchQuery = ref('')
const showAddModal = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const loading = ref(true)
const invalidLink = ref(false)
let pendingSectionFetchId: number | null | undefined
let isProcessingSectionFetch = false

// Computed
const enrolledStudents = computed(() => enrollmentStore.getSectionStudents)
const isLoading = computed(() => enrollmentStore.isLoading || sectionStore.loading || userStore.loading || loading.value)

function asSearchableString(value: string | number) {
  if (typeof value === 'string')
    return value.toLowerCase()
  if (typeof value === 'number')
    return String(value).toLowerCase()
  return ''
}

function formatEnrollmentDate(value: string) {
  const parsed = parseUtcDate(value)
  return parsed ? parsed.toLocaleDateString(LOCALE.DEFAULT) : '-'
}

const filteredEnrolledStudents = computed(() => {
  if (!searchQuery.value)
    return enrolledStudents.value
  const query = searchQuery.value.toLowerCase()
  return enrolledStudents.value.filter(s =>
    (s.studentFirstname && asSearchableString(s.studentFirstname).includes(query))
    || (s.studentLastname && asSearchableString(s.studentLastname).includes(query))
    || (s.studentId && asSearchableString(s.studentId).includes(query)),
  )
})

async function fetchDataForSection(currentSectionId: number | null) {
  loading.value = true
  errorMessage.value = ''
  invalidLink.value = false
  section.value = null

  try {
    if (currentSectionId == null) {
      invalidLink.value = true
      errorMessage.value = 'Invalid section details link.'
      return
    }

    const [sectionData] = await Promise.all([
      sectionStore.getSection(currentSectionId),
      enrollmentStore.fetchSectionStudents(currentSectionId),
    ])

    section.value = sectionData
  }
  catch (err) {
    console.error('Failed to load section enrollments:', err)
    errorMessage.value = 'Failed to load section enrollments. Please try again.'
  }
  finally {
    loading.value = false
  }
}

async function processSectionFetchQueue() {
  if (isProcessingSectionFetch)
    return

  isProcessingSectionFetch = true

  try {
    while (pendingSectionFetchId !== undefined) {
      const sectionIdToFetch = pendingSectionFetchId
      pendingSectionFetchId = undefined
      await fetchDataForSection(sectionIdToFetch)
    }
  }
  finally {
    isProcessingSectionFetch = false
  }
}

function fetchData() {
  pendingSectionFetchId = sectionId.value
  void processSectionFetchQueue()
}

async function handleDrop(enrollmentId: EntityId) {
  if (!confirm('Are you sure you want to drop this student?'))
    return

  if (sectionId.value == null)
    return

  try {
    errorMessage.value = ''
    await enrollmentStore.dropStudent(enrollmentId, sectionId.value)
    successMessage.value = 'Student dropped successfully'
  }
  catch (error: unknown) {
    errorMessage.value = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to drop student'
  }
}

async function handleReenroll(enrollmentId: EntityId) {
  if (sectionId.value == null)
    return

  try {
    errorMessage.value = ''
    await enrollmentStore.reenrollStudent(enrollmentId, sectionId.value)
    successMessage.value = 'Student re-enrolled successfully'
  }
  catch (error: unknown) {
    errorMessage.value = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to re-enroll student'
  }
}

async function handleEnrollmentSuccess() {
  showAddModal.value = false
  successMessage.value = 'Student enrolled successfully'
  if (sectionId.value != null) {
    await enrollmentStore.fetchSectionStudents(sectionId.value)
  }
}

function handleEnrollmentError(msg: string) {
  errorMessage.value = msg
}

function goBack() {
  router.push('/sections')
}

watch(sectionId, (nextSectionId) => {
  pendingSectionFetchId = nextSectionId
  void processSectionFetchQueue()
}, { immediate: true })
</script>

<template>
  <div class="section-enrollments-view">
    <!-- Header -->
    <div class="page-header">
      <BaseButton variant="ghost" class="back-button" :icon="ArrowLeft" @click="goBack">
        Back to Sections
      </BaseButton>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading && !section" class="loading-skeleton">
      <div class="container">
        <div class="skeleton-header">
          <SkeletonLoader type="text" :height="40" :width="300" style="margin-bottom: 0.5rem;" />
          <SkeletonLoader type="text" :height="20" :width="200" />
        </div>
        <div class="skeleton-table">
          <SkeletonLoader type="rectangle" :height="50" style="margin-bottom: 1rem; width: 100%;" />
          <SkeletonLoader v-for="i in 5" :key="i" type="rectangle" :height="60" style="margin-bottom: 0.5rem; width: 100%;" />
        </div>
      </div>
    </div>

    <!-- Invalid Link State -->
    <div v-else-if="invalidLink" class="error-state">
      <AlertTriangle class="error-icon" :size="48" />
      <h3>Invalid Link</h3>
      <p>The section ID in the URL is not valid.</p>
      <BaseButton variant="primary" @click="goBack">
        Go to Sections
      </BaseButton>
    </div>

    <!-- Error State -->
    <div v-else-if="errorMessage && !section" class="error-state">
      <AlertTriangle class="error-icon" :size="48" />
      <h3>Error Loading Section</h3>
      <p>{{ errorMessage }}</p>
      <BaseButton variant="primary" @click="fetchData">
        Retry
      </BaseButton>
    </div>

    <!-- Content -->
    <div v-else class="container">
      <!-- Page Title -->
      <div class="page-title-section">
        <div>
          <h1 class="page-title">
            Manage Enrollments
          </h1>
          <p class="page-subtitle">
            {{ section?.name || 'Section' }}
          </p>
        </div>
      </div>

      <!-- Messages -->
      <div v-if="errorMessage" class="alert error">
        <AlertTriangle :size="18" />
        <span>{{ errorMessage }}</span>
        <button class="btn-icon-small" @click="errorMessage = ''">
          <X :size="14" />
        </button>
      </div>
      <div v-if="successMessage" class="alert success">
        <Check :size="18" />
        <span>{{ successMessage }}</span>
        <button class="btn-icon-small" @click="successMessage = ''">
          <X :size="14" />
        </button>
      </div>

      <!-- Actions Bar -->
      <div class="actions-bar">
        <div class="search-wrapper">
          <Search class="search-icon" :size="18" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search enrolled students..."
            class="search-input"
          >
        </div>
        <div class="actions-controls">
          <BulkDataActions
            entity="enrollments"
            :title="`${section?.name ?? 'Section'} Enrollments`"
            :export-params="{ sectionName: (section?.name ?? '') as string } as Record<string, unknown>"
            :import-params="{ sectionName: (section?.name ?? '') as string } as Record<string, unknown>"
            @success="successMessage = $event"
            @error="errorMessage = $event"
            @imported="fetchData"
          />
          <BaseButton variant="primary" :icon="UserPlus" @click="showAddModal = true">
            Enroll Student
          </BaseButton>
        </div>
      </div>

      <!-- Students List -->
      <div class="students-list">
        <SkeletonLoader
          v-if="isLoading && enrolledStudents.length === 0"
          type="rectangle"
          :height="400"
          style="border-radius: 12px;"
        />

        <table v-else class="data-table">
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Student</th>
              <th>Type</th>
              <th>Status</th>
              <th>Enrolled Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="enrolledStudents.length === 0">
              <td colspan="6" class="empty-state">
                No students enrolled in this section.
              </td>
            </tr>
            <tr v-for="student in filteredEnrolledStudents" :key="student.enrollmentId">
              <td class="text-left">
                {{ student.studentId }}
              </td>
              <td>
                <div class="student-info">
                  <span class="student-name">{{ student.studentLastname }}, {{ student.studentFirstname }}</span>
                </div>
              </td>
              <td>
                <span class="badge type">{{ student.enrollmentType || 'Regular' }}</span>
              </td>
              <td>
                <span class="badge status" :class="student.status?.toLowerCase()">
                  {{ student.status || 'Active' }}
                </span>
              </td>
              <td>{{ formatEnrollmentDate(student.enrolledAt || '') }}</td>
              <td>
                <div class="row-actions">
                  <button
                    v-if="student.status !== 'Dropped' && student.enrollmentId"
                    class="btn-icon danger"
                    title="Drop Student"
                    @click="handleDrop(student.enrollmentId)"
                  >
                    <Trash2 :size="16" />
                  </button>
                  <button
                    v-else-if="student.enrollmentId"
                    class="btn-icon success"
                    title="Re-enroll Student"
                    @click="handleReenroll(student.enrollmentId)"
                  >
                    <RefreshCw :size="16" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add Enrollment Modal -->
    <AddEnrollmentModal
      v-if="showAddModal && section"
      :section="section"
      @close="showAddModal = false"
      @success="handleEnrollmentSuccess"
      @error="handleEnrollmentError"
    />
  </div>
</template>

<style scoped>
.section-enrollments-view {
  min-height: 100vh;
  background: var(--color-slate-100);
  padding: 1rem;
  position: relative;
}

.section-enrollments-view::before {
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

.loading-skeleton {
  position: relative;
  z-index: 1;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.skeleton-header {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.skeleton-table {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  text-align: center;
  color: var(--text-secondary);
  max-width: 600px;
  margin: 2rem auto;
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

.page-title-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0 0 0.25rem 0;
}

.page-subtitle {
  font-size: 0.9rem;
  color: var(--color-gray-500);
  margin: 0;
  opacity: 0.9;
}

/* Alerts */
.alert {
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
  background: white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.alert.error {
  background: var(--color-error-bg);
  color: var(--color-error-darkest);
  border: 1px solid var(--color-error-light);
}

.alert.success {
  background: var(--color-success-bg);
  color: rgb(22, 101, 52);
  border: 1px solid var(--color-success-light);
}

.btn-icon-small {
  background: none;
  border: none;
  padding: 0;
  margin-left: auto;
  cursor: pointer;
  opacity: 0.6;
}

/* Actions Bar */
.actions-bar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.actions-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.search-wrapper {
  position: relative;
  width: 100%;
  max-width: 400px;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-gray-400);
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.75rem;
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  font-size: 0.95rem;
  background: white;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Table */
.students-list {
  border: 1px solid var(--color-gray-200);
  border-radius: 12px;
  overflow: hidden;
  background: white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.data-table th {
  background: var(--color-slate-100);
  padding: 1rem;
  text-align: center;
  font-weight: 600;
  color: var(--color-gray-600);
  border-bottom: 1px solid var(--color-gray-200);
}

.data-table td {
  padding: 1rem;
  border-bottom: 1px solid var(--color-gray-200);
  vertical-align: middle;
  text-align: center;
}

.data-table td.text-left {
  text-align: left;
}

.student-info {
  display: flex;
  flex-direction: column;
}

.student-name {
  font-weight: 600;
  color: var(--color-gray-800);
}

.student-id {
  font-size: 0.8rem;
  color: var(--color-gray-500);
}

.badge {
  padding: 0.25rem 0.625rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge.type {
  background: var(--color-info-bg);
  color: var(--color-primary-light);
}

.badge.status {
  background: var(--color-gray-100);
  color: var(--color-gray-700);
}

.badge.status.active {
  background: var(--color-success-bg);
  color: rgb(22, 101, 52);
}

.badge.status.dropped {
  background: var(--color-error-lighter);
  color: var(--color-error-darkest);
}

.row-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  padding: 0.375rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-icon.danger {
  background: var(--color-error-lighter);
  color: var(--color-error-dark);
}

.btn-icon.danger:hover {
  background: var(--color-error-light);
}

.btn-icon.success {
  background: var(--color-success-bg);
  color: rgb(22, 101, 52);
}

.btn-icon.success:hover {
  background: var(--color-success-light);
}

.empty-state {
  text-align: center;
  color: var(--color-gray-500);
  padding: 3rem !important;
}

/* Responsive Design */
@media (max-width: 768px) {
  .actions-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .search-wrapper {
    max-width: 100%;
  }

  .data-table {
    font-size: 0.85rem;
  }

  .data-table th,
  .data-table td {
    padding: 0.75rem 0.5rem;
  }
}

@media (max-width: 640px) {
  .students-list {
    overflow-x: auto;
  }

  .data-table {
    min-width: 600px;
    font-size: 0.8rem;
  }

  .data-table th,
  .data-table td {
    padding: 0.625rem 0.375rem;
  }
}
</style>
