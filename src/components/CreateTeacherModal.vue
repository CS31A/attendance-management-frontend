<template>
  <div class="overlay">
    <div class="modal">
      <!-- Modal Header -->
      <div class="modal-header">
        <h2>Create Teacher</h2>
        <button type="button" class="btn-close" @click="$emit('cancel')">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Modal Body -->
      <form @submit.prevent="createTeacher" class="modal-body">
        <div class="form-group">
          <label>Username</label>
          <input 
            v-model="username" 
            type="text"
            placeholder="Enter username" 
            required 
          />
        </div>

        <div class="form-group">
          <label>Email</label>
          <input 
            v-model="email" 
            type="email"
            placeholder="Enter email" 
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

        <div class="actions">
          <button type="submit" class="btn-create">
            Create Teacher Account
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

const username = ref("");
const email = ref("");
const firstName = ref("");
const lastName = ref("");

// Create teacher object and emit
const createTeacher = () => {
  emit("create", {
    username: username.value,
    email: email.value,
    firstName: firstName.value,
    lastName: lastName.value,
  });

  // Clear form after submission
  username.value = "";
  email.value = "";
  firstName.value = "";
  lastName.value = "";
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
  z-index: 50;
}

.modal {
  background: white;
  border-radius: 1rem;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.modal-header {
  background: linear-gradient(to right, #3b82f6, #6366f1);
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  color: white;
  font-size: 1.5rem;
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
  width: 1.5rem;
  height: 1.5rem;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
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
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.btn-create {
  flex: 1;
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-create:hover {
  background-color: #2563eb;
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
</style>