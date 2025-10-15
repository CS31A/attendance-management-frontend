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
          <label>Password *</label>
          <input 
            v-model="password" 
            type="password"
            placeholder="Enter password" 
            required 
            minlength="6"
          />
          <small class="helper-text info">Must be at least 6 characters</small>
        </div>

        <!-- Confirm Password Field -->
        <div class="form-group">
          <label>Confirm Password *</label>
          <input 
            v-model="confirmPassword" 
            type="password"
            placeholder="Confirm password" 
            required 
            minlength="6"
          />
          <small class="helper-text info">Must match the password above</small>
        </div>

        <!-- Role Field -->
        <div class="form-group">
          <label>Role *</label>
          <div class="role-selector">
            <div 
              @click="role = 'Instructor'"
              class="role-option"
              :class="{ 'role-selected': role === 'Instructor' }"
            >
              <svg class="role-icon" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
              </svg>
              <span class="role-name">Instructor</span>
            </div>
            <div 
              @click="role = 'Student'"
              class="role-option"
              :class="{ 'role-selected': role === 'Student' }"
            >
              <svg class="role-icon" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"/>
              </svg>
              <span class="role-name">Student</span>
            </div>
          </div>
          <small class="helper-text" v-if="!role">Please select a role</small>
        </div>

        <!-- Section ID Field (for both Students and Instructors) -->
        <div v-if="role === 'Student' || role === 'Instructor'" class="form-group">
          <label>Section *</label>
          <select 
            v-model="sectionId" 
            required
            class="section-select"
          >
            <option value="">Select a section...</option>
            <option value="1">Section 1</option>
            <option value="2">Section 2</option>
            <option value="3">Section 3</option>
            <option value="4">Section 4</option>
            <option value="5">Section 5</option>
            <option value="CS101">CS101</option>
            <option value="MATH201">MATH201</option>
            <option value="ENG301">ENG301</option>
          </select>
          <small class="helper-text info">Required for {{ role.toLowerCase() }}s (select from existing sections)</small>
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
    passwordsMatch: password.value === confirmPassword.value
  });
  
  if (!role.value) return false;
  if ((role.value === 'Student' || role.value === 'Instructor') && !sectionId.value?.trim()) return false;
  if (password.value !== confirmPassword.value) return false;
  return true;
});

// Watch for user changes in edit mode
watch(() => props.user, (newUser) => {
  if (newUser && isEditMode.value) {
    email.value = newUser.email || '';
    firstName.value = newUser.firstName || '';
    lastName.value = newUser.lastName || '';
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
  
  if (password.value !== confirmPassword.value) {
    errorMessage.value = "Passwords do not match";
    return;
  }
  
  if (role.value === 'Student' || role.value === 'Instructor') {
    if (!sectionId.value?.trim()) {
      errorMessage.value = `Please enter a section for ${role.value.toLowerCase()}s`;
      return;
    }
  }
  
  // Prepare data according to Scalar API documentation
  const userData = {
    Username: email.value,
    Email: email.value,
    Password: password.value,
    RepeatedPassword: confirmPassword.value,
    FirstName: firstName.value,
    LastName: lastName.value,
    Role: role.value,
    SectionId: (role.value === "Student" || role.value === "Instructor") ? sectionId.value.trim() : null,
  };
  
  console.log('Sending userData to backend:', userData);
  
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
  border-color: #667eea;
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
  border-color: #667eea;
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
  border-color: #667eea;
  background: #f8f9ff;
  transform: translateY(-1px); 
}

.role-selected {
  border-color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15); /* Reduced shadow */
}

.role-icon {
  width: 2rem; 
  height: 2rem;
  color: #667eea;
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
  background-color: #667eea;
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

@media (max-width: 640px) {
  .overlay {
    padding: 0;
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
  }

  .role-selector {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .actions {
    flex-direction: column-reverse;
  }

  .btn-create,
  .btn-cancel {
    width: 100%;
  }
}
</style>