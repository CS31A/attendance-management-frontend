<script setup lang="ts">
import BaseModal from '../common/BaseModal.vue'

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
</script>

<template>
  <BaseModal
    :show="show"
    :title="title"
    size="sm"
    @close="handleCancel"
  >
    <p class="confirmation-message">
      {{ message }}
    </p>

    <template #footer>
      <button class="btn-cancel" @click="handleCancel">
        {{ cancelText }}
      </button>
      <button class="btn-confirm" @click="handleConfirm">
        {{ confirmText }}
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.confirmation-message {
  margin: 0;
  color: var(--color-gray-600);
  line-height: 1.5;
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

@media (max-width: 640px) {
  .btn-cancel,
  .btn-confirm {
    width: 100%;
    flex: 1;
  }
}
</style>
