<script setup lang="ts">
import type { FingerprintDeviceDto } from '@/api/fingerprint'
import { AlertTriangle, Monitor, RefreshCw } from 'lucide-vue-next'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import ManagementSearchBar from '@/components/common/ManagementSearchBar.vue'
import SkeletonLoader from '@/components/common/SkeletonLoader.vue'
import Toast from '@/components/common/Toast.vue'
import DeviceTable from '@/components/tables/DeviceTable.vue'
import { useToast } from '@/composables/useToast'
import { useDeviceStore } from '@/stores/deviceStore'
import { useNotificationStore } from '@/stores/notificationStore'

const deviceStore = useDeviceStore()
const notificationStore = useNotificationStore()
const { toast, showToast, closeToast } = useToast()

const searchQuery = ref('')
const selectedDeviceId = ref<string | number | null>(null)
const showDeviceModal = ref(false)
const viewMode = ref<'all' | 'active' | 'inactive'>('all')

const selectedDevice = computed(() =>
  selectedDeviceId.value != null
    ? deviceStore.getDeviceById(selectedDeviceId.value) ?? null
    : null,
)

onMounted(async () => {
  await refreshDevices()
  subscribeToDeviceUpdates()
})

onUnmounted(() => {
  unsubscribeFromDeviceUpdates()
})

async function refreshDevices() {
  const result = await deviceStore.fetchDevices()
  if (!result.success) {
    showToast('Failed to load devices', 'error')
  }
}

function subscribeToDeviceUpdates() {
  try {
    notificationStore.registerHandler('DeviceStatusUpdate', handleDeviceStatusUpdate)
  }
  catch (error) {
    console.error('Failed to subscribe to device status updates:', error)
  }
}

function unsubscribeFromDeviceUpdates() {
  notificationStore.unregisterHandler('DeviceStatusUpdate', handleDeviceStatusUpdate)
}

function handleDeviceStatusUpdate(deviceUpdate: Partial<FingerprintDeviceDto> & { id: string | number }) {
  try {
    const existing = deviceStore.getDeviceById(deviceUpdate.id)
    const wasOnline = existing?.lastSeenAt
      && (new Date().getTime() - new Date(existing.lastSeenAt).getTime()) < 120000

    deviceStore.updateDeviceStatus(deviceUpdate)

    const device = deviceStore.getDeviceById(deviceUpdate.id)
    if (device) {
      const isOnline = device.lastSeenAt
        && (new Date().getTime() - new Date(device.lastSeenAt).getTime()) < 120000
      if (isOnline && !wasOnline) {
        showToast(`Device "${device.name || device.deviceIdentifier}" is now online`, 'success')
      }
    }
  }
  catch (error) {
    console.error('Failed to handle device status update:', error)
  }
}

const filteredDevices = computed(() => {
  let devices = deviceStore.devices

  // Filter by view mode
  if (viewMode.value === 'active') {
    devices = deviceStore.activeDevices
  }
  else if (viewMode.value === 'inactive') {
    devices = deviceStore.inactiveDevices
  }

  // Filter by search query
  if (searchQuery.value.trim()) {
    return deviceStore.filterDevices(searchQuery.value)
      .filter(d => viewMode.value === 'all' || (viewMode.value === 'active' ? d.isActive : !d.isActive))
  }

  return devices
})

const hasActiveSearch = computed(() => searchQuery.value.trim().length > 0)

function clearSearch() {
  searchQuery.value = ''
}

function handleViewDevice(device: FingerprintDeviceDto) {
  selectedDeviceId.value = device.id
  showDeviceModal.value = true
}

function closeDeviceModal() {
  showDeviceModal.value = false
  selectedDeviceId.value = null
}

function getConnectivityStatusClass(device: FingerprintDeviceDto): string {
  if (!device.lastSeenAt) {
    return 'status-offline'
  }

  const lastSeen = new Date(device.lastSeenAt)
  const now = new Date()
  const diffMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / 60000)

  return diffMinutes < 2 ? 'status-online' : 'status-offline'
}

function getConnectivityStatusText(device: FingerprintDeviceDto): string {
  if (!device.lastSeenAt) {
    return 'Never Connected'
  }

  const lastSeen = new Date(device.lastSeenAt)
  const now = new Date()
  const diffMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / 60000)

  return diffMinutes < 2 ? 'Online' : 'Offline'
}
</script>

<template>
  <div class="device-management">
    <!-- Loading State -->
    <div
      v-if="deviceStore.loading && !deviceStore.devices.length"
      class="loading-skeleton"
    >
      <!-- Header skeleton -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-text">
            <SkeletonLoader type="text" :height="40" :width="300" style="margin-bottom: 0.5rem;" />
            <SkeletonLoader type="text" :height="20" :width="200" />
          </div>
          <SkeletonLoader type="rectangle" :height="50" :width="150" />
        </div>
      </div>

      <!-- Filters skeleton -->
      <div class="filters-section">
        <SkeletonLoader type="rectangle" :height="55" :width="400" style="flex: 1;" />
      </div>

      <!-- Table skeleton -->
      <div class="skeleton-table">
        <SkeletonLoader type="rectangle" :height="50" style="margin-bottom: 1rem; width: 100%;" />
        <SkeletonLoader type="rectangle" :height="60" style="margin-bottom: 0.5rem; width: 100%;" />
        <SkeletonLoader type="rectangle" :height="60" style="margin-bottom: 0.5rem; width: 100%;" />
        <SkeletonLoader type="rectangle" :height="60" style="margin-bottom: 0.5rem; width: 100%;" />
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="deviceStore.error" class="error-message">
      <div class="error-content">
        <AlertTriangle class="error-icon" :size="24" />
        <p>{{ deviceStore.error }}</p>
        <BaseButton
          variant="ghost"
          size="small"
          @click="refreshDevices"
        >
          Retry
        </BaseButton>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-text">
            <h1 class="page-title">
              Device Monitoring
            </h1>
            <p class="page-subtitle">
              Monitor fingerprint devices and their status
            </p>
          </div>
          <div class="header-actions">
            <BaseButton
              variant="secondary"
              :icon="RefreshCw"
              :loading="deviceStore.loading"
              @click="refreshDevices"
            >
              Refresh
            </BaseButton>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon stat-icon-primary">
            <Monitor :size="24" />
          </div>
          <div class="stat-content">
            <div class="stat-label">
              Total Devices
            </div>
            <div class="stat-value">
              {{ deviceStore.deviceCount }}
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon stat-icon-success">
            <Monitor :size="24" />
          </div>
          <div class="stat-content">
            <div class="stat-label">
              Active Devices
            </div>
            <div class="stat-value">
              {{ deviceStore.activeDeviceCount }}
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon stat-icon-gray">
            <Monitor :size="24" />
          </div>
          <div class="stat-content">
            <div class="stat-label">
              Inactive Devices
            </div>
            <div class="stat-value">
              {{ deviceStore.inactiveDevices.length }}
            </div>
          </div>
        </div>
      </div>

      <!-- Filters Section -->
      <div class="filters-section">
        <ManagementSearchBar
          v-model="searchQuery"
          placeholder="Search by name, identifier, or location..."
          :result-count="filteredDevices.length"
        />

        <!-- View Mode Toggle -->
        <div class="view-toggle">
          <button
            class="toggle-btn"
            :class="{ active: viewMode === 'all' }"
            @click="viewMode = 'all'"
          >
            All
          </button>
          <button
            class="toggle-btn"
            :class="{ active: viewMode === 'active' }"
            @click="viewMode = 'active'"
          >
            Active
          </button>
          <button
            class="toggle-btn"
            :class="{ active: viewMode === 'inactive' }"
            @click="viewMode = 'inactive'"
          >
            Inactive
          </button>
        </div>
      </div>

      <!-- Devices Table -->
      <DeviceTable
        v-if="filteredDevices.length > 0"
        :devices="filteredDevices"
        :title="viewMode === 'all' ? 'All Devices' : viewMode === 'active' ? 'Active Devices' : 'Inactive Devices'"
        :show-actions="true"
        @view="handleViewDevice"
      />

      <!-- Empty State -->
      <div v-else class="empty-state">
        <div class="empty-icon-container">
          <Monitor class="empty-icon" :size="48" />
        </div>
        <h3 class="empty-title">
          No Devices Found
        </h3>
        <p class="empty-description">
          {{ hasActiveSearch ? 'Try adjusting your search or filters' : 'No fingerprint devices have been registered yet' }}
        </p>
        <BaseButton
          v-if="hasActiveSearch"
          variant="secondary"
          size="medium"
          @click="clearSearch"
        >
          Clear Search
        </BaseButton>
        <div v-else class="info-notice">
          <p>Device registration is managed by the backend. Contact your system administrator.</p>
        </div>
      </div>
    </div>

    <!-- Device Details Modal -->
    <div v-if="showDeviceModal && selectedDevice" class="modal-overlay" @click="closeDeviceModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Device Details</h2>
          <button class="modal-close" @click="closeDeviceModal">
            ×
          </button>
        </div>
        <div class="modal-body">
          <div class="device-details">
            <div class="detail-row">
              <span class="detail-label">Device Name:</span>
              <span class="detail-value">{{ selectedDevice.name || 'Unnamed Device' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Device Identifier:</span>
              <span class="detail-value device-id">{{ selectedDevice.deviceIdentifier }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Location:</span>
              <span class="detail-value">{{ selectedDevice.location || 'Not specified' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Registration Status:</span>
              <span class="detail-value status-badge" :class="[selectedDevice.isActive ? 'status-enabled' : 'status-disabled']">
                {{ selectedDevice.isActive ? 'Enabled' : 'Disabled' }}
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Connectivity Status:</span>
              <span class="detail-value status-badge" :class="[getConnectivityStatusClass(selectedDevice)]">
                {{ getConnectivityStatusText(selectedDevice) }}
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Last Seen:</span>
              <span class="detail-value">{{ selectedDevice.lastSeenAt ? new Date(selectedDevice.lastSeenAt).toLocaleString() : 'Never' }}</span>
            </div>
          </div>
          <div class="info-message">
            <p><strong>Note:</strong> Device information is managed by the backend system. To update device details, contact your system administrator.</p>
          </div>
        </div>
        <div class="modal-footer">
          <BaseButton variant="secondary" @click="closeDeviceModal">
            Close
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <Toast
      :show="toast.show"
      :message="toast.message"
      :type="toast.type"
      :duration="toast.duration"
      @close="closeToast"
    />
  </div>
</template>

<style scoped>
/* Main Container */
.device-management {
  min-height: 100vh;
  background: var(--color-slate-100);
  padding: 1rem;
  position: relative;
  overflow-x: hidden;
}

.loading-skeleton,
.container {
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.skeleton-table {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
  margin-bottom: 2rem;
}

/* Error Message */
.error-message {
  max-width: 1400px;
  margin: 2rem auto;
  background: white;
  border-radius: 20px;
  padding: 3rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
}

.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
}

.error-icon {
  color: var(--color-error);
}

/* Page Header */
.page-header {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
  border: 1px solid var(--color-gray-200);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.header-text {
  flex: 1;
  min-width: 250px;
}

.page-title {
  font-size: 2rem;
  font-weight: 800;
  color: var(--color-primary);
  margin: 0 0 0.5rem;
  letter-spacing: -0.02em;
}

.page-subtitle {
  font-size: 1rem;
  color: var(--color-gray-600);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
  border: 1px solid var(--color-gray-200);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 14px;
  flex-shrink: 0;
}

.stat-icon-primary {
  background: linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-primary) 100%);
  color: white;
}

.stat-icon-success {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
}

.stat-icon-gray {
  background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
  color: white;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--color-gray-600);
  font-weight: 600;
  margin-bottom: 0.375rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: 2rem;
  font-weight: 800;
  color: var(--color-gray-900);
  line-height: 1;
}

/* Filters Section */
.filters-section {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

/* View Toggle */
.view-toggle {
  display: flex;
  background: white;
  padding: 0.25rem;
  border-radius: 12px;
  border: 1px solid var(--color-gray-200);
  gap: 0.25rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.toggle-btn {
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-gray-600);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.toggle-btn:hover {
  color: var(--color-primary);
  background: var(--color-slate-50);
}

.toggle-btn.active {
  background: var(--color-primary-light);
  color: white;
  box-shadow: 0 2px 4px rgba(30, 58, 138, 0.2);
}

/* Empty State */
.empty-state {
  background: white;
  border-radius: 20px;
  padding: 4rem 2rem;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
  border: 1px solid var(--color-gray-200);
}

.empty-icon-container {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.empty-icon {
  color: var(--color-gray-300);
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-gray-700);
  margin: 0 0 0.5rem;
}

.empty-description {
  font-size: 1rem;
  color: var(--color-gray-500);
  margin: 0 0 2rem;
}

.info-notice {
  background: var(--color-gray-50);
  border: 1px solid var(--color-gray-200);
  border-radius: 12px;
  padding: 1rem 1.5rem;
  display: inline-block;
}

.info-notice p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-gray-500);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 20px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--color-gray-200);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
}

.modal-close {
  background: none;
  border: none;
  font-size: 2rem;
  color: var(--color-gray-400);
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: var(--color-gray-100);
  color: var(--color-gray-600);
}

.modal-body {
  padding: 2rem;
}

.device-details {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--color-slate-50);
  border-radius: 12px;
  gap: 1rem;
}

.detail-label {
  font-weight: 600;
  color: var(--color-gray-700);
  font-size: 0.9375rem;
}

.detail-value {
  font-size: 0.9375rem;
  color: var(--color-gray-900);
  text-align: right;
}

.device-id {
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
}

.info-message {
  text-align: center;
  color: var(--color-gray-600);
  padding: 2rem;
}

.info-message p {
  margin: 0.5rem 0;
}

.modal-footer {
  padding: 1.5rem 2rem;
  border-top: 1px solid var(--color-gray-200);
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

/* Status Badge Styles */
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

.status-enabled {
  background: rgba(59, 130, 246, 0.1);
  color: var(--color-primary);
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.status-disabled {
  background: rgba(107, 114, 128, 0.1);
  color: var(--color-gray-600);
  border: 1px solid rgba(107, 114, 128, 0.2);
}

/* Responsive */
@media (max-width: 768px) {
  .page-title {
    font-size: 1.5rem;
  }

  .header-content {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions button {
    flex: 1;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .filters-section {
    flex-direction: column;
  }

  .view-toggle {
    width: 100%;
  }

  .toggle-btn {
    flex: 1;
  }
}
</style>
