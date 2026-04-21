<script setup>
import { BookOpen, Clock, MapPin, User } from 'lucide-vue-next'
import { LOCALE } from '@/utils/constants'

defineProps({
  sessions: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

function formatTime(isoString) {
  if (!isoString)
    return '-'
  return new Date(isoString).toLocaleTimeString(LOCALE.DEFAULT, LOCALE.TIME_FORMAT_SHORT)
}
</script>

<template>
  <div class="active-sessions-widget">
    <div class="widget-header">
      <h3>Active Sessions</h3>
      <span class="badge">{{ sessions.length }} Live</span>
    </div>

    <div class="table-container">
      <table v-if="sessions.length > 0">
        <thead>
          <tr>
            <th>Subject</th>
            <th>Room</th>
            <th>Instructor</th>
            <th>Started</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="session in sessions" :key="session.id">
            <td>
              <div class="subject-info">
                <div class="icon-box">
                  <BookOpen class="icon" />
                </div>
                <div>
                  <div class="subject-code">
                    {{ session.subjectCode }}
                  </div>
                  <div class="section-name">
                    {{ session.sectionName }}
                  </div>
                </div>
              </div>
            </td>
            <td>
              <div class="cell-flex">
                <MapPin class="cell-icon" />
                {{ session.actualRoomName || session.scheduledRoomName }}
              </div>
            </td>
            <td>
              <div class="cell-flex">
                <User class="cell-icon" />
                {{ session.startedByName || 'Unknown' }}
              </div>
            </td>
            <td>
              <div class="cell-flex">
                <Clock class="cell-icon" />
                {{ formatTime(session.actualStartTime) }}
              </div>
            </td>
            <td>
              <span class="status-pill active">Active</span>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else class="empty-state">
        <div class="empty-icon-wrapper">
          <Clock class="empty-icon" />
        </div>
        <p>No active sessions at the moment</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.active-sessions-widget {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-primary);
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: all var(--transition-base);
  position: relative;
}

.active-sessions-widget::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--gradient-primary-horizontal);
  opacity: 0;
  transition: opacity var(--transition-base);
  z-index: 1;
}

.active-sessions-widget:hover {
  box-shadow: var(--shadow-lg);
  border-color: var(--color-primary-lighter);
}

.active-sessions-widget:hover::before {
  opacity: 1;
}

.widget-header {
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
}

h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
}

.badge {
  background: var(--color-success);
  color: white;
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid var(--color-success);
  box-shadow: var(--shadow-sm);
}

.table-container {
  flex: 1;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  text-align: left;
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  font-weight: 600;
  background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
  border-bottom: 2px solid var(--border-primary);
}

tbody tr {
  transition: all var(--transition-fast);
}

tbody tr:hover {
  background: var(--bg-hover);
  transform: scale(1.01);
}

td {
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--border-light);
  color: var(--text-secondary);
  font-size: 0.875rem;
  transition: all var(--transition-fast);
}

tr:last-child td {
  border-bottom: none;
}

.subject-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.icon-box {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--color-info), var(--color-info-light));
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
}

tbody tr:hover .icon-box {
  transform: scale(1.1) rotate(5deg);
  box-shadow: var(--shadow-md);
}

.icon {
  width: 18px;
  height: 18px;
}

.subject-code {
  font-weight: 600;
  color: var(--text-primary);
}

.section-name {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.cell-flex {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.cell-icon {
  width: 16px;
  height: 16px;
  color: var(--text-muted);
  transition: all var(--transition-base);
}

tbody tr:hover .cell-icon {
  color: var(--color-primary);
}

.status-pill {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
  box-shadow: var(--shadow-sm);
}

.status-pill.active {
  background: linear-gradient(135deg, var(--color-success-bg), var(--color-success-light));
  color: var(--color-success);
  position: relative;
  padding-left: calc(var(--spacing-md) + 10px);
  border: 1px solid var(--color-success);
}

.status-pill.active::before {
  content: '';
  position: absolute;
  left: var(--spacing-sm);
  width: 6px;
  height: 6px;
  background: var(--color-success);
  border-radius: var(--radius-full);
  animation: pulseDot 2s ease infinite;
}

@keyframes pulseDot {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 0 0 var(--color-success);
  }
  50% {
    opacity: 0.7;
    box-shadow: 0 0 0 4px transparent;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  color: var(--text-muted);
}

.empty-icon-wrapper {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary));
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-md);
  box-shadow: var(--shadow-sm);
}

.empty-icon {
  width: 32px;
  height: 32px;
  color: var(--text-muted);
}
</style>
