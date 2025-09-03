<script setup>
import { ref, computed } from 'vue'
import DeleteModal from '@/components/DeleteModal.vue'
import CreateBlockModal from '@/components/CreateBlockModal.vue'
import CreateStudentModal from '@/components/CreateStudentModal.vue'
import EditBlockModal from '@/components/EditBlockModal.vue'
import EditStudentModal from '@/components/EditStudentModal.vue'
import ExcelComponent from '@/components/ExcelComponent.vue'

// State
const blocks = ref([])
const selectedBlockIndex = ref(null)
const showAddBlock = ref(false)
const showAddStudent = ref(false)
const showEditBlock = ref(false)
const showEditStudent = ref(false)
const showDeleteModal = ref(false)
const deleteModal = ref({ title: '', message: '', type: '', index: -1 })
const editingBlockIndex = ref(-1)
const editingStudentIndex = ref(-1)
const editingBlockName = ref('')
const editingStudentName = ref('')

// Refs

// Computed
const selectedBlock = computed(() => {
  return selectedBlockIndex.value !== null ? blocks.value[selectedBlockIndex.value] : null
})

const totalBlocks = computed(() => blocks.value.length)

const totalStudents = computed(() => {
  return blocks.value.reduce((total, block) => total + block.students.length, 0)
})

// Block Management
const toggleAddBlock = () => {
  showAddBlock.value = !showAddBlock.value
}

const addBlock = (blockName) => {
  if (blockName.trim()) {
    blocks.value.push({
      id: Date.now().toString(),
      name: blockName.trim(),
      students: []
    })
    showAddBlock.value = false
  }
}

const toggleEditBlock = (index) => {
  editingBlockIndex.value = index
  editingBlockName.value = blocks.value[index].name
  showEditBlock.value = !showEditBlock.value
}

const updateBlock = (blockName) => {
  if (blockName.trim() && editingBlockIndex.value >= 0) {
    blocks.value[editingBlockIndex.value].name = blockName.trim()
    showEditBlock.value = false
  }
}

const selectBlock = (index) => {
  selectedBlockIndex.value = index
  showAddStudent.value = false
}

const editBlockName = (index) => {
  const newName = prompt('Edit block name:', blocks.value[index].name)
  if (newName && newName.trim()) {
    blocks.value[index].name = newName.trim()
  }
}

const deleteBlock = (index) => {
  deleteModal.value = {
    title: 'Delete Block',
    message: `Are you sure you want to delete "${blocks.value[index].name}" and all its students? This cannot be undone.`,
    type: 'block',
    index
  }
  showDeleteModal.value = true
}

// Student Management
const toggleAddStudent = () => {
  if (selectedBlock.value) {
    showAddStudent.value = !showAddStudent.value
  }
}

const addStudent = (studentName) => {
  if (studentName.trim() && selectedBlock.value) {
    const studentId = `STU${Date.now().toString().slice(-6)}`
    selectedBlock.value.students.push({
      id: studentId,
      name: studentName.trim()
    })
    showAddStudent.value = false
  }
}

const toggleEditStudent = (index) => {
  editingStudentIndex.value = index
  editingStudentName.value = selectedBlock.value.students[index].name
  showEditStudent.value = !showEditStudent.value
}

const updateStudent = (studentName) => {
  if (studentName.trim() && editingStudentIndex.value >= 0 && selectedBlock.value) {
    selectedBlock.value.students[editingStudentIndex.value].name = studentName.trim()
    showEditStudent.value = false
  }
}

const editStudentName = (index) => {
  const student = selectedBlock.value.students[index]
  const newName = prompt('Edit student name:', student.name)
  if (newName && newName.trim()) {
    student.name = newName.trim()
  }
}

const deleteStudent = (index) => {
  const student = selectedBlock.value.students[index]
  deleteModal.value = {
    title: 'Remove Student',
    message: `Are you sure you want to remove "${student.name}" from this block?`,
    type: 'student',
    index
  }
  showDeleteModal.value = true
}

// Delete Modal
const confirmDelete = () => {
  if (deleteModal.value.type === 'block') {
    blocks.value.splice(deleteModal.value.index, 1)
    if (selectedBlockIndex.value === deleteModal.value.index) {
      selectedBlockIndex.value = null
    } else if (selectedBlockIndex.value > deleteModal.value.index) {
      selectedBlockIndex.value--
    }
  } else if (deleteModal.value.type === 'student') {
    selectedBlock.value.students.splice(deleteModal.value.index, 1)
  }
  cancelDelete()
}

const cancelDelete = () => {
  showDeleteModal.value = false
  deleteModal.value = { title: '', message: '', type: '', index: -1 }
}

// Utility Functions
const getInitials = (name) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}
</script>

<template>
  <div class="student-dashboard">
    <!-- Header -->
    <div class="dashboard-header">
      <div class="header-left">
        <h1 class="page-title">Student Management</h1>
        <p class="page-subtitle">Manage class blocks and student enrollment</p>
      </div>
      <div class="header-right">
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ totalBlocks }}</div>
            <div class="stat-label">Blocks</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ totalStudents }}</div>
            <div class="stat-label">Students</div>
          </div>
        </div>
        <ExcelComponent 
          :blocks="blocks" 
          :total-students="totalStudents" 
          @update:blocks="blocks = $event"
        />
      </div>
    </div>

    <div class="dashboard-body">
      <!-- Blocks Section -->
      <div class="blocks-section">
        <div class="section-header">
          <h2>Class Blocks</h2>
          <button @click="toggleAddBlock" class="btn-add-block">
            <svg v-if="!showAddBlock" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            {{ showAddBlock ? 'Cancel' : 'Add Block' }}
          </button>
        </div>

        <!-- Blocks List -->
        <div class="blocks-container">
          <div v-if="blocks.length === 0" class="empty-blocks">
            <div class="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <h3>No blocks created</h3>
            <p>Create your first class block to start managing students</p>
          </div>

          <div 
            v-for="(block, index) in blocks" 
            :key="block.id"
            :class="['block-card', { active: selectedBlockIndex === index }]"
            @click="selectBlock(index)"
          >
            <div class="block-main">
              <div class="block-info">
                <h3 class="block-name">{{ block.name }}</h3>
                <span class="block-count">{{ block.students.length }} students</span>
              </div>
              <div class="block-actions">
                <button @click.stop="toggleEditBlock(index)" class="btn-edit" title="Edit">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button @click.stop="deleteBlock(index)" class="btn-delete" title="Delete">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="3,6 5,6 21,6"/>
                    <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Students Section -->
      <div class="students-section">
        <div v-if="selectedBlock" class="students-content">
          <div class="students-header">
            <div>
              <h2>{{ selectedBlock.name }} Students</h2>
              <p class="students-subtitle">{{ selectedBlock.students.length }} students enrolled</p>
            </div>
            <button @click="toggleAddStudent" class="btn-add-student">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/>
                <line x1="20" y1="8" x2="20" y2="14"/>
                <line x1="23" y1="11" x2="17" y2="11"/>
              </svg>
              Add Student
            </button>
          </div>

          <!-- Students Grid -->
          <div class="students-grid">
            <div v-if="selectedBlock.students.length === 0" class="empty-students">
              <div class="empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="m22 21-3-3m0 0a5 5 0 1 0-7-7 5 5 0 0 0 7 7z"/>
                </svg>
              </div>
              <h3>No students added</h3>
              <p>Add students to this block to get started</p>
            </div>

            <div 
              v-for="(student, index) in selectedBlock.students" 
              :key="student.id"
              class="student-card"
            >
              <div class="student-avatar">
                <span>{{ getInitials(student.name) }}</span>
              </div>
              <div class="student-details">
                <h4 class="student-name">{{ student.name }}</h4>
                <span class="student-id">ID: {{ student.id }}</span>
              </div>
              <div class="student-actions">
                <button @click="toggleEditStudent(index)" class="btn-edit" title="Edit">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button @click="deleteStudent(index)" class="btn-delete" title="Remove">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- No Block Selected -->
        <div v-else class="no-block-selected">
          <div class="placeholder-content">
            <div class="placeholder-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <h3>Select a Block</h3>
            <p>Choose a class block from the left to view and manage its students</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <DeleteModal 
      v-if="showDeleteModal"
      :title="deleteModal.title"
      :message="deleteModal.message"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
    
    <!-- Create Block Modal -->
    <CreateBlockModal
      v-if="showAddBlock"
      @create="addBlock"
      @cancel="toggleAddBlock"
    />
    
    <!-- Create Student Modal -->
    <CreateStudentModal
      v-if="showAddStudent && selectedBlock"
      @create="addStudent"
      @cancel="toggleAddStudent"
    />
    
    <!-- Edit Block Modal -->
    <EditBlockModal
      v-if="showEditBlock"
      :block-name="editingBlockName"
      @update="updateBlock"
      @cancel="showEditBlock = false"
    />
    
    <!-- Edit Student Modal -->
    <EditStudentModal
      v-if="showEditStudent && selectedBlock"
      :student-name="editingStudentName"
      @update="updateStudent"
      @cancel="showEditStudent = false"
    />
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.student-dashboard {
  min-height: 100vh;
  background: #f8fafc;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.dashboard-header {
  background: white;
  padding: 2rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.header-left {
  flex: 1;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

.page-subtitle {
  font-size: 1rem;
  color: #64748b;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.stats-grid {
  display: flex;
  gap: 2rem;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #3b82f6;
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 0.25rem;
}



.dashboard-body {
  display: flex;
  max-width: 1400px;
  margin: 0 auto;
  gap: 2rem;
  padding: 2rem;
  min-height: calc(100vh - 120px);
}

.blocks-section {
  width: 350px;
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  height: fit-content;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.btn-add-block {
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.btn-add-block:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.btn-add-block svg {
  width: 1rem;
  height: 1rem;
  stroke-width: 2;
}

/* .add-block-form {
  background: #f1f5f9;
  padding: 1rem;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
  display: flex;
  gap: 0.75rem;
}

.block-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s ease;
}

.block-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
} */

.btn-create {
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-create:hover {
  background: #2563eb;
}

.blocks-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.empty-blocks {
  text-align: center;
  padding: 3rem 1rem;
  color: #64748b;
}

.empty-icon {
  margin: 0 auto 1rem auto;
  width: 3rem;
  height: 3rem;
  color: #cbd5e1;
}

.empty-icon svg {
  width: 100%;
  height: 100%;
  stroke-width: 1.5;
}

.empty-blocks h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
}

.empty-blocks p {
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.5;
}

.block-card {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.block-card:hover {
  border-color: #3b82f6;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.block-card.active {
  border-color: #3b82f6;
  background: #eff6ff;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.block-main {
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.block-info {
  flex: 1;
}

.block-name {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.block-count {
  font-size: 0.875rem;
  color: #64748b;
}

.block-actions {
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.block-card:hover .block-actions {
  opacity: 1;
}

.btn-edit, .btn-delete {
  background: transparent;
  border: none;
  border-radius: 0.375rem;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-edit {
  color: #64748b;
}

.btn-edit:hover {
  background: #f1f5f9;
  color: #3b82f6;
}

.btn-delete {
  color: #64748b;
}

.btn-delete:hover {
  background: #fef2f2;
  color: #ef4444;
}

.btn-edit svg, .btn-delete svg {
  width: 1rem;
  height: 1rem;
  stroke-width: 2;
}

.students-section {
  flex: 1;
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.students-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.students-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.students-subtitle {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}

.btn-add-student {
  background: #10b981;
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.btn-add-student:hover {
  background: #059669;
  transform: translateY(-1px);
}

.btn-add-student svg {
  width: 1rem;
  height: 1rem;
  stroke-width: 2;
}


/* .add-student-form {
  background: #f0fdf4;
  padding: 1rem;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.student-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s ease;
}

.student-input:focus {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
} */

.btn-cancel {
  background: #64748b;
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel:hover {
  background: #475569;
}


.students-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.empty-students {
  grid-column: 1 / -1;
  text-align: center;
  padding: 4rem 1rem;
  color: #64748b;
}

.empty-students .empty-icon {
  margin: 0 auto 1.5rem auto;
  width: 4rem;
  height: 4rem;
  color: #cbd5e1;
}

.empty-students h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
}

.empty-students p {
  font-size: 1rem;
  margin: 0;
}


.student-card {
  background: #fafafa;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s ease;
}

.student-card:hover {
  border-color: #10b981;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);
}

.student-avatar {
  width: 3rem;
  height: 3rem;
  background: linear-gradient(135deg, #3b82f6, #10b981);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.student-details {
  flex: 1;
}

.student-name {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.student-id {
  font-size: 0.75rem;
  color: #64748b;
  font-family: 'Monaco', 'Menlo', monospace;
  background: #f1f5f9;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  display: inline-block;
}

.student-actions {
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.student-card:hover .student-actions {
  opacity: 1;
}


.no-block-selected {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
}

.placeholder-content {
  text-align: center;
  color: #64748b;
}

.placeholder-icon {
  margin: 0 auto 1.5rem auto;
  width: 5rem;
  height: 5rem;
  color: #cbd5e1;
}

.placeholder-icon svg {
  width: 100%;
  height: 100%;
  stroke-width: 1.5;
}

.placeholder-content h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: #374151;
}

.placeholder-content p {
  font-size: 1rem;
  margin: 0;
  line-height: 1.5;
}


@media (max-width: 1024px) {
  .dashboard-body {
    flex-direction: column;
    padding: 1rem;
    gap: 1rem;
  }

  .blocks-section {
    width: 100%;
  }

  .dashboard-header {
    flex-direction: column;
    gap: 1.5rem;
    align-items: flex-start;
  }

  .header-right {
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 768px) {
  .dashboard-header {
    padding: 1.5rem;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .stats-grid {
    gap: 1rem;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .students-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  /* .add-block-form,
  .add-student-form {
    flex-direction: column;
  } */

  .students-grid {
    grid-template-columns: 1fr;
  }


}

@media (max-width: 480px) {
  .dashboard-header {
    padding: 1rem;
  }

  .dashboard-body {
    padding: 0.5rem;
  }

  .blocks-section,
  .students-section {
    padding: 1rem;
  }

  .page-title {
    font-size: 1.25rem;
  }

  .student-card {
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
  }

  .student-actions {
    opacity: 1;
    margin-top: 0.5rem;
  }

  .header-right {
    flex-direction: column;
    gap: 1rem;
  }
}


.btn-add-block:focus,
.btn-create:focus,
.btn-cancel:focus,
.btn-add-student:focus,
.btn-excel:focus,
.btn-edit:focus,
.btn-delete:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* .block-input:focus,
.student-input:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
} */

.block-card:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}


.btn-excel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}


html {
  scroll-behavior: smooth;
}


::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

@media print {
  .dashboard-header,
  .btn-add-block,
  .btn-add-student,
  .btn-excel,
  .student-actions,
  .block-actions {
    display: none !important;
  }

  .dashboard-body {
    display: block;
  }

  .blocks-section,
  .students-section {
    box-shadow: none;
    border: 1px solid #e2e8f0;
    margin-bottom: 1rem;
  }
}

@media (prefers-contrast: high) {
  .block-card,
  .student-card {
    border-width: 2px;
  }

  .btn-add-block,
  .btn-create,
  .btn-add-student,
  .btn-excel {
    border: 2px solid currentColor;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
</style>