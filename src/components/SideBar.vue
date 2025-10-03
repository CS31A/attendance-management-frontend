<script setup>
import { useAuthStore } from '@/stores/authStore'
import { ref, onMounted, onUnmounted, computed, defineAsyncComponent } from 'vue'
const LogoutButton = defineAsyncComponent(() => import('@/components/LogoutButton.vue'))

const authStore = useAuthStore()
const user = authStore.getUser

// Reactive data
const isSidebarOpen = ref(false)
const isCollapsed = ref(false)
const windowWidth = ref(window.innerWidth)

// Event listener functions
let clickOutsideHandler
let resizeHandler

// Computed properties
const isDesktop = computed(() => windowWidth.value > 768)

// Helper function to dispatch sidebar toggle event
const dispatchSidebarToggle = (isOpen = isSidebarOpen.value) => {
  window.dispatchEvent(new CustomEvent('sidebar-toggle', { 
    detail: { isOpen, isCollapsed: isCollapsed.value } 
  }))
}

// Methods
const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
  dispatchSidebarToggle()
}

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  dispatchSidebarToggle()
}

const closeSidebar = () => {
  isSidebarOpen.value = false
  dispatchSidebarToggle(false)
}

// Lifecycle hooks
onMounted(() => {
  clickOutsideHandler = (e) => {
    if (window.innerWidth <= 768) {
      const sidebar = document.querySelector('.sidebar')
      const burgerBtn = document.querySelector('.burger-btn')
      
      if (sidebar && burgerBtn && !sidebar.contains(e.target) && !burgerBtn.contains(e.target)) {
        isSidebarOpen.value = false
        dispatchSidebarToggle(false)
      }
    }
  }
  document.addEventListener('click', clickOutsideHandler)

  resizeHandler = () => {
    windowWidth.value = window.innerWidth
    if (window.innerWidth > 768) {
      isSidebarOpen.value = false
      dispatchSidebarToggle(false)
    }
  }
  window.addEventListener('resize', resizeHandler)
})

onUnmounted(() => {
  if (clickOutsideHandler) {
    document.removeEventListener('click', clickOutsideHandler)
  }
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler)
  }
})
</script>

<template>
  <div>
    <!-- Mobile Burger Button -->
    <button 
      class="burger-btn"
      @click="toggleSidebar"
      :class="{ 'active': isSidebarOpen }"
    >
      <span></span>
      <span></span>
      <span></span>
    </button>

    <div 
      class="sidebar-overlay"
      :class="{ 'active': isSidebarOpen }"
      @click="closeSidebar"
    ></div>

    <!-- Sidebar -->
    <aside class="sidebar" :class="{ 'mobile-open': isSidebarOpen, 'collapsed': isCollapsed }">
      <!-- Collapse Toggle Button (Desktop Only) -->
      <div class="collapse-section" v-show="isDesktop">
        <button class="collapse-btn" @click="toggleCollapse">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path :d="isCollapsed ? 'M9 18l6-6-6-6' : 'M15 18l-6-6 6-6'"/>
          </svg>
        </button>
      </div>

      <nav class="nav-menu">
        <ul>
          <li>
            <router-link to="/dashboard" class="nav-link" @click="closeSidebar">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
              <span class="nav-text" v-show="!isCollapsed">Dashboard</span>
            </router-link>
          </li>
          <li>
            <router-link to="/students" class="nav-link" @click="closeSidebar">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span class="nav-text" v-show="!isCollapsed">Students</span>
            </router-link>
          </li>
          <li>
            <router-link to="/qr-generator" class="nav-link" @click="closeSidebar">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="5" height="5"/>
                <rect x="16" y="3" width="5" height="5"/>
                <rect x="3" y="16" width="5" height="5"/>
                <path d="m21 16-3.5-3.5-2.5 2.5"/>
                <path d="m13 13 3 3 4.5-4.5"/>
              </svg>
              <span class="nav-text" v-show="!isCollapsed">QR Generator</span>
            </router-link>
          </li>
        </ul>
      </nav>

      <div class="sidebar-footer">
        <div class="user-info">
          <div class="user-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div class="user-details" v-show="!isCollapsed">
            <span class="user-name">{{ user }}</span>
            <span class="user-role">Administrator</span>
          </div>
        </div>
        <LogoutButton />
      </div>
    </aside>
  </div>
</template>

<style scoped>
/* Burger Menu Button */
.burger-btn {
  display: none;
  position: fixed;
  top: 10px;
  left: 20px;
  z-index: 1100;
  background: #2563eb;
  border: none;
  border-radius: 8px;
  width: 50px;
  height: 50px;
  cursor: pointer;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 4px;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
  transition: all 0.3s ease;
}

.burger-btn span {
  display: block;
  width: 25px;
  height: 3px;
  background: white;
  border-radius: 2px;
  transition: all 0.3s ease;
  transform-origin: center;
}

.burger-btn.active span:nth-child(1) {
  transform: rotate(45deg) translate(6px, 6px);
}

.burger-btn.active span:nth-child(2) {
  opacity: 0;
}

.burger-btn.active span:nth-child(3) {
  transform: rotate(-45deg) translate(6px, -6px);
}

.burger-btn:hover {
  background: #1d4ed8;
  transform: scale(1.05);
}

/* Sidebar Overlay */
.sidebar-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
}

.sidebar-overlay.active {
  opacity: 1;
  visibility: visible;
}

/* Main Sidebar */
.sidebar {
  width: 280px;
  background: #2563eb;
  color: white;
  height: 100vh;
  padding: 70px 0 0 0;
  box-shadow: 4px 0 20px rgba(37, 99, 235, 0.2);
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s ease;
}

.sidebar.collapsed {
  width: 80px;
}

/* Collapse Section */
.collapse-section {
  padding: 16px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: flex-end;
}

.sidebar.collapsed .collapse-section {
  padding: 16px;
  justify-content: center;
}

/* Collapse Button */
.collapse-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 6px;
  width: 32px;
  height: 32px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.collapse-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.collapse-btn svg {
  width: 16px;
  height: 16px;
}

.nav-menu {
  flex: 1;
  padding: 24px 0;
  overflow-y: auto;
}

.nav-menu ul {
  list-style: none;
  margin: 0;
  padding: 0 16px;
}

.sidebar.collapsed .nav-menu ul {
  padding: 0 8px;
}

.nav-menu li {
  margin: 0 0 8px 0;
}

.nav-link {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  transition: all 0.3s ease;
  border-radius: 12px;
  font-weight: 500;
  font-size: 14px;
  gap: 12px;
}

.sidebar.collapsed .nav-link {
  padding: 14px 12px;
  justify-content: center;
  gap: 0;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  transform: translateX(4px);
}

.nav-link.router-link-active {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.nav-icon {
  width: 20px;
  height: 20px;
  stroke-width: 2;
  transition: transform 0.3s ease;
}

.nav-link:hover .nav-icon {
  transform: scale(1.1);
}

.nav-text {
  font-weight: 500;
  letter-spacing: 0.025em;
}

.sidebar-footer {
  padding: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.1);
  transition: padding 0.3s ease;
}

.sidebar.collapsed .sidebar-footer {
  padding: 16px 8px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.sidebar.collapsed .user-info {
  padding: 8px;
  gap: 0;
  justify-content: center;
  background: transparent;
  border: none;
}

.user-info:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-1px);
}

.sidebar.collapsed .user-info:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: none;
}

.user-avatar {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.sidebar.collapsed .user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
}

.user-avatar svg {
  width: 20px;
  height: 20px;
  transition: all 0.3s ease;
}

.sidebar.collapsed .user-avatar svg {
  width: 16px;
  height: 16px;
}

.user-details {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  transition: opacity 0.3s ease;
  opacity: 1;
}

.sidebar.collapsed .user-details {
  opacity: 0;
  position: absolute;
  visibility: hidden;
  pointer-events: none;
}

.sidebar:not(.collapsed) .user-details {
  opacity: 1;
  position: relative;
  visibility: visible;
  pointer-events: auto;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: white;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Responsive Design */
@media (max-width: 768px) {
  .burger-btn {
    display: flex;
  }
  
  .sidebar-overlay {
    display: block;
  }
  
  .sidebar {
    transform: translateX(-100%);
    padding-top: 70px;
  }
  
  .sidebar.mobile-open {
    transform: translateX(0);
  }
  
  .sidebar.mobile-open.collapsed .user-info {
    justify-content: flex-start;
    gap: 12px;
  }
  
  .sidebar.mobile-open.collapsed .user-details {
    display: flex;
  }
}

@media (max-width: 768px) and (min-width: 481px) {
  .sidebar-footer {
    padding: 20px;
  }
  
  .user-avatar {
    width: 38px;
    height: 38px;
  }
}

@media (max-width: 480px) {
  .sidebar {
    width: 260px;
  }
  
  .nav-link {
    font-size: 13px;
    padding: 12px 14px;
  }
  
  .nav-icon {
    width: 18px;
    height: 18px;
  }
  
  .sidebar-footer {
    padding: 16px;
  }
  
  .user-info {
    padding: 10px;
  }
  
  .user-avatar {
    width: 36px;
    height: 36px;
  }
  
  .user-name {
    font-size: 13px;
  }
  
  .user-role {
    font-size: 11px;
  }
}

/* Scrollbar styling */
.nav-menu::-webkit-scrollbar {
  width: 4px;
}

.nav-menu::-webkit-scrollbar-track {
  background: transparent;
}

.nav-menu::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.nav-menu::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Large screens */
@media (min-width: 1200px) {
  .sidebar {
    width: 300px;
  }
  
  .sidebar.collapsed {
    width: 80px;
  }
  
  .collapse-section {
    padding: 16px 28px;
  }
  
  .nav-link {
    padding: 16px 18px;
    font-size: 15px;
  }
  
  .user-info {
    padding: 14px;
  }
  
  .user-avatar {
    width: 44px;
    height: 44px;
  }
  
  .user-name {
    font-size: 15px;
  }
  
  .user-role {
    font-size: 13px;
  }
}

/* Logout button styles */
.sidebar-footer :deep(.logout-button) {
  width: 100%;
  margin-top: 16px;
  background: rgba(239, 68, 68, 0.2);
  color: #fecaca;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.sidebar-footer :deep(.logout-button:hover:not(:disabled)) {
  background: rgba(239, 68, 68, 0.3);
  color: #ffffff;
}

.sidebar.collapsed .sidebar-footer :deep(.logout-button) {
  padding: 8px;
  font-size: 12px;
}
</style>
