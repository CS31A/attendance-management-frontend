import { useAuthStore } from '@/stores/authStore'

/**
 * Authentication guard for protected routes
 *
 * This guard checks if the user is authenticated before allowing access to protected routes.
 * If the user is not authenticated, they will be redirected to the login page.
 *
 * @param {import('vue-router').RouteLocationNormalized} to - The target route being navigated to
 * @param {import('vue-router').RouteLocationNormalized} _from - The current route being navigated away from
 * @returns {Promise<boolean | object>} Navigation result:
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
export async function authGuard(to, _from) {
  const authStore = useAuthStore()

  // If we're still initializing, allow the navigation to proceed for now
  // The router will re-evaluate the guard when the auth store finishes initializing
  if (authStore.getIsLoading) {
    await authStore.initializeAuth()
  }

  try {
    if (authStore.getIsAuthenticated)
      return true
    // Verify session to avoid races while "loading"
    const ok = await authStore.checkAuth()
    if (ok)
      return true
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  catch {
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
 * @param {import('vue-router').RouteLocationNormalized} _to - The target route being navigated to
 * @param {import('vue-router').RouteLocationNormalized} _from - The current route being navigated away from
 * @returns {Promise<boolean | object>} Navigation result:
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
export async function guestGuard(_to, _from) {
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
  }
  catch {
    // On error, allow access to guest routes (fail open)
    return true
  }
}

/**
 * Admin guard for admin-only routes
 *
 * This guard checks if the user is authenticated AND has admin privileges
 * before allowing access to admin-only routes. If the user is not authenticated
 * or does not have admin privileges, they will be redirected to the dashboard.
 *
 * @param {import('vue-router').RouteLocationNormalized} to - The target route being navigated to
 * @param {import('vue-router').RouteLocationNormalized} _from - The current route being navigated away from
 * @returns {Promise<boolean | object>} Navigation result:
 *   - true: Allow navigation to proceed
 *   - Object: Redirect to specified route (e.g., dashboard)
 *
 * @example
 * // In router configuration
 * {
 *   path: '/users',
 *   component: UserManagementView,
 *   beforeEnter: adminGuard
 * }
 */
export async function adminGuard(to, _from) {
  const authStore = useAuthStore()

  // If we're still initializing, allow the navigation to proceed for now
  // The router will re-evaluate the guard when the auth store finishes initializing
  if (authStore.getIsLoading) {
    await authStore.initializeAuth()
  }

  try {
    if (authStore.getIsAuthenticated && authStore.isAdmin)
      return true

    // Verify session and check admin status to avoid races while "loading"
    const isAuthOk = await authStore.checkAuth()
    if (isAuthOk && authStore.isAdmin)
      return true

    // Either not authenticated or not an admin - redirect to dashboard
    return { path: '/dashboard', query: { redirect: to.fullPath } }
  }
  catch {
    // Fail closed on errors - redirect to dashboard
    return { path: '/dashboard', query: { redirect: to.fullPath } }
  }
}

/**
 * Instructor guard for instructor-only routes
 *
 * This guard checks if the user is authenticated AND has the "Teacher" role
 * before allowing access to instructor-only routes. If the user is not authenticated
 * or does not have the Teacher role, they will be redirected to the dashboard.
 *
 * Note: Backend uses "Teacher" role for instructors.
 *
 * @param {import('vue-router').RouteLocationNormalized} to - The target route being navigated to
 * @param {import('vue-router').RouteLocationNormalized} _from - The current route being navigated away from
 * @returns {Promise<boolean | object>} Navigation result:
 *   - true: Allow navigation to proceed
 *   - Object: Redirect to specified route (e.g., dashboard)
 *
 * @example
 * // In router configuration
 * {
 *   path: '/sessions',
 *   component: SessionsView,
 *   beforeEnter: [authGuard, instructorGuard]
 * }
 */
export async function instructorGuard(to, _from) {
  const authStore = useAuthStore()

  // If we're still initializing, wait for initialization
  if (authStore.getIsLoading) {
    await authStore.initializeAuth()
  }

  try {
    // Check if user is authenticated and has Teacher role
    if (authStore.getIsAuthenticated && authStore.isTeacher)
      return true

    // Verify session and check teacher status to avoid races while "loading"
    const isAuthOk = await authStore.checkAuth()
    if (isAuthOk && authStore.isTeacher)
      return true

    // Either not authenticated or not a teacher - redirect to dashboard
    return { path: '/dashboard', query: { redirect: to.fullPath } }
  }
  catch {
    // Fail closed on errors - redirect to dashboard
    return { path: '/dashboard', query: { redirect: to.fullPath } }
  }
}
