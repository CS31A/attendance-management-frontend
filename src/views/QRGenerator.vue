<script>
export default {
  name: 'QRGenerator',
  
  data() {
    return {
      subjects: [
        {
          id: 1001,
          name: 'Computer Programming',
          code: 'COMP101',
          teacher: 'Prof. Smith',
          createdAt: new Date()
        },
        {
          id: 2001,
          name: 'Database Management',
          code: 'COMP102',
          teacher: 'Dr. Johnson',
          createdAt: new Date()
        },
        {
          id: 3001,
          name: 'Calculus I',
          code: 'MATH103',
          teacher: 'Ms. Brown',
          createdAt: new Date()
        }
      ],
      newSubject: {
        name: '',
        code: '',
        teacher: ''
      }
    }
  },

  computed: {
    canAddSubject() {
      return this.newSubject.name.trim() && 
             this.newSubject.code.trim() && 
             this.newSubject.teacher.trim()
    }
  },

  methods: {
    addSubject() {
      if (!this.canAddSubject) return

      const subject = {
        id: Date.now(),
        name: this.newSubject.name.trim(),
        code: this.newSubject.code.trim().toUpperCase(),
        teacher: this.newSubject.teacher.trim(),
        createdAt: new Date()
      }

      this.subjects.push(subject)
      this.resetForm()
    },

    removeSubject(id) {
      const index = this.subjects.findIndex(subject => subject.id === id)
      if (index !== -1) {
        this.subjects.splice(index, 1)
      }
    },

    resetForm() {
      this.newSubject = {
        name: '',
        code: '',
        teacher: ''
      }
    },

    getQRUrl(subject) {
      const qrData = this.generateQRData(subject)
      const encodedData = encodeURIComponent(qrData)
      return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedData}&bgcolor=e6f3ff&color=1e40af`
    },

    generateQRData(subject) {
      return `Subject: ${subject.name}\nCode: ${subject.code}\nTeacher: ${subject.teacher}\nYear: ${new Date().getFullYear()}\nGenerated: ${this.formatDate(subject.createdAt)}`
    },

    regenerateQR(subjectId) {
      const subject = this.subjects.find(s => s.id === subjectId)
      if (subject) {
        subject.createdAt = new Date()
        // Force reactivity update
        this.$forceUpdate()
      }
    },

    downloadQR(subject) {
      const link = document.createElement('a')
      link.href = this.getQRUrl(subject)
      link.download = `${subject.code}_QR.png`
      link.click()
    },

    formatDate(date) {
      return new Date(date).toLocaleDateString()
    },

    handleImageError(event) {
      console.error('QR image failed to load')
      event.target.style.display = 'none'
      // You could show an error message here
    }
  }
}
</script>

<template>
  <div class="qr-app">
    <!-- Header Section -->
    <header class="app-header">
      <h1 class="app-title">
        <svg class="title-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zM3 21h8v-8H3v8zm2-6h4v4H5v-4zM13 3v8h8V3h-8zm6 6h-4V5h4v4zM19 19h2v2h-2zM13 13h2v2h-2zM15 15h2v2h-2zM13 17h2v2h-2zM15 19h2v2h-2zM17 17h2v2h-2zM17 13h2v2h-2zM19 15h2v2h-2z"/>
        </svg>
        Class Subject QR Generator
      </h1>
      <p class="app-subtitle">Generate QR codes for all your class subjects</p>
    </header>

    <!-- Subject Form -->
    <section class="form-section">
      <div class="subject-form">
        <h3 class="form-title">Add New Subject</h3>
        <div class="form-grid">
          <div class="input-group">
            <label class="input-label">Subject Name</label>
            <input
              v-model="newSubject.name"
              type="text"
              placeholder="Enter subject name"
              class="form-input"
              @keyup.enter="addSubject"
            />
          </div>
          <div class="input-group">
            <label class="input-label">Subject Code</label>
            <input
              v-model="newSubject.code"
              type="text"
              placeholder="Enter subject code"
              class="form-input"
              @keyup.enter="addSubject"
            />
          </div>
          <div class="input-group">
            <label class="input-label">Teacher Name</label>
            <input
              v-model="newSubject.teacher"
              type="text"
              placeholder="Enter teacher name"
              class="form-input"
              @keyup.enter="addSubject"
            />
          </div>
          <div class="input-group">
            <button 
              @click="addSubject"
              :disabled="!canAddSubject"
              class="submit-btn"
            >
              <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
              Add Subject
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Subjects Grid -->
    <section v-if="subjects.length > 0" class="subjects-section">
      <div class="subjects-grid">
        <div
          v-for="subject in subjects"
          :key="subject.id"
          class="subject-card"
        >
          <!-- Card Header -->
          <div class="card-header">
            <h3 class="subject-name">{{ subject.name }}</h3>
            <button 
              @click="removeSubject(subject.id)" 
              class="delete-btn"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
            </button>
          </div>
          
          <!-- Subject Details -->
          <div class="subject-details">
            <p><strong>Code:</strong> {{ subject.code }}</p>
            <p><strong>Teacher:</strong> {{ subject.teacher }}</p>
            <p><strong>Created:</strong> {{ formatDate(subject.createdAt) }}</p>
          </div>

          <!-- QR Code Display -->
          <div class="qr-display">
            <img 
              :src="getQRUrl(subject)" 
              :alt="'QR Code for ' + subject.name"
              class="qr-image"
              @error="handleImageError"
            />
          </div>

          <!-- Card Actions -->
          <div class="card-actions">
            <button 
              @click="regenerateQR(subject.id)" 
              class="action-btn refresh-btn"
            >
              <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
              </svg>
              Refresh
            </button>
            <button 
              @click="downloadQR(subject)" 
              class="action-btn download-btn"
            >
              <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
              </svg>
              Download
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Empty State -->
    <section v-else class="empty-section">
      <div class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
        <h3 class="empty-title">No subjects added yet</h3>
        <p class="empty-text">Add your first subject to generate QR codes</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.qr-app {
  min-height: 100vh;
  background: linear-gradient(135deg, #e6f3ff 0%, #cce7ff 50%, #b3daff 100%);
  padding: 20px;
  font-family: Arial, sans-serif;
}

.app-header {
  text-align: center;
  margin-bottom: 30px;
  padding: 30px;
  background: linear-gradient(135deg, #1e40af, #3b82f6);
  border-radius: 15px;
  color: white;
  box-shadow: 0 8px 25px rgba(30, 64, 175, 0.3);
}

.app-title {
  font-size: 2.5rem;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  font-weight: bold;
}

.title-icon {
  width: 50px;
  height: 50px;
}

.app-subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
}

.form-section {
  margin-bottom: 30px;
}

.subject-form {
  background: white;
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border: 2px solid #e6f3ff;
}

.form-title {
  color: #1e40af;
  margin-bottom: 20px;
  font-size: 1.5rem;
  font-weight: bold;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  align-items: end;
}

.input-group {
  display: flex;
  flex-direction: column;
}

.input-label {
  margin-bottom: 8px;
  color: #374151;
  font-weight: 500;
  font-size: 0.9rem;
}

.form-input {
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.submit-btn {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  width: 16px;
  height: 16px;
}

.subjects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 25px;
}

.subject-card {
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 2px solid #e6f3ff;
}

.subject-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.subject-name {
  color: #1e40af;
  font-size: 1.3rem;
  font-weight: bold;
  margin: 0;
}

.delete-btn {
  background: #ef4444;
  color: white;
  border: none;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.delete-btn:hover {
  background: #dc2626;
  transform: scale(1.1);
}

.delete-btn svg {
  width: 16px;
  height: 16px;
}

.subject-details {
  margin-bottom: 20px;
  color: #6b7280;
}

.subject-details p {
  margin: 5px 0;
}

.qr-display {
  text-align: center;
  margin-bottom: 20px;
}

.qr-image {
  width: 180px;
  height: 180px;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  border: 3px solid #e6f3ff;
}

.card-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.action-btn {
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.refresh-btn {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
}

.refresh-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
}

.download-btn {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.download-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

.empty-section {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.empty-state {
  text-align: center;
  padding: 50px 30px;
  background: white;
  border-radius: 15px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border: 2px solid #e6f3ff;
}

.empty-icon {
  width: 60px;
  height: 60px;
  margin-bottom: 20px;
  color: #93c5fd;
}

.empty-title {
  color: #1e40af;
  font-size: 1.5rem;
  margin-bottom: 10px;
}

.empty-text {
  color: #6b7280;
  font-size: 1.1rem;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .subjects-grid {
    grid-template-columns: 1fr;
  }
  
  .app-title {
    font-size: 2rem;
    flex-direction: column;
    gap: 10px;
  }
  
  .title-icon {
    width: 40px;
    height: 40px;
  }
}
</style>