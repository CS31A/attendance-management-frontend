<script setup>
import { AlertTriangle, Clock, Hash, QrCode, RefreshCw, X } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useQrCodeStore } from '@/stores/qrCodeStore'

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  sessionId: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['close', 'generated'])

const qrCodeStore = useQrCodeStore()
const loading = ref(false)
const error = ref('')

// Form data
const expirationMinutes = ref(30)
const maxUsage = ref('')
const uniqueHash = ref('')

// Generate random hash function
function generateHash() {
  const timestamp = Date.now().toString(36)
  const randomStr = Math.random().toString(36).substring(2, 15)
  const randomStr2 = Math.random().toString(36).substring(2, 15)
  uniqueHash.value = `${timestamp}-${randomStr}${randomStr2}`
}

// Initialize hash on component mount
generateHash()

// Validation
const isValid = computed(() => {
  return expirationMinutes.value > 0 && (!maxUsage.value || maxUsage.value > 0)
})

const expirationOptions = [
  { value: 15, label: '15 Minutes' },
  { value: 30, label: '30 Minutes (Default)' },
  { value: 45, label: '45 Minutes' },
  { value: 60, label: '1 Hour' },
  { value: 90, label: '1.5 Hours' },
  { value: 120, label: '2 Hours' },
  { value: 240, label: '4 Hours' },
]

function resetForm() {
  expirationMinutes.value = 30
  maxUsage.value = ''
  error.value = ''
  generateHash()
}

function handleClose() {
  resetForm()
  emit('close')
}

async function handleSubmit() {
  if (!isValid.value)
    return

  loading.value = true
  error.value = ''

  try {
    const payload = {
      sessionId: props.sessionId,
      expirationMinutes: expirationMinutes.value,
      // Convert empty string to null, otherwise number
      maxUsage: maxUsage.value === '' ? null : Number(maxUsage.value),
      uniqueHash: uniqueHash.value,
    }

    const result = await qrCodeStore.generateQrCode(payload)
    emit('generated', result)
    handleClose()
  }
  catch (err) {
    console.error('QR Generation error:', err)
    error.value = err.response?.data?.message || err.message || 'Failed to generate QR code'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div v-if="show" class="overlay" role="dialog" aria-modal="true" aria-labelledby="generate-qr-title" @click.self="handleClose">
    <div class="modal">
      <!-- Header -->
      <div class="modal-header">
        <div class="header-content">
          <QrCode class="header-icon" :size="24" aria-hidden="true" />
          <h2 id="generate-qr-title">
            Generate QR Code
          </h2>
        </div>
        <button type="button" class="btn-close" aria-label="Close modal" @click="handleClose">
          <X :size="24" />
        </button>
      </div>

      <!-- Error -->
      <div v-if="error" class="error-message">
        <div class="error-content">
          <AlertTriangle class="error-icon" :size="20" />
          <p>{{ error }}</p>
        </div>
      </div>

      <!-- Body -->
      <form class="modal-body" @submit.prevent="handleSubmit">
        <p class="description">
          Generate a QR code for students to scan. They can use their mobile app to record attendance.
        </p>

        <!-- Expiration Field -->
        <div class="form-group">
          <label>
            Expiration Time
            <span class="required">*</span>
          </label>
          <div class="input-wrapper">
            <Clock class="input-icon" :size="18" />
            <select v-model="expirationMinutes" required :disabled="loading">
              <option v-for="opt in expirationOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
          <small class="helper-text info">How long the QR code remains valid.</small>
        </div>

        <!-- Max Usage Field -->
        <div class="form-group">
          <label>
            Max Usage Limit
            <span class="optional">(Optional)</span>
          </label>
          <div class="input-wrapper">
            <Hash class="input-icon" :size="18" />
            <input
              v-model="maxUsage"
              type="number"
              min="1"
              placeholder="Unlimited"
              :disabled="loading"
            >
          </div>
          <small class="helper-text info">Limit the total number of scans allowed.</small>
        </div>

        <!-- Unique Hash Field -->
        <div class="form-group">
          <label>
            Unique Identifier Hash
            <span class="required">*</span>
          </label>
          <div class="input-wrapper-with-button">
            <div class="input-wrapper">
              <Hash class="input-icon" :size="18" />
              <input
                v-model="uniqueHash"
                type="text"
                readonly
                :disabled="loading"
                class="hash-input"
              >
            </div>
            <button
              type="button"
              class="btn-regenerate"
              :disabled="loading"
              aria-label="Regenerate hash"
              @click="generateHash"
            >
              <RefreshCw :size="18" />
            </button>
          </div>
          <small class="helper-text info">Client-side signature identifier for this QR code.</small>
        </div>

        <!-- Actions -->
        <div class="actions">
          <button type="submit" class="btn-submit" :disabled="!isValid || loading">
            <span v-if="loading" class="spinner" />
            {{ loading ? 'Generating...' : 'Generate QR Code' }}
          </button>
          <button type="button" class="btn-cancel" :disabled="loading" @click="handleClose">
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
  max-width: 420px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;
  overflow: hidden;
}

.modal-header {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  padding: 1.25rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: white;
}

.modal-header h2 {
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
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  padding: 1.5rem;
}

.description {
  color: var(--color-gray-600);
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
  line-height: 1.5;
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

.required {
  color: var(--color-error);
  margin-left: 0.25rem;
}

.optional {
  color: var(--color-gray-500);
  font-weight: 400;
  font-size: 0.8rem;
  margin-left: 0.25rem;
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
  padding: 0.75rem 1rem 0.75rem 2.5rem;
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

.form-group input:disabled,
.form-group select:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.helper-text {
  display: block;
  margin-top: 0.375rem;
  font-size: 0.75rem;
  color: var(--color-gray-500);
}

.input-wrapper-with-button {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.input-wrapper-with-button .input-wrapper {
  flex: 1;
}

.hash-input {
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  background-color: var(--color-gray-100) !important;
  cursor: default;
}

.btn-regenerate {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(30, 58, 138, 0.2);
}

.btn-regenerate:hover:not(:disabled) {
  transform: rotate(180deg);
  box-shadow: 0 4px 6px rgba(30, 58, 138, 0.3);
}

.btn-regenerate:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
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

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
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
@media (max-width: 1200px) {
  .modal {
    max-width: 90%;
  }
}

@media (max-width: 900px) {
  .modal {
    max-width: 95%;
    margin: 1rem;
  }

  .modal-header h2 {
    font-size: 1.25rem;
  }

  .actions {
    gap: 0.75rem;
  }
}

@media (max-width: 640px) {
  .modal {
    max-width: 100%;
    margin: 0.75rem;
    max-height: 85vh;
  }

  .modal-header h2 {
    font-size: 1.125rem;
  }

  .actions {
    flex-direction: column-reverse;
  }

  .btn-submit, .btn-cancel {
    width: 100%;
  }
}
</style>
