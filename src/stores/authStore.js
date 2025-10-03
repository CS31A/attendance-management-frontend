import { defineStore } from "pinia"
import { ref, computed } from "vue"
import api from "@/api"

/**
 * Authentication Store
 * 
 * Manages user authentication state, including login/logout functionality,
 * session validation, and user information.
 * 
 * @typedef {Object} AuthState
 * @property {Object | null} user - The authenticated user object or null
 * @property {boolean} isAuthenticated - Whether the user is currently authenticated
 * @property {boolean} isLoading - Whether the auth store is initializing
 * 
 * @typedef {Object} LoginResponse
 * @property {boolean} success - Whether the login was successful
 * @property {string} [message] - Error message if login failed
 * 
 * @typedef {Object} User
 * @property {string} id - User ID
 * @property {string} name - User's name
 * @property {string} email - User's email
 */
export const useAuthStore = defineStore('authStore', () => {
    // State
    /** @type {import('vue').Ref<Object|null>} */
    const user = ref(null)
    
    /** @type {import('vue').Ref<boolean>} */
    const isAuthenticated = ref(false)
    
    /** @type {import('vue').Ref<boolean>} */
    const isLoading = ref(true) 

    // Getters
    /**
     * Get the current user object
     * @returns {Object|null} The user object or null if not authenticated
     */
    const getUser = computed(() => user.value)
    
    /**
     * Check if the user is authenticated
     * @returns {boolean} True if user is authenticated, false otherwise
     */
    const getIsAuthenticated = computed(() => isAuthenticated.value)
    
    /**
     * Check if the auth store is initializing
     * @returns {boolean} True if the store is loading, false otherwise
     */
    const getIsLoading = computed(() => isLoading.value)

    // Actions
    /**
     * Authenticate a user with identifier and password
     * 
     * @param {string} identifier - User's email or username
     * @param {string} password - User's password
     * @returns {Promise<LoginResponse>} Login result with success status and optional message
     * 
     * @example
     * const authStore = useAuthStore()
     * const result = await authStore.login('user@example.com', 'password123')
     * if (result.success) {
     *   console.log('Login successful')
     * } else {
     *   console.log('Login failed:', result.message)
     * }
     */
    const login = async (identifier, password) => {
        try {
            // Create the payload with identifier and password
            const payload = { identifier, password }
            
            const response = await api.post("/account/web/login", payload)

            if (response.data.success) {
                isAuthenticated.value = true
                await checkAuth()
                return { success: true }
            } else {
                return { success: false, message: "Login failed" }
            }
        } catch (error) {
            console.error("Login error:", error)
            const message = error.response?.data?.message || "Invalid credentials"
            return { success: false, message }
        }
    }

    /**
     * Log out the current user
     * 
     * Calls the backend logout endpoint to clear the session cookie
     * and resets the local authentication state.
     * 
     * @returns {Promise<void>}
     */
    const logout = async () => {
        try {
            // Call backend logout endpoint to clear cookie
            await api.post("/account/web/logout")
        } catch (error) {
            console.error("Logout error:", error)
        } finally {
            // Always clear local state regardless of backend response
            user.value = null
            isAuthenticated.value = false
        }
    }

    /**
     * Check if user is authenticated by validating the session with the backend
     * 
     * This function is used during app initialization to verify if the user
     * has a valid session. It updates the store's authentication state based
     * on the backend response.
     * 
     * @returns {Promise<boolean>} True if user is authenticated, false otherwise
     */
    const checkAuth = async () => {
        isLoading.value = true
        try {
            const response = await api.get("/account/check")

            if (response.data && response.data.user) {
                user.value = response.data.user
                isAuthenticated.value = true
                return true
            }
            // If response doesn't include a user, treat as unauthenticated
            user.value = null
            isAuthenticated.value = false
            return false
        } catch (error) {
            const status = error?.response?.status
            if (status === 401) {
                user.value = null
                isAuthenticated.value = false
            } else {
                // For other errors, still clear the state as a fallback
                user.value = null
                isAuthenticated.value = false
            }
            return false
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Initialize the authentication state
     * 
     * This function should be called when the application loads to determine
     * if the user has a valid session. It only performs the check if the
     * authentication state hasn't already been determined.
     * 
     * @returns {Promise<void>}
     */
    const initializeAuth = async () => {
        // Only check if we haven't already determined auth state
        if (user.value === null && isLoading.value) 
            await checkAuth()
    
        // Set loading to false if it's still true
        if (isLoading.value) 
            isLoading.value = false
        
    }

    /**
     * Refresh the access token using the refresh token
     * 
     * This function calls the backend refresh endpoint to obtain a new
     * access token when the current one expires. It updates the authentication
     * state if successful, or logs out the user if the refresh fails.
     * 
     * @returns {Promise<boolean>} True if refresh was successful, false otherwise
     */
    const refreshToken = async () => {
        try {
            const response = await api.post("/account/web/refresh")
            
            if (response.data.success) {
                // Update the authentication state with the new access token info
                // We need to check auth status again to update user info
                const authStatus = await checkAuth()
                return authStatus
            } else {
                // Refresh failed, clear auth state
                user.value = null
                isAuthenticated.value = false
                return false
            }
        } catch (error) {
            console.error("Token refresh error:", error)
            const status = error?.response?.status
            
            // If refresh token is also expired or invalid, logout user
            if (status === 401 || status === 403) {
                user.value = null
                isAuthenticated.value = false
            }
            
            return false
        }
    }

    return {
        // State
        user,
        isAuthenticated,
        isLoading,
        
        // Getters
        getUser,
        getIsAuthenticated,
        getIsLoading,
        
        // Actions
        login,
        logout,
        checkAuth,
        initializeAuth,
        refreshToken
    }
})