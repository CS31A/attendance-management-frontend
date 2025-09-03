<script setup>
import { ref } from 'vue'

// Props
const props = defineProps({
  blocks: {
    type: Array,
    required: true
  },
  totalStudents: {
    type: Number,
    required: true
  }
})

// Emits
const emit = defineEmits(['update:blocks'])

// Refs
const fileInputRef = ref(null)

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

  // Create a copy of blocks to modify
  const updatedBlocks = [...props.blocks]

  // Import the data
  importedData.forEach((students, blockName) => {
    // Find or create block
    let blockIndex = updatedBlocks.findIndex(b => b.name === blockName)
    
    if (blockIndex === -1) {
      // Create new block
      updatedBlocks.push({
        id: Date.now().toString() + Math.random(),
        name: blockName,
        students: []
      })
      blockIndex = updatedBlocks.length - 1
    }

    // Add students (avoiding duplicates by name)
    const existingNames = new Set(updatedBlocks[blockIndex].students.map(s => s.name.toLowerCase()))
    
    students.forEach(student => {
      if (!existingNames.has(student.name.toLowerCase())) {
        updatedBlocks[blockIndex].students.push(student)
        existingNames.add(student.name.toLowerCase())
      }
    })
  })

  // Emit the updated blocks
  emit('update:blocks', updatedBlocks)

  // Show import summary
  let message = `Import completed!\n\n✅ ${successCount} students imported successfully`
  if (errorCount > 0) {
    message += `\n⚠️ ${errorCount} rows had errors and were skipped`
  }
  message += `\n\n📚 ${importedData.size} blocks processed`
  
  alert(message)
}

const exportToExcel = () => {
  if (props.totalStudents === 0) return

  // Create CSV content
  let csvContent = 'Block,Student Name,Student ID\n'
  
  props.blocks.forEach(block => {
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
</script>

<template>
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
</template>

<style scoped>
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

@media (max-width: 768px) {
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
</style>