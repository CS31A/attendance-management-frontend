<script setup>
import { BookOpen, Calendar, Edit, Hash, Trash2 } from 'lucide-vue-next'

defineProps({
  subjects: {
    type: Array,
    required: true,
  },
})

defineEmits(['edit', 'delete'])

// Format date for display
function formatDate(value) {
  if (!value)
    return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime()))
    return 'N/A'

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date)
}
</script>

<template>
  <div class="app-table-wrapper">
    <table class="app-table subjects-table">
      <thead>
        <tr>
          <th class="th-id">
            ID
          </th>
          <th class="th-code">
            Code
          </th>
          <th class="th-name">
            Subject Name
          </th>
          <th class="th-created">
            Created
          </th>
          <th class="th-updated">
            Updated
          </th>
          <th class="th-actions">
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="subject in subjects" :key="subject.id" class="subject-row">
          <td class="td-id">
            <span class="id-text">{{ subject.id }}</span>
          </td>
          <td class="td-code">
            <div class="code-cell">
              <Hash class="code-icon" :size="16" />
              <span class="code-text">{{ subject.code }}</span>
            </div>
          </td>
          <td class="td-name">
            <div class="app-cell-name">
              <BookOpen class="subject-icon" :size="18" />
              <span class="subject-name">{{ subject.name }}</span>
            </div>
          </td>
          <td class="td-created">
            <div class="app-cell-date">
              <Calendar class="date-icon" :size="16" />
              <span class="date-text">{{ formatDate(subject?.createdAt) }}</span>
            </div>
          </td>
          <td class="td-updated">
            <div class="app-cell-date">
              <Calendar class="date-icon" :size="16" />
              <span class="date-text">{{ formatDate(subject?.updatedAt) }}</span>
            </div>
          </td>
          <td class="td-actions">
            <div class="app-cell-actions">
              <button class="app-btn-icon app-btn-edit" title="Edit Subject" @click="$emit('edit', subject)">
                <Edit :size="16" />
              </button>
              <button class="app-btn-icon app-btn-delete" title="Delete Subject" @click="$emit('delete', subject.id)">
                <Trash2 :size="16" />
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
/* Specific column widths */
.th-id { width: 8%; min-width: 60px; }
.th-code { width: 15%; min-width: 100px; }
.th-name { width: 25%; }
.th-created, .th-updated { width: 20%; text-align: left; }
.th-actions { width: 12%; text-align: center; }

/* Custom Cell Styles */
.id-text {
  color: var(--color-gray-500);
  font-family: monospace;
  font-weight: 600;
}

.td-code {
  font-family: monospace;
  font-weight: 600;
  color: var(--color-gray-600);
}

.code-cell {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.code-icon {
  color: var(--color-gray-500);
  flex-shrink: 0;
}

.subject-icon {
  color: var(--color-primary);
  flex-shrink: 0;
}

.subject-name {
  font-size: 0.8125rem;
}

/* Responsive Sticky Columns */
@media (max-width: 768px) {
  .subjects-table {
    min-width: 600px;
  }

  .th-name,
  .td-name {
    position: sticky;
    left: 0;
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
    z-index: 10;
  }

  .td-name {
    background: white;
    border-right: 2px solid var(--color-gray-200);
  }

  .th-name {
    color: white;
  }
}

@media (max-width: 640px) {
  .subjects-table {
    min-width: 100%;
  }

  .th-name,
  .td-name {
    width: auto;
    min-width: 120px;
  }

  .th-actions,
  .td-actions {
    width: 100px;
    min-width: 100px;
    position: sticky;
    right: 0;
    background: white;
    border-left: 2px solid var(--color-gray-200);
    z-index: 5;
  }

  .th-actions {
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
    color: white;
  }

  /* Truncate text */
  .subject-name,
  .date-text,
  .code-text {
    font-size: 0.75rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

@media (max-width: 480px) {
  .subjects-table {
    min-width: 500px;
  }

  .th-name, .td-name { min-width: 100px; }
  .th-actions, .td-actions { min-width: 80px; }
}

@media (max-width: 320px) {
  .subjects-table {
    min-width: 450px;
  }

  .subject-name, .date-text, .code-text { font-size: 0.6875rem; }
  .th-name, .td-name { min-width: 80px; }
  .th-actions, .td-actions { min-width: 70px; }
}
</style>
