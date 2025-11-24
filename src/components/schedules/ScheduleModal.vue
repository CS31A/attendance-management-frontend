<script setup>
import { AlertTriangle, BookOpen, Calendar, Clock, DoorOpen, GraduationCap, User, X } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { getClassrooms } from '@/api/classrooms'
import { getAllInstructors } from '@/api/instructors'
import sectionsApi from '@/api/sections'
import subjectApi from '@/api/subjects'

const props = defineProps({
  schedule: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['save', 'cancel'])

// Form data
const timeIn = ref('')
const timeOut = ref('')
const dayOfWeek = ref('')
const subjectId = ref('')
const classroomId = ref('')
const sectionId = ref('')
const instructorId = ref('')
const errorMessage = ref('')

// Dropdown data
const subjects = ref([])
const classrooms = ref([])
const sections = ref([])
const instructors = ref([])
const loadingDropdowns = ref(false)

const daysOfWeek = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

// Initialize form if editing
watch(() => props.schedule, (newSchedule) => {
  if (newSchedule) {
    timeIn.value = newSchedule.timeIn || ''
    timeOut.value = newSchedule.timeOut || ''
    dayOfWeek.value = newSchedule.dayOfWeek || ''
    subjectId.value = newSchedule.subjectId || newSchedule.subject?.id || ''
    classroomId.value = newSchedule.classroomId || newSchedule.classroom?.id || ''
    sectionId.value = newSchedule.sectionId || newSchedule.section?.id || ''
    instructorId.value = newSchedule.instructorId || newSchedule.instructor?.id || ''
  }
  else {
    resetForm()
  }
}, { immediate: true })

function resetForm() {
  timeIn.value = ''
  timeOut.value = ''
  dayOfWeek.value = ''
  subjectId.value = ''
  classroomId.value = ''
  sectionId.value = ''
  instructorId.value = ''
  errorMessage.value = ''
}

// Computed properties
const isEditMode = computed(() => !!props.schedule)
const modalTitle = computed(() => isEditMode.value ? 'Edit Schedule' : 'Create Schedule')
const submitButtonText = computed(() => isEditMode.value ? 'Save Changes' : 'Create Schedule')

const isFormValid = computed(() => {
  return (
    timeIn.value
    && timeOut.value
    && dayOfWeek.value
    && subjectId.value
    && classroomId.value
    && sectionId.value
    && instructorId.value
  )
})

// Load dropdown data
async function loadDropdownData() {
  loadingDropdowns.value = true
  try {
    const [subjectsRes, classroomsData, sectionsRes, instructorsData] = await Promise.all([
      subjectApi.getAllSubjects(),
      getClassrooms(),
      sectionsApi.getAllSections(),
      getAllInstructors(),
    ])
    subjects.value = subjectsRes.data || subjectsRes
    classrooms.value = classroomsData
    sections.value = sectionsRes.data || sectionsRes
    instructors.value = instructorsData
  }
  catch (error) {
    console.error('Error loading dropdown data:', error)
    errorMessage.value = 'Failed to load form data. Please try again.'
  }
  finally {
    loadingDropdowns.value = false
  }
}

// Main form submission
function handleSubmit() {
  errorMessage.value = ''

  // Validation
  if (!timeIn.value) {
    errorMessage.value = 'Time In is required'
    return
  }
  if (!timeOut.value) {
    errorMessage.value = 'Time Out is required'
    return
  }
  if (timeIn.value >= timeOut.value) {
    errorMessage.value = 'Time Out must be after Time In'
    return
  }
  if (!dayOfWeek.value) {
    errorMessage.value = 'Day of Week is required'
    return
  }
  if (!subjectId.value) {
    errorMessage.value = 'Subject is required'
    return
  }
  if (!classroomId.value) {
    errorMessage.value = 'Classroom is required'
    return
  }
  if (!sectionId.value) {
    errorMessage.value = 'Section is required'
    return
  }
  if (!instructorId.value) {
    errorMessage.value = 'Instructor is required'
    return
  }

  const scheduleData = {
    timeIn: timeIn.value,
    timeOut: timeOut.value,
    dayOfWeek: dayOfWeek.value,
    subjectId: Number(subjectId.value),
    classroomId: Number(classroomId.value),
    sectionId: Number(sectionId.value),
    instructorId: Number(instructorId.value),
  }

  emit('save', scheduleData)
}

// Handle error from parent
function handleError(error) {
  errorMessage.value = error
}

// Expose methods to parent
defineExpose({ handleError })

onMounted(() => {
  loadDropdownData()
})
</script>

<template>
  <div class="overlay">
    <div class="modal">
      <!-- Modal Header -->
      <div class="modal-header">
        <h2>{{ modalTitle }}</h2>
        <button type="button" class="btn-close" @click="$emit('cancel')">
          <X size="24" />
        </button>
      </div>

      <!-- Error Message Display -->
      <div v-if="errorMessage" class="error-message">
        <div class="error-content">
          <AlertTriangle class="error-icon" size="20" />
          <p>{{ errorMessage }}</p>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loadingDropdowns" class="loading-state">
        <div class="spinner" />
        <p>Loading form data...</p>
      </div>

      <!-- Modal Body -->
      <form v-else class="modal-body" @submit.prevent="handleSubmit">
        <!-- Time Fields Row -->
        <div class="form-row">
          <!-- Time In Field -->
          <div class="form-group">
            <label>Time In *</label>
            <div class="input-wrapper">
              <Clock class="input-icon" size="18" />
              <input
                v-model="timeIn"
                type="time"
                required
              >
            </div>
          </div>

          <!-- Time Out Field -->
          <div class="form-group">
            <label>Time Out *</label>
            <div class="input-wrapper">
              <Clock class="input-icon" size="18" />
              <input
                v-model="timeOut"
                type="time"
                required
              >
            </div>
          </div>
        </div>

        <!-- Day of Week Field -->
        <div class="form-group">
          <label>Day of Week *</label>
          <div class="input-wrapper">
            <Calendar class="input-icon" size="18" />
            <select v-model="dayOfWeek" required>
              <option value="" disabled>
                Select a day
              </option>
              <option v-for="day in daysOfWeek" :key="day" :value="day">
                {{ day }}
              </option>
            </select>
          </div>
        </div>

        <!-- Subject Field -->
        <div class="form-group">
          <label>Subject *</label>
          <div class="input-wrapper">
            <BookOpen class="input-icon" size="18" />
            <select v-model="subjectId" required>
              <option value="" disabled>
                Select a subject
              </option>
              <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
                {{ subject.name }} ({{ subject.code }})
              </option>
            </select>
          </div>
        </div>

        <!-- Classroom Field -->
        <div class="form-group">
          <label>Classroom *</label>
          <div class="input-wrapper">
            <DoorOpen class="input-icon" size="18" />
            <select v-model="classroomId" required>
              <option value="" disabled>
                Select a classroom
              </option>
              <option v-for="classroom in classrooms" :key="classroom.id" :value="classroom.id">
                {{ classroom.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- Section Field -->
        <div class="form-group">
          <label>Section *</label>
          <div class="input-wrapper">
            <GraduationCap class="input-icon" size="18" />
            <select v-model="sectionId" required>
              <option value="" disabled>
                Select a section
              </option>
              <option v-for="section in sections" :key="section.id" :value="section.id">
                {{ section.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- Instructor Field -->
        <div class="form-group">
          <label>Instructor *</label>
          <div class="input-wrapper">
            <User class="input-icon" size="18" />
            <select v-model="instructorId" required>
              <option value="" disabled>
                Select an instructor
              </option>
              <option v-for="instructor in instructors" :key="instructor.id" :value="instructor.id">
                {{ instructor.firstName }} {{ instructor.lastName }}
              </option>
            </select>
          </div>
        </div>

        <!-- Actions -->
        <div class="actions">
          <button type="submit" class="btn-submit" :disabled="!isFormValid">
            {{ submitButtonText }}
          </button>
          <button type="button" class="btn-cancel" @click="$emit('cancel')">
            Cancel
          </button>
        </div>
      </form>
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
  z-index: 9999;
  padding: 1rem;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.2s ease-out;
}

.modal {
  background: white;
  border-radius: 1rem;
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;
}

.modal-header {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  padding: 1.25rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 1;
}

.modal-header h2 {
  color: white;
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.btn-close {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: rotate(90deg);
}

.modal-body {
  padding: 1.5rem;
}

.loading-state {
  padding: 3rem 1.5rem;
  text-align: center;
  color: var(--color-gray-500);
}

.loading-state .spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-slate-200);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-gray-700);
  margin-bottom: 0.5rem;
}

.input-wrapper {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-gray-400);
  pointer-events: none;
}

.form-group input,
.form-group select {
  display: block;
  width: 100%;
  padding: 0.75rem 1rem;
  padding-left: 2.5rem;
  border: 1px solid var(--color-gray-200);
  border-radius: 0.5rem;
  font-size: 0.95rem;
  outline: none;
  transition: all 0.2s;
  background-color: var(--color-gray-50);
}

.form-group input:focus,
.form-group select:focus {
  border-color: var(--color-primary);
  background-color: white;
  box-shadow: 0 0 0 4px rgba(30, 58, 138, 0.1);
}

.actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.btn-submit {
  flex: 1;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 6px -1px rgba(30, 58, 138, 0.2);
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 8px -1px rgba(30, 58, 138, 0.3);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-cancel {
  background-color: white;
  color: var(--color-gray-600);
  border: 1px solid var(--color-gray-200);
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background-color: var(--color-gray-100);
  border-color: var(--color-gray-300);
  color: var(--color-gray-800);
}

.error-message {
  background: var(--color-error-bg);
  border-left: 4px solid var(--color-error);
  padding: 1rem;
  margin: 0;
}

.error-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.error-icon {
  color: var(--color-error);
  flex-shrink: 0;
}

.error-content p {
  margin: 0;
  color: var(--color-error-darker);
  font-size: 0.875rem;
  font-weight: 500;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 640px) {
  .modal {
    max-width: 100%;
    margin: 1rem;
    max-height: 85vh;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .actions {
    flex-direction: column-reverse;
  }

  .btn-submit, .btn-cancel {
    width: 100%;
  }
}
</style>
