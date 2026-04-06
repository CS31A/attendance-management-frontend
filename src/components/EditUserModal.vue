<script setup>
import { AlertTriangle, GraduationCap, Loader2, User, X } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'

const props = defineProps({
  user: { type: Object, required: true },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['update', 'cancel'])

// Form data
const email = ref('')
const firstName = ref('')
const lastName = ref('')
const password = ref('')
const confirmPassword = ref('')
const role = ref('')
const sectionId = ref('')
const errorMessage = ref('')
const passwordMismatchError = ref('')

// Load user data when component mounts
watch(() => props.user, (newUser) => {
  if (newUser) {
    email.value = newUser.email || ''
    firstName.value = newUser.firstName || newUser.firstname || ''
    lastName.value = newUser.lastName || newUser.lastname || ''
    password.value = ''
    confirmPassword.value = ''
    role.value = newUser.role || ''
    sectionId.value = newUser.sectionId || ''
  }
}, { immediate: true })

// Form validation
const isFormValid = computed(() => {
  if (!role.value)
    return false
  if (role.value === 'Student' && !String(sectionId.value || '').trim())
    return false

  // Password validation - optional but must match if provided
  if (password.value && confirmPassword.value && password.value !== confirmPassword.value) {
    return false
  }
  if ((password.value && !confirmPassword.value) || (!password.value && confirmPassword.value)) {
    return false
  }

  return true
})

// Watch for password changes to manage error message
watch([password, confirmPassword], () => {
  if (password.value && confirmPassword.value && password.value !== confirmPassword.value) {
    passwordMismatchError.value = 'Passwords do not match'
  }
  else if ((password.value && !confirmPassword.value) || (!password.value && confirmPassword.value)) {
    passwordMismatchError.value = 'Please fill both password fields or leave both empty'
  }
  else {
    passwordMismatchError.value = ''
  }
})

// Get role icon component
function getRoleIcon(role) {
  const icons = {
    Instructor: GraduationCap,
    Student: User,
  }
  return icons[role] || User
}

// Form submission
function updateUser() {
  errorMessage.value = ''

  if (!isFormValid.value) {
    errorMessage.value = 'Please check all required fields'
    return
  }

  const userData = {
    Username: email.value,
    Email: email.value,
    FirstName: firstName.value,
    LastName: lastName.value,
    SectionId: role.value === 'Student' ? String(sectionId.value || '').trim() : null,
  }

  // Only include password if provided
  if (password.value && confirmPassword.value) {
    userData.Password = password.value
    userData.RepeatedPassword = confirmPassword.value
  }

  emit('update', userData)
}

// Handle error from parent
function handleError(error) {
  errorMessage.value = error
}

// Expose methods to parent
defineExpose({ handleError })
</script>

<template>
  <div class="overlay">
    <div class="modal">
      <!-- Modal Header -->
      <div class="modal-header">
        <h2>Edit User</h2>
        <button type="button" class="btn-close" @click="$emit('cancel')">
          <X :size="24" />
        </button>
      </div>

      <!-- Error Message Display -->
      <div v-if="errorMessage" class="error-message">
        <div class="error-content">
          <AlertTriangle class="error-icon" :size="20" />
          <p>{{ errorMessage }}</p>
        </div>
      </div>

      <!-- Modal Body -->
      <form class="modal-body" @submit.prevent="updateUser">
        <!-- Email Field (Read-only) -->
        <div class="form-group">
          <label>Email *</label>
          <input
            v-model="email"
            type="email"
            placeholder="Enter email address"
            required
            disabled
          >
          <small class="helper-text info">Email cannot be changed</small>
        </div>

        <!-- First Name Field -->
        <div class="form-group">
          <label>First Name *</label>
          <input
            v-model="firstName"
            type="text"
            placeholder="Enter first name"
            required
          >
          <small class="helper-text info">User's first name</small>
        </div>

        <!-- Last Name Field -->
        <div class="form-group">
          <label>Last Name *</label>
          <input
            v-model="lastName"
            type="text"
            placeholder="Enter last name"
            required
          >
          <small class="helper-text info">User's last name</small>
        </div>

        <!-- Password Field (Optional) -->
        <div class="form-group">
          <label>Password (Optional)</label>
          <input
            v-model="password"
            type="password"
            placeholder="Leave empty to keep current password"
            minlength="6"
          >
          <small class="helper-text info">Leave empty to keep current password</small>
        </div>

        <!-- Confirm Password Field (Optional) -->
        <div class="form-group">
          <label>Confirm Password (Optional)</label>
          <input
            v-model="confirmPassword"
            type="password"
            placeholder="Leave empty to keep current password"
            minlength="6"
          >
          <small class="helper-text info">Leave empty to keep current password</small>
          <small v-if="passwordMismatchError" class="helper-text error">{{ passwordMismatchError }}</small>
        </div>

        <!-- Role Field (Read-only) -->
        <div class="form-group">
          <label>Role *</label>
          <div class="role-display">
            <div class="role-badge" :class="role.toLowerCase()">
              <component :is="getRoleIcon(role)" class="role-icon" :size="20" />
              <span class="role-name">{{ role }}</span>
            </div>
          </div>
          <small class="helper-text info">Role cannot be changed</small>
        </div>

        <!-- Section ID Field (for Students only) -->
        <div v-if="role === 'Student'" class="form-group">
          <label>Section *</label>
          <input
            v-model="sectionId"
            type="text"
            placeholder="Enter section (e.g., 3, 4, 5, CS101, MATH201...)"
            required
          >
          <small class="helper-text info">Required for students</small>
        </div>

        <!-- Actions -->
        <div class="actions">
          <button type="submit" class="btn-update" :disabled="!isFormValid || loading">
            <Loader2 v-if="loading" class="loading-spinner-btn" :size="18" />
            <span v-else>Update User</span>
          </button>
          <button type="button" class="btn-cancel" :disabled="loading" @click="$emit('cancel')">
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
/* Overlay */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 1.25rem 1.25rem 1.5rem;
  padding-top: 5.25rem;
}

/* Modal */
.modal {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 440px;
  width: 100%;
  max-height: calc(100vh - 6.5rem);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Modal Header */
.modal-header {
  background: linear-gradient(to right, var(--color-primary), var(--color-primary-light));
  padding: 0.875rem 1rem;
  border-radius: 0.75rem 0.75rem 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  color: white;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.btn-close {
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.375rem;
  transition: background-color 0.2s ease;
}

.btn-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.btn-close svg {
  width: 1.25rem;
  height: 1.25rem;
}

/* Modal Body */
.modal-body {
  padding: 1rem;
  overflow-y: auto;
}

/* Form Groups */
.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-gray-700);
  margin-bottom: 0.5rem;
}

.form-group input {
  display: block;
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid var(--color-gray-200);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group input:disabled {
  background-color: var(--color-gray-50);
  color: var(--color-gray-500);
  cursor: not-allowed;
}

/* Helper Text */
.helper-text {
  display: block;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.helper-text.info {
  color: var(--color-gray-500);
}

.helper-text.error {
  color: var(--color-error-dark);
}

/* Role Display Styles */
.role-display {
  display: flex;
  gap: 1rem;
}

.role-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  background: var(--color-slate-100);
  border: 2px solid var(--color-gray-200);
  color: var(--color-slate-500);
  font-weight: 500;
}

.role-badge.instructor {
  background: var(--color-info-bg);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.role-badge.student {
  background: var(--color-success-bg);
  border-color: var(--color-success);
  color: var(--color-success);
}

.role-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.role-name {
  font-weight: 600;
}

/* Actions */
.actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-gray-200);
}

.btn-update {
  flex: 1;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-update:hover:not(:disabled) {
  background-color: var(--color-secondary-light);
}

.btn-update:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-cancel {
  background-color: var(--color-gray-200);
  color: var(--color-gray-700);
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel:hover {
  background-color: var(--color-gray-300);
}

/* Error Message */
.error-message {
  background: var(--color-error-bg);
  border: 1px solid var(--color-error-light);
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 1rem 1.25rem 0;
}

.error-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.error-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--color-error-dark);
  flex-shrink: 0;
}

.error-content p {
  color: var(--color-error-dark);
  font-weight: 500;
  margin: 0;
  font-size: 0.875rem;
}

/* Desktop Responsive */
@media (min-width: 1024px) {
  .modal {
    max-width: 440px; /* stay slimmer on desktop */
  }
}

@media (min-width: 1280px) {
  .modal {
    max-width: 420px; /* extra slim on very large screens */
  }

  .modal-body {
    padding: 1.125rem;
  }

  .form-group {
    margin-bottom: 0.875rem;
  }
}

/* Tablet Responsive */
@media (max-width: 768px) {
  .overlay {
    padding: 0.75rem;
    padding-top: 4.5rem; /* smaller header height on tablet */
    align-items: center;
  }

  .modal {
    max-width: 100%;
    max-height: calc(100vh - 5rem);
    border-radius: 0.875rem;
  }

  .modal-header {
    padding: 0.75rem 1rem;
  }

  .modal-header h2 {
    font-size: 1.125rem;
  }

  .modal-body {
    padding: 0.875rem;
  }

  .form-group {
    margin-bottom: 0.75rem;
  }

  .form-group input {
    padding: 0.625rem 0.875rem;
    font-size: 0.9rem;
  }

  .actions {
    flex-direction: column-reverse;
    gap: 0.5rem;
  }

  .btn-update,
  .btn-cancel {
    width: 100%;
    padding: 0.75rem 1.25rem;
  }
}

/* Mobile Responsive */
@media (max-width: 640px) {
  .overlay {
    padding: 0.5rem;
    padding-top: 4rem; /* header ~56px */
    align-items: flex-end;
  }

  .modal {
    max-width: 100%;
    max-height: calc(100vh - 4.5rem);
    border-radius: 0.875rem 0.875rem 0 0;
  }

  .modal-header {
    border-radius: 1rem 1rem 0 0;
    padding: 0.875rem 1rem;
  }

  .modal-header h2 {
    font-size: 1rem;
  }

  .btn-close svg {
    width: 1rem;
    height: 1rem;
  }

  .modal-body {
    padding: 0.75rem;
  }

  .form-group {
    margin-bottom: 0.875rem;
  }

  .form-group label {
    font-size: 0.8rem;
    margin-bottom: 0.25rem;
  }

  .form-group input {
    padding: 0.625rem 0.875rem;
    font-size: 0.85rem;
  }

  .role-badge {
    padding: 0.5rem 0.75rem;
  }

  .role-icon {
    width: 1rem;
    height: 1rem;
  }

  .actions {
    flex-direction: column-reverse;
    gap: 0.5rem;
  }

  .btn-update,
  .btn-cancel {
    width: 100%;
    padding: 0.625rem 1rem;
  }

  .error-message {
    margin: 0.75rem 1rem 0;
    padding: 0.625rem;
  }

  .modal-header {
    padding: 0.625rem 0.875rem;
  }

  .modal-header h2 {
    font-size: 0.9rem;
  }

  .modal-body {
    padding: 0.75rem;
  }

  .form-group input {
    padding: 0.5rem 0.625rem;
    font-size: 0.75rem;
  }

  .actions {
    margin-top: 0.875rem;
  }

  .btn-update,
  .btn-cancel {
    padding: 0.5rem 0.875rem;
    font-size: 0.8rem;
  }
}

/* Small Mobile Responsive */
@media (max-width: 360px) {
  .overlay {
    padding: 0.25rem;
    padding-top: 3.5rem; /* header ~48px */
    align-items: flex-end;
  }

  .modal {
    max-width: 100%;
    max-height: calc(100vh - 3.75rem);
    border-radius: 0.75rem 0.75rem 0 0;
  }

  .modal-header {
    border-radius: 0.75rem 0.75rem 0 0;
    padding: 0.75rem 1rem;
  }

  .modal-header h2 {
    font-size: 0.95rem;
  }

  .modal-body {
    padding: 0.75rem;
    max-height: calc(100vh - 4.25rem);
  }

  .form-group {
    margin-bottom: 0.75rem;
  }

  .form-group label {
    font-size: 0.75rem;
    margin-bottom: 0.25rem;
  }

  .form-group input {
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
  }

  .role-badge {
    padding: 0.375rem 0.625rem;
  }

  .role-icon {
    width: 0.875rem;
    height: 0.875rem;
  }

  .actions {
    margin-top: 0.875rem;
  }

  .btn-update,
  .btn-cancel {
    padding: 0.5rem 0.875rem;
    font-size: 0.8rem;
  }

  .error-message {
    margin: 0.75rem 1rem 0;
    padding: 0.625rem;
  }

  .modal-header {
    padding: 0.625rem 0.875rem;
  }

  .modal-header h2 {
    font-size: 0.9rem;
  }

  .modal-body {
    padding: 0.75rem;
  }

  .form-group input {
    padding: 0.5rem 0.625rem;
    font-size: 0.75rem;
  }

  .btn-update,
  .btn-cancel {
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
  }
}
</style>
