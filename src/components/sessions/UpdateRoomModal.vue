<script setup>
import { AlertTriangle, Loader2, MapPin, X } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { getClassrooms } from '@/api/classrooms'

defineProps({
  session: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update', 'cancel'])

// State
const newRoomId = ref(null)
const errorMessage = ref('')
const classrooms = ref([])
const loadingClassrooms = ref(false)

// Computed
const isFormValid = computed(() => {
  return newRoomId.value !== null && classrooms.value.length > 0
})

// Methods
async function loadClassrooms() {
  loadingClassrooms.value = true
  errorMessage.value = ''

  try {
    classrooms.value = await getClassrooms()

    if (classrooms.value.length === 0) {
      errorMessage.value = 'No classrooms available. Please contact your administrator.'
    }
  }
  catch (error) {
    console.error('Failed to load classrooms:', error)
    errorMessage.value = error.response?.data?.message || 'Failed to load classrooms. Please try again.'
    classrooms.value = []
  }
  finally {
    loadingClassrooms.value = false
  }
}

function getCourseName(session) {
  if (!session)
    return 'N/A'
  return session.courseName || session.courseCode || 'Unknown Course'
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

function updateRoom() {
  errorMessage.value = ''

  if (!newRoomId.value) {
    errorMessage.value = 'Please select a new room'
    return
  }

  // Build payload - API expects actualRoomId
  const payload = {
    actualRoomId: newRoomId.value,
  }

  emit('update', payload)
}

// Lifecycle
onMounted(() => {
  loadClassrooms()
})
</script>

<template>
  <div class="overlay">
    <div class="modal">
      <!-- Modal Header -->
      <div class="modal-header">
        <h2>Change Session Room</h2>
        <button type="button" class="btn-close" @click="$emit('cancel')">
          <X size="24" />
        </button>
      </div>

      <!-- Session Info Display -->
      <div class="session-info">
        <div class="info-row">
          <span class="info-label">Course:</span>
          <span class="info-value">{{ getCourseName(session) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Date:</span>
          <span class="info-value">{{ formatDate(session?.sessionDate) }}</span>
        </div>
        <div class="info-row highlight">
          <span class="info-label">Current Room:</span>
          <span class="info-value current-room">
            {{ session?.actualRoomName || session?.scheduledRoom || 'TBD' }}
          </span>
        </div>
      </div>

      <!-- Error Message Display -->
      <div v-if="errorMessage" class="error-message">
        <div class="error-content">
          <AlertTriangle class="error-icon" size="20" />
          <p>{{ errorMessage }}</p>
        </div>
      </div>

      <!-- Loading State for Classrooms -->
      <div v-if="loadingClassrooms" class="loading-message">
        <Loader2 class="spinner" size="20" />
        <p>Loading classrooms...</p>
      </div>

      <!-- Modal Body -->
      <form class="modal-body" @submit.prevent="updateRoom">
        <!-- New Room Dropdown -->
        <div class="form-group">
          <label>New Room *</label>
          <select
            v-model="newRoomId"
            required
            :disabled="loadingClassrooms || !classrooms.length"
          >
            <option :value="null" disabled>
              Select a room
            </option>
            <option
              v-for="classroom in classrooms"
              :key="classroom.id"
              :value="classroom.id"
            >
              {{ classroom.name }}
              <template v-if="classroom.building">
                - {{ classroom.building }}
              </template>
            </option>
          </select>
          <small class="helper-text info">
            Select the new room for this active session
          </small>
          <small v-if="!loadingClassrooms && !classrooms.length" class="helper-text error">
            No classrooms available. Please contact your administrator.
          </small>
        </div>

        <!-- Update Notice -->
        <div class="update-notice">
          <div class="notice-icon">
            <MapPin size="20" />
          </div>
          <div class="notice-content">
            <p class="notice-title">
              Room Change
            </p>
            <p class="notice-text">
              The room location will be updated immediately. Students will see the new room information.
            </p>
          </div>
        </div>

        <!-- Actions -->
        <div class="actions">
          <button
            type="submit"
            class="btn-update"
            :disabled="!isFormValid || loadingClassrooms"
          >
            <MapPin size="18" />
            <span>Update Room</span>
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
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

/* Modal Header */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.btn-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #f3f4f6;
  color: #1f2937;
}

/* Session Info */
.session-info {
  padding: 1rem 1.5rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-row.highlight {
  padding: 0.5rem;
  background: #fef3c7;
  border-radius: 6px;
  margin-top: 0.5rem;
}

.info-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
}

.info-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
}

.current-room {
  color: #92400e;
}

/* Error Message */
.error-message {
  margin: 1rem 1.5rem 0;
  padding: 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
}

.error-content {
  display: flex;
  align-items: start;
  gap: 0.75rem;
}

.error-icon {
  color: #dc2626;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.error-content p {
  color: #991b1b;
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.5;
}

/* Loading Message */
.loading-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 1rem 1.5rem 0;
  padding: 1rem;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  color: #0369a1;
  font-size: 0.875rem;
}

.spinner {
  animation: spin 1s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-message p {
  margin: 0;
}

/* Modal Body */
.modal-body {
  padding: 1.5rem;
}

/* Form Group */
.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #1f2937;
  transition: all 0.2s;
}

.form-group select:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.form-group select:disabled {
  background: #f9fafb;
  color: #9ca3af;
  cursor: not-allowed;
}

.helper-text {
  display: block;
  font-size: 0.813rem;
  margin-top: 0.375rem;
}

.helper-text.info {
  color: #6b7280;
}

.helper-text.error {
  color: #dc2626;
}

/* Update Notice */
.update-notice {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.notice-icon {
  flex-shrink: 0;
  color: #2563eb;
}

.notice-content {
  flex: 1;
}

.notice-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e40af;
  margin: 0 0 0.25rem 0;
}

.notice-text {
  font-size: 0.813rem;
  color: #1e40af;
  margin: 0;
  line-height: 1.5;
}

/* Actions */
.actions {
  display: flex;
  gap: 0.75rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.btn-update,
.btn-cancel {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  flex: 1;
}

.btn-update {
  background: #2563eb;
  color: white;
}

.btn-update:hover:not(:disabled) {
  background: #1d4ed8;
}

.btn-update:disabled {
  background: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
}

.btn-cancel {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-cancel:hover {
  background: #f9fafb;
}
</style>
