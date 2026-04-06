<script setup>
import { BookOpen, Calendar, Edit, Trash2 } from 'lucide-vue-next'
import { formatShortTableDate as formatDate } from '@/utils/date'

defineProps({
  courses: {
    type: Array,
    required: true,
  },
})

defineEmits(['edit', 'delete'])
</script>

<template>
  <div class="app-table-wrapper">
    <table class="app-table courses-table">
      <thead>
        <tr>
          <th class="th-id">
            ID
          </th>
          <th class="th-name">
            Course Name
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
        <tr v-for="course in courses" :key="course.id" class="course-row">
          <td class="td-id">
            <span class="id-text">{{ course.id }}</span>
          </td>
          <td class="td-name">
            <div class="app-cell-name">
              <BookOpen class="course-icon" :size="18" />
              <span class="course-name">{{ course.name }}</span>
            </div>
          </td>
          <td class="td-created">
            <div class="app-cell-date">
              <Calendar class="date-icon" :size="16" />
              <span class="date-text">{{ formatDate(course?.createdAt) }}</span>
            </div>
          </td>
          <td class="td-updated">
            <div class="app-cell-date">
              <Calendar class="date-icon" :size="16" />
              <span class="date-text">{{ formatDate(course?.updatedAt) }}</span>
            </div>
          </td>
          <td class="td-actions">
            <div class="app-cell-actions">
              <button class="app-btn-icon app-btn-edit" title="Edit Course" @click="$emit('edit', course)">
                <Edit :size="16" />
              </button>
              <button class="app-btn-icon app-btn-delete" title="Delete Course" @click="$emit('delete', course.id)">
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
.th-name { width: 35%; }
.th-created, .th-updated { width: 20%; text-align: left; }
.th-actions { width: 15%; text-align: center; }

/* Custom Cell Styles */
.id-text {
  color: var(--color-gray-500);
  font-family: monospace;
  font-weight: 600;
}

.course-icon {
  color: var(--color-primary);
  flex-shrink: 0;
}

.course-name {
  font-size: 0.8125rem;
}

/* Responsive Sticky Columns */
@media (max-width: 768px) {
  .courses-table {
    min-width: 500px;
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
  .courses-table {
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
  .course-name,
  .date-text {
    font-size: 0.75rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

@media (max-width: 480px) {
  .courses-table {
    min-width: 450px;
  }

  .th-name, .td-name { min-width: 100px; }
  .th-actions, .td-actions { min-width: 80px; }
}

@media (max-width: 320px) {
  .courses-table {
    min-width: 400px;
  }

  .course-name, .date-text { font-size: 0.6875rem; }
  .th-name, .td-name { min-width: 80px; }
  .th-actions, .td-actions { min-width: 70px; }
}
</style>
