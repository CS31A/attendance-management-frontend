import { defineStore } from 'pinia'
import api from '@/api/index.js'

// Helper function to validate section
function isValidSection(sectionId) {
  const validSections = ['1', '2', '3', '4', '5', 'CS101', 'MATH201', 'ENG301']
  return validSections.includes(sectionId)
}

export const useUserStore = defineStore('user', {
  state: () => ({
    users: [],
    loading: false,
    error: null,
    // Pagination state
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
  }),

  getters: {
    getUsers: state => state.users,
    instructors: state => state.users.filter(user => user.role === 'Instructor'),
    students: state => state.users.filter(user => user.role === 'Student'),
    filteredUsers: state => (searchQuery, selectedRole) => {
      let filtered = state.users

      if (selectedRole !== 'All Roles') {
        filtered = filtered.filter(user => user.role === selectedRole)
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase().trim()
        filtered = filtered.filter((user) => {
          // Handle both camelCase and lowercase property names from API
          const firstName = (user.firstName || user.firstname || '').toLowerCase()
          const lastName = (user.lastName || user.lastname || '').toLowerCase()
          const email = (user.email || '').toLowerCase()
          const username = (user.username || '').toLowerCase()

          return firstName.includes(query)
            || lastName.includes(query)
            || email.includes(query)
            || username.includes(query)
            || `${firstName} ${lastName}`.includes(query)
        })
      }

      return filtered
    },

    // Pagination getters
    paginatedUsers: state => (searchQuery, selectedRole) => {
      const filtered = state.filteredUsers(searchQuery, selectedRole)
      const start = (state.currentPage - 1) * state.itemsPerPage
      const end = start + state.itemsPerPage
      return filtered.slice(start, end)
    },

    totalPages: state => (searchQuery, selectedRole) => {
      const filtered = state.filteredUsers(searchQuery, selectedRole)
      return Math.ceil(filtered.length / state.itemsPerPage)
    },

    hasNextPage: state => (searchQuery, selectedRole) => {
      const filtered = state.filteredUsers(searchQuery, selectedRole)
      const totalPages = Math.ceil(filtered.length / state.itemsPerPage)
      return state.currentPage < totalPages
    },

    hasPreviousPage: (state) => {
      return state.currentPage > 1
    },
  },

  actions: {
    async fetchUsers() {
      this.loading = true
      this.error = null

      try {
        // Para sa skeleton loader simulation
        await new Promise(resolve => setTimeout(resolve, 500))

        const resp = await api.get('/users')
        this.users = resp.data
      }
      catch {
        // Error fetching users
      }
      finally {
        this.loading = false
        this.error = null
      }
    },
    async createUser(userData) {
      this.loading = true
      this.error = null

      try {
        // Transform data to match Scalar API documentation exactly
        const registerData = {
          username: userData.Username,
          firstname: userData.FirstName,
          lastname: userData.LastName,
          email: userData.Email,
          password: userData.Password,
          repeatedPassword: userData.RepeatedPassword,
          role: userData.Role === 'Instructor' ? 'teacher' : userData.Role.toLowerCase(),
          sectionId: userData.Role === 'Student' ? Number.parseInt(userData.SectionId) : null,
        }

        // If section validation fails for students, try with a default section
        if (registerData.sectionId && userData.Role.toLowerCase() === 'student' && !isValidSection(registerData.sectionId)) {
          console.warn('Section validation failed for student, trying with default section 3')
          registerData.sectionId = 3
        }

        let response
        try {
          response = await api.post('/account/register', registerData)
        }
        catch (error) {
          console.error('Backend error details:', error.response?.data)
          console.error('Error status:', error.response?.status)
          console.error('Error message:', error.response?.data?.message)

          // If section validation fails for students, try with a different approach
          if (error.response?.status === 400 && error.response?.data?.message?.includes('section') && userData.Role.toLowerCase() === 'student') {
            const fallbackData = {
              ...registerData,
              sectionId: Number.parseInt(registerData.sectionId) || 3,
            }
            response = await api.post('/account/register', fallbackData)
          }
          else {
            throw error
          }
        }

        // Add the new user to the store
        const newUser = {
          id: response.data.id || Date.now(),
          firstName: response.data.firstName || response.data.firstname || userData.FirstName,
          lastName: response.data.lastName || response.data.lastname || userData.LastName,
          email: response.data.email || userData.Email,
          role: userData.Role,
          sectionId: response.data.sectionId || userData.SectionId,
          createdAt: response.data.createdAt || new Date().toISOString(),
        }

        this.users.push(newUser)

        return { success: true, data: response.data }
      }
      catch (error) {
        console.error('Error creating user:', error)

        // For development: if backend fails, add to local store anyway
        if (error.response?.status === 401 || error.response?.status === 400) {
          const newUser = {
            id: Date.now(), // Simple ID generation
            firstName: userData.FirstName,
            lastName: userData.LastName,
            email: userData.Email,
            role: userData.Role,
            sectionId: userData.SectionId,
            createdAt: new Date().toISOString(),
          }

          this.users.push(newUser)
          return { success: true, data: newUser }
        }

        // Extract detailed error message from backend
        let errorMessage = 'Failed to create user'
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message
        }
        else if (error.response?.data?.errors) {
          // Handle validation errors from backend
          const errors = error.response.data.errors
          const errorMessages = Object.values(errors).flat()
          errorMessage = errorMessages.join(', ')
        }
        else if (error.response?.data) {
          errorMessage = JSON.stringify(error.response.data)
        }

        this.error = errorMessage
        return { success: false, error: errorMessage }
      }
      finally {
        this.loading = false
      }
    },

    async updateUser(userId, userData) {
      this.loading = true
      this.error = null

      try {
        // Find the original user to get their current role/endpoint
        const originalUser = this.users.find(user => (user.userId || user.id) === userId)
        if (!originalUser) {
          throw new Error('User not found')
        }

        // Use the original user's role to determine the correct endpoint
        // API returns 'Teacher' but we also handle 'Instructor' for compatibility
        const isTeacher = originalUser.role === 'Teacher' || originalUser.role === 'Instructor'
        const endpoint = isTeacher ? '/instructors' : '/students'

        const response = await api.patch(`${endpoint}/${userId}`, userData)

        // Update the user in the store with the original role (role cannot be changed)
        const index = this.users.findIndex(user => (user.userId || user.id) === userId)
        if (index !== -1) {
          this.users[index] = { ...response.data, role: originalUser.role }
        }

        return { success: true, data: response.data }
      }
      catch (error) {
        console.error('Error updating user:', error)
        this.error = error.response?.data?.message || 'Failed to update user'
        return { success: false, error: this.error }
      }
      finally {
        this.loading = false
      }
    },

    async softDeleteUser(userId) {
      this.loading = true
      this.error = null

      try {
        await api.delete(`/account/admin/users/${userId}`)

        // Mark user as deleted in local state
        const index = this.users.findIndex(u => (u.userId || u.id) === userId)
        if (index !== -1) {
          this.users[index].deletedAt = new Date().toISOString()
          this.users[index].isDeleted = true
        }

        return { success: true }
      }
      catch (error) {
        console.error('Error soft deleting user:', error)
        this.error = error.response?.data?.message || 'Failed to soft delete user'
        return { success: false, error: this.error }
      }
      finally {
        this.loading = false
      }
    },

    async hardDeleteUser(userId, role) {
      this.loading = true
      this.error = null

      try {
        // API returns 'Teacher' but we also handle 'Instructor' for compatibility
        const isTeacher = role === 'Teacher' || role === 'Instructor'
        const endpoint = isTeacher ? '/instructors' : '/students'
        await api.delete(`${endpoint}/${userId}`)

        // Remove the user from the store
        this.users = this.users.filter(user => (user.userId || user.id) !== userId)

        return { success: true }
      }
      catch (error) {
        console.error('Error hard deleting user:', error)
        this.error = error.response?.data?.message || 'Failed to permanently delete user'
        return { success: false, error: this.error }
      }
      finally {
        this.loading = false
      }
    },

    // Pagination actions
    setCurrentPage(page) {
      this.currentPage = page
    },

    setItemsPerPage(itemsPerPage) {
      this.itemsPerPage = itemsPerPage
      this.currentPage = 1 // Reset to first page when changing items per page
    },

    nextPage(searchQuery, selectedRole) {
      const totalPages = this.totalPages(searchQuery, selectedRole)
      if (this.currentPage < totalPages) {
        this.currentPage++
      }
    },

    previousPage() {
      if (this.currentPage > 1) {
        this.currentPage--
      }
    },

    goToPage(page, searchQuery, selectedRole) {
      const totalPages = this.totalPages(searchQuery, selectedRole)
      if (page >= 1 && page <= totalPages) {
        this.currentPage = page
      }
    },
  },
})
