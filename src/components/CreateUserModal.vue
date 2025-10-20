<template>
  <div class="overlay">
    <div class="modal">
      <!-- Modal Header -->
      <div class="modal-header">
        <h2>{{ modalTitle }}</h2>
        <button type="button" class="btn-close" @click="$emit('cancel')">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Error Message Display -->
      <div v-if="errorMessage" class="error-message">
        <div class="error-content">
          <svg class="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p>{{ errorMessage }}</p>
        </div>
      </div>

      <!-- Modal Body -->
      <form @submit.prevent="createUser" class="modal-body">
        <!-- Email Field -->
        <div class="form-group">
          <label>Email *</label>
          <input 
            v-model="email" 
            type="email"
            placeholder="Enter email address" 
            required 
            :disabled="isEditMode"
          />
          <small class="helper-text info">Email address for login</small>
        </div>

        <!-- First Name Field -->
        <div class="form-group">
          <label>First Name *</label>
          <input 
            v-model="firstName" 
            type="text"
            placeholder="Enter first name" 
            required 
          />
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
          />
          <small class="helper-text info">User's last name</small>
        </div>

        <!-- Password Field -->
        <div class="form-group">
          <label>Password {{ isEditMode ? '(Optional)' : '*' }}</label>
          <input 
            v-model="password" 
            type="password"
            :placeholder="isEditMode ? 'Leave empty to keep current password' : 'Enter password'" 
            :required="!isEditMode"
            minlength="6"
          />
          <small class="helper-text info">
            {{ isEditMode ? 'Leave empty to keep current password' : 'Must be at least 6 characters' }}
          </small>
        </div>

        <!-- Confirm Password Field -->
        <div class="form-group">
          <label>Confirm Password {{ isEditMode ? '(Optional)' : '*' }}</label>
          <input 
            v-model="confirmPassword" 
            type="password"
            :placeholder="isEditMode ? 'Leave empty to keep current password' : 'Confirm password'" 
            :required="!isEditMode"
            minlength="6"
          />
          <small class="helper-text info">
            {{ isEditMode ? 'Leave empty to keep current password' : 'Must match the password above' }}
          </small>
          <small v-if="passwordMismatchError" class="helper-text error">{{ passwordMismatchError }}</small>
        </div>

        <!-- Role Field -->
        <div class="form-group">
          <label>Role *</label>
          <div class="role-selector" :class="{ 'disabled': isEditMode }">
            <div 
              @click="!isEditMode && (role = 'Instructor')"
              class="role-option"
              :class="{ 
                'role-selected': role === 'Instructor',
                'disabled': isEditMode
              }"
            >
              <svg class="role-icon" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
              </svg>
              <span class="role-name">Instructor</span>
            </div>
            <div 
              @click="!isEditMode && (role = 'Student')"
              class="role-option"
              :class="{ 
                'role-selected': role === 'Student',
                'disabled': isEditMode
              }"
            >
              <svg class="role-icon" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"/>
              </svg>
              <span class="role-name">Student</span>
            </div>
          </div>
          <small class="helper-text" v-if="!role">Please select a role</small>
          <small class="helper-text info" v-if="isEditMode">Role cannot be changed when editing</small>
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
          />
          <small class="helper-text info">Required for students (enter any valid section)</small>
        </div>

        <!-- Actions -->
        <div class="actions">
          <button type="submit" class="btn-create" :disabled="!isFormValid">
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

<script setup>
import { ref, computed, watch } from "vue";

const props = defineProps({
  user: { type: Object, default: null },
  mode: { type: String, default: 'create' }
});

const emit = defineEmits(["create", "update", "cancel"]);

// Form data
const email = ref("");
const firstName = ref("");
const lastName = ref("");
const password = ref("");
const confirmPassword = ref("");
const role = ref("");
const sectionId = ref("");
const errorMessage = ref("");
const passwordMismatchError = ref("");

// Computed properties
const isEditMode = computed(() => props.mode === 'edit');
const modalTitle = computed(() => isEditMode.value ? 'Edit User' : 'Create User');
const submitButtonText = computed(() => isEditMode.value ? 'Update User' : 'Create Account');

const isFormValid = computed(() => {
  console.log('Form validation check:', {
    role: role.value,
    sectionId: sectionId.value,
    password: password.value,
    confirmPassword: confirmPassword.value,
    passwordsMatch: password.value === confirmPassword.value,
    isEditMode: isEditMode.value
  });
  
  // Reset error message
  passwordMismatchError.value = '';

  if (!role.value) return false;
  if (role.value === 'Student' && !sectionId.value?.trim()) return false;

  // In edit mode, password is optional - only validate if provided
  if (isEditMode.value) {
    // If password is provided, it must match confirmation
    if (password.value && confirmPassword.value && password.value !== confirmPassword.value) {
      passwordMismatchError.value = 'Passwords do not match';
      return false;
    }
    // If only one password field is filled, it's invalid
    if ((password.value && !confirmPassword.value) || (!password.value && confirmPassword.value)) {
      passwordMismatchError.value = 'Please fill both password fields or leave both empty';
      return false;
    }
  } else {
    // In create mode, password is required
    if (password.value !== confirmPassword.value) {
      if (password.value && confirmPassword.value) {
        passwordMismatchError.value = 'Passwords do not match';
      }
      return false;
    }
  }
  return true;
});

// Watch for password changes to clear error
watch([password, confirmPassword], () => {
  if (password.value === confirmPassword.value) {
    passwordMismatchError.value = '';
  }
});

// Watch for user changes in edit mode
watch(() => props.user, (newUser) => {
  if (newUser && isEditMode.value) {
    console.log('Loading user data for edit:', newUser);
    email.value = newUser.email || '';
    firstName.value = newUser.firstName || newUser.firstname || '';
    lastName.value = newUser.lastName || newUser.lastname || '';
    password.value = '';
    confirmPassword.value = '';
    role.value = newUser.role || '';
    sectionId.value = newUser.sectionId || '';
  }
}, { immediate: true });

// Main form submission
const createUser = () => {
  errorMessage.value = "";
  
  // Validation
  if (!role.value) {
    errorMessage.value = "Please select a role";
    return;
  }
  
  // Password validation - different rules for edit vs create
  if (isEditMode.value) {
    // In edit mode, password is optional but must match if provided
    if (password.value && confirmPassword.value && password.value !== confirmPassword.value) {
      errorMessage.value = "Passwords do not match";
      return;
    }
    if ((password.value && !confirmPassword.value) || (!password.value && confirmPassword.value)) {
      errorMessage.value = "Please fill both password fields or leave both empty";
      return;
    }
  } else {
    // In create mode, password is required
    if (password.value !== confirmPassword.value) {
      errorMessage.value = "Passwords do not match";
      return;
    }
  }
  
  if (role.value === 'Student') {
    if (!sectionId.value?.trim()) {
      errorMessage.value = "Please enter a section for students";
      return;
    }
  }
  
  // Prepare data according to Scalar API documentation
  const userData = {
    Username: email.value,
    Email: email.value,
    FirstName: firstName.value,
    LastName: lastName.value,
    // Don't include Role in edit mode - role cannot be changed
    ...(isEditMode.value ? {} : { Role: role.value }),
    SectionId: role.value === "Student" ? sectionId.value.trim() : null,
  };
  
  // Only include password fields if provided (for edit mode) or required (for create mode)
  if (password.value && confirmPassword.value) {
    userData.Password = password.value;
    userData.RepeatedPassword = confirmPassword.value;
  }
  
  console.log('Sending userData to backend:', userData);
  console.log('Edit mode:', isEditMode.value);
  
  // Emit the appropriate event
  if (isEditMode.value) {
    emit("update", userData);
  } else {
    emit("create", userData);
  }
  
  // Clear form only for create mode
  if (!isEditMode.value) {
    email.value = "";
    firstName.value = "";
    lastName.value = "";
    password.value = "";
    confirmPassword.value = "";
    role.value = "";
    sectionId.value = "";
  }
};

// Handle error from parent
const handleError = (error) => {
  errorMessage.value = error;
};

// Expose methods to parent
defineExpose({ handleError });
</script>

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
  background: linear-gradient(to right, #1e3a8a, #1e40af);
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
  transition: background-color 0.2s;
}

.btn-close:hover {
  background: rgba(255, 255, 255, 0.2);
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
  color: #374151;
  margin-bottom: 0.375rem;
}

.form-group input {
  display: block;
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  outline: none;
  transition: all 0.2s;
}

.form-group input:focus {
  border-color: #1e3a8a;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group input:disabled {
  background-color: #f9fafb;
  color: #6b7280;
  cursor: not-allowed;
}

.section-select {
  display: block;
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  outline: none;
  transition: all 0.2s;
  background-color: white;
  cursor: pointer;
}

.section-select:focus {
  border-color: #1e3a8a;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.helper-text {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: #ef4444;
}

.helper-text.info {
  color: #6b7280;
}

.helper-text.error {
  color: #ef4444;
  font-size: 0.75rem;
  margin-top: 0.25rem;
  font-weight: 500;
}

.role-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.role-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem; 
  padding: 1rem 0.75rem; 
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem; 
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
}

.role-option:hover {
  border-color: #1e3a8a;
  background: #f8f9ff;
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
  background: #f8fafc;
  border-color: #e5e7eb;
  transform: none;
}

.role-selected {
  border-color: #1e3a8a;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15); /* Reduced shadow */
}

.role-icon {
  width: 2rem; 
  height: 2rem;
  color: #1e3a8a;
}

.role-name {
  font-size: 0.875rem; 
  font-weight: 600;
  color: #374151;
}

.actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.25rem; 
}

.btn-create {
  flex: 1;
  background-color: #1e3a8a;
  color: white;
  border: none;
  padding: 0.625rem 1.25rem; 
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-create:hover:not(:disabled) {
  background-color: #5568d3;
}

.btn-create:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-cancel {
  background-color: #e5e7eb;
  color: #374151;
  border: none;
  padding: 0.625rem 1.25rem; 
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem; 
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-cancel:hover {
  background-color: #d1d5db;
}

.error-message {
  background: #fef2f2;
  border: 1px solid #fecaca;
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
  color: #ef4444;
  flex-shrink: 0;
}

.error-content p {
  margin: 0;
  color: #dc2626;
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
    grid-template-columns: 1fr;
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