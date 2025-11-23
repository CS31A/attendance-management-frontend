<script setup>
import { Eye, EyeOff } from 'lucide-vue-next'
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import Toast from '@/components/common/Toast.vue'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

// Redirect if already authenticated
onMounted(() => {
  if (authStore.getIsAuthenticated) {
    router.push('/dashboard')
  }
})

const formData = reactive({
  username: '',
  password: '',
  rememberMe: false,
})

const errors = reactive({
  username: '',
  password: '',
  general: '',
})

const isLoading = ref(false)
const hasAttemptedSubmit = ref(false)
const showPassword = ref(false)
let navigationTimeout = null

const toast = reactive({
  show: false,
  message: '',
  type: 'success',
  duration: 3000,
})

function showToast(message, type = 'success', duration = 1000) {
  toast.message = message
  toast.type = type
  toast.duration = duration
  toast.show = true
}

function closeToast() {
  toast.show = false
}

// Validation rules
function validateUsername(username) {
  if (!username || username.trim() === '') {
    return 'Username or email is required'
  }

  // Simple email format check - backend validates properly
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const isEmail = emailRegex.test(username)

  if (username.includes('@') && !isEmail) {
    return 'Please enter a valid email address'
  }

  if (!isEmail && username.length < 6) {
    return 'Username must be at least 6 characters long'
  }

  return ''
}

function validatePassword(password) {
  if (!password || password.trim() === '') {
    return 'Password is required'
  }

  if (password.length < 8) {
    return 'Password must be at least 8 characters long'
  }

  return ''
}

// Real-time validation
function validateField(field) {
  if (!hasAttemptedSubmit.value)
    return

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
  return validateUsername(formData.username) === ''
    && validatePassword(formData.password) === ''
})

async function handleLogin() {
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
    // Using the authStore login method
    const result = await authStore.login(formData.username, formData.password)

    if (result.success) {
      showToast('Login successful! Redirecting to dashboard...', 'success', 1000)
      navigationTimeout = setTimeout(async () => {
        try {
          await router.push('/dashboard')
        }
        catch (error) {
          console.error('Navigation failed:', error)
          errors.general = 'Navigation failed. Please try again.'
        }
      }, 1000)
    }
    else {
      throw new Error(result.message || 'Invalid credentials')
    }
  }
  catch (error) {
    console.error('Login failed:', error)
    errors.general = error.message || 'Invalid username or password. Please try again.'
  }
  finally {
    isLoading.value = false
  }
}

function handleForgotPassword() {
  // router.push('/forgot-password')
}

// Cleanup timeout on component unmount
onUnmounted(() => {
  if (navigationTimeout) {
    clearTimeout(navigationTimeout)
  }
})
</script>

<template>
  <div class="login-container">
    <!-- Left Panel -->
    <div class="left-panel">
      <!-- Background Logo -->
      <div class="background-logo">
        <img src="@/components/icons/ACLCLogo.png" alt="ACLC Logo Background" class="background-logo-image">
      </div>

      <!-- Decorative Grid Pattern -->
      <div class="grid-pattern" />

      <div class="logo-section">
        <div class="logo-content">
          <div class="brand-badge">
            <span class="badge-dot" />
            <span class="badge-text">Education Excellence</span>
          </div>
          <h1 class="logo-title">
            <span class="title-primary">ACLC</span>
            <span class="title-secondary">Attendance</span>
            <span class="title-accent">Monitoring System</span>
          </h1>
          <p class="logo-subtitle">
            A reliable and efficient way to monitor student attendance with precision and care.
          </p>

          <div class="feature-grid">
            <div class="feature-card">
              <div class="feature-icon">
                ⚡
              </div>
              <div class="feature-text">
                <span class="feature-title">Lightning Fast</span>
                <span class="feature-desc">Quick access</span>
              </div>
            </div>
            <div class="feature-card">
              <div class="feature-icon">
                🔒
              </div>
              <div class="feature-text">
                <span class="feature-title">Secure</span>
                <span class="feature-desc">Protected data</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="footer">
        <div class="footer-content">
          <p class="footer-text">
            © 2025 Toma Sigma • Built with ❤️
          </p>
          <div class="footer-dots">
            <span class="dot-indicator active" />
            <span class="dot-indicator" />
            <span class="dot-indicator" />
          </div>
        </div>
      </div>
    </div>

    <!-- Right Panel -->
    <div class="right-panel">
      <div class="login-form-container">
        <div class="login-form">
          <!-- Form Header -->
          <div class="form-header">
            <div class="welcome-badge">
              <span class="badge-emoji">👋</span>
              <span class="badge-label">Welcome Back</span>
            </div>
            <h2 class="form-title">
              Ready to <span class="title-gradient">sign in</span>?
            </h2>
            <p class="form-subtitle">
              Enter your credentials to access your dashboard and start managing attendance.
            </p>
          </div>

          <form class="form-content" @submit.prevent="handleLogin">
            <!-- General Error Message -->
            <div v-if="errors.general" class="error-message general-error">
              <span class="error-emoji">⚠️</span>
              <span>{{ errors.general }}</span>
            </div>

            <div class="form-group">
              <label for="username" class="form-label">
                <span class="label-icon">👤</span>
                <span class="label-text">Username or Email</span>
              </label>
              <div class="input-container">
                <input
                  id="username"
                  v-model="formData.username"
                  type="text"
                  class="form-input"
                  :class="{
                    'form-input-error': errors.username,
                    'form-input-success': formData.username && !errors.username && hasAttemptedSubmit,
                  }"
                  placeholder="e.g., john.doe@example.com"
                  @blur="validateField('username')"
                  @input="validateField('username')"
                >
                <div class="input-border" />
              </div>
              <div v-if="errors.username" class="error-message">
                <span class="error-emoji">❌</span>
                <span>{{ errors.username }}</span>
              </div>
            </div>

            <div class="form-group">
              <label for="password" class="form-label">
                <span class="label-icon">🔐</span>
                <span class="label-text">Password</span>
              </label>
              <div class="input-container">
                <input
                  id="password"
                  v-model="formData.password"
                  :type="showPassword ? 'text' : 'password'"
                  class="form-input"
                  :class="{
                    'form-input-error': errors.password,
                    'form-input-success': formData.password && !errors.password && hasAttemptedSubmit,
                  }"
                  placeholder="Enter your password"
                  @blur="validateField('password')"
                  @input="validateField('password')"
                >
                <button
                  type="button"
                  class="password-toggle-btn"
                  :title="showPassword ? 'Hide password' : 'Show password'"
                  :aria-label="showPassword ? 'Hide password' : 'Show password'"
                  @click="showPassword = !showPassword"
                >
                  <component :is="showPassword ? EyeOff : Eye" class="password-toggle-icon" />
                </button>
                <div class="input-border" />
              </div>
              <div v-if="errors.password" class="error-message">
                <span class="error-emoji">❌</span>
                <span>{{ errors.password }}</span>
              </div>
            </div>

            <div class="form-options">
              <div class="checkbox-group">
                <div class="custom-checkbox">
                  <input
                    id="remember"
                    v-model="formData.rememberMe"
                    type="checkbox"
                    class="checkbox-input"
                  >
                  <label for="remember" class="checkbox-label">
                    <span class="checkbox-box">
                      <span class="checkbox-check">✓</span>
                    </span>
                    <span class="checkbox-text">Remember me for 30 days</span>
                  </label>
                </div>
              </div>
              <a href="#" class="forgot-password" @click.prevent="handleForgotPassword">
                <span class="forgot-icon">🔑</span>
                <span>Forgot Password?</span>
              </a>
            </div>

            <button type="submit" class="login-button" :disabled="isLoading">
              <span class="button-content">
                <span class="button-icon">{{ isLoading ? '⏳' : '🚀' }}</span>
                <span class="button-text">{{ isLoading ? 'Logging in...' : 'Login to Dashboard' }}</span>
              </span>
              <div class="button-glow" />
            </button>

            <!-- Additional Options -->
            <div class="form-footer">
              <p class="security-note">
                <span class="security-icon">🛡️</span>
                Your data is protected with enterprise-grade security
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
    <Toast
      :show="toast.show"
      :message="toast.message"
      :type="toast.type"
      :duration="toast.duration"
      @close="closeToast"
    />
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  height: 100vh;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

/* Left Panel Styles */
.left-panel {
  flex: 1;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e293b 100%);
  display: flex;
  flex-direction: column;
  padding: 64px 48px;
  color: white;
  position: relative;
  overflow: hidden;
}

.grid-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 60%, rgba(59, 130, 246, 0.05) 0%, transparent 50%);
  z-index: 1;
}

.background-logo {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
  pointer-events: none;
}

.background-logo-image {
  width: 650px;
  height: 650px;
  object-fit: contain;
  opacity: 0.06;
  filter: brightness(1.2);
}

.logo-section {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-top: 24px;
  position: relative;
  z-index: 3;
  flex: 1;
}

.logo-content {
  flex: 1;
}

.brand-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 8px 16px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 24px;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.badge-dot {
  width: 6px;
  height: 6px;
  background: #22c55e;
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
}

.badge-text {
  color: rgba(255, 255, 255, 0.9);
}

.logo-title {
  font-size: 42px;
  font-weight: 800;
  margin-bottom: 16px;
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.title-primary {
  color: #60a5fa;
  text-shadow: 0 0 20px rgba(96, 165, 250, 0.3);
}

.title-secondary {
  color: #ffffff;
  font-weight: 600;
}

.title-accent {
  color: #dc2626;
  font-weight: 700;
  text-shadow: 0 0 20px rgba(220, 38, 38, 0.3);
}

.logo-subtitle {
  font-size: 18px;
  font-weight: 400;
  opacity: 0.9;
  line-height: 1.6;
  margin-bottom: 32px;
  color: #e2e8f0;
}

.feature-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 32px;
}

.feature-card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.feature-icon {
  font-size: 20px;
  filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.3));
}

.feature-text {
  display: flex;
  flex-direction: column;
}

.feature-title {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 2px;
}

.feature-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.footer {
  margin-top: auto;
  position: relative;
  z-index: 3;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-text {
  font-size: 14px;
  opacity: 0.8;
  font-weight: 500;
}

.footer-dots {
  display: flex;
  gap: 8px;
}

.dot-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
}

.dot-indicator.active {
  background: #22c55e;
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
}

/* Right Panel Styles */
.right-panel {
  flex: 1;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  position: relative;
}

.login-form-container {
  width: 100%;
  max-width: 480px;
}

.login-form {
  background: #ffffff;
  border-radius: 24px;
  padding: 32px;
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.8),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(226, 232, 240, 0.8);
  backdrop-filter: blur(20px);
}

.form-header {
  text-align: center;
  margin-bottom: 24px;
}

.welcome-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #ede9fe 0%, #f3e8ff 100%);
  color: #7c3aed;
  padding: 6px 16px;
  border-radius: 20px;
  border: 1px solid #e9d5ff;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 12px;
}

.badge-emoji {
  font-size: 16px;
}

.form-title {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.title-gradient {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.form-subtitle {
  font-size: 16px;
  color: #64748b;
  line-height: 1.5;
  font-weight: 400;
}

.form-content {
  margin-top: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
}

.label-icon {
  font-size: 16px;
  opacity: 0.8;
}

.label-text {
  flex: 1;
}

.input-container {
  position: relative;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 15px;
  color: #1e293b;
  background: #ffffff;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
  font-weight: 500;
}

.form-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
  transform: translateY(-1px);
}

.form-input::placeholder {
  color: #94a3b8;
  font-weight: 400;
}

.form-input-error {
  border-color: #ef4444;
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
  background: #fef2f2;
}

.form-input-error:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
}

.form-input-success {
  border-color: #22c55e;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.1);
  background: #f0fdf4;
}

.input-border {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  transition: all 0.3s ease;
  transform: translateX(-50%);
}

.form-input:focus + .input-border {
  width: 100%;
}

.password-toggle-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  z-index: 2;
}

.password-toggle-btn:hover {
  background: rgba(59, 130, 246, 0.1);
  transform: translateY(-50%) scale(1.05);
}

.password-toggle-btn:active {
  transform: translateY(-50%) scale(0.95);
}

.password-toggle-icon {
  width: 18px;
  height: 18px;
  color: #64748b;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.password-toggle-btn:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.form-input:focus + .password-toggle-btn {
  background: rgba(59, 130, 246, 0.05);
}

.form-input-error + .password-toggle-btn:hover {
  background: rgba(239, 68, 68, 0.1);
}

.error-message {
  font-size: 13px;
  color: #ef4444;
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}

.error-emoji {
  font-size: 14px;
}

.general-error {
  background: linear-gradient(135deg, #fef2f2 0%, #fef1f2 100%);
  border: 2px solid #fecaca;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 12px;
  margin-bottom: 16px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.1);
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 12px 0;
}

.custom-checkbox {
  display: flex;
  align-items: center;
}

.checkbox-input {
  display: none;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
}

.checkbox-box {
  width: 20px;
  height: 20px;
  border: 2px solid #d1d5db;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  transition: all 0.2s ease;
}

.checkbox-input:checked + .checkbox-label .checkbox-box {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.checkbox-check {
  color: #ffffff;
  font-size: 12px;
  font-weight: bold;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.checkbox-input:checked + .checkbox-label .checkbox-check {
  opacity: 1;
}

.checkbox-text {
  font-size: 13px;
  color: #475569;
  font-weight: 500;
}

.forgot-password {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #3b82f6;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s ease;
  padding: 8px 12px;
  border-radius: 8px;
}

.forgot-password:hover {
  color: #1d4ed8;
  background: rgba(59, 130, 246, 0.05);
  transform: translateY(-1px);
}

.forgot-icon {
  font-size: 14px;
}

.login-button {
  width: 100%;
  padding: 14px 28px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
  position: relative;
  overflow: hidden;
  box-shadow:
    0 10px 25px rgba(59, 130, 246, 0.3),
    0 4px 12px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.button-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  position: relative;
  z-index: 2;
}

.button-icon {
  font-size: 18px;
  filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.3));
}

.button-text {
  font-weight: 600;
  letter-spacing: 0.5px;
}

.button-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transform: rotate(-45deg);
  opacity: 0;
  z-index: 1;
}

.login-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  transform: translateY(-2px);
  box-shadow:
    0 20px 40px rgba(59, 130, 246, 0.4),
    0 8px 16px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.login-button:hover:not(:disabled) .button-glow {
  opacity: 1;
}

.login-button:active:not(:disabled) {
  transform: translateY(-1px);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.form-footer {
  margin-top: 20px;
  text-align: center;
}

.divider {
  position: relative;
  margin: 16px 0;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
}

.divider-text {
  background: #ffffff;
  padding: 0 16px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  letter-spacing: 1px;
  text-transform: uppercase;
  position: relative;
  z-index: 1;
}

.security-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  color: #64748b;
  margin-top: 8px;
  font-weight: 500;
}

.security-icon {
  font-size: 16px;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .left-panel {
    padding: 48px 32px;
  }

  .logo-title {
    font-size: 36px;
  }

  .feature-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .login-form {
    padding: 40px;
  }
}

@media (max-width: 968px) {
  .left-panel {
    flex: 0 0 380px;
    padding: 40px 32px;
  }

  .background-logo-image {
    width: 400px;
    height: 400px;
  }

  .logo-title {
    font-size: 32px;
  }

  .login-form {
    padding: 36px;
  }

  .login-form-container {
    max-width: 420px;
  }
}

@media (max-width: 768px) {
  .login-container {
    flex-direction: column;
    background: linear-gradient(180deg, #1e293b 0%, #f1f5f9 50%);
  }

  .left-panel {
    flex: none;
    padding: 40px 32px;
    min-height: 280px;
  }

  .feature-grid {
    display: none;
  }

  .logo-title {
    font-size: 28px;
  }

  .logo-subtitle {
    font-size: 16px;
  }

  .background-logo-image {
    width: 200px;
    height: 200px;
    opacity: 0.1;
  }

  .right-panel {
    padding: 32px 24px;
    background: transparent;
  }

  .login-form {
    padding: 32px;
    box-shadow:
      0 20px 40px rgba(0, 0, 0, 0.1),
      0 0 0 1px rgba(255, 255, 255, 0.9);
  }

  .form-title {
    font-size: 28px;
  }

  .form-subtitle {
    font-size: 15px;
  }
}

@media (max-width: 640px) {
  .left-panel {
    padding: 32px 24px;
    min-height: 220px;
  }

  .logo-title {
    font-size: 24px;
  }

  .logo-subtitle {
    font-size: 14px;
  }

  .brand-badge {
    font-size: 11px;
    padding: 6px 12px;
  }

  .right-panel {
    padding: 24px 20px;
  }

  .login-form {
    padding: 28px;
    border-radius: 20px;
  }

  .form-title {
    font-size: 26px;
  }

  .form-input {
    padding: 14px 16px;
    font-size: 16px;
  }

  .login-button {
    padding: 16px 28px;
    font-size: 15px;
  }
}

@media (max-width: 480px) {
  .left-panel {
    padding: 24px 20px;
    min-height: 180px;
  }

  .logo-section {
    margin-top: 0;
  }

  .logo-title {
    font-size: 22px;
  }

  .background-logo-image {
    width: 120px;
    height: 120px;
  }

  .right-panel {
    padding: 20px 16px;
  }

  .login-form {
    padding: 24px;
  }

  .form-options {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    padding: 16px 0;
  }

  .footer-content {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }

  .footer-dots {
    justify-content: center;
  }
}
</style>
