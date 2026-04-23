<script setup lang="ts">
import { AlertTriangle, BookOpen, RefreshCw, Users } from 'lucide-vue-next'
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import Toast from '@/components/common/Toast.vue'
import { useToast } from '@/composables/useToast'
import { useInstructorStore } from '@/stores/instructorStore'
import { getErrorMessage } from '@/utils/httpError'

const SkeletonLoader = defineAsyncComponent(() => import('@/components/common/SkeletonLoader.vue'))

const instructorStore = useInstructorStore()

// State
const errorMessage = ref('')

// Computed properties
const sections = computed(() => instructorStore.sections)
const loading = computed(() => instructorStore.loading)
const instructorInfo = computed(() => instructorStore.instructorInfo)

// Toast state and helpers
const { toast, showToast, closeToast } = useToast()

// Methods
async function loadSections() {
  errorMessage.value = ''
  try {
    await instructorStore.fetchSectionsWithStudents()
  }
  catch (error) {
    console.error('Failed to load instructor sections:', error)
    const message = getErrorMessage(error, 'Failed to load your classes. Please try again.')
    showToast(message, 'error')
    errorMessage.value = message
  }
}

// Lifecycle
onMounted(() => {
  loadSections()
})
</script>

<template>
  <div class="instructor-classes-view">
    <!-- Header Section -->
    <div class="classes-header">
      <div class="header-content">
        <h1 class="page-title">
          My Classes
        </h1>
        <p v-if="instructorInfo" class="page-subtitle">
          Welcome, {{ instructorInfo.fullName }}
        </p>
        <p v-else class="page-subtitle">
          View your assigned sections and enrolled students
        </p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !sections.length" class="loading-skeleton">
      <SkeletonLoader type="rectangle" :height="60" style="margin-bottom: 1rem; width: 100%;" />
      <SkeletonLoader v-for="i in 3" :key="i" type="rectangle" :height="120" style="margin-bottom: 1rem; width: 100%;" />
    </div>

    <!-- Error State -->
    <div v-else-if="errorMessage" class="error-state">
      <AlertTriangle :size="48" class="error-icon" />
      <h3>Failed to Load Classes</h3>
      <p>{{ errorMessage }}</p>
      <button class="btn-retry" @click="loadSections">
        <RefreshCw :size="18" />
        <span>Retry</span>
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="!sections.length && !loading" class="empty-state">
      <BookOpen :size="64" class="empty-icon" />
      <h3>No Sections Assigned</h3>
      <p>You currently have no assigned sections. Please contact your administrator if you believe this is an error.</p>
    </div>

    <!-- Sections Content -->
    <div v-else class="sections-content">
      <div class="sections-summary">
        <div class="summary-card">
          <BookOpen :size="24" class="summary-icon" />
          <div class="summary-info">
            <span class="summary-label">Total Sections</span>
            <span class="summary-value">{{ instructorStore.totalSections }}</span>
          </div>
        </div>
        <div class="summary-card">
          <Users :size="24" class="summary-icon" />
          <div class="summary-info">
            <span class="summary-label">Total Students</span>
            <span class="summary-value">{{ instructorStore.totalStudents }}</span>
          </div>
        </div>
      </div>

      <div class="sections-list">
        <div v-for="section in sections" :key="section.SectionId" class="section-card">
          <div class="section-header">
            <div class="section-info">
              <h2 class="section-name">
                {{ section.SectionName }}
              </h2>
              <p class="course-name">
                {{ section.CourseName }}
              </p>
            </div>
          </div>

          <div class="subjects-list">
            <div v-for="subject in section.Subjects" :key="subject.SubjectId" class="subject-item">
              <div class="subject-header">
                <div class="subject-info">
                  <h3 class="subject-name">
                    {{ subject.SubjectName }}
                  </h3>
                  <span class="subject-code">{{ subject.SubjectCode }}</span>
                </div>
                <div class="schedule-info">
                  <span class="schedule-day">{{ subject.DayOfWeek }}</span>
                  <span class="schedule-time">{{ subject.TimeIn }} - {{ subject.TimeOut }}</span>
                  <span class="classroom-name">{{ subject.ClassroomName }}</span>
                </div>
              </div>

              <div v-if="subject.Students.length > 0" class="students-list">
                <div class="students-header">
                  <span class="students-count">{{ subject.Students.length }} Student{{ subject.Students.length !== 1 ? 's' : '' }}</span>
                </div>
                <div class="students-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Student ID</th>
                        <th>Name</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="student in subject.Students" :key="student.StudentId">
                        <td>{{ student.StudentId }}</td>
                        <td>{{ student.Firstname }} {{ student.Lastname }}</td>
                        <td>
                          <span
                            class="status-badge"
                            :class="student.IsRegular ? 'status-regular' : 'status-irregular'"
                          >
                            {{ student.IsRegular ? 'Regular' : 'Irregular' }}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div v-else class="no-students">
                <p>No students enrolled in this subject</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
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
.instructor-classes-view {
  padding: 1rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* Header Section */
.classes-header {
  margin-bottom: 1.5rem;
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

/* Loading State */
.loading-skeleton {
  padding: 1rem 0;
}

/* Error State */
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

/* Empty State */
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

/* Sections Content */
.sections-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Summary Cards */
.sections-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
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

/* Sections List */
.sections-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.section-header {
  padding: 1.5rem;
  background: var(--color-gray-50);
  border-bottom: 1px solid var(--color-gray-200);
}

.section-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.section-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-gray-900);
  margin: 0;
}

.course-name {
  font-size: 0.875rem;
  color: var(--color-gray-500);
  margin: 0;
}

/* Subjects List */
.subjects-list {
  display: flex;
  flex-direction: column;
}

.subject-item {
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-gray-200);
}

.subject-item:last-child {
  border-bottom: none;
}

.subject-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
}

.subject-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
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

/* Students List */
.students-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.students-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.students-count {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-gray-700);
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

.students-table tbody tr:hover {
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
  background: var(--color-success-light);
  color: var(--color-success);
}

.status-irregular {
  background: var(--color-warning-light);
  color: var(--color-warning);
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

/* Responsive Styles */
@media (max-width: 1024px) {
  .subject-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .schedule-info {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .instructor-classes-view {
    padding: 0.75rem;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .sections-summary {
    grid-template-columns: 1fr;
  }

  .section-header {
    padding: 1rem;
  }

  .subject-item {
    padding: 1rem;
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
  .instructor-classes-view {
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

  .section-name {
    font-size: 1.125rem;
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
