<script setup>
import { X } from 'lucide-vue-next'

const _props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: 'Details',
  },
  items: {
    type: Array,
    default: () => [],
    validator: (value) => {
      return value.every(item => item.label && (item.value !== undefined))
    },
  },
  icon: {
    type: Object,
    default: null,
  },
  iconColor: {
    type: String,
    default: 'var(--color-primary)',
  },
})

const emit = defineEmits(['close'])

function handleClose() {
  emit('close')
}

// Close modal on Escape key
function handleKeydown(event) {
  if (event.key === 'Escape') {
    handleClose()
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
      @click="handleClose"
      @keydown="handleKeydown"
    >
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <div v-if="icon" class="header-icon-wrapper" :style="{ background: `rgba(255, 255, 255, 0.2)` }">
            <component :is="icon" class="header-icon" size="24" :style="{ color: 'white' }" />
          </div>
          <h3>{{ title }}</h3>
          <button class="close-btn" @click="handleClose">
            <X size="20" />
          </button>
        </div>
        <div class="modal-body">
          <div v-if="items && items.length > 0" class="details-grid">
            <div v-for="(item, index) in items" :key="index" class="detail-item" :class="{ 'full-width': item.fullWidth }">
              <label class="detail-label">{{ item.label }}</label>
              <div class="detail-value" :class="{ badge: item.badge, status: item.status }">
                <component :is="item.icon" v-if="item.icon" class="detail-icon" size="16" />
                <span v-if="item.badge" class="badge-content" :class="item.badgeClass">{{ item.value }}</span>
                <span v-else>{{ item.value || '-' }}</span>
              </div>
            </div>
          </div>
          <div v-else class="empty-details">
            <p>No details available</p>
          </div>

          <!-- Optional slot for custom content -->
          <slot />
        </div>
        <div class="modal-footer">
          <button class="btn-close" @click="handleClose">
            Close
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
  max-height: calc(100vh - 2rem);
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  margin: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background: linear-gradient(to right, var(--color-primary), var(--color-primary-light));
  gap: 0.75rem;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  flex-shrink: 0;
}

.header-icon {
  flex-shrink: 0;
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: bold;
  color: white;
  margin: 0;
  flex: 1;
}

.close-btn {
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.modal-body {
  padding: 1.25rem;
  overflow-y: auto;
  flex: 1;
  background: white;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: white;
  padding: 1rem;
  border-radius: 0.75rem;
  border: 1px solid var(--color-gray-200);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  animation: fadeInUp 0.3s ease-out backwards;
}

.detail-item:nth-child(1) { animation-delay: 0.05s; }
.detail-item:nth-child(2) { animation-delay: 0.1s; }
.detail-item:nth-child(3) { animation-delay: 0.15s; }
.detail-item:nth-child(4) { animation-delay: 0.2s; }
.detail-item:nth-child(5) { animation-delay: 0.25s; }
.detail-item:nth-child(6) { animation-delay: 0.3s; }
.detail-item:nth-child(7) { animation-delay: 0.35s; }
.detail-item:nth-child(8) { animation-delay: 0.4s; }
.detail-item:nth-child(9) { animation-delay: 0.45s; }
.detail-item:nth-child(10) { animation-delay: 0.5s; }

.detail-item:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
  border-color: var(--color-primary-lighter);
  transform: translateY(-2px);
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-gray-500);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.detail-value {
  font-size: 1rem;
  color: var(--color-gray-800);
  font-weight: 500;
  word-break: break-word;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  line-height: 1.5;
}

.detail-icon {
  color: var(--color-gray-400);
  flex-shrink: 0;
}

.detail-value.badge .badge-content {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  background: var(--color-gray-100);
  color: var(--color-gray-700);
}

.badge-content.success {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(22, 163, 74, 0.1) 100%);
  color: var(--color-success);
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.badge-content.error {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%);
  color: var(--color-error);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.badge-content.warning {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%);
  color: #d97706;
  border: 1px solid rgba(251, 191, 36, 0.2);
}

.badge-content.info {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%);
  color: #2563eb;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.empty-details {
  text-align: center;
  padding: 3rem 2rem;
  color: var(--color-gray-500);
  background: white;
  border-radius: 0.75rem;
  border: 2px dashed var(--color-gray-300);
}

.empty-details p {
  margin: 0;
  font-weight: 500;
}

.modal-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1.25rem;
  justify-content: flex-end;
  background: white;
  border-top: 1px solid var(--color-gray-200);
  flex-shrink: 0;
}

.btn-close {
  padding: 0.625rem 1.5rem;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.btn-close:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
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

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
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
    max-height: calc(100vh - 2rem);
  }

  .details-grid {
    grid-template-columns: 1fr;
  }

  .modal-footer {
    flex-direction: column;
  }

  .btn-close {
    width: 100%;
  }
}
</style>
