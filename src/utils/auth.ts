import router from '@/router'
import { useAuthStore } from '@/stores/authStore'

// Utility function to handle user logout
export async function handleLogout(): Promise<void> {
  const authStore = useAuthStore()

  try {
    await authStore.logout()
    // Redirect to login page after logout
    router.push('/login')
  }
  catch (error) {
    console.error('Logout error:', error)
    // Even if there's an error, redirect to login
    router.push('/login')
  }
}
