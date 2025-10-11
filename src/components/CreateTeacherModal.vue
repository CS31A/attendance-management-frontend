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
      <div class="modal-body">
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

        <!-- New Fields -->
        <div class="form-row">
          <div class="form-group">
            <label>Section</label>
            <select v-model="section" required>
              <option value="" disabled>Select section</option>
              <option value="Section A">Section A</option>
              <option value="Section B">Section B</option>
              <option value="Section C">Section C</option>
            </select>
          </div>

          <div class="form-group">
            <label>Subject</label>
            <select v-model="subject" required>
              <option value="" disabled>Select subject</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Science">Science</option>
              <option value="English">English</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>Time</label>
          <select v-model="time" required>
            <option value="" disabled>Select time</option>
            <option value="8:00 AM - 9:00 AM">8:00 AM - 9:00 AM</option>
            <option value="9:00 AM - 10:00 AM">9:00 AM - 10:00 AM</option>
            <option value="10:00 AM - 11:00 AM">10:00 AM - 11:00 AM</option>
          </select>
        </div>

        <!-- Students Multi-Select -->
        <div class="form-group">
          <label>Students</label>
          <div class="students-selector">
            <div 
              v-for="student in availableStudents" 
              :key="student.id" 
              class="student-checkbox"
            >
              <input 
                type="checkbox" 
                :id="`student-${student.id}`"
                :value="student.id"
                v-model="selectedStudentIds"
              />
              <label :for="`student-${student.id}`">
                {{ student.firstName }} {{ student.lastName }} (@{{ student.username }})
              </label>
            </div>
          </div>
          <small class="helper-text" v-if="availableStudents.length === 0">
            No students available. Please create students first in the Student Management section.
          </small>
          <small class="helper-text" v-else>
            Selected: {{ selectedStudentIds.length }} student(s)
          </small>
        </div>

        <div class="actions">
          <button @click="createTeacher" class="btn-create">
            Create Teacher
          </button>
          <button type="button" class="btn-cancel" @click="$emit('cancel')">
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useStudentStore } from '@/stores/studentstore'

const emit = defineEmits(["create", "cancel"]);

// Get students from the store
const studentStore = useStudentStore()
const availableStudents = studentStore.students

const username = ref("");
const email = ref("");
const firstName = ref("");
const lastName = ref("");
const section = ref("");
const subject = ref("");
const time = ref("");
const selectedStudentIds = ref([]);

// Get selected students details as comma-separated string
const getSelectedStudentsString = () => {
  const selected = availableStudents.value.filter(student => 
    selectedStudentIds.value.includes(student.id)
  );
  return selected.map(s => `${s.firstName} ${s.lastName}`).join(", ");
};

// Create teacher object and emit
const createTeacher = () => {
  // Validate all fields
  if (!username.value || !email.value || !firstName.value || !lastName.value || 
      !section.value || !subject.value || !time.value) {
    alert('Please fill in all fields');
    return;
  }

  if (selectedStudentIds.value.length === 0) {
    alert("Please select at least one student");
    return;
  }

  emit("create", {
    username: username.value,
    email: email.value,
    firstName: firstName.value,
    lastName: lastName.value,
    section: section.value,
    subject: subject.value,
    time: time.value,
    students: getSelectedStudentsString(),
    studentIds: selectedStudentIds.value, // Send the IDs for backend processing
  });

  // Clear form after submission
  username.value = "";
  email.value = "";
  firstName.value = "";
  lastName.value = "";
  section.value = "";
  subject.value = "";
  time.value = "";
  selectedStudentIds.value = [];
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
  padding: 2rem 1rem;
}

.modal {
  background: white;
  border-radius: 1rem;
  width: 100%;
  max-width: 550px;
  max-height: 85vh;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
}

.modal-header {
  background: linear-gradient(to right, #667eea, #764ba2);
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 10;
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
  margin-bottom: 0.5rem;
}

.form-group input,
.form-group select {
  display: block;
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  outline: none;
  transition: all 0.2s;
  font-family: inherit;
}

.form-group input:focus,
.form-group select:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group select {
  cursor: pointer;
  background-color: white;
}

.helper-text {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

/* Students Selector */
.students-selector {
  max-height: 150px;
  overflow-y: auto;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 0.5rem;
  background: #f9fafb;
}

.student-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.25rem;
  transition: background-color 0.2s;
}

.student-checkbox:hover {
  background: #e5e7eb;
}

.student-checkbox input[type="checkbox"] {
  width: 1rem;
  height: 1rem;
  cursor: pointer;
  accent-color: #667eea;
}

.student-checkbox label {
  flex: 1;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
  margin: 0;
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

.btn-create:hover {
  background-color: #5568d3;
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
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .modal {
    max-width: 95%;
  }
  
  .modal-header h2 {
    font-size: 1.25rem;
  }
}
</style>