<script setup>
import { Calendar, Clock, MapPin, Play, StopCircle, Trash2 } from 'lucide-vue-next'
import SessionStatusBadge from './SessionStatusBadge.vue'

defineProps({
  sessions: {
    type: Array,
    required: true,
  },
})

defineEmits(['start', 'end', 'delete', 'updateRoom'])

// Helper functions
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

function getCourseName(session) {
  return session.courseName || session.courseCode || 'Unknown Course'
}

function getScheduleInfo(session) {
  const parts = []
  if (session.scheduleCode)
    parts.push(session.scheduleCode)
  if (session.section)
    parts.push(`Section ${session.section}`)
  return parts.join(' • ') || 'No schedule info'
}

function getTimeRange(session) {
  if (session.actualStartTime && session.actualEndTime) {
    return `${formatTime(session.actualStartTime)} - ${formatTime(session.actualEndTime)}`
  }
  if (session.scheduledStartTime && session.scheduledEndTime) {
    return `${formatTime(session.scheduledStartTime)} - ${formatTime(session.scheduledEndTime)}`
  }
  return 'Time TBD'
}

function formatTime(timeString) {
  if (!timeString)
    return ''

  // Handle HH:mm:ss format
  const [hours, minutes] = timeString.split(':')
  const hour = Number.parseInt(hours, 10)
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12

  return `${displayHour}:${minutes} ${period}`
}
</script>

<template>
  <div class="table-wrapper">
    <table class="sessions-table">
      <thead>
        <tr>
          <th class="th-date">
            Date
          </th>
          <th class="th-course">
            Course/Schedule
          </th>
          <th class="th-status">
            Status
          </th>
          <th class="th-room">
            Room
          </th>
          <th class="th-time">
            Time
          </th>
          <th class="th-actions">
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="session in sessions" :key="session.id" class="session-row">
          <!-- Date Column -->
          <td class="td-date">
            <div class="date-cell">
              <Calendar class="date-icon" size="16" />
              <span class="date-text">{{ formatDate(session.sessionDate) }}</span>
            </div>
          </td>

          <!-- Course/Schedule Column -->
          <td class="td-course">
            <div class="course-cell">
              <span class="course-name">{{ getCourseName(session) }}</span>
              <span class="schedule-info">{{ getScheduleInfo(session) }}</span>
            </div>
          </td>

          <!-- Status Column -->
          <td class="td-status">
            <SessionStatusBadge :status="session.status" />
          </td>

          <!-- Room Column -->
          <td class="td-room">
            <div class="room-cell">
              <MapPin class="room-icon" size="16" />
              <span class="room-text">{{ session.actualRoomName || session.scheduledRoomName || 'TBD' }}</span>
            </div>
          </td>

          <!-- Time Column -->
          <td class="td-time">
            <div class="time-cell">
              <Clock class="time-icon" size="16" />
              <span class="time-text">{{ getTimeRange(session) }}</span>
            </div>
          </td>

          <!-- Actions Column -->
          <td class="td-actions">
            <div class="action-buttons">
              <!-- Not Started Actions -->
              <template v-if="session.status === 'not_started'">
                <button
                  class="btn-action btn-start"
                  title="Start Session"
                  @click="$emit('start', session)"
                >
                  <Play class="btn-icon" size="16" />
                  <span>Start</span>
                </button>
                <button
                  class="btn-action btn-delete"
                  title="Delete Session"
                  @click="$emit('delete', session.id)"
                >
                  <Trash2 class="btn-icon" size="16" />
                </button>
              </template>

              <!-- Active Actions -->
              <template v-else-if="session.status === 'active'">
                <button
                  class="btn-action btn-end"
                  title="End Session"
                  @click="$emit('end', session)"
                >
                  <StopCircle class="btn-icon" size="16" />
                  <span>End</span>
                </button>
                <button
                  class="btn-action btn-room"
                  title="Change Room"
                  @click="$emit('updateRoom', session)"
                >
                  <MapPin class="btn-icon" size="16" />
                </button>
              </template>

              <!-- Completed/Cancelled - View Only -->
              <template v-else>
                <span class="status-readonly">View Only</span>
              </template>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-wrapper {
  overflow-x: auto;
}

.sessions-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

/* Table Header */
thead {
  background: var(--color-gray-50);
  border-bottom: 2px solid var(--color-gray-200);
}

th {
  padding: 1rem;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-gray-700);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.th-date { width: 15%; }
.th-course { width: 25%; }
.th-status { width: 12%; }
.th-room { width: 12%; }
.th-time { width: 16%; }
.th-actions { width: 20%; }

/* Table Body */
tbody tr {
  border-bottom: 1px solid var(--color-gray-100);
  transition: background 0.2s;
}

tbody tr:hover {
  background: var(--color-gray-50);
}

td {
  padding: 1rem;
  font-size: 0.875rem;
  color: var(--color-gray-700);
}

/* Date Cell */
.date-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-icon {
  color: var(--color-gray-500);
  flex-shrink: 0;
}

.date-text {
  font-weight: 500;
}

/* Course Cell */
.course-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.course-name {
  font-weight: 600;
  color: var(--color-gray-800);
}

.schedule-info {
  font-size: 0.813rem;
  color: var(--color-gray-500);
}

/* Room Cell */
.room-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.room-icon {
  color: var(--color-gray-500);
  flex-shrink: 0;
}

.room-text {
  font-weight: 500;
}

/* Time Cell */
.time-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.time-icon {
  color: var(--color-gray-500);
  flex-shrink: 0;
}

.time-text {
  font-weight: 500;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.btn-action {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  border: 1px solid var(--color-gray-300);
  border-radius: 6px;
  background: white;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-action:hover {
  background: var(--color-gray-50);
}

.btn-icon {
  flex-shrink: 0;
}

/* Start Button */
.btn-start {
  color: var(--color-success);
  border-color: var(--color-success);
}

.btn-start:hover {
  background: var(--color-success-bg);
}

/* End Button */
.btn-end {
  color: var(--color-error-dark);
  border-color: var(--color-error-dark);
}

.btn-end:hover {
  background: var(--color-error-lighter);
}

/* Room Button */
.btn-room {
  color: var(--color-primary-lighter);
  border-color: var(--color-primary-lighter);
  padding: 0.5rem;
}

.btn-room:hover {
  background: var(--color-info-lighter);
}

/* Delete Button */
.btn-delete {
  color: var(--color-error-dark);
  border-color: var(--color-error-dark);
  padding: 0.5rem;
}

.btn-delete:hover {
  background: var(--color-error-lighter);
}

/* Read Only Status */
.status-readonly {
  font-size: 0.813rem;
  color: var(--color-gray-400);
  font-style: italic;
}

/* Responsive */
@media (max-width: 1024px) {
  .th-time,
  .td-time {
    display: none;
  }
}

@media (max-width: 768px) {
  .th-room,
  .td-room,
  .th-time,
  .td-time {
    display: none;
  }

  .btn-action span {
    display: none;
  }
}
</style>
