<script setup lang="ts">
import type { AppNotification } from '@/types/notifications'
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import Toast from './components/common/Toast.vue'
import { useToast } from './composables/useToast'
import { useAuthStore } from './stores/authStore'
import { useNotificationStore } from './stores/notificationStore'

const SideBar = defineAsyncComponent(() => import('./components/SideBar.vue'))
const Header = defineAsyncComponent(() => import('./components/Header.vue'))
const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const route = useRoute()
const { toast, showToast, closeToast } = useToast()

const isMobile = ref(false)
const isSidebarOpen = ref(false)
const isSidebarCollapsed = ref(false)

// Computed properties
const isAuthInitializing = computed(() => authStore.getIsLoading)
const isAuthenticated = computed(() => authStore.getIsAuthenticated)
const showSidebar = computed(() => {
  // Show sidebar if authenticated and not on login or 404 page
  return isAuthenticated.value && route.path !== '/login' && route.name !== 'NotFound'
})
const notificationCount = computed(() => notificationStore.unreadCount)
const notifications = computed(() => notificationStore.notifications)

function checkIsMobile() {
  isMobile.value = window.innerWidth <= 768
}

async function syncNotificationsWithAuth(authenticated: boolean) {
  if (authenticated) {
    try {
      await notificationStore.start()
    }
    catch (error) {
      console.error('Failed to start notification connection:', error)
    }
    return
  }

  await notificationStore.reset()
}

// Initialize authentication state
onMounted(async () => {
  await authStore.initializeAuth()
  await syncNotificationsWithAuth(authStore.getIsAuthenticated)
  checkIsMobile()
  window.addEventListener('resize', checkIsMobile)
})

// Event listener to detect when sidebar opens/closes
function handleSidebarToggle(stateOrEvent: { isOpen: boolean, isCollapsed: boolean } | CustomEvent<{ isOpen?: boolean, isCollapsed?: boolean }>) {
  const state = stateOrEvent instanceof CustomEvent ? stateOrEvent.detail : stateOrEvent
  if (state) {
    isSidebarOpen.value = state.isOpen ?? false
    isSidebarCollapsed.value = state.isCollapsed ?? false
  }
}

onMounted(() => {
  window.addEventListener('sidebarToggle', handleSidebarToggle as EventListener)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkIsMobile)
  window.removeEventListener('sidebarToggle', handleSidebarToggle as EventListener)
  void notificationStore.stop()
})

function handleNotificationClick() {
  // Dropdown open/close is handled inside Header; nothing else needed here.
}

function handleNotificationRead(notificationId: string) {
  notificationStore.markRead(notificationId)
}

// Handle profile click
function handleProfileClick() {
  // Add your profile logic here
}

// Handle collapse toggle from Header
function handleToggleCollapse(isCollapsed: boolean) {
  isSidebarCollapsed.value = isCollapsed
}

watch(isAuthenticated, syncNotificationsWithAuth)

watch(
  () => notificationStore.latestNotification,
  (notification: AppNotification | null) => {
    if (!notification)
      return

    showToast(notification.message, 'info', 5000)
  },
)
</script>

<template>
  <div class="container">
    <!-- Show loading state while initializing auth -->
    <div v-if="isAuthInitializing" class="auth-loading">
      <div class="spinner" />
      <p>Authenticating...</p>
    </div>

    <!-- Show app content when auth is ready -->
    <template v-else>
      <SideBar v-if="showSidebar" :is-collapsed="isSidebarCollapsed" />

      <!-- Header Component -->
      <Header
        v-if="showSidebar"
        :notification-count="notificationCount"
        :notifications="notifications"
        :is-mobile="isMobile"
        :is-sidebar-open="isSidebarOpen"
        :is-sidebar-collapsed="isSidebarCollapsed"
        :show-sidebar="showSidebar"
        @notification-click="handleNotificationClick"
        @notification-read="handleNotificationRead"
        @profile-click="handleProfileClick"
        @toggle-collapse="handleToggleCollapse"
        @sidebar-toggle="handleSidebarToggle"
      />

      <main
        :class="{
          'no-sidebar': !showSidebar || isMobile,
          'sidebar-open': showSidebar && isMobile && isSidebarOpen,
          'sidebar-collapsed': showSidebar && !isMobile && isSidebarCollapsed,
          'with-header': showSidebar,
        }"
      >
        <router-view />
      </main>

      <Toast
        :show="toast.show"
        :message="toast.message"
        :type="toast.type"
        :duration="toast.duration"
        @close="closeToast"
      />
    </template>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: "Poppins", sans-serif;
}

body {
  background: var(--bg-secondary);
}

.container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--bg-secondary);
}

/* Main Content Styles */
main {
  flex: 1;
  margin-left: var(--sidebar-width);
  overflow-y: auto;
  transition: margin-left var(--transition-base);
  background: var(--bg-secondary);
}

main.with-header {
  margin-top: var(--header-height);
}

main.no-sidebar {
  margin-left: 0;
}

main.sidebar-open {
  margin-left: var(--sidebar-width);
}

main.sidebar-collapsed {
  margin-left: var(--sidebar-collapsed-width);
}

.auth-loading {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100vh;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-gray-100);
  border-top: 4px solid var(--color-info);
  border-radius: var(--radius-full);
  animation: spin 1s linear infinite;
  margin-bottom: var(--spacing-md);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive behavior for mobile */
@media (max-width: 768px) {
  main {
    margin-left: 0;
  }

  main.sidebar-open {
    margin-left: var(--sidebar-width);
  }
}
</style>
