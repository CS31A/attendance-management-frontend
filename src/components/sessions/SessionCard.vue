<script setup>
import { Calendar, Clock, MapPin } from 'lucide-vue-next'
import SessionStatusBadge from './SessionStatusBadge.vue'

/**
 * Props
 */
defineProps({
  session: {
    type: Object,
    required: true,
  },
})

/**
 * Format date to readable string
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
  if (!dateString)
    return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format time to readable string
 * @param {string} dateString - ISO datetime string
 * @returns {string} Formatted time
 */
function formatTime(dateString) {
  if (!dateString)
    return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="session-card" :class="`session-${session.status}`">
    <div class="session-header">
      <div class="session-status">
        <SessionStatusBadge :status="session.status" />
      </div>
      <div class="session-date">
        {{ formatDate(session.sessionDate) }}
      </div>
    </div>

    <div class="session-body">
      <h3 class="session-title">
        {{ session.subjectCode }} - {{ session.subjectName }}
      </h3>
      <p class="session-section">
        {{ session.sectionName }}
      </p>

      <div class="session-details">
        <div class="detail-item">
          <Calendar :size="16" />
          <span>{{ formatTime(session.actualStartTime || session.sessionDate) }}</span>
        </div>

        <div v-if="session.actualRoomName || session.scheduledRoomName" class="detail-item">
          <MapPin :size="16" />
          <span>{{ session.actualRoomName || session.scheduledRoomName }}</span>
        </div>

        <div v-if="session.status === 'active' && session.attendanceCutOff" class="detail-item">
          <Clock :size="16" />
          <span>Cutoff: {{ formatTime(session.attendanceCutOff) }}</span>
        </div>
      </div>

      <div v-if="session.description" class="session-description">
        <p>{{ session.description }}</p>
      </div>
    </div>

    <div v-if="session.status === 'active'" class="session-footer">
      <div class="active-indicator">
        <div class="pulse" />
        <span>Session is live</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.session-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  border-left: 4px solid var(--color-gray-200);
}

.session-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.session-card.session-active {
  border-left-color: var(--color-success);
}

.session-card.session-not_started {
  border-left-color: var(--color-primary-lightest);
}

.session-card.session-ended {
  border-left-color: var(--color-gray-500);
}

.session-card.session-cancelled {
  border-left-color: var(--color-error);
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: var(--color-gray-50);
  border-bottom: 1px solid var(--color-gray-200);
}

.session-date {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-gray-500);
}

.session-body {
  padding: 16px;
}

.session-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-gray-800);
  margin: 0 0 4px 0;
}

.session-section {
  font-size: 14px;
  color: var(--color-gray-500);
  margin: 0 0 16px 0;
}

.session-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--color-gray-600);
}

.detail-item svg {
  color: var(--color-gray-500);
  flex-shrink: 0;
}

.session-description {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--color-gray-200);
}

.session-description p {
  font-size: 14px;
  color: var(--color-gray-500);
  margin: 0;
  line-height: 1.5;
}

.session-footer {
  padding: 12px 16px;
  background: var(--color-success-bg);
  border-top: 1px solid var(--color-success-light);
}

.active-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-success);
}

.pulse {
  width: 8px;
  height: 8px;
  background: var(--color-success);
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}

@media (max-width: 768px) {
  .session-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .session-title {
    font-size: 16px;
  }

  .detail-item {
    font-size: 13px;
  }
}
</style>
