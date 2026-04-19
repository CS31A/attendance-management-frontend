<script setup>
import { AlertTriangle, Check, Loader2, RefreshCw, Search, Trash2, UserPlus, X } from 'lucide-vue-next'
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import BulkDataActions from '@/components/common/BulkDataActions.vue'
import { LOCALE } from '@/utils/constants'
import { useEnrollmentStore } from '@/stores/enrollmentStore'
import { useUserStore } from '@/stores/userStore'
import { parseUtcDate } from '@/utils/qrcode'

const props = defineProps({
  section: {
    type: Object,
    required: true,
  },
})

defineEmits(['close'])

const LoadingSpinner = defineAsyncComponent(() => import('@/components/common/LoadingSpinner.vue'))

const enrollmentStore = useEnrollmentStore()
const userStore = useUserStore()

// State
const showAddForm = ref(false)
const searchQuery = ref('')
const selectedStudentId = ref('')
const subjectId = ref('') // In a real app, this might come from the section or a subject store
const enrollmentType = ref('Regular')
const academicYear = ref(new Date().getFullYear().toString())
const semester = ref('1st')

// Form validation
const errorMessage = ref('')
const successMessage = ref('')

// Computed
const enrolledStudents = computed(() => enrollmentStore.getSectionStudents)
const availableStudents = computed(() => userStore.students)
const isLoading = computed(() => enrollmentStore.isLoading || userStore.loading)

function asSearchableString(value) {
  if (typeof value === 'string')
    return value.toLowerCase()
  if (typeof value === 'number')
    return String(value).toLowerCase()
  return ''
}

function formatEnrollmentDate(value) {
  const parsed = parseUtcDate(value)
  return parsed ? parsed.toLocaleDateString(LOCALE.DEFAULT) : '-'
}

const filteredEnrolledStudents = computed(() => {
  if (!searchQuery.value)
    return enrolledStudents.value
  const query = searchQuery.value.toLowerCase()
  return enrolledStudents.value.filter(s =>
    asSearchableString(s.firstName).includes(query)
    || asSearchableString(s.lastName).includes(query)
    || asSearchableString(s.studentId).includes(query),
  )
})

// Methods
async function loadData() {
  try {
    await Promise.all([
      enrollmentStore.fetchSectionStudents(props.section.id),
      userStore.fetchUsers(),
    ])
  }
  catch {
    errorMessage.value = 'Failed to load data'
  }
}

async function handleEnroll() {
  if (!selectedStudentId.value) {
    errorMessage.value = 'Please select a student'
    return
  }

  try {
    errorMessage.value = ''
    await enrollmentStore.enrollStudent({
      studentId: selectedStudentId.value,
      sectionId: props.section.id,
      subjectId: Number(subjectId.value),
      enrollmentType: enrollmentType.value,
      academicYear: academicYear.value,
      semester: semester.value,
    })
    successMessage.value = 'Student enrolled successfully'
    showAddForm.value = false
    resetForm()
    await enrollmentStore.fetchSectionStudents(props.section.id)
  }
  catch (error) {
    errorMessage.value = error.response?.data?.message || 'Failed to enroll student'
  }
}

async function handleDrop(enrollmentId) {
  if (!confirm('Are you sure you want to drop this student?'))
    return

  try {
    await enrollmentStore.dropStudent(enrollmentId, props.section.id)
    successMessage.value = 'Student dropped successfully'
  }
  catch (error) {
    errorMessage.value = error.response?.data?.message || 'Failed to drop student'
  }
}

async function handleReenroll(enrollmentId) {
  try {
    await enrollmentStore.reenrollStudent(enrollmentId, props.section.id)
    successMessage.value = 'Student re-enrolled successfully'
  }
  catch (error) {
    errorMessage.value = error.response?.data?.message || 'Failed to re-enroll student'
  }
}

function resetForm() {
  selectedStudentId.value = ''
  enrollmentType.value = 'Regular'
  // Keep year/semester as they likely don't change often
}

// Watchers
watch(() => props.section, () => {
  loadData()
}, { immediate: true })
</script>

<template>
  <div class="overlay">
    <div class="modal">
      <!-- Header -->
      <div class="modal-header">
        <div>
          <h2>Manage Enrollments</h2>
          <p class="subtitle">
            {{ section.name }}
          </p>
        </div>
        <button class="btn-close" @click="$emit('close')">
          <X :size="24" />
        </button>
      </div>

      <!-- Body -->
      <div class="modal-body">
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
              :title="`${section.name} Enrollments`"
              :export-params="{ sectionName: section.name }"
              :import-params="{ sectionName: section.name }"
              @success="successMessage = $event"
              @error="errorMessage = $event"
              @imported="loadData"
            />
            <button class="btn-primary" @click="showAddForm = !showAddForm">
              <UserPlus :size="18" />
              <span>{{ showAddForm ? 'Cancel Enrollment' : 'Enroll Student' }}</span>
            </button>
          </div>
        </div>

        <!-- Add Enrollment Form -->
        <div v-if="showAddForm" class="add-form">
          <h3>New Enrollment</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Student</label>
              <select v-model="selectedStudentId" class="form-select">
                <option value="" disabled>
                  Select Student
                </option>
                <option v-for="student in availableStudents" :key="student.id" :value="student.id">
                  {{ student.lastName }}, {{ student.firstName }} ({{ student.studentId }})
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>Subject ID</label>
              <input v-model="subjectId" type="number" class="form-input" placeholder="Subject ID">
            </div>

            <div class="form-group">
              <label>Type</label>
              <select v-model="enrollmentType" class="form-select">
                <option value="Regular">
                  Regular
                </option>
                <option value="Irregular">
                  Irregular
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>Year</label>
              <input v-model="academicYear" type="text" class="form-input" placeholder="e.g. 2023-2024">
            </div>

            <div class="form-group">
              <label>Semester</label>
              <select v-model="semester" class="form-select">
                <option value="1st">
                  1st
                </option>
                <option value="2nd">
                  2nd
                </option>
                <option value="Summer">
                  Summer
                </option>
              </select>
            </div>
          </div>
          <div class="form-actions">
            <button class="btn-submit" :disabled="isLoading" @click="handleEnroll">
              <Loader2 v-if="isLoading" class="loading-spinner-btn" :size="18" />
              <span v-else>Enroll Student</span>
            </button>
          </div>
        </div>

        <!-- Students List -->
        <div class="students-list">
          <LoadingSpinner
            v-if="isLoading && !enrolledStudents.length"
            type="inline"
            message="Loading students..."
            size="medium"
          />

          <table v-else class="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Type</th>
                <th>Status</th>
                <th>Enrolled Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="enrolledStudents.length === 0">
                <td colspan="5" class="empty-state">
                  No students enrolled in this section.
                </td>
              </tr>
              <tr v-for="student in filteredEnrolledStudents" :key="student.enrollmentId">
                <td>
                  <div class="student-info">
                    <span class="student-name">{{ student.lastName }}, {{ student.firstName }}</span>
                    <span class="student-id">{{ student.studentId }}</span>
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
                <td>{{ formatEnrollmentDate(student.enrollmentDate) }}</td>
                <td>
                  <div class="row-actions">
                    <button
                      v-if="student.status !== 'Dropped'"
                      class="btn-icon danger"
                      title="Drop Student"
                      @click="handleDrop(student.enrollmentId)"
                    >
                      <Trash2 :size="16" />
                    </button>
                    <button
                      v-else
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
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1200;
  backdrop-filter: blur(4px);
  padding: 1rem;
}

.modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: slideUp 0.3s ease-out;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-gray-200);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  color: white;
  border-radius: 16px 16px 0 0;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.subtitle {
  margin: 0.25rem 0 0;
  opacity: 0.9;
  font-size: 0.9rem;
}

.btn-close {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  padding: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
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
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.actions-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.search-wrapper {
  position: relative;
  flex: 1;
  max-width: 300px;
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
  padding: 0.625rem 1rem 0.625rem 2.5rem;
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  font-size: 0.9rem;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 0.625rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: var(--color-primary-light);
}

/* Add Form */
.add-form {
  background: var(--color-slate-100);
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  border: 1px solid var(--color-slate-200);
}

.add-form h3 {
  margin: 0 0 1rem;
  font-size: 1.1rem;
  color: var(--color-primary);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-gray-600);
  margin-bottom: 0.375rem;
}

.form-select,
.form-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--color-gray-200);
  border-radius: 6px;
  font-size: 0.9rem;
}

.btn-submit {
  background: rgb(22, 101, 52);
  color: white;
  border: none;
  padding: 0.625rem 1.5rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

/* Table */
.students-list {
  border: 1px solid var(--color-gray-200);
  border-radius: 12px;
  overflow: hidden;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.data-table th {
  background: var(--color-slate-100);
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: var(--color-gray-600);
  border-bottom: 1px solid var(--color-gray-200);
}

.data-table td {
  padding: 1rem;
  border-bottom: 1px solid var(--color-gray-200);
  vertical-align: middle;
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

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Responsive Design */
@media (max-width: 768px) {
  .overlay {
    padding: 0.5rem;
  }

  .modal {
    max-height: 95vh;
    border-radius: 12px;
  }

  .modal-header {
    padding: 1.25rem;
  }

  .modal-header h2 {
    font-size: 1.25rem;
  }

  .modal-body {
    padding: 1.25rem;
  }

  .actions-bar {
    flex-direction: column;
    gap: 0.75rem;
  }

  .search-wrapper {
    max-width: 100%;
  }

  .btn-primary {
    width: 100%;
    justify-content: center;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .data-table {
    font-size: 0.85rem;
  }

  .data-table th,
  .data-table td {
    padding: 0.75rem 0.5rem;
  }

  .student-info {
    gap: 0.25rem;
  }

  .student-name {
    font-size: 0.9rem;
  }

  .student-id {
    font-size: 0.75rem;
  }

  .badge {
    font-size: 0.7rem;
    padding: 0.2rem 0.5rem;
  }
}

@media (max-width: 640px) {
  .overlay {
    padding: 0.25rem;
  }

  .modal {
    max-height: 98vh;
    border-radius: 8px;
  }

  .modal-header {
    padding: 1rem;
    border-radius: 8px 8px 0 0;
  }

  .modal-header h2 {
    font-size: 1.1rem;
  }

  .subtitle {
    font-size: 0.85rem;
  }

  .btn-close {
    padding: 0.375rem;
  }

  .modal-body {
    padding: 1rem;
  }

  .alert {
    padding: 0.75rem;
    font-size: 0.85rem;
    gap: 0.5rem;
  }

  .add-form {
    padding: 1rem;
  }

  .add-form h3 {
    font-size: 1rem;
  }

  .form-grid {
    gap: 0.75rem;
  }

  .btn-submit {
    width: 100%;
    padding: 0.75rem;
  }

  /* Make table horizontally scrollable */
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

@media (max-width: 480px) {
  .overlay {
    padding: 0;
    align-items: flex-start;
  }

  .modal {
    max-height: 100vh;
    height: 100vh;
    border-radius: 0;
  }

  .modal-header {
    padding: 0.875rem;
    border-radius: 0;
  }

  .modal-header h2 {
    font-size: 1rem;
  }

  .subtitle {
    font-size: 0.8rem;
  }

  .btn-close {
    padding: 0.25rem;
  }

  .btn-close svg {
    width: 20px;
    height: 20px;
  }

  .modal-body {
    padding: 0.875rem;
  }

  .search-input {
    padding: 0.5rem 0.75rem 0.5rem 2.25rem;
    font-size: 0.85rem;
  }

  .btn-primary {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }

  .btn-primary svg {
    width: 16px;
    height: 16px;
  }

  .add-form {
    padding: 0.875rem;
  }

  .add-form h3 {
    font-size: 0.95rem;
  }

  .form-group label {
    font-size: 0.8rem;
  }

  .form-select,
  .form-input {
    padding: 0.375rem 0.5rem;
    font-size: 0.85rem;
  }

  .data-table {
    min-width: 550px;
    font-size: 0.75rem;
  }

  .data-table th,
  .data-table td {
    padding: 0.5rem 0.25rem;
  }

  .student-name {
    font-size: 0.85rem;
  }

  .student-id {
    font-size: 0.7rem;
  }

  .badge {
    font-size: 0.65rem;
    padding: 0.15rem 0.4rem;
  }

  .btn-icon {
    padding: 0.25rem;
  }

  .btn-icon svg {
    width: 14px;
    height: 14px;
  }
}
</style>
