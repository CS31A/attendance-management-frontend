import { useAuthStore } from '@/stores/authStore'

/**
 * Authentication guard for protected routes
 * 
 * This guard checks if the user is authenticated before allowing access to protected routes.
 * If the user is not authenticated, they will be redirected to the login page.
 * 
 * @param {import('vue-router').RouteLocationNormalized} to - The target route being navigated to
 * @param {import('vue-router').RouteLocationNormalized} from - The current route being navigated away from
 * @returns {Promise<boolean|Object>} Navigation result:
 *   - true: Allow navigation to proceed
 *   - Object: Redirect to specified route (e.g., login page)
 * 
 * @example
 * // In router configuration
 * {
 *   path: '/dashboard',
 *   component: Dashboard,
 *   beforeEnter: authGuard
 * }
 */
export const authGuard = async (to, from) => {
  const authStore = useAuthStore()
  
  // If we're still initializing, allow the navigation to proceed for now
  // The router will re-evaluate the guard when the auth store finishes initializing
  if (authStore.getIsLoading) {
    await authStore.initializeAuth()
  }
  
  try {
    if (authStore.getIsAuthenticated) return true
    // Verify session to avoid races while "loading"
    const ok = await authStore.checkAuth()
    if (ok) return true
    return { path: '/login', query: { redirect: to.fullPath } }
  } catch {
    // Fail closed on errors
    return { path: '/login', query: { redirect: to.fullPath } }
  }
}

/**
 * Guest guard for authentication pages
 * 
 * This guard prevents authenticated users from accessing guest-only routes
 * like login or registration pages. Authenticated users will be redirected
 * to the dashboard.
 * 
 * @param {import('vue-router').RouteLocationNormalized} to - The target route being navigated to
 * @param {import('vue-router').RouteLocationNormalized} from - The current route being navigated away from
 * @returns {Promise<boolean|Object>} Navigation result:
 *   - true: Allow navigation to proceed
 *   - Object: Redirect to specified route (e.g., dashboard)
 * 
 * @example
 * // In router configuration
 * {
 *   path: '/login',
 *   component: LoginView,
 *   beforeEnter: guestGuard
 * }
 */
export const guestGuard = async (to, from) => {
  const authStore = useAuthStore()
  
  // If we're still initializing, allow the navigation to proceed for now
  // The router will re-evaluate the guard when the auth store finishes initializing
  if (authStore.getIsLoading) {
    await authStore.initializeAuth()
  }
  
  // If user is authenticated, redirect to dashboard
  if (authStore.getIsAuthenticated) {
    return '/dashboard'
  }
  
  // Check authentication status
  try {
    const isAuthenticated = await authStore.checkAuth()
    if (isAuthenticated) {
      // User is authenticated, redirect to dashboard
      return '/dashboard'
    }
    // User is not authenticated, allow access to guest routes
    return true
  } catch {
    // On error, allow access to guest routes (fail open)
    return true
  }
}