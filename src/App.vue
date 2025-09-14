<script setup>  
import { defineAsyncComponent, ref, onMounted, onUnmounted, computed } from 'vue';
import { useAuthStore } from './stores/authStore';
import { useRoute } from 'vue-router';

const SideBar = defineAsyncComponent(() => import('./components/SideBar.vue'))
const authStore = useAuthStore()
const route = useRoute()

const isMobile = ref(false);
const isSidebarOpen = ref(false);
const isSidebarCollapsed = ref(false);

// Computed properties
const isAuthInitializing = computed(() => authStore.getIsLoading);
const isAuthenticated = computed(() => authStore.getIsAuthenticated);
const showSidebar = computed(() => {
  // Show sidebar if authenticated and not on login page
  return isAuthenticated.value && route.path !== '/login';
});

const checkIsMobile = () => {
  isMobile.value = window.innerWidth <= 768;
};

// Initialize authentication state
onMounted(async () => {
  await authStore.initializeAuth()
  checkIsMobile();
  window.addEventListener('resize', checkIsMobile);
});

// Event listener to detect when sidebar opens/closes
const handleSidebarToggle = (event) => {
  if (event.detail) {
    isSidebarOpen.value = event.detail.isOpen ?? false;
    isSidebarCollapsed.value = event.detail.isCollapsed ?? false;
  }
};

onMounted(() => {
  window.addEventListener('sidebar-toggle', handleSidebarToggle);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkIsMobile);
  window.removeEventListener('sidebar-toggle', handleSidebarToggle);
});
</script>

<template>
  <div class="container">
    <!-- Show loading state while initializing auth -->
    <div v-if="isAuthInitializing" class="auth-loading">
      <div class="spinner"></div>
      <p>Authenticating...</p>
    </div>
    
    <!-- Show app content when auth is ready -->
    <template v-else>
      <SideBar v-if="showSidebar" />
      <main :class="{ 
        'no-sidebar': !showSidebar || isMobile,
        'sidebar-open': showSidebar && isMobile && isSidebarOpen,
        'sidebar-collapsed': showSidebar && !isMobile && isSidebarCollapsed
      }">
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

.container {
  display: flex;
  min-height: 100vh;
}

main {
  flex: 1;
  margin-left: 280px;
  overflow-y: auto;
  transition: margin-left 0.3s ease;
}

main.no-sidebar {
  margin-left: 0;
}

main.sidebar-open {
  margin-left: 280px;
}

main.sidebar-collapsed {
  margin-left: 80px;
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
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
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
    margin-left: 280px;
  }
}
</style>
