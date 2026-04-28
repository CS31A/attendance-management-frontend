<script setup lang="ts">
import type { FingerprintDeviceDto } from '@/api/fingerprint'
import { Activity, MapPin, Monitor } from 'lucide-vue-next'
import { computed } from 'vue'

const props = defineProps<{
  devices: FingerprintDeviceDto[]
  title?: string
  showActions?: boolean
}>()

const emit = defineEmits<{
  view: [device: FingerprintDeviceDto]
}>()

const hasDevices = computed(() => props.devices.length > 0)

function formatLastSeen(lastSeenAt: string | null | undefined): string {
  if (!lastSeenAt)
    return 'Never'

  const date = new Date(lastSeenAt)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1)
    return 'Just now'
  if (diffMins < 60)
    return `${diffMins}m ago`
  if (diffHours < 24)
    return `${diffHours}h ago`
  if (diffDays < 7)
    return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

function getStatusClass(device: FingerprintDeviceDto): string {
  if (!device.isActive) {
    return 'status-disabled'
  }

  // Check if device is online based on LastSeenAt
  if (!device.lastSeenAt) {
    return 'status-offline'
  }

  const lastSeen = new Date(device.lastSeenAt)
  const now = new Date()
  const diffMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / 60000)

  // Consider device online if seen in last 2 minutes
  if (diffMinutes < 2) {
    return 'status-online'
  }

  // Consider device offline if not seen in last 2 minutes
  return 'status-offline'
}

function getStatusText(device: FingerprintDeviceDto): string {
  if (!device.isActive) {
    return 'Disabled'
  }

  if (!device.lastSeenAt) {
    return 'Offline'
  }

  const lastSeen = new Date(device.lastSeenAt)
  const now = new Date()
  const diffMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / 60000)

  if (diffMinutes < 2) {
    return 'Online'
  }

  return 'Offline'
}
</script>

<template>
  <section class="device-table-section">
    <div v-if="title" class="section-header">
      <h2 class="section-title">
        {{ title }}
      </h2>
      <span class="device-count">{{ devices.length }} {{ devices.length === 1 ? 'device' : 'devices' }}</span>
    </div>

    <div v-if="hasDevices" class="table-container">
      <table class="device-table">
        <thead>
          <tr>
            <th>Device</th>
            <th>Location</th>
            <th>Status</th>
            <th>Last Seen</th>
            <th v-if="showActions">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="device in devices"
            :key="device.id"
            class="device-row"
          >
            <td>
              <div class="device-info">
                <div class="device-icon">
                  <Monitor :size="20" />
                </div>
                <div class="device-details">
                  <div class="device-name">
                    {{ device.name || 'Unnamed Device' }}
                  </div>
                  <div class="device-identifier">
                    {{ device.deviceIdentifier }}
                  </div>
                </div>
              </div>
            </td>
            <td>
              <div class="location-cell">
                <MapPin :size="16" class="location-icon" />
                <span>{{ device.location || 'Not specified' }}</span>
              </div>
            </td>
            <td>
              <span :class="['status-badge', getStatusClass(device)]">
                <Activity :size="14" />
                {{ getStatusText(device) }}
              </span>
            </td>
            <td>
              <span class="last-seen">{{ formatLastSeen(device.lastSeenAt) }}</span>
            </td>
            <td v-if="showActions">
              <div class="action-buttons">
                <button
                  class="action-btn action-btn-view"
                  title="View Details"
                  @click="emit('view', device)"
                >
                  View Details
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="empty-state">
      <Monitor :size="48" class="empty-icon" />
      <p class="empty-text">
        No devices found
      </p>
    </div>
  </section>
</template>

<style scoped>
.device-table-section {
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
  overflow: hidden;
  border: 1px solid var(--color-gray-200);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-gray-200);
  background: linear-gradient(135deg, var(--color-slate-100) 0%, white 100%);
}

.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0;
}

.device-count {
  font-size: 0.875rem;
  color: var(--color-gray-500);
  font-weight: 600;
  background: white;
  padding: 0.375rem 0.875rem;
  border-radius: 12px;
  border: 1px solid var(--color-gray-200);
}

.table-container {
  overflow-x: auto;
}

.device-table {
  width: 100%;
  border-collapse: collapse;
}

.device-table thead {
  background: var(--color-slate-100);
  border-bottom: 2px solid var(--color-gray-200);
}

.device-table th {
  padding: 1rem 1.5rem;
  text-align: left;
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--color-gray-600);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.device-table tbody tr {
  border-bottom: 1px solid var(--color-gray-200);
  transition: background-color 0.2s ease;
}

.device-table tbody tr:hover {
  background: var(--color-slate-50);
}

.device-table tbody tr:last-child {
  border-bottom: none;
}

.device-table td {
  padding: 1.25rem 1.5rem;
  font-size: 0.9375rem;
  color: var(--color-gray-700);
}

.device-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.device-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-primary) 100%);
  border-radius: 12px;
  color: white;
  flex-shrink: 0;
}

.device-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.device-name {
  font-weight: 600;
  color: var(--color-gray-900);
  font-size: 0.9375rem;
}

.device-identifier {
  font-size: 0.8125rem;
  color: var(--color-gray-500);
  font-family: 'Courier New', monospace;
}

.location-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-gray-600);
}

.location-icon {
  color: var(--color-gray-400);
  flex-shrink: 0;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.875rem;
  border-radius: 12px;
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: capitalize;
}

.status-online {
  background: rgba(34, 197, 94, 0.1);
  color: var(--color-success-dark);
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.status-offline {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-error-dark);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.status-disabled {
  background: rgba(107, 114, 128, 0.1);
  color: var(--color-gray-600);
  border: 1px solid rgba(107, 114, 128, 0.2);
}

.last-seen {
  color: var(--color-gray-600);
  font-size: 0.875rem;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  padding: 0.375rem 0.875rem;
  border: none;
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn-view {
  background: var(--color-slate-100);
  color: var(--color-primary);
  border: 1px solid var(--color-gray-200);
}

.action-btn-view:hover {
  background: var(--color-primary-light);
  color: white;
  transform: translateY(-1px);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: var(--color-gray-400);
}

.empty-icon {
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-text {
  font-size: 1rem;
  color: var(--color-gray-500);
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .device-table th,
  .device-table td {
    padding: 1rem;
  }

  .device-info {
    gap: 0.75rem;
  }

  .device-icon {
    width: 36px;
    height: 36px;
  }

  .action-buttons {
    flex-direction: column;
    gap: 0.375rem;
  }

  .action-btn {
    width: 100%;
  }
}
</style>
