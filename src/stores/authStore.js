import { defineStore } from "pinia"
import { ref, computed } from "vue"
import api from "@/api"

export const useAuthStore = defineStore('authStore', () => {
    // State
    const user = ref(null)
    const isAuthenticated = ref(false)
    const isLoading = ref(true) 

    // Getters
    const getUser = computed(() => user.value)
    const getIsAuthenticated = computed(() => isAuthenticated.value)
    const getIsLoading = computed(() => isLoading.value)

    // Actions
    const login = async (identifier, password) => {
        try {
            // Create the payload with identifier and password
            const payload = { identifier, password }
            
            const response = await api.post("/Account/web/login", payload)

            if (response.data.success) {
                isAuthenticated.value = true
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

    const logout = async () => {
        try {
            // Call backend logout endpoint to clear cookie
            await api.post("/Account/web/logout")
        } catch (error) {
            console.error("Logout error:", error)
        } finally {
            // Always clear local state regardless of backend response
            user.value = null
            isAuthenticated.value = false
        }
    }

    // Check if user is authenticated (for app initialization)
    const checkAuth = async () => {
        isLoading.value = true
        try {
            const response = await api.get("/Account/check")
            user.value = response.data.user
            isAuthenticated.value = true
            return true
        } catch (error) {
            // If not authenticated, clear state
            user.value = null
            isAuthenticated.value = false
            return false
        } finally {
            isLoading.value = false
        }
    }

    // Initialize auth state (useful when app loads)
    const initializeAuth = async () => {
        // Only check if we haven't already determined auth state
        if (user.value === null && isLoading.value) {
            await checkAuth()
        }
        // Set loading to false if it's still true
        if (isLoading.value) {
            isLoading.value = false
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
        initializeAuth
    }
})