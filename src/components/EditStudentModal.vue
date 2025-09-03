<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  studentName: {
    type: String,
    default: ''
  }
})

const studentName = ref(props.studentName)

const emit = defineEmits(['update', 'cancel'])

const inputRef = ref(null)

watch(() => props.studentName, (newName) => {
  studentName.value = newName
})

onMounted(() => {
  // Focus the input when the modal opens
  setTimeout(() => {
    inputRef.value?.focus()
  }, 100)
})

const update = () => {
  if (studentName.value.trim()) {
    emit('update', studentName.value.trim())
    studentName.value = ''
  }
}

const cancel = () => {
  studentName.value = props.studentName
  emit('cancel')
}
</script>

<template>
  <div class="modal-overlay" @click="cancel">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>Edit Student</h3>
      </div>
      <div class="modal-body">
        <input 
          v-model="studentName"
          @keyup.enter="update"
          placeholder="Enter student full name"
          class="student-input"
          ref="inputRef"
        />
      </div>
      <div class="modal-actions">
        <button @click="cancel" class="btn-cancel">Cancel</button>
        <button @click="update" class="btn-create" :disabled="!studentName.trim()">Update Student</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: white;
  border-radius: 1rem;
  width: 90%;
  max-width: 420px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: modalSlide 0.3s ease-out;
}

@keyframes modalSlide {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  padding: 1.5rem 1.5rem 0 1.5rem;
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.modal-body {
  padding: 1rem 1.5rem;
}

.student-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s ease;
}

.student-input:focus {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.modal-actions {
  padding: 0 1.5rem 1.5rem 1.5rem;
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.btn-create {
  background: #10b981;
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-create:hover:not(:disabled) {
  background: #059669;
  transform: translateY(-1px);
}

.btn-create:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
  transform: none;
}

.btn-cancel {
  background: #64748b;
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel:hover {
  background: #475569;
}

@media (max-width: 768px) {
  .modal-actions {
    flex-direction: column-reverse;
  }
}
</style>