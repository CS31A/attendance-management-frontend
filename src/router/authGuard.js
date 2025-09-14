import { useAuthStore } from '@/stores/authStore'

// Simple authentication guard for routes
export const authGuard = async (to, from, next) => {
  const authStore = useAuthStore()
  
  // If we're still initializing, redirect to a loading page
  if (authStore.getIsLoading) {
    // The router will re-evaluate the guard when the state changes
    return next()
  }
  
  // If user is authenticated, proceed
  if (authStore.getIsAuthenticated) {
    return next()
  }
  
  // Check authentication status
  const isAuthenticated = await authStore.checkAuth()
  
  if (isAuthenticated) {
    // User is authenticated, proceed to the requested route
    next()
  } else {
    // User is not authenticated, redirect to login
    next('/login')
  }
}

// Guest guard (for login/register pages)
export const guestGuard = async (to, from, next) => {
  const authStore = useAuthStore()
  
  // If we're still initializing, let the app handle loading states
  if (authStore.getIsLoading) {
    return next()
  }
  
  // If user is authenticated, redirect to dashboard
  if (authStore.getIsAuthenticated) {
    return next('/dashboard')
  }
  
  // Check authentication status
  const isAuthenticated = await authStore.checkAuth()
  
  if (isAuthenticated) {
    // User is authenticated, redirect to dashboard
    next('/dashboard')
  } else {
    // User is not authenticated, allow access to guest routes
    next()
  }
}