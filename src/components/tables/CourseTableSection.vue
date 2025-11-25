<script setup>
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import CourseTable from './CourseTable.vue'

defineProps({
  courses: {
    type: Array,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  pagination: {
    type: Object,
    default: null,
  },
})

defineEmits(['edit', 'delete', 'nextPage', 'previousPage', 'goToPage', 'setItemsPerPage'])
</script>

<template>
  <div class="table-section">
    <div class="table-header">
      <div class="table-title">
        <BookOpen class="table-icon" size="24" />
        <h2>{{ title }} ({{ pagination ? pagination.totalCourses : courses.length }})</h2>
      </div>
    </div>

    <div class="table-container">
      <CourseTable
        :courses="courses"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
      />

      <!-- Pagination Controls -->
      <div v-if="pagination" class="pagination-section">
        <div class="pagination-info">
          <span class="pagination-text">
            Showing {{ (pagination.currentPage - 1) * pagination.itemsPerPage + 1 }} to
            {{ Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalCourses) }} of
            {{ pagination.totalCourses }} courses
          </span>
          <div class="items-per-page">
            <label for="itemsPerPage">Show:</label>
            <select
              id="itemsPerPage"
              :value="pagination.itemsPerPage"
              class="items-select"
              @change="$emit('setItemsPerPage', parseInt($event.target.value))"
            >
              <option value="5">
                5
              </option>
              <option value="10">
                10
              </option>
              <option value="20">
                20
              </option>
              <option value="50">
                50
              </option>
            </select>
          </div>
        </div>

        <div class="pagination-controls">
          <button
            :disabled="!pagination.hasPreviousPage"
            class="pagination-btn"
            :class="{ disabled: !pagination.hasPreviousPage }"
            @click="$emit('previousPage')"
          >
            <ChevronLeft class="pagination-icon" size="16" />
            Previous
          </button>

          <div class="page-numbers">
            <button
              v-for="page in Math.min(5, pagination.totalPages)"
              :key="page"
              class="page-btn"
              :class="{ active: page === pagination.currentPage }"
              @click="$emit('goToPage', page)"
            >
              {{ page }}
            </button>
            <span v-if="pagination.totalPages > 5" class="page-ellipsis">...</span>
            <button
              v-if="pagination.totalPages > 5 && pagination.currentPage < pagination.totalPages - 2"
              class="page-btn"
              @click="$emit('goToPage', pagination.totalPages)"
            >
              {{ pagination.totalPages }}
            </button>
          </div>

          <button
            :disabled="!pagination.hasNextPage"
            class="pagination-btn"
            :class="{ disabled: !pagination.hasNextPage }"
            @click="$emit('nextPage')"
          >
            Next
            <ChevronRight class="pagination-icon" size="16" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.table-section {
  margin-bottom: 2rem;
}

.table-header {
  margin-bottom: 1rem;
}

.table-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--color-gray-200);
  overflow: hidden;
}

.table-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--color-primary);
}

.table-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--color-primary);
}

.table-title h2 {
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Pagination Styles */
.pagination-section {
  background: var(--color-slate-100);
  border-top: 1px solid var(--color-gray-200);
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.pagination-info {
  display: flex;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.pagination-text {
  color: var(--color-gray-500);
  font-size: 0.8125rem;
  font-weight: 500;
}

.items-per-page {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.items-per-page label {
  color: var(--color-gray-500);
  font-size: 0.8125rem;
  font-weight: 500;
}

.items-select {
  padding: 0.375rem 0.5rem;
  border: 1px solid var(--color-gray-300);
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.items-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.1);
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.pagination-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  background: var(--color-slate-100);
  border: 1px solid var(--color-slate-200);
  border-radius: 0.5rem;
  color: var(--color-slate-600);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(.disabled) {
  background: var(--color-slate-200);
  border-color: var(--color-slate-300);
}

.pagination-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-icon {
  width: 1rem;
  height: 1rem;
}

.page-numbers {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.page-btn {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-slate-100);
  border: 1px solid var(--color-slate-200);
  border-radius: 0.5rem;
  color: var(--color-slate-600);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover {
  background: var(--color-slate-200);
  border-color: var(--color-slate-300);
}

.page-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.page-ellipsis {
  color: var(--color-gray-400);
  font-size: 0.8125rem;
  padding: 0 0.5rem;
}

/* Responsive pagination */
@media (max-width: 768px) {
  .table-section {
    margin-bottom: 1.5rem;
  }

  .table-container {
    border-radius: 12px;
  }

  .table-title h2 {
    font-size: 1.25rem;
  }

  .pagination-section {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
    padding: 1rem;
  }

  .pagination-info {
    justify-content: center;
    flex-direction: column;
    gap: 1rem;
  }

  .pagination-controls {
    justify-content: center;
  }

  .page-numbers {
    flex-wrap: wrap;
    justify-content: center;
  }
}

@media (max-width: 640px) {
  .table-section {
    margin-bottom: 1rem;
  }

  .table-title h2 {
    font-size: 1.125rem;
  }

  .pagination-section {
    padding: 0.75rem;
  }

  .pagination-text {
    font-size: 0.8rem;
  }

  .pagination-btn {
    padding: 0.5rem;
    font-size: 0.8rem;
  }

  .pagination-icon {
    width: 0.875rem;
    height: 0.875rem;
  }
}
</style>
