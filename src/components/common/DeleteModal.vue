<script setup>
import { Trash2, X } from 'lucide-vue-next'

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: 'Confirm Deletion',
  },
  message: {
    type: String,
    default: 'Are you sure you want to delete this item? This action cannot be undone.',
  },
  itemName: {
    type: String,
    default: '',
  },
  confirmText: {
    type: String,
    default: 'Delete',
  },
  cancelText: {
    type: String,
    default: 'Cancel',
  },
  isDeleting: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['confirm', 'cancel'])

function handleConfirm() {
  if (!props.isDeleting) {
    emit('confirm')
  }
}

function handleCancel() {
  if (!props.isDeleting) {
    emit('cancel')
  }
}

// Close modal on Escape key
function handleKeydown(event) {
  if (event.key === 'Escape' && !props.isDeleting) {
    handleCancel()
  }
  else if (event.key === 'Enter' && !props.isDeleting) {
    handleConfirm()
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
          <div class="header-icon-wrapper">
            <Trash2 class="header-icon" size="24" />
          </div>
          <h3>{{ title }}</h3>
          <button class="close-btn" :disabled="isDeleting" @click="handleCancel">
            <X size="20" />
          </button>
        </div>
        <div class="modal-body">
          <p class="message">
            {{ message }}
          </p>
          <p v-if="itemName" class="item-name">
            <strong>{{ itemName }}</strong>
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" :disabled="isDeleting" @click="handleCancel">
            {{ cancelText }}
          </button>
          <button class="btn-delete" :disabled="isDeleting" @click="handleConfirm">
            <span v-if="isDeleting" class="spinner" />
            <span v-else>{{ confirmText }}</span>
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
  gap: 0.75rem;
}

.header-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%);
  flex-shrink: 0;
}

.header-icon {
  color: var(--color-error);
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-gray-800);
  margin: 0;
  flex: 1;
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
  flex-shrink: 0;
}

.close-btn:hover:not(:disabled) {
  background-color: var(--color-gray-100);
  color: var(--color-gray-500);
}

.close-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-body {
  padding: 1.5rem;
}

.message {
  margin: 0 0 0.75rem 0;
  color: var(--color-gray-600);
  line-height: 1.5;
}

.item-name {
  margin: 0;
  padding: 0.75rem;
  background: var(--color-error-bg);
  border: 1px solid var(--color-error-light);
  border-radius: 0.5rem;
  color: var(--color-error-dark);
  font-size: 0.875rem;
  word-break: break-word;
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

.btn-cancel:hover:not(:disabled) {
  background-color: var(--color-gray-100);
}

.btn-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-delete {
  padding: 0.625rem 1.25rem;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-delete:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.4);
}

.btn-delete:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
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
  .btn-delete {
    width: 100%;
  }
}
</style>
