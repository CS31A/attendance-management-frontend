<script setup lang="ts">
import type { SectionDto } from '@/api/sections'
import type { EntityId } from '@/types'
import { Loader2, X } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { useEnrollmentStore } from '@/stores/enrollmentStore'
import { useSubjectStore } from '@/stores/subjectStore'
import { useUserStore } from '@/stores/userStore'

const props = defineProps<{
  section: SectionDto
}>()

const emit = defineEmits<{
  close: []
  success: []
  error: [message: string]
}>()

const enrollmentStore = useEnrollmentStore()
const subjectStore = useSubjectStore()
const userStore = useUserStore()

// State
const selectedStudentId = ref<EntityId | ''>('')
const subjectId = ref<EntityId | ''>('')
const enrollmentType = ref('Regular')
const academicYear = ref(new Date().getFullYear().toString())
const semester = ref('1st')
const loadingStudents = ref(false)
const loadingSubjects = ref(false)

// Computed
const availableStudents = computed(() => userStore.students)
const availableSubjects = computed(() => subjectStore.sortedSubjects)
const isLoading = computed(() =>
  enrollmentStore.isLoading
  || subjectStore.loading
  || loadingStudents.value
  || loadingSubjects.value,
)

// Methods
async function loadDropdownData() {
  try {
    loadingStudents.value = true
    loadingSubjects.value = true
    await Promise.all([
      userStore.fetchUsers(),
      subjectStore.fetchSubjects(),
    ])

    const dropdownErrors = [userStore.error, subjectStore.error].filter(
      message => typeof message === 'string' && message.trim().length > 0,
    )
    if (dropdownErrors.length > 0) {
      emit('error', dropdownErrors.join(' '))
    }
  }
  catch {
    emit('error', 'Failed to load dropdown data')
  }
  finally {
    loadingStudents.value = false
    loadingSubjects.value = false
  }
}

async function handleEnroll() {
  if (!selectedStudentId.value) {
    emit('error', 'Please select a student')
    return
  }

  if (!subjectId.value) {
    emit('error', 'Please select a subject')
    return
  }

  try {
    await enrollmentStore.enrollStudent({
      studentId: selectedStudentId.value as EntityId,
      sectionId: props.section.id,
      subjectId: subjectId.value as EntityId,
      enrollmentType: enrollmentType.value,
      academicYear: academicYear.value,
      semester: semester.value,
    })
    emit('success')
    resetForm()
  }
  catch (error: unknown) {
    emit('error', (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to enroll student')
  }
}

function resetForm() {
  selectedStudentId.value = ''
  subjectId.value = ''
  enrollmentType.value = 'Regular'
  academicYear.value = new Date().getFullYear().toString()
  semester.value = '1st'
}

function handleClose() {
  resetForm()
  emit('close')
}

// Watch for modal open to lazy-load dropdown data
watch(() => props.section.id, () => {
  void loadDropdownData()
}, { immediate: true })
</script>

<template>
  <div class="overlay">
    <div class="modal">
      <!-- Header -->
      <div class="modal-header">
        <h2>Enroll Student</h2>
        <button class="btn-close" @click="handleClose">
          <X :size="20" />
        </button>
      </div>

      <!-- Body -->
      <div class="modal-body">
        <div class="form-grid">
          <div class="form-group">
            <label>Student *</label>
            <select v-model="selectedStudentId" class="form-select" :disabled="isLoading">
              <option value="" disabled>
                Select Student
              </option>
              <option v-for="student in availableStudents" :key="student.userId || student.id" :value="student.userId || student.id">
                {{ student.lastName }}, {{ student.firstName }} ({{ student.userId || student.id }})
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Subject *</label>
            <select v-model="subjectId" class="form-select" :disabled="isLoading">
              <option value="" disabled>
                Select Subject
              </option>
              <option v-for="subject in availableSubjects" :key="subject.id" :value="subject.id">
                {{ subject.name || `Subject ${subject.id}` }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Type</label>
            <select v-model="enrollmentType" class="form-select" :disabled="isLoading">
              <option value="Regular">
                Regular
              </option>
              <option value="Irregular">
                Irregular
              </option>
              <option value="Retake">
                Retake
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Year</label>
            <input v-model="academicYear" type="text" class="form-input" placeholder="e.g. 2023-2024" :disabled="isLoading">
          </div>

          <div class="form-group">
            <label>Semester</label>
            <select v-model="semester" class="form-select" :disabled="isLoading">
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
          <button class="btn-cancel" @click="handleClose">
            Cancel
          </button>
          <button class="btn-submit" :disabled="isLoading" @click="handleEnroll">
            <Loader2 v-if="isLoading" class="loading-spinner" :size="16" />
            <span v-else>Enroll Student</span>
          </button>
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
  max-width: 500px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: slideUp 0.3s ease-out;
}

.modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-gray-200);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  color: white;
  border-radius: 16px 16px 0 0;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}

.btn-close {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  padding: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
}

.modal-body {
  padding: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
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
  padding: 0.625rem;
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.form-select:focus,
.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-select:disabled,
.form-input:disabled {
  background: var(--color-gray-100);
  cursor: not-allowed;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn-cancel {
  background: white;
  color: var(--color-gray-700);
  border: 1px solid var(--color-gray-200);
  padding: 0.625rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: var(--color-gray-50);
}

.btn-submit {
  background: rgb(22, 101, 52);
  color: white;
  border: none;
  padding: 0.625rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn-submit:hover:not(:disabled) {
  background: rgb(20, 83, 45);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 640px) {
  .modal {
    max-width: 95vw;
    border-radius: 12px;
  }

  .modal-header {
    padding: 1rem;
    border-radius: 12px 12px 0 0;
  }

  .modal-header h2 {
    font-size: 1.1rem;
  }

  .modal-body {
    padding: 1rem;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-cancel,
  .btn-submit {
    width: 100%;
  }
}
</style>
