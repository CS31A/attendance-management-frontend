import type { EntityId } from '@/types'
import type { UserRole } from '@/utils/constants'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import api from '@/api'
import { ROLES } from '@/utils/constants'
import { getErrorMessage, getValidationErrorMessages } from '@/utils/httpError'

interface ApiUserProfile {
  id?: EntityId
  firstname?: string
  lastname?: string
  department?: string | null
  sectionId?: EntityId | null
  isRegular?: boolean
  createdAt?: string
  updatedAt?: string
}

interface ApiUser {
  userId?: EntityId
  id?: EntityId
  username?: string
  email?: string
  role?: UserRole | 'Teacher'
  createdAt?: string
  updatedAt?: string
  isDeleted?: boolean
  firstName?: string
  lastName?: string
  profileId?: EntityId
  department?: string | null
  sectionId?: EntityId | null
  isRegular?: boolean
  adminProfile?: ApiUserProfile | null
  instructorProfile?: ApiUserProfile | null
  studentProfile?: ApiUserProfile | null
  deletedAt?: string | null
  [key: string]: unknown
}

type UiRole = 'Admin' | 'Instructor' | 'Student'

export interface CreateUserInput {
  Username: string
  FirstName: string
  LastName: string
  Email: string
  Password: string
  RepeatedPassword: string
  Role: UiRole
  SectionId?: string
}

interface UserActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// Helper function to map user profile data from API response to flat structure
function mapUserProfile(user: ApiUser): ApiUser {
  // Normalize legacy 'Teacher' role to 'Instructor'
  const normalizedRole = user.role === 'Teacher' ? 'Instructor' : user.role

  // Extract base fields
  const mappedUser: ApiUser = {
    userId: user.userId,
    username: user.username,
    email: user.email,
    role: normalizedRole,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    isDeleted: user.isDeleted,
  }

  // Map profile data based on role
  if (normalizedRole === 'Admin' && user.adminProfile) {
    mappedUser.firstName = user.adminProfile.firstname
    mappedUser.lastName = user.adminProfile.lastname
    mappedUser.profileId = user.adminProfile.id
    mappedUser.createdAt = user.adminProfile.createdAt
    mappedUser.updatedAt = user.adminProfile.updatedAt
  }
  else if (normalizedRole === 'Instructor' && user.instructorProfile) {
    mappedUser.firstName = user.instructorProfile.firstname
    mappedUser.lastName = user.instructorProfile.lastname
    mappedUser.department = user.instructorProfile.department ?? null
    mappedUser.profileId = user.instructorProfile.id
    mappedUser.createdAt = user.instructorProfile.createdAt
    mappedUser.updatedAt = user.instructorProfile.updatedAt
  }
  else if (normalizedRole === 'Student' && user.studentProfile) {
    mappedUser.firstName = user.studentProfile.firstname
    mappedUser.lastName = user.studentProfile.lastname
    mappedUser.sectionId = user.studentProfile.sectionId
    mappedUser.isRegular = user.studentProfile.isRegular
    mappedUser.profileId = user.studentProfile.id
    mappedUser.createdAt = user.studentProfile.createdAt
    mappedUser.updatedAt = user.studentProfile.updatedAt
  }

  return mappedUser
}

function asLowerString(value: unknown): string {
  return typeof value === 'string' ? value.toLowerCase() : ''
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function normalizeRole(role: UiRole): UserRole {
  return role as UserRole
}

export const useUserStore = defineStore('user', () => {
  // State
  const users = ref<ApiUser[]>([])
  const loadingCount = ref(0)
  const loading = computed(() => loadingCount.value > 0)
  const error = ref('')
  // Pagination state
  const currentPage = ref(1)
  const itemsPerPage = ref(10)
  const totalItems = ref(0)

  // Getters
  const getUsers = computed(() => users.value)
  const instructors = computed(() => users.value.filter(user => user.role === ROLES.INSTRUCTOR))
  const students = computed(() => users.value.filter(user => user.role === ROLES.STUDENT))

  const filteredUsers = computed(() => (searchQuery: string, selectedRole: string) => {
    let filtered = users.value

    if (selectedRole !== 'All Roles') {
      filtered = filtered.filter(user => user.role === selectedRole)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter((user) => {
        // Handle both camelCase and lowercase property names from API
        const firstName = asLowerString(user.firstName || user.firstname)
        const lastName = asLowerString(user.lastName || user.lastname)
        const emailValue = asLowerString(user.email)
        const username = asLowerString(user.username)

        return firstName.includes(query)
          || lastName.includes(query)
          || emailValue.includes(query)
          || username.includes(query)
          || `${firstName} ${lastName}`.includes(query)
      })
    }

    return filtered
  })

  // Pagination getters
  const paginatedUsers = computed(() => (searchQuery: string, selectedRole: string) => {
    const filtered = filteredUsers.value(searchQuery, selectedRole)
    const start = (currentPage.value - 1) * itemsPerPage.value
    const end = start + itemsPerPage.value
    return filtered.slice(start, end)
  })

  const totalPages = computed(() => (searchQuery: string, selectedRole: string) => {
    const filtered = filteredUsers.value(searchQuery, selectedRole)
    return Math.ceil(filtered.length / itemsPerPage.value)
  })

  const hasNextPage = computed(() => (searchQuery: string, selectedRole: string) => {
    const filtered = filteredUsers.value(searchQuery, selectedRole)
    const computedTotalPages = Math.ceil(filtered.length / itemsPerPage.value)
    return currentPage.value < computedTotalPages
  })

  const hasPreviousPage = computed(() => currentPage.value > 1)

  function beginLoading() {
    loadingCount.value += 1
  }

  function endLoading() {
    loadingCount.value = Math.max(0, loadingCount.value - 1)
  }

  // Actions
  async function fetchUsers(status = 'Active') {
    beginLoading()
    error.value = ''

    try {
      const resp = await api.get<ApiUser[]>('/users', { params: { status } })
      // Map user profile data to flat structure
      users.value = resp.data.map(user => mapUserProfile(user))
    }
    catch (err) {
      console.error('Error fetching users:', err)
      error.value = 'Failed to fetch users'
    }
    finally {
      endLoading()
    }
  }

  async function createUser(userData: CreateUserInput): Promise<UserActionResult> {
    beginLoading()
    error.value = ''

    try {
      // Transform data to match Scalar API documentation exactly
      const registerData = {
        username: userData.Username,
        firstname: userData.FirstName,
        lastname: userData.LastName,
        email: userData.Email,
        password: userData.Password,
        repeatedPassword: userData.RepeatedPassword,
        role: userData.Role, // 'Admin' | 'Instructor' | 'Student'
        sectionId: userData.Role === 'Student' && userData.SectionId
          ? Number.parseInt(userData.SectionId, 10)
          : null,
      }
      const response = await api.post('/account/register', registerData)

      // Add the new user to the store
      // Map profile data if present in response
      const newUser = response.data.userId
        ? mapUserProfile(response.data)
        : {
            id: response.data.id || Date.now(),
            firstName: response.data.firstName || response.data.firstname || userData.FirstName,
            lastName: response.data.lastName || response.data.lastname || userData.LastName,
            email: response.data.email || userData.Email,
            role: normalizeRole(userData.Role),
            sectionId: response.data.sectionId || userData.SectionId,
            createdAt: response.data.createdAt || new Date().toISOString(),
          }

      users.value.push(newUser)

      return { success: true, data: response.data }
    }
    catch (caughtError) {
      console.error('Error creating user:', caughtError)

      // Extract detailed error message from backend
      let errorMessage = getErrorMessage(caughtError, 'Failed to create user')
      const validationErrors = getValidationErrorMessages(caughtError)
      if (validationErrors.length > 0) {
        errorMessage = validationErrors.join(', ')
      }

      error.value = errorMessage
      return { success: false, error: errorMessage }
    }
    finally {
      endLoading()
    }
  }

  async function updateUser(userId: EntityId, userData: Record<string, unknown>): Promise<UserActionResult> {
    beginLoading()
    error.value = ''

    try {
      // Find the original user to get their current role/endpoint
      const originalUser = users.value.find(user => (user.userId || user.id) === userId)
      if (!originalUser) {
        throw new Error('User not found')
      }

      // Use the original user's role to determine the correct endpoint
      // API may return 'Teacher' for legacy users, also handle 'Instructor' for compatibility
      const isInstructor = originalUser.role === ROLES.INSTRUCTOR || originalUser.role === 'Teacher'
      const endpoint = isInstructor ? '/instructors' : '/students'

      // Use profileId for the endpoint (backend expects profile ID, not user ID)
      const profileId = originalUser.profileId
      if (!profileId) {
        throw new Error('Profile ID not found for user')
      }

      const response = await api.patch(`${endpoint}/${profileId}`, userData)

      // Update the user in the store with the original role (role cannot be changed)
      const index = users.value.findIndex(user => (user.userId || user.id) === userId)
      if (index !== -1) {
        const responseData = response.data as ApiUser
        const hasNestedProfile = Boolean(responseData.adminProfile || responseData.instructorProfile || responseData.studentProfile)
        const updatedUser = hasNestedProfile
          ? mapUserProfile({ ...responseData, role: originalUser.role })
          : {
              ...originalUser,
              ...responseData,
              role: originalUser.role,
              firstName: asOptionalString(responseData.firstName) || asOptionalString(responseData.firstname) || originalUser.firstName,
              lastName: asOptionalString(responseData.lastName) || asOptionalString(responseData.lastname) || originalUser.lastName,
              department: responseData.department ?? originalUser.department ?? null,
            }
        users.value[index] = updatedUser
      }

      return { success: true, data: response.data }
    }
    catch (caughtError) {
      console.error('Error updating user:', caughtError)
      error.value = getErrorMessage(caughtError, 'Failed to update user')
      return { success: false, error: error.value }
    }
    finally {
      endLoading()
    }
  }

  /**
   * Soft delete a user (reversible)
   * Endpoint: PATCH /api/users/{userId}/soft-delete
   * Authorization: AdminPolicy
   * @param {number} userId - The ID of the user to soft delete
   * @returns {Promise<{success: boolean, error?: string}>} The result of the soft delete operation
   */
  async function softDeleteUser(userId: EntityId): Promise<UserActionResult> {
    beginLoading()
    error.value = ''

    try {
      await api.patch(`/users/${userId}/soft-delete`)

      // Mark user as deleted in local state
      const index = users.value.findIndex(u => (u.userId || u.id) === userId)
      if (index !== -1) {
        users.value[index].deletedAt = new Date().toISOString()
        users.value[index].isDeleted = true
      }

      return { success: true }
    }
    catch (caughtError) {
      console.error('Error soft deleting user:', caughtError)
      error.value = getErrorMessage(caughtError, 'Failed to soft delete user')
      return { success: false, error: error.value }
    }
    finally {
      endLoading()
    }
  }

  /**
   * Hard delete a user (permanent)
   * Endpoint: DELETE /api/users/{userId}
   * Authorization: AdminPolicy
   * @param {number} userId - The ID of the user to permanently delete
   * @returns {Promise<{success: boolean, error?: string}>} The result of the hard delete operation
   */
  async function hardDeleteUser(userId: EntityId): Promise<UserActionResult> {
    beginLoading()
    error.value = ''

    try {
      await api.delete(`/users/${userId}`)

      // Remove the user from the store
      users.value = users.value.filter(user => (user.userId || user.id) !== userId)

      return { success: true }
    }
    catch (caughtError) {
      console.error('Error hard deleting user:', caughtError)
      error.value = getErrorMessage(caughtError, 'Failed to permanently delete user')
      return { success: false, error: error.value }
    }
    finally {
      endLoading()
    }
  }

  /**
   * Restore a soft-deleted user
   * Endpoint: PATCH /api/users/{userId}/restore
   * Authorization: AdminPolicy
   * @param {number} userId - The ID of the user to restore
   * @returns {Promise<{success: boolean, error?: string}>} The result of the restore operation
   */
  async function restoreUser(userId: EntityId): Promise<UserActionResult> {
    beginLoading()
    error.value = ''

    try {
      await api.patch(`/users/${userId}/restore`)

      // Mark user as not deleted in local state
      const index = users.value.findIndex(u => (u.userId || u.id) === userId)
      if (index !== -1) {
        users.value[index].deletedAt = null
        users.value[index].isDeleted = false
      }

      return { success: true }
    }
    catch (caughtError) {
      console.error('Error restoring user:', caughtError)
      error.value = getErrorMessage(caughtError, 'Failed to restore user')
      return { success: false, error: error.value }
    }
    finally {
      endLoading()
    }
  }

  // Pagination actions
  function setCurrentPage(page: number): void {
    currentPage.value = page
  }

  function setItemsPerPage(newItemsPerPage: number): void {
    itemsPerPage.value = newItemsPerPage
    currentPage.value = 1 // Reset to first page when changing items per page
  }

  function nextPage(searchQuery: string, selectedRole: string): void {
    const computedTotalPages = totalPages.value(searchQuery, selectedRole)
    if (currentPage.value < computedTotalPages) {
      currentPage.value++
    }
  }

  function previousPage(): void {
    if (currentPage.value > 1) {
      currentPage.value--
    }
  }

  function goToPage(page: number, searchQuery: string, selectedRole: string): void {
    const computedTotalPages = totalPages.value(searchQuery, selectedRole)
    if (page >= 1 && page <= computedTotalPages) {
      currentPage.value = page
    }
  }

  return {
    // State
    users,
    loading,
    error,
    currentPage,
    itemsPerPage,
    totalItems,

    // Getters
    getUsers,
    instructors,
    students,
    filteredUsers,
    paginatedUsers,
    totalPages,
    hasNextPage,
    hasPreviousPage,

    // Actions
    fetchUsers,
    createUser,
    updateUser,
    softDeleteUser,
    hardDeleteUser,
    restoreUser,
    setCurrentPage,
    setItemsPerPage,
    nextPage,
    previousPage,
    goToPage,
  }
})
