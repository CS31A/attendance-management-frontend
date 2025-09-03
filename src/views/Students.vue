<script setup>
import { ref, computed, nextTick, watch } from 'vue'

// State
const blocks = ref([])
const selectedBlockIndex = ref(null)
const newBlockName = ref('')
const newStudentName = ref('')
const showAddBlock = ref(false)
const showAddStudent = ref(false)
const showDeleteModal = ref(false)
const deleteModal = ref({ title: '', message: '', type: '', index: -1 })

// Refs
const blockInputRef = ref(null)
const studentInputRef = ref(null)
const fileInputRef = ref(null)

// Computed
const selectedBlock = computed(() => {
  return selectedBlockIndex.value !== null ? blocks.value[selectedBlockIndex.value] : null
})

const totalBlocks = computed(() => blocks.value.length)

const totalStudents = computed(() => {
  return blocks.value.reduce((total, block) => total + block.students.length, 0)
})

// Block Management
const toggleAddBlock = async () => {
  showAddBlock.value = !showAddBlock.value
  if (showAddBlock.value) {
    await nextTick()
    blockInputRef.value?.focus()
  }
}

const addBlock = () => {
  if (newBlockName.value.trim()) {
    blocks.value.push({
      id: Date.now().toString(),
      name: newBlockName.value.trim(),
      students: []
    })
    newBlockName.value = ''
    showAddBlock.value = false
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
const toggleAddStudent = async () => {
  showAddStudent.value = !showAddStudent.value
  if (showAddStudent.value) {
    await nextTick()
    studentInputRef.value?.focus()
  }
}

const addStudent = () => {
  if (newStudentName.value.trim() && selectedBlock.value) {
    const studentId = `STU${Date.now().toString().slice(-6)}`
    selectedBlock.value.students.push({
      id: studentId,
      name: newStudentName.value.trim()
    })
    newStudentName.value = ''
    showAddStudent.value = false
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

// Excel Import/Export Functions
const triggerFileUpload = () => {
  fileInputRef.value?.click()
}

const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const text = e.target.result
      parseExcelData(text, file.name)
    } catch (error) {
      alert('Error reading file. Please make sure it\'s a valid Excel or CSV file.')
      console.error('File read error:', error)
    }
  }

  if (file.name.endsWith('.csv')) {
    reader.readAsText(file)
  } else {
    // For .xlsx files, we'll treat them as CSV for simplicity
    // In a real app, you'd use a library like SheetJS
    reader.readAsText(file)
  }
  
  // Reset file input
  event.target.value = ''
}

const parseExcelData = (csvText, fileName) => {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) {
    alert('File must contain at least a header row and one data row.')
    return
  }

  // Parse header to detect format
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase())
  
  let blockIndex = -1
  let nameIndex = -1
  let idIndex = -1

  // Try to find relevant columns
  headers.forEach((header, index) => {
    if (header.includes('block') || header.includes('class') || header.includes('period')) {
      blockIndex = index
    }
    if (header.includes('name') || header.includes('student')) {
      nameIndex = index
    }
    if (header.includes('id') || header.includes('number')) {
      idIndex = index
    }
  })

  if (blockIndex === -1 || nameIndex === -1) {
    alert('Could not find required columns. Please ensure your file has "Block" and "Student Name" columns.')
    return
  }

  const importedData = new Map() // blockName -> students[]
  let successCount = 0
  let errorCount = 0

  // Process data rows
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map(cell => cell.replace(/"/g, '').trim())
    
    if (row.length < Math.max(blockIndex + 1, nameIndex + 1)) {
      errorCount++
      continue
    }

    const blockName = row[blockIndex]
    const studentName = row[nameIndex]
    const studentId = idIndex >= 0 ? row[idIndex] : `STU${Date.now().toString().slice(-6)}`

    if (!blockName || !studentName) {
      errorCount++
      continue
    }

    if (!importedData.has(blockName)) {
      importedData.set(blockName, [])
    }

    importedData.get(blockName).push({
      id: studentId,
      name: studentName
    })
    successCount++
  }

  // Import the data
  importedData.forEach((students, blockName) => {
    // Find or create block
    let blockIndex = blocks.value.findIndex(b => b.name === blockName)
    
    if (blockIndex === -1) {
      // Create new block
      blocks.value.push({
        id: Date.now().toString() + Math.random(),
        name: blockName,
        students: []
      })
      blockIndex = blocks.value.length - 1
    }

    // Add students (avoiding duplicates by name)
    const existingNames = new Set(blocks.value[blockIndex].students.map(s => s.name.toLowerCase()))
    
    students.forEach(student => {
      if (!existingNames.has(student.name.toLowerCase())) {
        blocks.value[blockIndex].students.push(student)
        existingNames.add(student.name.toLowerCase())
      }
    })
  })

  // Show import summary
  let message = `Import completed!\n\n✅ ${successCount} students imported successfully`
  if (errorCount > 0) {
    message += `\n⚠️ ${errorCount} rows had errors and were skipped`
  }
  message += `\n\n📚 ${importedData.size} blocks processed`
  
  alert(message)
}

const exportToExcel = () => {
  if (totalStudents.value === 0) return

  // Create CSV content
  let csvContent = 'Block,Student Name,Student ID\n'
  
  blocks.value.forEach(block => {
    block.students.forEach(student => {
      csvContent += `"${block.name}","${student.name}","${student.id}"\n`
    })
  })

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `students_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

watch(showAddBlock, (show) => {
  if (show) {
    nextTick(() => blockInputRef.value?.focus())
  }
})

watch(showAddStudent, (show) => {
  if (show) {
    nextTick(() => studentInputRef.value?.focus())
  }
})
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
        <div class="excel-actions">
          <input
            ref="fileInputRef"
            type="file"
            accept=".xlsx,.xls,.csv"
            @change="handleFileUpload"
            style="display: none;"
          />
          <button @click="triggerFileUpload" class="btn-excel">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
              <line x1="7" y1="8" x2="12" y2="3"/>
              <line x1="17" y1="8" x2="12" y2="3"/>
            </svg>
            Import Excel
          </button>
          <button @click="exportToExcel" class="btn-export" :disabled="totalStudents === 0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="12" y1="9" x2="12" y2="21"/>
              <line x1="7" y1="16" x2="12" y2="21"/>
              <line x1="17" y1="16" x2="12" y2="21"/>
            </svg>
            Export Excel
          </button>
        </div>
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

        <!-- Add Block Form -->
        <div v-if="showAddBlock" class="add-block-form">
          <input 
            v-model="newBlockName" 
            @keyup.enter="addBlock"
            placeholder="Enter block name (e.g., Period 1, Block A)"
            class="block-input"
            ref="blockInputRef"
          />
          <button @click="addBlock" class="btn-create">Create Block</button>
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
                <button @click.stop="editBlockName(index)" class="btn-edit" title="Edit">
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

          <!-- Add Student Form -->
          <div v-if="showAddStudent" class="add-student-form">
            <input 
              v-model="newStudentName" 
              @keyup.enter="addStudent"
              placeholder="Enter student full name"
              class="student-input"
              ref="studentInputRef"
            />
            <button @click="addStudent" class="btn-create">Add Student</button>
            <button @click="showAddStudent = false" class="btn-cancel">Cancel</button>
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
                <button @click="editStudentName(index)" class="btn-edit" title="Edit">
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
    <div v-if="showDeleteModal" class="modal-overlay" @click="cancelDelete">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ deleteModal.title }}</h3>
        </div>
        <div class="modal-body">
          <p>{{ deleteModal.message }}</p>
        </div>
        <div class="modal-actions">
          <button @click="confirmDelete" class="btn-confirm-delete">Delete</button>
          <button @click="cancelDelete" class="btn-cancel">Cancel</button>
        </div>
      </div>
    </div>
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

.excel-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-excel {
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.btn-excel:hover {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.btn-export {
  background: #059669;
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.btn-export:hover:not(:disabled) {
  background: #047857;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.4);
}

.btn-export:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-excel svg, .btn-export svg {
  width: 1.25rem;
  height: 1.25rem;
  stroke-width: 2;
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

.add-block-form {
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
}

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


.add-student-form {
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
}

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

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: white;
  border-radius: 1rem;
  width: 90%;
  max-width: 420px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: modalSlide 0.3s ease-out;
}

@keyframes modalSlide {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  padding: 1.5rem 1.5rem 0 1.5rem;
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.modal-body {
  padding: 1rem 1.5rem;
}

.modal-body p {
  color: #64748b;
  margin: 0;
  line-height: 1.6;
}

.modal-actions {
  padding: 0 1.5rem 1.5rem 1.5rem;
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.btn-confirm-delete {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-confirm-delete:hover {
  background: #dc2626;
  transform: translateY(-1px);
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

  .add-block-form,
  .add-student-form {
    flex-direction: column;
  }

  .students-grid {
    grid-template-columns: 1fr;
  }

  .modal-actions {
    flex-direction: column-reverse;
  }

  .excel-actions {
    flex-direction: column;
    width: 100%;
  }

  .btn-excel,
  .btn-export {
    width: 100%;
    justify-content: center;
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
.btn-delete:focus,
.btn-confirm-delete:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.block-input:focus,
.student-input:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

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