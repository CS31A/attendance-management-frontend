<script setup lang="ts">
import type { SessionResponseDto } from '@/api/sessions'
import { AlertTriangle, Trash2, X } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { getSessionDisplayName } from '@/api/sessions'
import { formatLongWeekdayDate as formatDate } from '@/utils/date'

const props = defineProps<{
  session: SessionResponseDto
  isDeleting?: boolean
}>()

const emit = defineEmits<{
  cancel: []
  confirm: [reason: string]
}>()

// State
const reason = ref('')

// Computed
const isValid = computed(() => {
  const trimmed = reason.value.trim()
  return trimmed.length >= 5 && trimmed.length <= 500
})

const characterCount = computed(() => reason.value.trim().length)

// Methods
function handleConfirm() {
  if (!isValid.value || props.isDeleting)
    return

  emit('confirm', reason.value.trim())
}

function handleCancel() {
  if (props.isDeleting)
    return
  emit('cancel')
}
</script>

<template>
  <div class="overlay">
    <div class="modal">
      <!-- Modal Header -->
      <div class="modal-header">
        <div class="header-icon-wrapper">
          <Trash2 class="header-icon" :size="24" />
        </div>
        <h2>Cancel Session</h2>
        <button type="button" class="btn-close" :disabled="isDeleting" @click="handleCancel">
          <X :size="24" />
        </button>
      </div>

      <!-- Session Info Display -->
      <div class="session-info">
        <div class="info-row">
          <span class="info-label">Course:</span>
          <span class="info-value">{{ getSessionDisplayName(session) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Date:</span>
          <span class="info-value">{{ formatDate(session?.sessionDate) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Section:</span>
          <span class="info-value">{{ session?.sectionName || 'N/A' }}</span>
        </div>
      </div>

      <!-- Modal Body -->
      <form class="modal-body" @submit.prevent="handleConfirm">
        <!-- Reason Input -->
        <div class="form-group">
          <label for="cancel-reason">
            Cancellation Reason <span class="required">*</span>
          </label>
          <textarea
            id="cancel-reason"
            v-model="reason"
            placeholder="Enter the reason for cancelling this session (required, 5-500 characters)"
            rows="4"
            :disabled="isDeleting"
            :class="{ 'has-error': reason.length > 0 && !isValid }"
          />
          <small class="helper-text" :class="{ error: reason.length > 0 && !isValid, info: reason.length === 0 || isValid }">
            {{ characterCount }}/500 characters (minimum 5)
          </small>
        </div>

        <!-- Confirmation Notice -->
        <div class="confirmation-notice">
          <div class="notice-icon">
            <AlertTriangle :size="20" />
          </div>
          <div class="notice-content">
            <p class="notice-title">
              Confirm Session Cancellation
            </p>
            <p class="notice-text">
              Cancelling this session will permanently remove it from the schedule.
              This action cannot be undone. Only sessions that have not started can be cancelled.
            </p>
          </div>
        </div>

        <!-- Actions -->
        <div class="actions">
          <button
            type="button"
            class="btn-cancel"
            :disabled="isDeleting"
            @click="handleCancel"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="btn-confirm"
            :disabled="!isValid || isDeleting"
          >
            <span v-if="isDeleting" class="spinner" />
            <span v-else>Confirm Cancellation</span>
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
  z-index: var(--z-modal);
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
  padding: 1.25rem 1.5rem 0.5rem;
  border-bottom: 1px solid var(--color-gray-200);
  gap: 0.75rem;
}

.header-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%);
  flex-shrink: 0;
}

.header-icon {
  color: var(--color-error);
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-gray-800);
  margin: 0;
  flex: 1;
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
  color: var(--color-gray-500);
  cursor: pointer;
}

.btn-close:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Session Info */
.session-info {
  padding: 1rem 1.5rem;
  background: var(--color-gray-50);
  border-bottom: 1px solid var(--color-gray-200);
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-gray-500);
}

.info-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-gray-800);
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
  color: var(--color-gray-700);
  margin-bottom: 0.5rem;
}

.required {
  color: var(--color-error);
}

.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-gray-300);
  border-radius: 8px;
  font-size: 0.875rem;
  color: var(--color-gray-800);
  font-family: inherit;
  resize: vertical;
  transition: all 0.2s;
}

.form-group textarea:focus {
  outline: none;
  border-color: var(--color-secondary);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.form-group textarea.has-error {
  border-color: var(--color-error);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.form-group textarea:disabled {
  background: var(--color-gray-100);
  cursor: not-allowed;
}

.helper-text {
  display: block;
  font-size: 0.813rem;
  margin-top: 0.375rem;
}

.helper-text.info {
  color: var(--color-gray-500);
}

.helper-text.error {
  color: var(--color-error);
}

/* Confirmation Notice */
.confirmation-notice {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--color-warning-bg);
  border: 1px solid var(--color-warning-light);
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.notice-icon {
  flex-shrink: 0;
  color: var(--color-warning);
}

.notice-content {
  flex: 1;
}

.notice-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin: 0 0 0.25rem 0;
}

.notice-text {
  font-size: 0.813rem;
  color: var(--color-warning);
  margin: 0;
  line-height: 1.5;
}

/* Actions */
.actions {
  display: flex;
  gap: 0.75rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-gray-200);
}

.btn-confirm,
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
  flex: 1;
}

.btn-confirm {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
}

.btn-confirm:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.4);
}

.btn-confirm:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.btn-cancel {
  background: white;
  color: var(--color-gray-700);
  border: 1px solid var(--color-gray-300);
}

.btn-cancel:hover:not(:disabled) {
  background: var(--color-gray-50);
}

.btn-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Responsive */
@media (max-width: 1200px) {
  .modal {
    max-width: 90%;
  }
}

@media (max-width: 900px) {
  .modal {
    max-width: 95%;
  }

  .modal-header h2 {
    font-size: 1.125rem;
  }

  .session-info,
  .modal-body {
    padding: 1.25rem;
  }

  .actions {
    flex-direction: column;
  }

  .btn-confirm,
  .btn-cancel {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .modal {
    max-width: 100%;
    margin: 0.75rem;
  }

  .modal-header {
    padding: 1rem 1.25rem 0.5rem;
  }

  .modal-header h2 {
    font-size: 1rem;
  }

  .session-info,
  .modal-body {
    padding: 1rem;
  }

  .info-row {
    flex-direction: column;
    gap: 0.25rem;
    margin-bottom: 0.75rem;
  }

  .info-label,
  .info-value {
    font-size: 0.813rem;
  }
}
</style>
