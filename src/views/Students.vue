<template>
  <div class="student-manager">
  
    <div class="block-section">
      <h2>Blocks</h2>

      <div class="form">
        <input v-model="newBlock" placeholder="Enter block name" class="input" />
        <button @click="addBlock" class="btn-add">Add Block</button>
      </div>

      <ul class="block-list">
        <li
          v-for="(block, index) in blocks"
          :key="index"
          :class="{ active: selectedBlockIndex === index }"
          @click="selectBlock(index)"
        >
          {{ block.name }}
          <button @click.stop="removeBlock(index)" class="btn-remove">×</button>
        </li>
      </ul>
    </div>

    
    <div class="student-section" v-if="selectedBlock">
      <h2>{{ selectedBlock.name }} - Students</h2>

      <div class="form">
        <input
          v-model="selectedBlock.newStudent"
          placeholder="Enter student name"
          class="input"
        />
        <button @click="addStudent" class="btn-add">Add Student</button>
      </div>

      <ul class="student-list">
        <li
          v-for="(student, studentIndex) in selectedBlock.students"
          :key="studentIndex"
          class="student-item"
        >
          {{ student }}
          <button @click="removeStudent(studentIndex)" class="btn-remove">×</button>
        </li>
      </ul>
    </div>

    <div v-else class="student-section placeholder">
      <p>Select a block to view its students</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const newBlock = ref('')
const blocks = ref([])
const selectedBlockIndex = ref(null)

const addBlock = () => {
  if (newBlock.value.trim() !== '') {
    blocks.value.push({
      name: newBlock.value.trim(),
      newStudent: '',
      students: []
    })
    newBlock.value = ''
  }
}

const removeBlock = (index) => {
  blocks.value.splice(index, 1)
  if (selectedBlockIndex.value === index) {
    selectedBlockIndex.value = null
  } else if (selectedBlockIndex.value > index) {
    selectedBlockIndex.value -= 1
  }
}

const selectBlock = (index) => {
  selectedBlockIndex.value = index
}

const selectedBlock = computed(() => {
  return blocks.value[selectedBlockIndex.value] || null
})

const addStudent = () => {
  const block = selectedBlock.value
  if (block && block.newStudent.trim() !== '') {
    block.students.push(block.newStudent.trim())
    block.newStudent = ''
  }
}

const removeStudent = (studentIndex) => {
  selectedBlock.value.students.splice(studentIndex, 1)
}
</script>

<style scoped>
.student-manager {
  display: flex;
  gap: 30px;
  padding: 20px;
}

/* BLOCK SECTION */
.block-section {
  width: 30%;
  border-right: 1px solid #e5e7eb;
  padding-right: 20px;
}

.block-section h2 {
  font-size: 22px;
  margin-bottom: 10px;
}

.block-list {
  list-style: none;
  padding: 0;
}

.block-list li {
  background: #f9fafb;
  margin-bottom: 10px;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.block-list li.active {
  background: #dbeafe;
  border-color: #3b82f6;
}

.btn-remove {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 14px;
  cursor: pointer;
}

.btn-remove:hover {
  background: #dc2626;
}

/* STUDENT SECTION */
.student-section {
  flex: 1;
}

.student-section h2 {
  font-size: 22px;
  margin-bottom: 10px;
}

.form {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.input {
  flex: 1;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 16px;
}

.btn-add {
  background-color: #0f71d3;
  color: white;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
}

.btn-add:hover {
  background-color: #155cc6;
}

.student-list {
  list-style: none;
  padding: 0;
}

.student-item {
  background-color: #f3f4f6;
  padding: 10px 15px;
  margin-bottom: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  font-size: 18px;
  border: 2px dashed #d1d5db;
  height: 100%;
  min-height: 200px;
  border-radius: 6px;
}
</style>
