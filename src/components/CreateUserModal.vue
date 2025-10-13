<template>
  <div class="overlay">
    <div class="modal">
      <!-- Modal Header -->
      <div class="modal-header">
        <h2>Create User</h2>
        <button type="button" class="btn-close" @click="$emit('cancel')">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Modal Body -->
      <form @submit.prevent="createUser" class="modal-body">
        <div class="form-group">
          <label>Email</label>
          <input 
            v-model="email" 
            type="email"
            placeholder="Enter email address" 
            required 
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>First Name</label>
            <input 
              v-model="firstName" 
              type="text"
              placeholder="First name" 
              required 
            />
          </div>

          <div class="form-group">
            <label>Last Name</label>
            <input 
              v-model="lastName" 
              type="text"
              placeholder="Last name" 
              required 
            />
          </div>
        </div>

        <div class="form-group">
          <label>Password</label>
          <input 
            v-model="password" 
            type="password"
            placeholder="Enter password" 
            required 
            minlength="6"
          />
          <small class="helper-text info">Must be at least 6 characters</small>
        </div>

        <div class="form-group">
          <label>Role</label>
          <div class="role-selector">
            <div 
              @click="role = 'Teacher'"
              class="role-option"
              :class="{ 'role-selected': role === 'Teacher' }"
            >
              <svg class="role-icon" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
              </svg>
              <span class="role-name">Teacher</span>
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

        <div class="actions">
          <button type="submit" class="btn-create" :disabled="!role">
            Create Account
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
import { ref } from "vue";

const emit = defineEmits(["create", "cancel"]);

const email = ref("");
const firstName = ref("");
const lastName = ref("");
const password = ref("");
const role = ref("");

const createUser = () => {
  if (!role.value) {
    alert("Please select a role");
    return;
  }

  emit("create", {
    email: email.value,
    firstName: firstName.value,
    lastName: lastName.value,
    password: password.value,
    role: role.value,
  });

  // Clear form
  email.value = "";
  firstName.value = "";
  lastName.value = "";
  password.value = "";
  role.value = "";
};
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
  margin-bottom: 1.25rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-group input {
  display: block;
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  outline: none;
  transition: all 0.2s;
}

.form-group input:focus {
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
  gap: 1rem;
}

.role-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
}

.role-option:hover {
  border-color: #667eea;
  background: #f8f9ff;
  transform: translateY(-2px);
}

.role-selected {
  border-color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.role-icon {
  width: 2.5rem;
  height: 2.5rem;
  color: #667eea;
}

.role-name {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

.actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.btn-create {
  flex: 1;
  background-color: #667eea;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
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
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-cancel:hover {
  background-color: #d1d5db;
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