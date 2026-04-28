<script setup lang="ts">
import type { SessionResponseDto } from '@/api/sessions'
import type { EntityId } from '@/types'
import { Calendar, Clock, Eye, MapPin, Play, QrCode, StopCircle, Trash2 } from 'lucide-vue-next'
import { canStartSession } from '@/api/sessions'
import { LOCALE } from '@/utils/constants'
import { formatShortWeekdayDateWithYear as formatDate } from '@/utils/date'
import SessionStatusBadge from './SessionStatusBadge.vue'

defineProps<{
  sessions: SessionResponseDto[]
}>()

defineEmits<{
  start: [session: SessionResponseDto]
  end: [session: SessionResponseDto]
  delete: [id: EntityId]
  updateRoom: [session: SessionResponseDto]
  generateQr: [session: SessionResponseDto]
  viewQrCodes: [session: SessionResponseDto]
  viewDetails: [session: SessionResponseDto]
}>()

function getCourseName(session: SessionResponseDto | null) {
  if (!session)
    return 'Unknown Course'

  // Try subject fields first (most common in session data)
  if (session.subjectCode && session.subjectName) {
    return `${session.subjectCode} - ${session.subjectName}`
  }

  // Try course fields as fallback
  if (session.courseCode && session.courseName) {
    return `${session.courseCode} - ${session.courseName}`
  }

  // Individual field fallbacks
  return session.subjectName
    || session.subjectCode
    || session.courseName
    || session.courseCode
    || 'Unknown Course'
}

function getScheduleInfo(session: SessionResponseDto) {
  const parts = []
  if (session.subjectCode)
    parts.push(session.subjectCode)
  if (session.sectionName)
    parts.push(`Section ${session.sectionName}`)
  return parts.join(' • ') || 'No schedule info'
}

function getTimeRange(session: SessionResponseDto) {
  const actualStart = session.actualStartTime as string | undefined
  const actualEnd = session.actualEndTime as string | undefined
  const scheduledStart = (session.scheduledStartTime as string | undefined) || (session.startTime as string | undefined)
  const scheduledEnd = (session.scheduledEndTime as string | undefined) || (session.endTime as string | undefined)

  if (actualStart && actualEnd) {
    return `${formatTime(actualStart)} - ${formatTime(actualEnd)}`
  }
  if (scheduledStart && scheduledEnd) {
    return `${formatTime(scheduledStart)} - ${formatTime(scheduledEnd)}`
  }
  return 'Time TBD'
}

function formatTime(timeString: string | undefined) {
  if (!timeString)
    return ''

  // Prefer ISO/local datetime parsing when full timestamp values are provided.
  const parsedDate = new Date(timeString)
  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate.toLocaleTimeString(LOCALE.DEFAULT, LOCALE.TIME_FORMAT)
  }

  // Fallback for plain time strings (HH:mm or HH:mm:ss).
  const timeParts = timeString.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/)
  if (!timeParts)
    return ''

  const hour = Number.parseInt(timeParts[1], 10)
  const minutes = timeParts[2]
  if (Number.isNaN(hour))
    return ''

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
        <tr
          v-for="session in sessions"
          :key="session.id"
          class="session-row"
          tabindex="0"
          role="button"
          :aria-label="`View details for ${getCourseName(session)}`"
          @click="$emit('viewDetails', session)"
          @keydown.enter.prevent="$emit('viewDetails', session)"
          @keydown.space.prevent="$emit('viewDetails', session)"
        >
          <!-- Date Column -->
          <td class="td-date">
            <div class="date-cell">
              <Calendar class="date-icon" :size="16" />
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
              <MapPin class="room-icon" :size="16" />
              <span class="room-text">{{ session.actualRoomName || session.scheduledRoomName || 'TBD' }}</span>
            </div>
          </td>

          <!-- Time Column -->
          <td class="td-time">
            <div class="time-cell">
              <Clock class="time-icon" :size="16" />
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
                  :title="canStartSession(session) ? 'Start Session' : 'Session can only be started on its scheduled date'"
                  :disabled="!canStartSession(session)"
                  @click.stop="$emit('start', session)"
                >
                  <Play class="btn-icon" :size="16" />
                  <span>Start</span>
                </button>
                <button
                  class="btn-action btn-delete"
                  title="Delete Session"
                  @click.stop="$emit('delete', session.id)"
                >
                  <Trash2 class="btn-icon" :size="16" />
                </button>
              </template>

              <!-- Active Actions -->
              <template v-else-if="session.status === 'active'">
                <button
                  class="btn-action btn-qr"
                  title="Generate QR Code"
                  @click.stop="$emit('generateQr', session)"
                >
                  <QrCode class="btn-icon" :size="16" />
                  <span>QR</span>
                </button>
                <button
                  class="btn-action btn-view-qr"
                  title="View QR Codes"
                  @click.stop="$emit('viewQrCodes', session)"
                >
                  <Eye class="btn-icon" :size="16" />
                  <span>View</span>
                </button>
                <button
                  class="btn-action btn-end"
                  title="End Session"
                  @click.stop="$emit('end', session)"
                >
                  <StopCircle class="btn-icon" :size="16" />
                  <span>End</span>
                </button>
                <button
                  class="btn-action btn-room"
                  title="Change Room"
                  @click.stop="$emit('updateRoom', session)"
                >
                  <MapPin class="btn-icon" :size="16" />
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
  -webkit-overflow-scrolling: touch;
  /* Ensure minimum width for proper table layout */
  min-width: 0;
}

.sessions-table {
  width: 100%;
  min-width: 800px; /* Prevents crushing */
  border-collapse: collapse;
  background: white;
}

.btn-action:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  pointer-events: none;
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

.th-date { width: 13%; }
.th-course { width: 24%; }
.th-status { width: 10%; }
.th-room { width: 11%; }
.th-time { width: 15%; }
.th-actions { width: 27%; }

/* Table Body */
tbody tr {
  border-bottom: 1px solid var(--color-gray-100);
  transition: background 0.2s;
}

tbody tr:hover {
  background: var(--color-gray-50);
}

.session-row {
  cursor: pointer;
}

.session-row:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
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
  flex-wrap: nowrap;
  gap: 0.375rem;
  align-items: center;
}

.btn-action {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-gray-300);
  border-radius: 6px;
  background: white;
  font-size: 0.813rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
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

/* QR Button */
.btn-qr {
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.btn-qr:hover {
  background: var(--color-primary-bg, #eff6ff);
}

/* View QR Button */
.btn-view-qr {
  color: var(--color-secondary);
  border-color: var(--color-secondary);
}

.btn-view-qr:hover {
  background: var(--color-secondary-lighter, #f5f3ff);
}

/* Room Button */
.btn-room {
  color: var(--color-primary-lighter);
  border-color: var(--color-primary-lighter);
  padding: 0.5rem 0.625rem;
  min-width: auto;
}

.btn-room:hover {
  background: var(--color-info-lighter);
}

/* Delete Button */
.btn-delete {
  color: var(--color-error-dark);
  border-color: var(--color-error-dark);
  padding: 0.5rem 0.625rem;
  min-width: auto;
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

/* Handle narrower viewports - DevTools open scenarios */
@media (max-width: 1400px) {
  .sessions-table {
    min-width: 700px;
  }

  .btn-action span {
    font-size: 0.813rem;
  }

  th, td {
    padding: 0.875rem 0.75rem;
  }
}

@media (max-width: 1200px) {
  .sessions-table {
    min-width: 650px;
  }

  .action-buttons {
    gap: 0.375rem;
  }

  .btn-action {
    padding: 0.5rem 0.75rem;
  }

  th, td {
    padding: 0.75rem 0.625rem;
    font-size: 0.813rem;
  }
}

@media (max-width: 1024px) {
  .sessions-table {
    min-width: 600px;
  }

  .th-time,
  .td-time {
    display: none;
  }

  th, td {
    padding: 0.75rem 0.5rem;
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

  th, td {
    padding: 0.75rem;
    font-size: 0.813rem;
  }

  th {
    font-size: 0.75rem;
  }

  .date-text {
    font-size: 0.813rem;
  }

  .course-name {
    font-size: 0.875rem;
  }

  .schedule-info {
    font-size: 0.75rem;
  }

  .action-buttons {
    gap: 0.375rem;
  }

  .btn-action {
    padding: 0.5rem;
    min-width: 32px;
  }
}

@media (max-width: 480px) {
  .table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  th, td {
    padding: 0.5rem;
    font-size: 0.75rem;
  }

  th {
    font-size: 0.688rem;
    padding: 0.75rem 0.5rem;
  }

  .th-date { width: auto; min-width: 100px; }
  .th-course { width: auto; min-width: 150px; }
  .th-status { width: auto; min-width: 90px; }
  .th-actions { width: auto; min-width: 120px; }

  .date-icon,
  .room-icon,
  .time-icon,
  .btn-icon {
    width: 14px;
    height: 14px;
  }

  .date-cell,
  .room-cell,
  .time-cell {
    gap: 0.375rem;
  }

  .course-cell {
    gap: 0.125rem;
  }

  .date-text,
  .room-text,
  .time-text {
    font-size: 0.75rem;
  }

  .course-name {
    font-size: 0.813rem;
  }

  .schedule-info {
    font-size: 0.688rem;
  }

  .action-buttons {
    gap: 0.25rem;
    flex-wrap: wrap;
  }

  .btn-action {
    padding: 0.375rem;
    min-width: 28px;
    border-radius: 4px;
  }

  .status-readonly {
    font-size: 0.75rem;
  }
}

@media (max-width: 360px) {
  th, td {
    padding: 0.375rem;
    font-size: 0.688rem;
  }

  th {
    font-size: 0.625rem;
    padding: 0.625rem 0.375rem;
  }

  .btn-action {
    padding: 0.25rem;
    min-width: 24px;
  }

  .date-text,
  .room-text,
  .time-text,
  .course-name,
  .schedule-info {
    font-size: 0.688rem;
  }
}
</style>
