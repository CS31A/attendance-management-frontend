// studentstore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useStudentStore = defineStore('students', () => {
  // State - Initialize as empty array
  const students = ref([])

  // Actions
  function addStudent(studentData) {
    console.log('addStudent called with:', studentData)
    console.log('Current students before:', students.value)
    
    const newStudent = {
      id: Date.now(),
      ...studentData
    }
    
    // Direct push without checking
    students.value = [...students.value, newStudent]
    
    console.log('Student added:', newStudent)
    console.log('All students after:', students.value)
    
    return newStudent
  }

  function removeStudent(id) {
    students.value = students.value.filter(s => s.id !== id)
  }

  return {
    students,
    addStudent,
    removeStudent
  }
})