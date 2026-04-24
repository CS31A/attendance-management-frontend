<script setup lang="ts">
import type { EntityId } from '@/types'
import { Calendar, Check, Clock, Copy, Eye, EyeOff, Hash, Lock, Mail, Pencil, Save, Shield, X } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { computed, onMounted, reactive, ref } from 'vue'
import api from '@/api'
import { useAuthStore } from '@/stores/authStore'
import { formatLongDate } from '@/utils/date'
import { getErrorMessage } from '@/utils/httpError'

const authStore = useAuthStore()
const { userProfile, isLoading } = storeToRefs(authStore)

interface EditProfileForm {
  email: string
  username: string
  firstname: string
  lastname: string
  sectionId: EntityId | null
}

interface UpdateProfilePayload {
  firstname?: string
  lastname?: string
  email?: string
  currentPassword?: string
  newPassword?: string
  confirmNewPassword?: string
  sectionId?: EntityId
}

// UI State
const isEditing = ref(false)
const isSaving = ref(false)
const showSuccessMessage = ref(false)
const showErrorMessage = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const activeTab = ref('profile') // 'profile' or 'security'

// Password visibility toggles
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// Clipboard state
const copiedField = ref<'username' | 'role' | 'userId' | null>(null)

// Initial form state for change detection
const initialFormState = ref<EditProfileForm>({
  email: '',
  username: '',
  firstname: '',
  lastname: '',
  sectionId: null,
})

// Edit form data
const editForm = reactive<EditProfileForm>({
  email: '',
  username: '',
  firstname: '',
  lastname: '',
  sectionId: null,
})

// Password form data
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmNewPassword: '',
})

// Password validation
const passwordErrors = reactive({
  currentPassword: '',
  newPassword: '',
  confirmNewPassword: '',
})

onMounted(async () => {
  if (!userProfile.value) {
    await authStore.fetchUserProfile()
  }
  initEditForm()
})

function initEditForm() {
  if (userProfile.value) {
    editForm.email = userProfile.value.email || ''
    editForm.username = userProfile.value.username || ''

    if (userProfile.value.studentProfile) {
      editForm.firstname = userProfile.value.studentProfile.firstname || ''
      editForm.lastname = userProfile.value.studentProfile.lastname || ''
      editForm.sectionId = userProfile.value.studentProfile.sectionId || null
    }
    else if (userProfile.value.instructorProfile) {
      editForm.firstname = userProfile.value.instructorProfile.firstname || ''
      editForm.lastname = userProfile.value.instructorProfile.lastname || ''
    }
    else if (userProfile.value.adminProfile) {
      editForm.firstname = userProfile.value.adminProfile.firstname || ''
      editForm.lastname = userProfile.value.adminProfile.lastname || ''
    }
  }
}

function resetPasswordForm() {
  passwordForm.currentPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmNewPassword = ''
  passwordErrors.currentPassword = ''
  passwordErrors.newPassword = ''
  passwordErrors.confirmNewPassword = ''
}

const userRole = computed(() => userProfile.value?.role || 'User')
const isStudent = computed(() => userRole.value === 'Student')
const isInstructor = computed(() => userRole.value === 'Instructor')
const isAdmin = computed(() => userRole.value === 'Admin')

// Helper to get initials for avatar
function getInitials(name?: string | null) {
  if (!name)
    return 'U'
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const displayName = computed(() => {
  if (isStudent.value && userProfile.value?.studentProfile) {
    return `${userProfile.value.studentProfile.firstname} ${userProfile.value.studentProfile.lastname}`
  }
  else if (isInstructor.value && userProfile.value?.instructorProfile) {
    return `${userProfile.value.instructorProfile.firstname} ${userProfile.value.instructorProfile.lastname}`
  }
  else if (isAdmin.value && userProfile.value?.adminProfile) {
    return `${userProfile.value.adminProfile.firstname} ${userProfile.value.adminProfile.lastname}`
  }
  return userProfile.value?.username || 'User'
})

// Get profile ID
const profileId = computed(() => {
  if (isStudent.value && userProfile.value?.studentProfile) {
    return userProfile.value.studentProfile.id
  }
  else if (isInstructor.value && userProfile.value?.instructorProfile) {
    return userProfile.value.instructorProfile.id
  }
  else if (isAdmin.value && userProfile.value?.adminProfile) {
    return userProfile.value.adminProfile.id
  }
  return null
})

// Start editing profile
function startEditing() {
  initEditForm()
  resetPasswordForm()
  // Capture initial state for change detection
  initialFormState.value = {
    email: editForm.email,
    username: editForm.username,
    firstname: editForm.firstname,
    lastname: editForm.lastname,
    sectionId: editForm.sectionId,
  }
  activeTab.value = 'profile'
  isEditing.value = true
}

// Cancel editing
function cancelEditing() {
  isEditing.value = false
  showErrorMessage.value = false
  activeTab.value = 'profile'
  initEditForm()
  resetPasswordForm()
}

// Validate password fields
function validatePasswordFields() {
  let isValid = true
  passwordErrors.currentPassword = ''
  passwordErrors.newPassword = ''
  passwordErrors.confirmNewPassword = ''

  // Only validate if user is trying to change password
  if (passwordForm.newPassword || passwordForm.confirmNewPassword || passwordForm.currentPassword) {
    if (!passwordForm.currentPassword) {
      passwordErrors.currentPassword = 'Current password is required to change password'
      isValid = false
    }

    if (!passwordForm.newPassword) {
      passwordErrors.newPassword = 'New password is required'
      isValid = false
    }
    else if (passwordForm.newPassword.length < 8) {
      passwordErrors.newPassword = 'Password must be at least 8 characters'
      isValid = false
    }

    if (!passwordForm.confirmNewPassword) {
      passwordErrors.confirmNewPassword = 'Please confirm your new password'
      isValid = false
    }
    else if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      passwordErrors.confirmNewPassword = 'Passwords do not match'
      isValid = false
    }
  }

  return isValid
}

// Check if password is being changed
const isChangingPassword = computed(() => {
  return passwordForm.currentPassword || passwordForm.newPassword || passwordForm.confirmNewPassword
})

// Check if any form fields have changed
const hasChanges = computed(() => {
  const profileChanged
    = editForm.email !== initialFormState.value.email
      || editForm.firstname !== initialFormState.value.firstname
      || editForm.lastname !== initialFormState.value.lastname
      || editForm.sectionId !== initialFormState.value.sectionId

  return profileChanged || isChangingPassword.value
})

// Save profile changes
async function saveProfile() {
  // Validate password if changing
  if (!validatePasswordFields()) {
    return
  }

  isSaving.value = true
  showErrorMessage.value = false
  showSuccessMessage.value = false

  try {
    // Build the update payload based on UpdateProfile DTO
    const payload: UpdateProfilePayload = {
      firstname: editForm.firstname || undefined,
      lastname: editForm.lastname || undefined,
      email: editForm.email || undefined,
    }

    // Add password fields if changing password
    if (isChangingPassword.value) {
      payload.currentPassword = passwordForm.currentPassword
      payload.newPassword = passwordForm.newPassword
      payload.confirmNewPassword = passwordForm.confirmNewPassword
    }

    // Add sectionId for students
    if (isStudent.value && editForm.sectionId) {
      payload.sectionId = editForm.sectionId
    }

    const response = await api.patch('/account/profile', payload)

    if (response.data?.success) {
      await authStore.fetchUserProfile()
      isEditing.value = false
      successMessage.value = response.data.message || 'Profile updated successfully!'
      showSuccessMessage.value = true
      resetPasswordForm()
      setTimeout(() => {
        showSuccessMessage.value = false
      }, 3000)
    }
    else {
      errorMessage.value = response.data?.message || 'Failed to update profile. Please try again.'
      showErrorMessage.value = true
    }
  }
  catch (error) {
    console.error('Failed to update profile:', error)
    errorMessage.value = getErrorMessage(error, 'Failed to update profile. Please try again.')
    showErrorMessage.value = true
  }
  finally {
    isSaving.value = false
  }
}

// Get role badge color
const roleBadgeColor = computed(() => {
  switch (userRole.value) {
    case 'Instructor':
      return 'role-badge-instructor'
    case 'Student':
      return 'role-badge-student'
    case 'Admin':
      return 'role-badge-admin'
    default:
      return 'role-badge-default'
  }
})

// Get role display text
const roleDisplayText = computed(() => {
  if (userRole.value === 'Instructor')
    return 'Instructor'
  return userRole.value
})

// Copy to clipboard function
async function copyToClipboard(field: 'username' | 'role' | 'userId', value: string) {
  try {
    await navigator.clipboard.writeText(value)
    copiedField.value = field
    setTimeout(() => {
      copiedField.value = null
    }, 2000)
  }
  catch (error) {
    console.error('Failed to copy to clipboard:', error)
  }
}
</script>

<template>
  <div class="profile-container">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner" />
    </div>

    <!-- Profile Content -->
    <div v-else-if="userProfile" class="profile-content">
      <!-- Profile Header Card -->
      <div class="profile-header-card">
        <div class="profile-banner" />
        <div class="profile-header-content">
          <div class="profile-avatar-section">
            <div class="profile-avatar">
              {{ getInitials(displayName) }}
              <div class="status-indicator" />
            </div>
          </div>
          <div class="profile-info">
            <h1 class="profile-name">
              {{ displayName }}
            </h1>
            <div class="profile-meta">
              <span class="profile-username">@{{ userProfile.username }}</span>
              <span class="profile-role-badge" :class="roleBadgeColor">
                {{ roleDisplayText }}
              </span>
            </div>
          </div>
          <button class="edit-profile-btn" @click="startEditing">
            <Pencil :size="16" />
            Edit Profile
          </button>
        </div>
      </div>

      <!-- Success Message -->
      <div v-if="showSuccessMessage" class="alert alert-success">
        <svg xmlns="http://www.w3.org/2000/svg" class="alert-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {{ successMessage }}
      </div>

      <!-- Profile Details Grid -->
      <div class="profile-details-grid">
        <!-- Account Information -->
        <div class="details-card">
          <h2 class="details-card-title">
            Account Information
          </h2>
          <div class="details-list">
            <div class="detail-item">
              <div class="detail-icon">
                <Hash :size="20" />
              </div>
              <div class="detail-content">
                <span class="detail-label">USER ID</span>
                <span class="detail-value">{{ userProfile.userId }}</span>
              </div>
            </div>
            <div class="detail-item">
              <div class="detail-icon">
                <Mail :size="20" />
              </div>
              <div class="detail-content">
                <span class="detail-label">EMAIL ADDRESS</span>
                <span class="detail-value">{{ userProfile.email }}</span>
              </div>
            </div>
            <div class="detail-item">
              <div class="detail-icon">
                <Calendar :size="20" />
              </div>
              <div class="detail-content">
                <span class="detail-label">MEMBER SINCE</span>
                <span class="detail-value">{{ formatLongDate(userProfile.createdAt) }}</span>
              </div>
            </div>
            <div class="detail-item">
              <div class="detail-icon">
                <Clock :size="20" />
              </div>
              <div class="detail-content">
                <span class="detail-label">LAST UPDATED</span>
                <span class="detail-value">{{ formatLongDate(userProfile.updatedAt) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Professional Details -->
        <div v-if="!isAdmin" class="details-card">
          <h2 class="details-card-title">
            Professional Details
          </h2>
          <div class="details-list">
            <div class="detail-item">
              <div class="detail-icon">
                <Hash :size="20" />
              </div>
              <div class="detail-content">
                <span class="detail-label">{{ isInstructor ? 'INSTRUCTOR ID' : 'STUDENT ID' }}</span>
                <span class="detail-value">{{ profileId || 'N/A' }}</span>
              </div>
            </div>
            <div v-if="isInstructor" class="privilege-badge">
              <div class="privilege-icon">
                <Shield :size="20" />
              </div>
              <div class="privilege-content">
                <span class="privilege-title">Instructor Privileges Active</span>
                <span class="privilege-description">
                  This user has full access to course management, grading systems, and student records associated with their assigned department.
                </span>
              </div>
            </div>
            <div v-if="isStudent && userProfile.studentProfile" class="student-details">
              <div class="detail-item">
                <div class="detail-content">
                  <span class="detail-label">COURSE</span>
                  <span class="detail-value">{{ userProfile.studentProfile.courseName }}</span>
                </div>
              </div>
              <div class="detail-item">
                <div class="detail-content">
                  <span class="detail-label">SECTION</span>
                  <span class="detail-value">{{ userProfile.studentProfile.sectionName }}</span>
                </div>
              </div>
              <div class="detail-item">
                <div class="detail-content">
                  <span class="detail-label">STATUS</span>
                  <span class="status-badge" :class="[userProfile.studentProfile.isRegular ? 'status-regular' : 'status-irregular']">
                    {{ userProfile.studentProfile.isRegular ? 'Regular' : 'Irregular' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="isEditing" class="modal-overlay" @click.self="cancelEditing">
      <div class="modal-content">
        <div class="modal-header">
          <div>
            <h2 class="modal-title">
              Edit Profile
            </h2>
            <p class="modal-subtitle">
              <svg xmlns="http://www.w3.org/2000/svg" class="inline-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Update your profile information and change your password.
            </p>
          </div>
          <button class="modal-close" @click="cancelEditing">
            <X :size="24" />
          </button>
        </div>

        <!-- Tab Navigation -->
        <div class="modal-tabs">
          <button
            type="button"
            class="tab-btn"
            :class="{ active: activeTab === 'profile' }"
            @click="activeTab = 'profile'"
          >
            <Pencil :size="16" />
            Profile Information
          </button>
          <button
            type="button"
            class="tab-btn"
            :class="{ active: activeTab === 'security' }"
            @click="activeTab = 'security'"
          >
            <Lock :size="16" />
            Change Password
          </button>
        </div>

        <!-- Error Message -->
        <div v-if="showErrorMessage" class="alert alert-error modal-alert">
          <svg xmlns="http://www.w3.org/2000/svg" class="alert-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {{ errorMessage }}
          <button class="alert-close" @click="showErrorMessage = false">
            &times;
          </button>
        </div>

        <form class="edit-form" @submit.prevent="saveProfile">
          <!-- Profile Information Tab -->
          <div v-show="activeTab === 'profile'">
            <!-- Personal Information -->
            <div class="form-section">
              <h3 class="form-section-title">
                Personal Information
              </h3>
              <div class="form-grid">
                <div class="form-group">
                  <label for="firstname" class="form-label">
                    First Name
                  </label>
                  <input
                    id="firstname"
                    v-model="editForm.firstname"
                    type="text"
                    class="form-input"
                    placeholder="Enter your first name"
                  >
                </div>
                <div class="form-group">
                  <label for="lastname" class="form-label">
                    Last Name
                  </label>
                  <input
                    id="lastname"
                    v-model="editForm.lastname"
                    type="text"
                    class="form-input"
                    placeholder="Enter your last name"
                  >
                </div>
                <div class="form-group">
                  <label for="email" class="form-label">
                    Email Address
                  </label>
                  <input
                    id="email"
                    v-model="editForm.email"
                    type="email"
                    class="form-input"
                    placeholder="Enter your email"
                  >
                </div>
              </div>
            </div>

            <!-- Account Information (Read-only) -->
            <div class="form-section">
              <h3 class="form-section-title">
                Account Information
                <span class="form-section-hint">(Read-only)</span>
              </h3>
              <div class="form-grid">
                <div class="form-group">
                  <label for="username" class="form-label">Username</label>
                  <div class="input-with-icon">
                    <input
                      id="username"
                      type="text"
                      class="form-input form-input-readonly"
                      :value="editForm.username"
                      readonly
                      tabindex="-1"
                    >
                    <button
                      type="button"
                      class="input-icon-btn"
                      @click="copyToClipboard('username', editForm.username)"
                    >
                      <Copy v-if="copiedField !== 'username'" :size="18" />
                      <Check v-else :size="18" />
                    </button>
                  </div>
                </div>
                <div class="form-group">
                  <label for="role" class="form-label">Role</label>
                  <div class="input-with-icon">
                    <input
                      id="role"
                      type="text"
                      class="form-input form-input-readonly"
                      :value="roleDisplayText"
                      readonly
                      tabindex="-1"
                    >
                    <button
                      type="button"
                      class="input-icon-btn"
                      @click="copyToClipboard('role', roleDisplayText)"
                    >
                      <Copy v-if="copiedField !== 'role'" :size="18" />
                      <Check v-else :size="18" />
                    </button>
                  </div>
                </div>
                <div class="form-group">
                  <label for="userId" class="form-label">User ID</label>
                  <div class="input-with-icon">
                    <input
                      id="userId"
                      type="text"
                      class="form-input form-input-readonly"
                      :value="userProfile?.userId || ''"
                      readonly
                      tabindex="-1"
                    >
                    <button
                      type="button"
                      class="input-icon-btn"
                      @click="copyToClipboard('userId', String(userProfile?.userId || ''))"
                    >
                      <Copy v-if="copiedField !== 'userId'" :size="18" />
                      <Check v-else :size="18" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Security Tab -->
          <div v-show="activeTab === 'security'">
            <div class="form-section">
              <h3 class="form-section-title">
                Change Password
              </h3>
              <p class="form-section-description">
                To change your password, enter your current password and then your new password below.
              </p>
              <div class="form-grid form-grid-single">
                <div class="form-group">
                  <label for="currentPassword" class="form-label">
                    Current Password <span class="required">*</span>
                  </label>
                  <div class="input-with-icon">
                    <input
                      id="currentPassword"
                      v-model="passwordForm.currentPassword"
                      :type="showCurrentPassword ? 'text' : 'password'"
                      class="form-input"
                      :class="{ 'form-input-error': passwordErrors.currentPassword }"
                      placeholder="Enter your current password"
                    >
                    <button
                      type="button"
                      class="input-icon-btn"
                      @click="showCurrentPassword = !showCurrentPassword"
                    >
                      <Eye v-if="!showCurrentPassword" :size="18" />
                      <EyeOff v-else :size="18" />
                    </button>
                  </div>
                  <span v-if="passwordErrors.currentPassword" class="form-error">
                    {{ passwordErrors.currentPassword }}
                  </span>
                </div>

                <div class="form-group">
                  <label for="newPassword" class="form-label">
                    New Password <span class="required">*</span>
                  </label>
                  <div class="input-with-icon">
                    <input
                      id="newPassword"
                      v-model="passwordForm.newPassword"
                      :type="showNewPassword ? 'text' : 'password'"
                      class="form-input"
                      :class="{ 'form-input-error': passwordErrors.newPassword }"
                      placeholder="Enter your new password"
                    >
                    <button
                      type="button"
                      class="input-icon-btn"
                      @click="showNewPassword = !showNewPassword"
                    >
                      <Eye v-if="!showNewPassword" :size="18" />
                      <EyeOff v-else :size="18" />
                    </button>
                  </div>
                  <span v-if="passwordErrors.newPassword" class="form-error">
                    {{ passwordErrors.newPassword }}
                  </span>
                  <span class="form-hint">Password must be at least 8 characters long.</span>
                </div>

                <div class="form-group">
                  <label for="confirmNewPassword" class="form-label">
                    Confirm New Password <span class="required">*</span>
                  </label>
                  <div class="input-with-icon">
                    <input
                      id="confirmNewPassword"
                      v-model="passwordForm.confirmNewPassword"
                      :type="showConfirmPassword ? 'text' : 'password'"
                      class="form-input"
                      :class="{ 'form-input-error': passwordErrors.confirmNewPassword }"
                      placeholder="Confirm your new password"
                    >
                    <button
                      type="button"
                      class="input-icon-btn"
                      @click="showConfirmPassword = !showConfirmPassword"
                    >
                      <Eye v-if="!showConfirmPassword" :size="18" />
                      <EyeOff v-else :size="18" />
                    </button>
                  </div>
                  <span v-if="passwordErrors.confirmNewPassword" class="form-error">
                    {{ passwordErrors.confirmNewPassword }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" @click="cancelEditing">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" :disabled="isSaving || !hasChanges">
              <Save v-if="!isSaving" :size="16" />
              <span v-if="isSaving" class="btn-spinner" />
              {{ isSaving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="!isLoading && !userProfile" class="error-state">
      <div class="error-icon">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <p>Failed to load profile information.</p>
      <button class="retry-btn" @click="authStore.fetchUserProfile()">
        Retry
      </button>
    </div>
  </div>
</template>

<style scoped>
.profile-container {
  min-height: 100vh;
  background-color: var(--bg-secondary);
  padding: var(--spacing-lg);
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 16rem;
}

.spinner {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  border: 3px solid var(--border-light);
  border-top-color: var(--color-primary);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.profile-content {
  max-width: 72rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

/* Profile Header Card */
.profile-header-card {
  background-color: var(--bg-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-light);
  overflow: hidden;
  position: relative;
}

.profile-banner {
  height: 120px;
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
}

.profile-header-content {
  padding: 0 var(--spacing-xl) var(--spacing-xl);
  position: relative;
}

.profile-avatar-section {
  position: absolute;
  top: -60px;
  left: var(--spacing-xl);
}

.profile-avatar {
  height: 120px;
  width: 120px;
  border-radius: var(--radius-full);
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-white);
  border: 4px solid var(--bg-primary);
  box-shadow: var(--shadow-primary-lg);
  position: relative;
}

.status-indicator {
  position: absolute;
  bottom: 8px;
  right: 8px;
  height: 18px;
  width: 18px;
  border-radius: var(--radius-full);
  border: 3px solid var(--bg-primary);
  background-color: var(--color-success);
}

.profile-info {
  padding-top: 70px;
  padding-bottom: var(--spacing-md);
}

.profile-name {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.profile-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.profile-username {
  font-size: 0.9375rem;
  color: var(--text-secondary);
}

.profile-role-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.role-badge-instructor {
  background-color: #fef3c7;
  color: #d97706;
}

.role-badge-student {
  background-color: #dbeafe;
  color: #2563eb;
}

.role-badge-admin {
  background-color: #f3e8ff;
  color: #7c3aed;
}

.role-badge-default {
  background-color: var(--color-info-lighter);
  color: var(--color-primary);
}

.edit-profile-btn {
  position: absolute;
  top: var(--spacing-md);
  right: var(--spacing-xl);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  background-color: var(--bg-primary);
  color: var(--text-secondary);
  border: 1px solid var(--border-primary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.edit-profile-btn:hover {
  background-color: var(--bg-hover);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

/* Alert Messages */
.alert {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
}

.alert-success {
  background-color: var(--color-success-bg);
  color: var(--color-success);
  border: 1px solid var(--color-success-light);
}

.alert-error {
  background-color: var(--color-error-bg);
  color: var(--color-error);
  border: 1px solid var(--color-error-light);
}

.alert-icon {
  height: 1.25rem;
  width: 1.25rem;
  flex-shrink: 0;
}

.alert-close {
  margin-left: auto;
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: inherit;
  opacity: 0.7;
}

.alert-close:hover {
  opacity: 1;
}

/* Profile Details Grid */
.profile-details-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-lg);
}

@media (min-width: 768px) {
  .profile-details-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.details-card {
  background-color: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-light);
  padding: var(--spacing-lg);
}

.details-card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--border-light);
}

.details-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.detail-item {
  display: flex;
  gap: var(--spacing-md);
}

.detail-icon {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  color: var(--text-tertiary);
  padding-top: 2px;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.detail-label {
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.detail-value {
  font-size: 0.9375rem;
  color: var(--text-primary);
  font-weight: 500;
}

.privilege-badge {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: #dbeafe;
  border-radius: var(--radius-md);
  border: 1px solid #93c5fd;
}

.privilege-icon {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  color: #2563eb;
  padding-top: 2px;
}

.privilege-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.privilege-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e40af;
}

.privilege-description {
  font-size: 0.8125rem;
  color: #1e40af;
  line-height: 1.5;
}

.student-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-block;
  width: fit-content;
}

.status-regular {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.status-irregular {
  background-color: var(--color-warning-bg);
  color: var(--color-warning);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: var(--spacing-md);
}

.modal-content {
  background-color: var(--bg-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-2xl);
  max-width: 56rem;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-md);
  padding: var(--spacing-xl);
  border-bottom: 1px solid var(--border-light);
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.modal-subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  background-color: #fef3c7;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  margin-top: var(--spacing-sm);
}

.inline-icon {
  height: 1rem;
  width: 1rem;
  flex-shrink: 0;
  color: #d97706;
}

.modal-close {
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.modal-close:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

/* Modal Tabs */
.modal-tabs {
  display: flex;
  gap: var(--spacing-xs);
  padding: 0 var(--spacing-xl);
  border-bottom: 1px solid var(--border-light);
  background-color: var(--bg-secondary);
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-md) var(--spacing-lg);
  background: none;
  border: none;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  position: relative;
  transition: all var(--transition-fast);
}

.tab-btn:hover {
  color: var(--text-primary);
}

.tab-btn.active {
  color: var(--color-primary);
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background-color: var(--color-primary);
  border-radius: 2px 2px 0 0;
}

.modal-alert {
  margin: var(--spacing-md) var(--spacing-xl) 0;
}

/* Form */
.edit-form {
  padding: var(--spacing-xl);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.form-section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.form-section-hint {
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--text-tertiary);
}

.form-section-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-sm);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-md);
}

.form-grid-single {
  grid-template-columns: 1fr !important;
  max-width: 400px;
}

@media (min-width: 640px) {
  .form-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.required {
  color: var(--color-error);
}

.form-input {
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  font-size: 0.9375rem;
  color: var(--text-primary);
  background-color: var(--bg-primary);
  transition: all var(--transition-fast);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.1);
}

.form-input-readonly {
  background-color: var(--bg-tertiary);
  color: var(--text-tertiary);
  cursor: not-allowed;
}

.form-input-readonly:focus {
  outline: none;
  border-color: var(--border-primary);
  box-shadow: none;
}

.form-input-error {
  border-color: var(--color-error);
}

.form-input-error:focus {
  border-color: var(--color-error);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

/* Input with Icon (for password fields) */
.input-with-icon {
  position: relative;
  display: flex;
  align-items: center;
}

.input-with-icon .form-input {
  padding-right: 2.75rem;
  width: 100%;
}

.input-icon-btn {
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  padding: 0.25rem;
  color: var(--text-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color var(--transition-fast);
}

.input-icon-btn:hover {
  color: var(--text-secondary);
}

/* Form Error and Hint */
.form-error {
  font-size: 0.75rem;
  color: var(--color-error);
}

.form-hint {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--border-light);
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  border: none;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: var(--color-primary);
  color: var(--text-white);
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-light);
}

.btn-secondary {
  background-color: var(--bg-tertiary);
  color: var(--text-secondary);
  border: 1px solid var(--border-primary);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--bg-hover);
}

.btn-spinner {
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  border: 2px solid transparent;
  border-top-color: currentColor;
  animation: spin 0.8s linear infinite;
}

/* Error State */
.error-state {
  text-align: center;
  padding: 4rem 2rem;
  background-color: var(--bg-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
}

.error-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  border-radius: var(--radius-full);
  background-color: var(--color-warning-bg);
  margin-bottom: var(--spacing-md);
}

.error-icon svg {
  width: 2rem;
  height: 2rem;
  color: var(--color-warning);
}

.error-state p {
  color: var(--text-tertiary);
  font-size: 1rem;
  margin-bottom: var(--spacing-lg);
}

.retry-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  background-color: var(--color-primary);
  color: var(--text-white);
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.retry-btn:hover {
  background-color: var(--color-primary-light);
}
</style>
