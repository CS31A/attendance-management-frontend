<script setup lang="ts">
import { AlertTriangle, X } from 'lucide-vue-next'

defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: 'Alert',
  },
  message: {
    type: String,
    default: 'An error occurred',
  },
  confirmText: {
    type: String,
    default: 'OK',
  },
})

const emit = defineEmits(['confirm'])

function handleConfirm() {
  emit('confirm')
}

// Close modal on Escape key
function handleKeydown(event: any) {
  if (event.key === 'Escape') {
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
      @click="handleConfirm"
      @keydown="handleKeydown"
    >
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <div class="alert-icon">
            <AlertTriangle :size="24" />
          </div>
          <h3>{{ title }}</h3>
          <button class="close-btn" @click="handleConfirm">
            <X :size="20" />
          </button>
        </div>
        <div class="modal-body">
          <p>{{ message }}</p>
        </div>
        <div class="modal-footer">
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
  align-items: flex-start;
  padding: 1.25rem 1.5rem 0.5rem;
  border-bottom: 1px solid var(--color-gray-200);
}

.alert-icon {
  color: var(--color-error);
  margin-right: 0.75rem;
  margin-top: 0.25rem;
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
  margin-left: 0.5rem;
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

  .modal-header {
    align-items: center;
  }

  .alert-icon {
    margin-top: 0;
  }

  .modal-footer {
    flex-direction: column;
  }

  .btn-confirm {
    width: 100%;
  }
}
</style>
