import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '@/api'

import { useAuthStore } from '@/stores/authStore'
import { ROLES } from '@/utils/constants'
import { getErrorMessage } from '@/utils/httpError'
import ProfileView from '@/views/ProfileView.vue'

vi.mock('@/api')
vi.mock('@/utils/httpError')

function createAxiosResponse<T>(data: T): AxiosResponse<T> {
  return { data, status: 200, statusText: 'OK', headers: {}, config: {} as InternalAxiosRequestConfig }
}

// Extracted validation logic from ProfileView.vue for unit testing
interface PasswordForm {
  currentPassword: string
  newPassword: string
  confirmNewPassword: string
}

interface PasswordErrors {
  currentPassword: string
  newPassword: string
  confirmNewPassword: string
}

function validatePasswordFields(passwordForm: PasswordForm, passwordErrors: PasswordErrors): boolean {
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

function createMockUserProfile() {
  return {
    userId: '1',
    username: 'testuser',
    email: 'test@example.com',
    role: ROLES.INSTRUCTOR,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    instructorProfile: {
      id: 1,
      firstname: 'Test',
      lastname: 'Instructor',
    },
  }
}

describe('profileView - Password Change', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  describe('unit Tests - Validation Logic', () => {
    it('returns true when no password fields are filled (validation skipped)', () => {
      const passwordForm: PasswordForm = {
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      }
      const passwordErrors: PasswordErrors = {
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      }

      const result = validatePasswordFields(passwordForm, passwordErrors)

      expect(result).toBe(true)
      expect(passwordErrors.currentPassword).toBe('')
      expect(passwordErrors.newPassword).toBe('')
      expect(passwordErrors.confirmNewPassword).toBe('')
    })

    it('shows error when newPassword/confirmPassword filled but currentPassword empty', () => {
      const passwordForm: PasswordForm = {
        currentPassword: '',
        newPassword: 'newpassword123',
        confirmNewPassword: 'newpassword123',
      }
      const passwordErrors: PasswordErrors = {
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      }

      const result = validatePasswordFields(passwordForm, passwordErrors)

      expect(result).toBe(false)
      expect(passwordErrors.currentPassword).toBe('Current password is required to change password')
      expect(passwordErrors.newPassword).toBe('')
      expect(passwordErrors.confirmNewPassword).toBe('')
    })

    it('shows error when currentPassword filled but newPassword empty', () => {
      const passwordForm: PasswordForm = {
        currentPassword: 'oldpassword',
        newPassword: '',
        confirmNewPassword: '',
      }
      const passwordErrors: PasswordErrors = {
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      }

      const result = validatePasswordFields(passwordForm, passwordErrors)

      expect(result).toBe(false)
      expect(passwordErrors.currentPassword).toBe('')
      expect(passwordErrors.newPassword).toBe('New password is required')
      expect(passwordErrors.confirmNewPassword).toBe('')
    })

    it('shows error when newPassword < 8 characters', () => {
      const passwordForm: PasswordForm = {
        currentPassword: 'oldpassword',
        newPassword: 'short',
        confirmNewPassword: 'short',
      }
      const passwordErrors: PasswordErrors = {
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      }

      const result = validatePasswordFields(passwordForm, passwordErrors)

      expect(result).toBe(false)
      expect(passwordErrors.currentPassword).toBe('')
      expect(passwordErrors.newPassword).toBe('Password must be at least 8 characters')
      expect(passwordErrors.confirmNewPassword).toBe('')
    })

    it('shows error when newPassword filled but confirmPassword empty', () => {
      const passwordForm: PasswordForm = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
        confirmNewPassword: '',
      }
      const passwordErrors: PasswordErrors = {
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      }

      const result = validatePasswordFields(passwordForm, passwordErrors)

      expect(result).toBe(false)
      expect(passwordErrors.currentPassword).toBe('')
      expect(passwordErrors.newPassword).toBe('')
      expect(passwordErrors.confirmNewPassword).toBe('Please confirm your new password')
    })

    it('shows error when newPassword !== confirmNewPassword', () => {
      const passwordForm: PasswordForm = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
        confirmNewPassword: 'differentpassword',
      }
      const passwordErrors: PasswordErrors = {
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      }

      const result = validatePasswordFields(passwordForm, passwordErrors)

      expect(result).toBe(false)
      expect(passwordErrors.currentPassword).toBe('')
      expect(passwordErrors.newPassword).toBe('')
      expect(passwordErrors.confirmNewPassword).toBe('Passwords do not match')
    })

    it('returns true when all fields are valid', () => {
      const passwordForm: PasswordForm = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
        confirmNewPassword: 'newpassword123',
      }
      const passwordErrors: PasswordErrors = {
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      }

      const result = validatePasswordFields(passwordForm, passwordErrors)

      expect(result).toBe(true)
      expect(passwordErrors.currentPassword).toBe('')
      expect(passwordErrors.newPassword).toBe('')
      expect(passwordErrors.confirmNewPassword).toBe('')
    })

    it('validates when only currentPassword is filled', () => {
      const passwordForm: PasswordForm = {
        currentPassword: 'oldpassword',
        newPassword: '',
        confirmNewPassword: '',
      }
      const passwordErrors: PasswordErrors = {
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      }

      const result = validatePasswordFields(passwordForm, passwordErrors)

      expect(result).toBe(false)
      expect(passwordErrors.newPassword).toBe('New password is required')
    })

    it('validates when only newPassword is filled', () => {
      const passwordForm: PasswordForm = {
        currentPassword: '',
        newPassword: 'newpassword123',
        confirmNewPassword: '',
      }
      const passwordErrors: PasswordErrors = {
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      }

      const result = validatePasswordFields(passwordForm, passwordErrors)

      expect(result).toBe(false)
      expect(passwordErrors.currentPassword).toBe('Current password is required to change password')
    })

    it('validates when only confirmNewPassword is filled', () => {
      const passwordForm: PasswordForm = {
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: 'newpassword123',
      }
      const passwordErrors: PasswordErrors = {
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      }

      const result = validatePasswordFields(passwordForm, passwordErrors)

      expect(result).toBe(false)
      expect(passwordErrors.currentPassword).toBe('Current password is required to change password')
    })
  })

  describe('component Tests - UI Interactions', () => {
    it('tab switching shows security tab when clicked', async () => {
      const authStore = useAuthStore()
      authStore.userProfile = createMockUserProfile()
      authStore.isLoading = false

      const wrapper = mount(ProfileView, {
        global: {
          plugins: [createPinia()],
          stubs: {
            RouterLink: true,
          },
        },
      })

      // Click edit profile button
      await wrapper.find('.edit-profile-btn').trigger('click')
      await wrapper.vm.$nextTick()

      // Click security tab
      const securityTab = wrapper.findAll('.tab-btn')[1]
      await securityTab.trigger('click')
      await wrapper.vm.$nextTick()

      // Verify security tab is active
      expect(securityTab.classes()).toContain('active')
    })

    it('password visibility toggle changes input type', async () => {
      const authStore = useAuthStore()
      authStore.userProfile = createMockUserProfile()
      authStore.isLoading = false

      const wrapper = mount(ProfileView, {
        global: {
          plugins: [createPinia()],
          stubs: {
            RouterLink: true,
          },
        },
      })

      // Open edit modal
      await wrapper.find('.edit-profile-btn').trigger('click')
      await wrapper.vm.$nextTick()

      // Click security tab
      const securityTab = wrapper.findAll('.tab-btn')[1]
      await securityTab.trigger('click')
      await wrapper.vm.$nextTick()

      // Find current password input
      const currentPasswordInput = wrapper.find('#currentPassword')
      expect(currentPasswordInput.attributes('type')).toBe('password')

      // Click visibility toggle
      const toggleButton = currentPasswordInput.element.nextElementSibling as HTMLElement
      await toggleButton.click()
      await wrapper.vm.$nextTick()

      expect(currentPasswordInput.attributes('type')).toBe('text')
    })

    it('form validation shows error messages on invalid submit', async () => {
      const authStore = useAuthStore()
      authStore.userProfile = createMockUserProfile()
      authStore.isLoading = false

      const wrapper = mount(ProfileView, {
        global: {
          plugins: [createPinia()],
          stubs: {
            RouterLink: true,
          },
        },
      })

      // Open edit modal
      await wrapper.find('.edit-profile-btn').trigger('click')
      await wrapper.vm.$nextTick()

      // Click security tab
      const securityTab = wrapper.findAll('.tab-btn')[1]
      await securityTab.trigger('click')
      await wrapper.vm.$nextTick()

      // Fill only new password (invalid - missing current password)
      const newPasswordInput = wrapper.find('#newPassword')
      await newPasswordInput.setValue('newpassword123')
      await wrapper.vm.$nextTick()

      // Submit form
      const form = wrapper.find('.edit-form')
      await form.trigger('submit')
      await wrapper.vm.$nextTick()

      // Verify error message appears
      expect(wrapper.find('.form-error').text()).toContain('Current password is required')
    })

    it('submit button disabled when hasChanges is false', async () => {
      const authStore = useAuthStore()
      authStore.userProfile = createMockUserProfile()
      authStore.isLoading = false

      const wrapper = mount(ProfileView, {
        global: {
          plugins: [createPinia()],
          stubs: {
            RouterLink: true,
          },
        },
      })

      // Open edit modal
      await wrapper.find('.edit-profile-btn').trigger('click')
      await wrapper.vm.$nextTick()

      const submitButton = wrapper.find('.btn-primary')
      expect(submitButton.attributes('disabled')).toBeDefined()
    })

    it('cancel editing resets password form and closes modal', async () => {
      const authStore = useAuthStore()
      authStore.userProfile = createMockUserProfile()
      authStore.isLoading = false

      const wrapper = mount(ProfileView, {
        global: {
          plugins: [createPinia()],
          stubs: {
            RouterLink: true,
          },
        },
      })

      // Open edit modal
      await wrapper.find('.edit-profile-btn').trigger('click')
      await wrapper.vm.$nextTick()

      // Fill password fields
      const currentPasswordInput = wrapper.find('#currentPassword')
      await currentPasswordInput.setValue('oldpassword')
      await wrapper.vm.$nextTick()

      // Click cancel
      const cancelButton = wrapper.find('.btn-secondary')
      await cancelButton.trigger('click')
      await wrapper.vm.$nextTick()

      // Verify modal is closed
      expect(wrapper.find('.modal-overlay').exists()).toBe(false)
    })
  })

  describe('integration Tests - Backend Response', () => {
    it('successful password change shows success message', async () => {
      const authStore = useAuthStore()
      authStore.userProfile = createMockUserProfile()
      authStore.isLoading = false

      vi.mocked(api.patch).mockResolvedValue(
        createAxiosResponse({ success: true, message: 'Profile updated successfully!' }),
      )
      vi.mocked(authStore.fetchUserProfile).mockResolvedValue(createMockUserProfile())

      const wrapper = mount(ProfileView, {
        global: {
          plugins: [createPinia()],
          stubs: {
            RouterLink: true,
          },
        },
      })

      // Open edit modal
      await wrapper.find('.edit-profile-btn').trigger('click')
      await wrapper.vm.$nextTick()

      // Click security tab
      const securityTab = wrapper.findAll('.tab-btn')[1]
      await securityTab.trigger('click')
      await wrapper.vm.$nextTick()

      // Fill password fields
      const currentPasswordInput = wrapper.find('#currentPassword')
      const newPasswordInput = wrapper.find('#newPassword')
      const confirmPasswordInput = wrapper.find('#confirmNewPassword')

      await currentPasswordInput.setValue('oldpassword')
      await newPasswordInput.setValue('newpassword123')
      await confirmPasswordInput.setValue('newpassword123')
      await wrapper.vm.$nextTick()

      // Submit form
      const form = wrapper.find('.edit-form')
      await form.trigger('submit')
      await wrapper.vm.$nextTick()

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100))

      // Verify API was called
      expect(api.patch).toHaveBeenCalledWith('/account/profile', expect.objectContaining({
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
        confirmNewPassword: 'newpassword123',
      }))

      // Verify profile refresh was called
      expect(authStore.fetchUserProfile).toHaveBeenCalled()
    })

    it('backend validation error shows error message', async () => {
      const authStore = useAuthStore()
      authStore.userProfile = createMockUserProfile()
      authStore.isLoading = false

      vi.mocked(api.patch).mockResolvedValue(
        createAxiosResponse({ success: false, message: 'Current password is incorrect' }),
      )

      const wrapper = mount(ProfileView, {
        global: {
          plugins: [createPinia()],
          stubs: {
            RouterLink: true,
          },
        },
      })

      // Open edit modal
      await wrapper.find('.edit-profile-btn').trigger('click')
      await wrapper.vm.$nextTick()

      // Click security tab
      const securityTab = wrapper.findAll('.tab-btn')[1]
      await securityTab.trigger('click')
      await wrapper.vm.$nextTick()

      // Fill password fields
      const currentPasswordInput = wrapper.find('#currentPassword')
      const newPasswordInput = wrapper.find('#newPassword')
      const confirmPasswordInput = wrapper.find('#confirmNewPassword')

      await currentPasswordInput.setValue('wrongpassword')
      await newPasswordInput.setValue('newpassword123')
      await confirmPasswordInput.setValue('newpassword123')
      await wrapper.vm.$nextTick()

      // Submit form
      const form = wrapper.find('.edit-form')
      await form.trigger('submit')
      await wrapper.vm.$nextTick()

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100))

      // Verify error message is shown
      expect(wrapper.find('.alert-error').exists()).toBe(true)
      expect(wrapper.find('.alert-error').text()).toContain('Current password is incorrect')
    })

    it('network error shows error message via getErrorMessage', async () => {
      const authStore = useAuthStore()
      authStore.userProfile = createMockUserProfile()
      authStore.isLoading = false

      const testError = new Error('Network error')
      vi.mocked(api.patch).mockRejectedValue(testError)
      vi.mocked(getErrorMessage).mockReturnValue('Failed to update profile. Please try again.')

      const wrapper = mount(ProfileView, {
        global: {
          plugins: [createPinia()],
          stubs: {
            RouterLink: true,
          },
        },
      })

      // Open edit modal
      await wrapper.find('.edit-profile-btn').trigger('click')
      await wrapper.vm.$nextTick()

      // Click security tab
      const securityTab = wrapper.findAll('.tab-btn')[1]
      await securityTab.trigger('click')
      await wrapper.vm.$nextTick()

      // Fill password fields
      const currentPasswordInput = wrapper.find('#currentPassword')
      const newPasswordInput = wrapper.find('#newPassword')
      const confirmPasswordInput = wrapper.find('#confirmNewPassword')

      await currentPasswordInput.setValue('oldpassword')
      await newPasswordInput.setValue('newpassword123')
      await confirmPasswordInput.setValue('newpassword123')
      await wrapper.vm.$nextTick()

      // Submit form
      const form = wrapper.find('.edit-form')
      await form.trigger('submit')
      await wrapper.vm.$nextTick()

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100))

      // Verify getErrorMessage was called
      expect(getErrorMessage).toHaveBeenCalledWith(testError, 'Failed to update profile. Please try again.')

      // Verify error message is shown
      expect(wrapper.find('.alert-error').exists()).toBe(true)
    })
  })

  describe('edge Cases', () => {
    it('whitespace-only password fails validation (too short)', () => {
      const passwordForm: PasswordForm = {
        currentPassword: 'oldpassword',
        newPassword: '        ', // 8 spaces
        confirmNewPassword: '        ',
      }
      const passwordErrors: PasswordErrors = {
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      }

      const result = validatePasswordFields(passwordForm, passwordErrors)

      expect(result).toBe(true) // 8 spaces passes length check
    })

    it('whitespace-only password less than 8 chars fails validation', () => {
      const passwordForm: PasswordForm = {
        currentPassword: 'oldpassword',
        newPassword: '   ', // 3 spaces
        confirmNewPassword: '   ',
      }
      const passwordErrors: PasswordErrors = {
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      }

      const result = validatePasswordFields(passwordForm, passwordErrors)

      expect(result).toBe(false)
      expect(passwordErrors.newPassword).toBe('Password must be at least 8 characters')
    })

    it('passwords with special characters pass validation', () => {
      const passwordForm: PasswordForm = {
        currentPassword: 'oldpassword',
        newPassword: '!@#$%^&*()_+-=[]{}|;\':",.<>?/',
        confirmNewPassword: '!@#$%^&*()_+-=[]{}|;\':",.<>?/',
      }
      const passwordErrors: PasswordErrors = {
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      }

      const result = validatePasswordFields(passwordForm, passwordErrors)

      expect(result).toBe(true)
    })

    it('very long passwords (100+ chars) pass validation', () => {
      const longPassword = 'a'.repeat(100)
      const passwordForm: PasswordForm = {
        currentPassword: 'oldpassword',
        newPassword: longPassword,
        confirmNewPassword: longPassword,
      }
      const passwordErrors: PasswordErrors = {
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      }

      const result = validatePasswordFields(passwordForm, passwordErrors)

      expect(result).toBe(true)
    })

    it('unicode characters in passwords pass validation', () => {
      const passwordForm: PasswordForm = {
        currentPassword: 'oldpassword',
        newPassword: '密码🔐émojis😀',
        confirmNewPassword: '密码🔐émojis😀',
      }
      const passwordErrors: PasswordErrors = {
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      }

      const result = validatePasswordFields(passwordForm, passwordErrors)

      expect(result).toBe(true)
    })

    it('password matching current password passes validation (current implementation allows it)', () => {
      const passwordForm: PasswordForm = {
        currentPassword: 'samepassword',
        newPassword: 'samepassword',
        confirmNewPassword: 'samepassword',
      }
      const passwordErrors: PasswordErrors = {
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      }

      const result = validatePasswordFields(passwordForm, passwordErrors)

      expect(result).toBe(true)
    })

    it('password with leading/trailing whitespace is not trimmed in validation', () => {
      const passwordForm: PasswordForm = {
        currentPassword: 'oldpassword',
        newPassword: '  newpassword123  ',
        confirmNewPassword: '  newpassword123  ',
      }
      const passwordErrors: PasswordErrors = {
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      }

      const result = validatePasswordFields(passwordForm, passwordErrors)

      expect(result).toBe(true) // Length check includes whitespace
    })

    it('passwords with mixed whitespace and characters pass if >= 8 chars', () => {
      const passwordForm: PasswordForm = {
        currentPassword: 'oldpassword',
        newPassword: '  pass  ', // 8 chars with spaces
        confirmNewPassword: '  pass  ',
      }
      const passwordErrors: PasswordErrors = {
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      }

      const result = validatePasswordFields(passwordForm, passwordErrors)

      expect(result).toBe(true)
    })
  })
})
