<script setup lang="ts">
import type { EntityId } from '@/types'
import { Fingerprint, Trash2 } from 'lucide-vue-next'
import { formatLongDate } from '@/utils/date'

defineProps<{
  fingerprint: {
    id: EntityId
    deviceId: EntityId
    deviceName: string
    deviceLocation: string
    enrolledAt: string
  } | null
}>()

const emit = defineEmits<{
  enroll: []
  delete: [fingerprintId: EntityId]
}>()
</script>

<template>
  <div class="fingerprint-card">
    <div class="card-header">
      <Fingerprint :size="20" />
      <h4>Fingerprint</h4>
    </div>

    <div class="card-body">
      <div v-if="fingerprint" class="info">
        <div class="info-row">
          <span class="label">Status:</span>
          <span class="badge badge-success">Enrolled</span>
        </div>
        <div class="info-row">
          <span class="label">Device:</span>
          <span>{{ fingerprint.deviceName }} ({{ fingerprint.deviceLocation }})</span>
        </div>
        <div class="info-row">
          <span class="label">Enrolled:</span>
          <span>{{ formatLongDate(fingerprint.enrolledAt) }}</span>
        </div>
      </div>
      <div v-else class="empty">
        <Fingerprint :size="32" class="text-gray-300" />
        <p>No fingerprint enrolled</p>
      </div>
    </div>

    <div class="card-actions">
      <button v-if="fingerprint" class="btn-danger" @click="emit('delete', fingerprint.id)">
        <Trash2 :size="16" />
        Delete
      </button>
      <button class="btn-primary" @click="emit('enroll')">
        <Fingerprint :size="16" />
        {{ fingerprint ? 'Re-enroll' : 'Enroll' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.fingerprint-card {
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.25rem;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.card-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
}

.card-body {
  margin-bottom: 1rem;
}

.info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-row {
  display: flex;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.label {
  font-weight: 500;
  color: #6b7280;
  min-width: 60px;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge-success {
  background: #dcfce7;
  color: #166534;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem;
  color: #6b7280;
}

.card-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--color-primary, #3b82f6);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.btn-danger {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.btn-danger:hover {
  background: #fee2e2;
}
</style>
