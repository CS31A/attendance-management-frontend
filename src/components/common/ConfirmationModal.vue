<script setup>
import { X } from 'lucide-vue-next'

defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: 'Confirm Action',
  },
  message: {
    type: String,
    default: 'Are you sure you want to proceed?',
  },
  confirmText: {
    type: String,
    default: 'Confirm',
  },
  cancelText: {
    type: String,
    default: 'Cancel',
  },
})

const emit = defineEmits(['confirm', 'cancel'])

function handleConfirm() {
  emit('confirm')
}

function handleCancel() {
  emit('cancel')
}

// Close modal on Escape key
function handleKeydown(event) {
  if (event.key === 'Escape') {
    handleCancel()
  }
}

defineExpose({
  handleKeydown,
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="modal-overlay"
      @click="handleCancel"
      @keydown="handleKeydown"
    >
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ title }}</h3>
          <button class="close-btn" @click="handleCancel">
            <X size="20" />
          </button>
        </div>
        <div class="modal-body">
          <p>{{ message }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="handleCancel">
            {{ cancelText }}
          </button>
          <button class="btn-confirm" @click="handleConfirm">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 0.75rem;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem 0.5rem;
  border-bottom: 1px solid var(--color-gray-200);
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-gray-800);
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: var(--color-gray-400);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background-color: var(--color-gray-100);
  color: var(--color-gray-500);
}

.modal-body {
  padding: 1.5rem;
}

.modal-body p {
  margin: 0;
  color: var(--color-gray-600);
  line-height: 1.5;
}

.modal-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.5rem 1.5rem;
  justify-content: flex-end;
}

.btn-cancel {
  padding: 0.625rem 1.25rem;
  background-color: white;
  color: var(--color-gray-600);
  border: 1px solid var(--color-gray-300);
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background-color: var(--color-gray-100);
}

.btn-confirm {
  padding: 0.625rem 1.25rem;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-confirm:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(30, 58, 138, 0.3);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive styles */
@media (max-width: 640px) {
  .modal-content {
    margin: 1rem;
    max-width: calc(100% - 2rem);
  }

  .modal-footer {
    flex-direction: column;
  }

  .btn-cancel,
  .btn-confirm {
    width: 100%;
  }
}
</style>
