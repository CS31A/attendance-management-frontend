<script setup lang="ts">
import type { EntityId } from '@/types'
import { AlertTriangle, Eye, EyeOff, GraduationCap, Loader2, Shield, User, X } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/authStore'

type UiRole = 'Admin' | 'Instructor' | 'Student'

defineProps<{
  loading?: boolean
}>()

const emit = defineEmits<{
  create: [userData: {
    Username: string
    Email: string
    Password: string
    RepeatedPassword: string
    FirstName: string
    LastName: string
    Role: UiRole
    SectionId?: string
  }]
  cancel: []
}>()

// Get auth store to determine role restrictions
const authStore = useAuthStore()

// Computed property to determine available roles based on current user's role
const availableRoles = computed<UiRole[]>(() => {
  if (authStore.isAdmin) {
    // Admins can create admins, instructors and students
    return ['Admin', 'Instructor', 'Student']
  }
  else if (authStore.isTeacher) {
    // Instructors can only create students
    return ['Student']
  }
  return []
})

// Form data
const username = ref('')
const email = ref('')
const firstName = ref('')
const lastName = ref('')
const password = ref('')
const confirmPassword = ref('')
const role = ref<UiRole | ''>('')
const sectionId = ref<EntityId | ''>('')
const errorMessage = ref('')
const passwordMismatchError = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)

// Computed properties
const modalTitle = computed(() => 'Create User')
const submitButtonText = computed(() => 'Create Account')

const isFormValid = computed(() => {
  if (!username.value?.trim() || !role.value || !availableRoles.value.includes(role.value))
    return false
  if (role.value === 'Student' && !String(sectionId.value || '').trim())
    return false

  // In create mode, password is required
  if (password.value !== confirmPassword.value) {
    return false
  }
  return true
})

// Watch for password changes to manage error message
watch([password, confirmPassword], () => {
  if (password.value === confirmPassword.value) {
    passwordMismatchError.value = ''
  }
  else if (password.value && confirmPassword.value) {
    passwordMismatchError.value = 'Passwords do not match'
  }
}, { immediate: true })

// Watch for changes in available roles to set default role
watch(availableRoles, (newAvailableRoles) => {
  // If the currently selected role is not available, reset it
  if (role.value && !newAvailableRoles.includes(role.value as UiRole)) {
    role.value = ''
  }

  // If only student role is available, default to student
  if (newAvailableRoles.length === 1 && newAvailableRoles[0] === 'Student') {
    role.value = 'Student'
  }
}, { immediate: true })

// Main form submission
function createUser() {
  errorMessage.value = ''

  // Validation
  if (!role.value) {
    errorMessage.value = 'Please select a role'
    return
  }

  // Validate that selected role is available to current user
  if (!availableRoles.value.includes(role.value as UiRole)) {
    errorMessage.value = 'You don\'t have permission to create this role'
    return
  }

  // Validate username
  if (!username.value?.trim()) {
    errorMessage.value = 'Please enter a username'
    return
  }

  // Password validation - required in create mode
  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match'
    return
  }

  if (role.value === 'Student') {
    if (!String(sectionId.value || '').trim()) {
      errorMessage.value = 'Please enter a section for students'
      return
    }
  }

  // Prepare data according to Scalar API documentation
  const userData = {
    Username: username.value,
    Email: email.value,
    Password: password.value,
    RepeatedPassword: confirmPassword.value,
    FirstName: firstName.value,
    LastName: lastName.value,
    Role: role.value as UiRole,
    SectionId: role.value === 'Student' ? String(sectionId.value || '').trim() : undefined,
  }

  // Emit the create event
  emit('create', userData)

  // Clear form after successful creation
  username.value = ''
  email.value = ''
  firstName.value = ''
  lastName.value = ''
  password.value = ''
  confirmPassword.value = ''
  role.value = ''
  sectionId.value = ''
}

// Handle error from parent
function handleError(error: string) {
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
        <h2>{{ modalTitle }}</h2>
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
      <form class="modal-body" @submit.prevent="createUser">
        <!-- Email Field -->
        <div class="form-group">
          <label>Email *</label>
          <input
            v-model="email"
            type="email"
            placeholder="Enter email address"
            required
          >
          <small class="helper-text info">Email address for login</small>
        </div>

        <!-- Username Field -->
        <div class="form-group">
          <label>Username *</label>
          <input
            v-model="username"
            type="text"
            placeholder="Enter username"
            required
          >
          <small class="helper-text info">Username for login</small>
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

        <!-- Password Field -->
        <div class="form-group">
          <label>Password *</label>
          <div class="password-input-wrapper">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Enter password"
              required
              minlength="6"
            >
            <button
              type="button"
              class="password-toggle"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              @click="showPassword = !showPassword"
            >
              <Eye v-if="!showPassword" :size="18" />
              <EyeOff v-else :size="18" />
            </button>
          </div>
          <small class="helper-text info">Must be at least 6 characters</small>
        </div>

        <!-- Confirm Password Field -->
        <div class="form-group">
          <label>Confirm Password *</label>
          <div class="password-input-wrapper">
            <input
              v-model="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="Confirm password"
              required
              minlength="6"
            >
            <button
              type="button"
              class="password-toggle"
              :aria-label="showConfirmPassword ? 'Hide password' : 'Show password'"
              @click="showConfirmPassword = !showConfirmPassword"
            >
              <Eye v-if="!showConfirmPassword" :size="18" />
              <EyeOff v-else :size="18" />
            </button>
          </div>
          <small class="helper-text info">Must match the password above</small>
          <small v-if="passwordMismatchError" class="helper-text error">{{ passwordMismatchError }}</small>
        </div>

        <!-- Role Field -->
        <div class="form-group">
          <label>Role *</label>
          <div class="role-selector">
            <div
              v-if="availableRoles.includes('Admin')"
              class="role-option"
              :class="{ 'role-selected': role === 'Admin' }"
              @click="role = 'Admin'"
            >
              <Shield class="role-icon" :size="32" />
              <span class="role-name">Admin</span>
            </div>
            <div
              v-if="availableRoles.includes('Instructor')"
              class="role-option"
              :class="{ 'role-selected': role === 'Instructor' }"
              @click="role = 'Instructor'"
            >
              <GraduationCap class="role-icon" :size="32" />
              <span class="role-name">Instructor</span>
            </div>
            <div
              v-if="availableRoles.includes('Student')"
              class="role-option"
              :class="{ 'role-selected': role === 'Student' }"
              @click="role = 'Student'"
            >
              <User class="role-icon" :size="32" />
              <span class="role-name">Student</span>
            </div>
          </div>
          <small v-if="!role" class="helper-text">Please select a role</small>
        </div>

        <!-- Section ID Field (for Students only) -->
        <div v-if="role === 'Student'" class="form-group">
          <label>Section *</label>
          <input
            v-model="sectionId"
            type="text"
            class="form-input"
            placeholder="Enter section (e.g., 3, 4, 5, CS101, MATH201...)"
            required
          >
          <small class="helper-text info">Required for students (enter any valid section)</small>
        </div>

        <!-- Actions -->
        <div class="actions">
          <button type="submit" class="btn-create" :disabled="!isFormValid || loading">
            <Loader2 v-if="loading" class="loading-spinner-btn" :size="18" />
            <span v-else>{{ submitButtonText }}</span>
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
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  padding: 1rem;
  overflow-y: auto;
}

.modal {
  background: white;
  border-radius: 0.75rem;
  width: 100%;
  max-width: 420px; /* Reduced from 550px */
  max-height: calc(100vh - 2rem);
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  margin: auto;
}

.modal-header {
  background: linear-gradient(to right, var(--color-primary), var(--color-primary-light));
  padding: 1rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 10;
}

.modal-header h2 {
  color: white;
  font-size: 1.25rem;
  font-weight: bold;
  margin: 0;
}

.btn-close {
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
}

.btn-close svg {
  width: 1.25rem;
  height: 1.25rem;
}

.modal-body {
  padding: 1.25rem;
  overflow-y: auto;
  flex: 1;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-gray-700);
  margin-bottom: 0.375rem;
}

.form-group input {
  display: block;
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--color-gray-300);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  outline: none;
  transition: all 0.2s;
}

.form-group input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group input:disabled {
  background-color: var(--color-gray-50);
  color: var(--color-gray-500);
  cursor: not-allowed;
}

.password-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input-wrapper input {
  padding-right: 2.5rem;
}

.password-toggle {
  position: absolute;
  right: 0.75rem;
  background: transparent;
  border: none;
  color: var(--color-gray-500);
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;
  transition: all 0.2s;
}

.password-toggle:hover {
  color: var(--color-primary);
  background: rgba(102, 126, 234, 0.1);
}

.password-toggle:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.section-select {
  display: block;
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--color-gray-300);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  outline: none;
  transition: all 0.2s;
  background-color: white;
  cursor: pointer;
}

.section-select:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.helper-text {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--color-error);
}

.helper-text.info {
  color: var(--color-gray-500);
}

.helper-text.error {
  color: var(--color-error);
  font-size: 0.75rem;
  margin-top: 0.25rem;
  font-weight: 500;
}

.role-selector {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.role-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 0.75rem;
  border: 2px solid var(--color-gray-200);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
}

.role-option:hover {
  border-color: var(--color-primary);
  background: var(--color-bg-secondary);
  transform: translateY(-1px);
}

.role-selector.disabled {
  opacity: 0.6;
  pointer-events: none;
}

.role-option.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.role-option.disabled:hover {
  background: var(--color-slate-100);
  border-color: var(--color-gray-200);
  transform: none;
}

.role-selected {
  border-color: var(--color-primary);
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15); /* Reduced shadow */
}

.role-icon {
  width: 2rem;
  height: 2rem;
  color: var(--color-primary);
}

.role-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-gray-700);
}

.actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.25rem;
}

.btn-create {
  flex: 1;
  background-color: var(--color-primary);
  color: white;
  border: none;
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-create:hover:not(:disabled) {
  background-color: var(--color-secondary-light);
}

.btn-create:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-cancel {
  background-color: var(--color-gray-200);
  color: var(--color-gray-700);
  border: none;
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-cancel:hover {
  background-color: var(--color-gray-300);
}

.error-message {
  background: var(--color-error-bg);
  border: 1px solid var(--color-error-light);
  border-radius: 0.5rem;
  padding: 0.75rem;
  margin: 1rem 1.25rem 0;
}

.error-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.error-icon {
  width: 1rem;
  height: 1rem;
  color: var(--color-error);
  flex-shrink: 0;
}

.error-content p {
  margin: 0;
  color: var(--color-error-dark);
  font-size: 0.875rem;
  font-weight: 500;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .modal {
    max-width: 500px;
  }
}

@media (max-width: 968px) {
  .modal {
    max-width: 450px;
  }

  .modal-body {
    padding: 1.5rem;
  }

  .form-group {
    margin-bottom: 1.25rem;
  }
}

@media (max-width: 768px) {
  .overlay {
    padding: 1rem;
    align-items: center;
  }

  .modal {
    max-width: 100%;
    max-height: 90vh;
    border-radius: 1rem;
    margin: 0;
  }

  .modal-header {
    padding: 1rem 1.25rem;
  }

  .modal-header h2 {
    font-size: 1.125rem;
  }

  .modal-body {
    padding: 1.25rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group input {
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
  }

  .role-selector {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }

  .role-option {
    padding: 0.875rem 0.75rem;
  }

  .actions {
    flex-direction: column-reverse;
    gap: 0.5rem;
  }

  .btn-create,
  .btn-cancel {
    width: 100%;
    padding: 0.75rem 1.25rem;
    font-size: 0.9rem;
  }
}

@media (max-width: 640px) {
  .overlay {
    padding: 0.5rem;
    align-items: flex-end;
  }

  .modal {
    max-width: 100%;
    max-height: 95vh;
    border-radius: 1rem 1rem 0 0;
    margin: 0;
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
    padding: 1rem;
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

  .helper-text {
    font-size: 0.7rem;
  }

  .role-selector {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .role-option {
    padding: 0.75rem 0.625rem;
    gap: 0.375rem;
  }

  .role-icon {
    width: 1.5rem;
    height: 1.5rem;
  }

  .role-name {
    font-size: 0.8rem;
  }

  .actions {
    flex-direction: column-reverse;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .btn-create,
  .btn-cancel {
    width: 100%;
    padding: 0.625rem 1rem;
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .overlay {
    padding: 0;
    align-items: flex-end;
  }

  .modal {
    max-width: 100%;
    max-height: 98vh;
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
    padding: 0.875rem;
    max-height: calc(98vh - 60px);
    overflow-y: auto;
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

  .helper-text {
    font-size: 0.65rem;
  }

  .role-option {
    padding: 0.625rem 0.5rem;
    gap: 0.25rem;
  }

  .role-icon {
    width: 1.25rem;
    height: 1.25rem;
  }

  .role-name {
    font-size: 0.75rem;
  }

  .actions {
    margin-top: 0.875rem;
  }

  .btn-create,
  .btn-cancel {
    padding: 0.5rem 0.875rem;
    font-size: 0.8rem;
  }

  .error-message {
    margin: 0.75rem 1rem 0;
    padding: 0.625rem;
  }

  .error-content p {
    font-size: 0.8rem;
  }
}

@media (max-width: 360px) {
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

  .role-option {
    padding: 0.5rem 0.375rem;
  }

  .role-icon {
    width: 1rem;
    height: 1rem;
  }

  .role-name {
    font-size: 0.7rem;
  }

  .btn-create,
  .btn-cancel {
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
  }
}
</style>
