<script setup>
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from './stores/authStore'

const SideBar = defineAsyncComponent(() => import('./components/SideBar.vue'))
const Header = defineAsyncComponent(() => import('./components/Header.vue'))
const authStore = useAuthStore()
const route = useRoute()

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

function checkIsMobile() {
  isMobile.value = window.innerWidth <= 768
}

// Initialize authentication state
onMounted(async () => {
  await authStore.initializeAuth()
  checkIsMobile()
  window.addEventListener('resize', checkIsMobile)
})

// Event listener to detect when sidebar opens/closes
function handleSidebarToggle(event) {
  if (event.detail) {
    isSidebarOpen.value = event.detail.isOpen ?? false
    isSidebarCollapsed.value = event.detail.isCollapsed ?? false
  }
}

onMounted(() => {
  window.addEventListener('sidebarToggle', handleSidebarToggle)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkIsMobile)
  window.removeEventListener('sidebarToggle', handleSidebarToggle)
})

// Notification badge count (you can make this dynamic)
const notificationCount = ref(1)

// Handle notification click
function handleNotificationClick() {
  // Add your notification logic here
}

// Handle profile click
function handleProfileClick() {
  // Add your profile logic here
}

// Handle collapse toggle from Header
function handleToggleCollapse(isCollapsed) {
  isSidebarCollapsed.value = isCollapsed
}
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
        :is-mobile="isMobile"
        :is-sidebar-open="isSidebarOpen"
        :is-sidebar-collapsed="isSidebarCollapsed"
        :show-sidebar="showSidebar"
        @notification-click="handleNotificationClick"
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
