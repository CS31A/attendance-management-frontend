<script setup>  
import { defineAsyncComponent, ref, onMounted, onUnmounted } from 'vue';
const SideBar = defineAsyncComponent(() => import('./components/SideBar.vue'))

const isMobile = ref(false);
const isSidebarOpen = ref(false);
const isSidebarCollapsed = ref(false);

const checkIsMobile = () => {
  isMobile.value = window.innerWidth <= 768;
};

// Event listener to detect when sidebar opens/closes
const handleSidebarToggle = (event) => {
  isSidebarOpen.value = event.detail.isOpen;
  isSidebarCollapsed.value = event.detail.isCollapsed;
};

onMounted(() => {
  checkIsMobile();
  window.addEventListener('resize', checkIsMobile);
  window.addEventListener('sidebar-toggle', handleSidebarToggle);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkIsMobile);
  window.removeEventListener('sidebar-toggle', handleSidebarToggle);
});
</script>

<template>
  <div class="container">
    <SideBar v-if="$route.path !== '/login'" />
    <main :class="{ 
      'no-sidebar': $route.path === '/login' || isMobile, 
      'sidebar-open': isMobile && isSidebarOpen,
      'sidebar-collapsed': !isMobile && isSidebarCollapsed
    }">
      <router-view />
    </main>
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
