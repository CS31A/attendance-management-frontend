<script setup>
import { Ban, Calendar, Clock, Eye, RefreshCw, Users } from 'lucide-vue-next'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { calculateRemainingTime, formatDate, isQrExpired } from '@/utils/qrcode'

const props = defineProps({
  qrCode: {
    type: Object,
    required: true,
  },
})

defineEmits(['view', 'revoke', 'reactivate'])

const timeRemaining = ref(0)
const timerInterval = ref(null)

const isExpiredState = computed(() => {
  // If manually revoked or expired by time
  if (!props.qrCode.isActive)
    return true
  return isQrExpired(props.qrCode.expiresAt)
})

const status = computed(() => {
  if (!props.qrCode.isActive)
    return 'Revoked'
  if (isExpiredState.value)
    return 'Expired'
  return 'Active'
})

const statusClass = computed(() => {
  switch (status.value) {
    case 'Active': return 'status-active'
    case 'Expired': return 'status-expired'
    case 'Revoked': return 'status-revoked'
    default: return 'status-unknown'
  }
})

const formattedCountdown = computed(() => {
  if (status.value !== 'Active')
    return '-'
  const minutes = Math.floor(timeRemaining.value / 60)
  const seconds = timeRemaining.value % 60
  return `${minutes}m ${seconds}s`
})

function updateTimer() {
  if (props.qrCode.expiresAt && status.value === 'Active') {
    timeRemaining.value = calculateRemainingTime(props.qrCode.expiresAt)
  }
}

onMounted(() => {
  updateTimer()
  timerInterval.value = setInterval(updateTimer, 1000)
})

onUnmounted(() => {
  if (timerInterval.value)
    clearInterval(timerInterval.value)
})
</script>

<template>
  <div class="qr-card">
    <div class="card-content">
      <!-- Header Info -->
      <div class="card-header">
        <h3 class="subject-name">
          {{ qrCode.subjectName || 'Unknown Subject' }}
        </h3>
        <span class="section-name">
          {{ qrCode.sectionName || 'No Section' }}
        </span>
      </div>

      <!-- Details Grid -->
      <div class="details-grid">
        <!-- Status -->
        <div class="detail-item">
          <span class="status-badge" :class="statusClass">
            {{ status }}
          </span>
        </div>

        <!-- Date -->
        <div class="detail-item">
          <Calendar size="14" class="icon" />
          <span>{{ formatDate(qrCode.sessionDate || qrCode.createdAt) }}</span>
        </div>

        <!-- Scans -->
        <div class="detail-item">
          <Users size="14" class="icon" />
          <span>{{ qrCode.usageCount || 0 }} scans</span>
        </div>

        <!-- Timer/Expiration -->
        <div class="detail-item timer" :class="{ urgent: timeRemaining < 300 && status === 'Active' }">
          <Clock size="14" class="icon" />
          <span v-if="status === 'Active'">{{ formattedCountdown }}</span>
          <span v-else>--:--</span>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="card-actions">
      <button
        class="action-btn view"
        title="View QR Code"
        @click="$emit('view', qrCode)"
      >
        <Eye size="18" />
      </button>

      <button
        v-if="qrCode.isActive"
        class="action-btn revoke"
        title="Revoke QR Code"
        @click="$emit('revoke', qrCode)"
      >
        <Ban size="18" />
      </button>

      <button
        v-else
        class="action-btn reactivate"
        title="Reactivate QR Code"
        @click="$emit('reactivate', qrCode)"
      >
        <RefreshCw size="18" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.qr-card {
  background: white;
  border: 1px solid var(--color-gray-200);
  border-radius: 0.75rem;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s;
  gap: 1rem;
}

.qr-card:hover {
  border-color: var(--color-primary-light);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.card-content {
  flex: 1;
  min-width: 0;
}

.card-header {
  margin-bottom: 0.75rem;
}

.subject-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-gray-900);
  margin: 0 0 0.25rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.section-name {
  font-size: 0.875rem;
  color: var(--color-gray-500);
}

.details-grid {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: var(--color-gray-600);
}

.icon {
  color: var(--color-gray-400);
}

.status-badge {
  padding: 0.125rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-active {
  background: #ecfdf5;
  color: #059669;
}

.status-expired {
  background: #fef2f2;
  color: #b91c1c;
}

.status-revoked {
  background: #f3f4f6;
  color: #4b5563;
}

.timer.urgent {
  color: #ea580c;
  font-weight: 600;
}

.timer.urgent .icon {
  color: #ea580c;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  width: 36px;
  height: 36px;
  border-radius: 0.5rem;
  border: 1px solid var(--color-gray-200);
  background: white;
  color: var(--color-gray-600);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  transform: translateY(-1px);
}

.action-btn.view:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-bg, #eff6ff);
}

.action-btn.revoke:hover {
  border-color: var(--color-error);
  color: var(--color-error);
  background: #fef2f2;
}

.action-btn.reactivate:hover {
  border-color: #059669;
  color: #059669;
  background: #ecfdf5;
}

@media (max-width: 640px) {
  .qr-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .card-actions {
    width: 100%;
    justify-content: flex-end;
    margin-top: 0.5rem;
    padding-top: 0.75rem;
    border-top: 1px dashed var(--color-gray-200);
  }
}
</style>
