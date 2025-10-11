<script setup>
import { ref, computed } from 'vue'
import CreateStudentModal from '@/components/CreateStudentModal.vue'
import { useStudentStore } from '@/stores/studentstore'

const studentStore = useStudentStore()

// Use computed to make it reactive
const students = computed(() => studentStore.students)
const showAddStudent = ref(false)

// Fetch all students on mount (you'll need to add this API call)
const fetchStudents = async () => {
  try {
    // TODO: Replace with your actual API endpoint
    // const response = await fetch('http://localhost:YOUR_PORT/api/students')
    // const data = await response.json()
    // data.forEach(student => studentStore.addStudent(student))
    console.log('Fetch students from API')
  } catch (error) {
    console.error('Error fetching students:', error)
  }
}

// Handle student creation from modal
const handleCreateStudent = async (studentData) => {
  try {
    // TODO: Replace with your actual API endpoint
    // const response = await fetch('http://localhost:YOUR_PORT/api/students', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(studentData)
    // })

    // if (!response.ok) {
    //   throw new Error('Failed to create student')
    // }

    // const newStudent = await response.json()
    
    // For now, just add to store (remove this when API is ready)
    studentStore.addStudent(studentData)
    showAddStudent.value = false
    
    alert('Student created successfully!')
  } catch (error) {
    console.error('Error creating student:', error)
    alert('Failed to create student. Please try again.')
  }
}

// Handle modal cancel
const handleCancel = () => {
  showAddStudent.value = false
}

// Delete student
const deleteStudent = async (id) => {
  if (!confirm('Are you sure you want to delete this student?')) return

  try {
    // TODO: Replace with your actual API endpoint
    // await fetch(`http://localhost:YOUR_PORT/api/students/${id}`, {
    //   method: 'DELETE'
    // })

    studentStore.removeStudent(id)
    alert('Student deleted successfully!')
  } catch (error) {
    console.error('Error deleting student:', error)
    alert('Failed to delete student.')
  }
}

// Load students on component mount
// fetchStudents()
</script>

<template>
  <div class="student-management">
    <div class="container">
      <!-- Header Section -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-text">
            <h1 class="page-title">Student Management</h1>
            <p class="page-subtitle">Manage and organize your students</p>
          </div>
          <button @click="showAddStudent = true" class="btn-add-student">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            <span>Add Student</span>
          </button>
        </div>
      </div>

      <!-- Students Grid -->
      <div class="students-grid" v-if="students.length > 0">
        <div v-for="student in students" :key="student.id" class="student-card">
          <!-- Card Header with Gradient -->
          <div class="card-header">
            <div class="student-info">
              <div class="avatar-container">
                <svg class="avatar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
              </div>
              <div class="student-details">
                <h3 class="student-name">{{ student.firstName }} {{ student.lastName }}</h3>
                <p class="student-username">@{{ student.username }}</p>
              </div>
            </div>
          </div>
          
          <!-- Card Body -->
          <div class="card-body">
            <div class="info-row">
              <svg class="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              <span class="info-text">{{ student.email }}</span>
            </div>

            <div class="card-actions">
              <button @click="deleteStudent(student.id)" class="btn-delete">
                <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <div class="empty-icon-container">
          <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
          </svg>
        </div>
        <h3 class="empty-title">No Students Yet</h3>
        <p class="empty-description">Get started by adding your first student to the system</p>
        <button @click="showAddStudent = true" class="btn-empty-action">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          <span>Add Your First Student</span>
        </button>
      </div>
    </div>

    <!-- Modal Component -->
    <CreateStudentModal
      v-if="showAddStudent"
      @create="handleCreateStudent"
      @cancel="handleCancel"
    />
  </div>
</template>

<style scoped>
/* Main Container */
.student-management {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
}

/* Header Section */
.page-header {
  margin-bottom: 3rem;
  animation: fadeInDown 0.6s ease-out;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.header-text {
  flex: 1;
  min-width: 250px;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: white;
  margin: 0 0 0.5rem 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-subtitle {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  font-weight: 300;
}

/* Add Student Button */
.btn-add-student {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  color: #667eea;
  border: none;
  padding: 0.875rem 1.75rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.btn-add-student:hover {
  background: #f8f9ff;
  transform: translateY(-2px);
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.15), 0 4px 6px rgba(0, 0, 0, 0.1);
}

.btn-add-student:active {
  transform: translateY(0);
}

.btn-add-student .icon {
  width: 1.25rem;
  height: 1.25rem;
}

/* Students Grid */
.students-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  animation: fadeIn 0.8s ease-out;
}

/* Student Card */
.student-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  animation: fadeInUp 0.5s ease-out backwards;
}

.student-card:nth-child(1) { animation-delay: 0.1s; }
.student-card:nth-child(2) { animation-delay: 0.2s; }
.student-card:nth-child(3) { animation-delay: 0.3s; }
.student-card:nth-child(4) { animation-delay: 0.4s; }
.student-card:nth-child(5) { animation-delay: 0.5s; }
.student-card:nth-child(6) { animation-delay: 0.6s; }

.student-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04);
}

/* Card Header */
.card-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1.5rem;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar-container {
  background: rgba(255, 255, 255, 0.25);
  padding: 0.75rem;
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.avatar-icon {
  width: 2rem;
  height: 2rem;
  color: white;
}

.student-details {
  flex: 1;
}

.student-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
  margin: 0 0 0.25rem 0;
}

.student-username {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
  font-weight: 400;
}

/* Card Body */
.card-body {
  padding: 1.5rem;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 8px;
}

.info-icon {
  width: 1.125rem;
  height: 1.125rem;
  color: #6b7280;
  flex-shrink: 0;
}

.info-text {
  font-size: 0.9rem;
  color: #4b5563;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Card Actions */
.card-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-delete {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-delete:hover {
  background: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(239, 68, 68, 0.3);
}

.btn-delete:active {
  transform: translateY(0);
}

.btn-icon {
  width: 1rem;
  height: 1rem;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
  animation: fadeIn 0.8s ease-out;
}

.empty-icon-container {
  display: inline-flex;
  padding: 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  margin-bottom: 1.5rem;
}

.empty-icon {
  width: 3rem;
  height: 3rem;
  color: white;
}

.empty-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.75rem 0;
}

.empty-description {
  font-size: 1.1rem;
  color: #6b7280;
  margin: 0 0 2rem 0;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.btn-empty-action {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);
}

.btn-empty-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px rgba(102, 126, 234, 0.4);
}

.btn-empty-action:active {
  transform: translateY(0);
}

.btn-empty-action .icon {
  width: 1.25rem;
  height: 1.25rem;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .page-title {
    font-size: 2rem;
  }

  .page-subtitle {
    font-size: 1rem;
  }

  .students-grid {
    grid-template-columns: 1fr;
  }

  .header-content {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-add-student {
    justify-content: center;
  }
}
</style>