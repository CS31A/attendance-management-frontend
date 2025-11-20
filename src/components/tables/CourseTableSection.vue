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
              @change="$emit('set-items-per-page', parseInt($event.target.value))"
              class="items-select"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>
        
        <div class="pagination-controls">
          <button 
            @click="$emit('previous-page')" 
            :disabled="!pagination.hasPreviousPage"
            class="pagination-btn"
            :class="{ disabled: !pagination.hasPreviousPage }"
          >
            <ChevronLeft class="pagination-icon" size="16" />
            Previous
          </button>
          
          <div class="page-numbers">
            <button 
              v-for="page in Math.min(5, pagination.totalPages)" 
              :key="page"
              @click="$emit('go-to-page', page)"
              class="page-btn"
              :class="{ active: page === pagination.currentPage }"
            >
              {{ page }}
            </button>
            <span v-if="pagination.totalPages > 5" class="page-ellipsis">...</span>
            <button 
              v-if="pagination.totalPages > 5 && pagination.currentPage < pagination.totalPages - 2"
              @click="$emit('go-to-page', pagination.totalPages)"
              class="page-btn"
            >
              {{ pagination.totalPages }}
            </button>
          </div>
          
          <button 
            @click="$emit('next-page')" 
            :disabled="!pagination.hasNextPage"
            class="pagination-btn"
            :class="{ disabled: !pagination.hasNextPage }"
          >
            Next
            <ChevronRight class="pagination-icon" size="16" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import CourseTable from './CourseTable.vue'
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-vue-next'

defineProps({
  courses: {
    type: Array,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  pagination: {
    type: Object,
    default: null
  }
})

defineEmits(['edit', 'delete', 'next-page', 'previous-page', 'go-to-page', 'set-items-per-page'])
</script>

<style scoped>
.table-section {
  margin-bottom: 2rem;
  animation: fadeIn 0.8s ease-out;
}

.table-header {
  margin-bottom: 1rem;
}

.table-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.table-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #1e3a8a;
}

.table-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: #1e3a8a;
}

.table-title h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Pagination Styles */
.pagination-section {
  background: #f8fafc;
  border-top: 1px solid #e5e7eb;
  padding: 1.5rem;
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
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
}

.items-per-page {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.items-per-page label {
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
}

.items-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.items-select:focus {
  outline: none;
  border-color: #1e3a8a;
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
  padding: 0.5rem 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  color: #475569;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(.disabled) {
  background: #e2e8f0;
  border-color: #cbd5e1;
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
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  color: #475569;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover {
  background: #e2e8f0;
  border-color: #cbd5e1;
}

.page-btn.active {
  background: #1e3a8a;
  border-color: #1e3a8a;
  color: white;
}

.page-ellipsis {
  color: #9ca3af;
  font-size: 0.875rem;
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
