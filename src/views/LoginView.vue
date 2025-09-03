<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const formData = reactive({
  username: '',
  password: '',
  rememberMe: false
})

const errors = reactive({
  username: '',
  password: '',
  general: ''
})

const isLoading = ref(false)
const hasAttemptedSubmit = ref(false)

// Validation rules
const validateUsername = (username) => {
  if (!username || username.trim() === '') {
    return 'Username or email is required'
  }
  
  // Check if it's an email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const isEmail = emailRegex.test(username)
  
  if (username.includes('@') && !isEmail) {
    return 'Please enter a valid email address'
  }
  
  if (!isEmail && username.length < 3) {
    return 'Username must be at least 8 characters long'
  }
  
  return ''
}

const validatePassword = (password) => {
  if (!password || password.trim() === '') {
    return 'Password is required'
  }
  
  if (password.length < 6) {
    return 'Password must be at least 6 characters long'
  }
  
  return ''
}

// Real-time validation
const validateField = (field) => {
  if (!hasAttemptedSubmit.value) return
  
  switch (field) {
    case 'username':
      errors.username = validateUsername(formData.username)
      break
    case 'password':
      errors.password = validatePassword(formData.password)
      break
  }
}

// Computed properties for form state
const isFormValid = computed(() => {
  return validateUsername(formData.username) === '' && 
         validatePassword(formData.password) === ''
})

const hasErrors = computed(() => {
  return errors.username || errors.password || errors.general
})

const handleLogin = async () => {
  hasAttemptedSubmit.value = true
  
  // Clear previous errors
  errors.username = ''
  errors.password = ''
  errors.general = ''
  
  // Validate all fields
  errors.username = validateUsername(formData.username)
  errors.password = validatePassword(formData.password)
  
  // If validation fails, don't submit
  if (!isFormValid.value) {
    return
  }
  
  isLoading.value = true
  
  try {
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Simulate authentication check
    if (formData.username === 'invalid' && formData.password === 'invalid') {
      throw new Error('Invalid credentials')
    }
    
    console.log('Login attempt with:', {
      username: formData.username,
      password: formData.password,
      rememberMe: formData.rememberMe
    })
    
    router.push('/dashboard')
  } catch (error) {
    console.error('Login failed:', error)
    errors.general = 'Invalid username or password. Please try again.'
  } finally {
    isLoading.value = false
  }
}

const handleForgotPassword = () => {
  console.log('Forgot password clicked')
  // router.push('/forgot-password')
}
</script>

<template>
  <div class="login-container">
    <!-- Left Panel -->
    <div class="left-panel">
      <!-- Background Logo -->
      <div class="background-logo">
        <img src="@/components/icons/ACLCLogo.png" alt="ACLC Logo Background" class="background-logo-image" />
      </div>
      
      <div class="logo-section">
        <div class="logo-content">
          <h1 class="logo-title">ACLC Attendance Monitoring System</h1>
          <p class="logo-subtitle">A reliable and efficient way to monitor student attendance.</p>
        </div>
      </div>
      <div class="footer">
        <p>© 2025. Toma sigma</p>
      </div>
    </div>

    <!-- Right Panel -->
    <div class="right-panel">
      <div class="login-form-container">
        <div class="login-form">
          <h2 class="form-title">Welcome Back</h2>
          <p class="form-subtitle">Please enter your details to sign in.</p>

          <form @submit.prevent="handleLogin">
            <!-- General Error Message -->
            <div v-if="errors.general" class="error-message general-error">
              {{ errors.general }}
            </div>

            <div class="form-group">
              <label for="username" class="form-label">Username or Email</label>
              <input
                id="username"
                v-model="formData.username"
                type="text"
                class="form-input"
                :class="{ 'form-input-error': errors.username }"
                placeholder="e.g., john.doe@example.com"
                @blur="validateField('username')"
                @input="validateField('username')"
              />
              <div v-if="errors.username" class="error-message">
                {{ errors.username }}
              </div>
            </div>

            <div class="form-group">
              <label for="password" class="form-label">Password</label>
              <input
                id="password"
                v-model="formData.password"
                type="password"
                class="form-input"
                :class="{ 'form-input-error': errors.password }"
                placeholder="Enter your password"
                @blur="validateField('password')"
                @input="validateField('password')"
              />
              <div v-if="errors.password" class="error-message">
                {{ errors.password }}
              </div>
            </div>

            <div class="form-options">
              <div class="checkbox-group">
                <input
                  id="remember"
                  v-model="formData.rememberMe"
                  type="checkbox"
                  class="checkbox"
                />
                <label for="remember" class="checkbox-label">Remember me</label>
              </div>
              <a href="#" class="forgot-password" @click.prevent="handleForgotPassword">
                Forgot Password?
              </a>
            </div>

            <button type="submit" class="login-button" :disabled="isLoading">
              {{ isLoading ? 'Logging in...' : 'Login' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif;
}

/* Left Panel Styles */
.left-panel {
  flex: 1;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  display: flex;
  flex-direction: column;
  padding: 48px;
  color: white;
  position: relative;
  overflow: hidden;
}

.background-logo {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
  pointer-events: none;
}

.background-logo-image {
  width: 600px;
  height: 600px;
  object-fit: contain;
  opacity: 0.4;
}

.logo-section {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-top: 24px;
  position: relative;
  z-index: 2;
}

.logo-content {
  flex: 1;
}

.logo-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
  letter-spacing: -0.02em;
}

.logo-subtitle {
  font-size: 14px;
  font-weight: 400;
  opacity: 0.9;
  line-height: 1.5;
}

.footer {
  margin-top: auto;
  font-size: 12px;
  opacity: 0.7;
  position: relative;
  z-index: 2;
}

/* Right Panel Styles */
.right-panel {
  flex: 1;
  background-color: #e5e5e5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
}

.login-form-container {
  width: 100%;
  max-width: 440px;
}

.login-form {
  background: white;
  border-radius: 12px;
  padding: 48px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.form-title {
  font-size: 28px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
  letter-spacing: -0.02em;
}

.form-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 32px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
}

.form-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  color: #1f2937;
  transition: all 0.2s;
  outline: none;
}

.form-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-input::placeholder {
  color: #9ca3af;
}

.form-input-error {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.form-input-error:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.error-message {
  font-size: 12px;
  color: #ef4444;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.general-error {
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 14px;
  font-weight: 500;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.checkbox {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid #d1d5db;
  cursor: pointer;
}

.checkbox-label {
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  user-select: none;
}

.forgot-password {
  font-size: 14px;
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.forgot-password:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

.login-button {
  width: 100%;
  padding: 12px 24px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  outline: none;
}

.login-button:hover:not(:disabled) {
  background: #1d4ed8;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Responsive Design */
@media (max-width: 968px) {
  .left-panel {
    flex: 0 0 320px;
    padding: 32px;
  }
  
  .background-logo-image {
    width: 200px;
    height: 200px;
  }
  
  .login-form {
    padding: 32px;
  }
}

@media (max-width: 768px) {
  .login-container {
    flex-direction: column;
  }
  
  .left-panel {
    flex: none;
    padding: 32px;
    min-height: 200px;
  }
  
  .background-logo-image {
    width: 120px;
    height: 120px;
  }
  
  .right-panel {
    padding: 24px;
  }
  
  .login-form {
    padding: 24px;
  }
  
  .form-title {
    font-size: 24px;
  }
}

@media (max-width: 480px) {
  .left-panel {
    padding: 24px;
    min-height: 160px;
  }
  
  .logo-section {
    margin-top: 0;
  }
  
  .background-logo-image {
    width: 80px;
    height: 80px;
  }
  
  .right-panel {
    padding: 16px;
  }
  
  .login-form {
    padding: 20px;
  }
  
  .form-options {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>