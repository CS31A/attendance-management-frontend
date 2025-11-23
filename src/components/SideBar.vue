<script setup>
import { BarChart3, BookOpen, Calendar, ClipboardCheck, Grid3X3, Group, Library, UserCircle, Users } from 'lucide-vue-next'
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'

// Props
const props = defineProps({
  isCollapsed: {
    type: Boolean,
    default: false,
  },
})

const LogoutButton = defineAsyncComponent(() => import('@/components/LogoutButton.vue'))

const authStore = useAuthStore()
const user = authStore.getUser

// Computed property for user role with fallback
const userRole = computed(() => {
  const role = authStore.userProfile?.role
  if (!role)
    return 'User'

  // Capitalize first letter of role
  return role.charAt(0).toUpperCase() + role.slice(1)
})

// Computed property to check if user is admin
const isAdmin = computed(() => authStore.isAdmin)

// Reactive data
const isSidebarOpen = ref(false)
const windowWidth = ref(window.innerWidth)

// Event listener functions
let clickOutsideHandler
let resizeHandler

// Helper function to dispatch sidebar toggle event
function dispatchSidebarToggle(isOpen = isSidebarOpen.value) {
  window.dispatchEvent(new CustomEvent('sidebarToggle', {
    detail: { isOpen, isCollapsed: props.isCollapsed },
  }))
}

// Methods
function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value
  dispatchSidebarToggle()
}

function closeSidebar() {
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
      :class="{ active: isSidebarOpen }"
      @click="toggleSidebar"
    >
      <span />
      <span />
      <span />
    </button>

    <div
      class="sidebar-overlay"
      :class="{ active: isSidebarOpen }"
      @click="closeSidebar"
    />

    <!-- Sidebar -->
    <aside class="sidebar" :class="{ 'mobile-open': isSidebarOpen, 'collapsed': isCollapsed }">
      <nav class="nav-menu">
        <ul>
          <li>
            <router-link to="/dashboard" class="nav-link" @click="closeSidebar">
              <Grid3X3 class="nav-icon" size="20" />
              <span v-show="!isCollapsed" class="nav-text">Dashboard</span>
            </router-link>
          </li>
          <li v-if="authStore.isTeacher">
            <router-link to="/sessions" class="nav-link" @click="closeSidebar">
              <Calendar class="nav-icon" size="20" />
              <span v-show="!isCollapsed" class="nav-text">Sessions</span>
            </router-link>
          </li>
          <li v-if="authStore.isTeacher">
            <router-link to="/attendance" class="nav-link" @click="closeSidebar">
              <ClipboardCheck class="nav-icon" size="20" />
              <span v-show="!isCollapsed" class="nav-text">Attendance</span>
            </router-link>
          </li>
          <li v-if="isAdmin">
            <router-link to="/users" class="nav-link" @click="closeSidebar">
              <Users class="nav-icon" size="20" />
              <span v-show="!isCollapsed" class="nav-text">Users</span>
            </router-link>
          </li>
          <li v-if="isAdmin">
            <router-link to="/sections" class="nav-link" @click="closeSidebar">
              <Group class="nav-icon" size="20" />
              <span v-show="!isCollapsed" class="nav-text">Sections</span>
            </router-link>
          </li>
          <li v-if="isAdmin">
            <router-link to="/courses" class="nav-link" @click="closeSidebar">
              <BookOpen class="nav-icon" size="20" />
              <span v-show="!isCollapsed" class="nav-text">Courses</span>
            </router-link>
          </li>
          <li v-if="isAdmin">
            <router-link to="/subjects" class="nav-link" @click="closeSidebar">
              <Library class="nav-icon" size="20" />
              <span v-show="!isCollapsed" class="nav-text">Subjects</span>
            </router-link>
          </li>
          <li>
            <router-link to="/reports" class="nav-link" @click="closeSidebar">
              <BarChart3 class="nav-icon" size="20" />
              <span v-show="!isCollapsed" class="nav-text">Reports</span>
            </router-link>
          </li>
        </ul>
      </nav>

      <div class="sidebar-footer">
        <div class="user-info">
          <div class="user-avatar">
            <UserCircle size="20" />
          </div>
          <div v-show="!isCollapsed" class="user-details">
            <span class="user-name">{{ user }}</span>
            <span class="user-role">{{ userRole }}</span>
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
  background: #1e3a8a;
  border: none;
  border-radius: 8px;
  width: 50px;
  height: 50px;
  cursor: pointer;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 4px;
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.4);
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
  background: #1e40af;
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
  background: linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%);
  color: white;
  height: 100vh;
  padding: 70px 0 0 0;
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
  color: rgba(255, 255, 255, 0.85);
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
  background: rgba(255, 255, 255, 0.15);
  color: white;
  transform: translateX(4px);
}

.nav-link.router-link-active {
  background: rgba(255, 255, 255, 0.25);
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(0, 0, 0, 0.15);
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
  border: 1px solid rgba(255, 255, 255, 0.15);
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
  color: rgba(255, 255, 255, 0.75);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .sidebar {
    width: 260px;
  }

  .sidebar.collapsed {
    width: 70px;
  }

  .nav-link {
    padding: 12px 14px;
    font-size: 13px;
  }

  .nav-icon {
    width: 18px;
    height: 18px;
  }
}

@media (max-width: 968px) {
  .sidebar {
    width: 240px;
  }

  .sidebar.collapsed {
    width: 70px;
  }

  .nav-link {
    padding: 11px 13px;
    font-size: 12px;
  }

  .nav-icon {
    width: 17px;
    height: 17px;
  }

  .user-info {
    padding: 11px;
  }

  .user-avatar {
    width: 38px;
    height: 38px;
  }

  .user-name {
    font-size: 13px;
  }

  .user-role {
    font-size: 11px;
  }
}

@media (max-width: 768px) {
  .burger-btn {
    display: flex;
  }

  .sidebar-overlay {
    display: block;
  }

  .sidebar {
    transform: translateX(-100%);
    padding-top: 60px;
    width: 280px;
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

  .nav-link {
    padding: 14px 16px;
    font-size: 14px;
  }

  .nav-icon {
    width: 20px;
    height: 20px;
  }

  .sidebar-footer {
    padding: 20px;
  }

  .user-info {
    padding: 12px;
  }

  .user-avatar {
    width: 40px;
    height: 40px;
  }

  .user-name {
    font-size: 14px;
  }

  .user-role {
    font-size: 12px;
  }
}

@media (max-width: 640px) {
  .burger-btn {
    width: 45px;
    height: 45px;
    top: 8px;
    left: 16px;
  }

  .burger-btn span {
    width: 22px;
    height: 2px;
  }

  .sidebar {
    width: 260px;
    padding-top: 56px;
  }

  .nav-link {
    padding: 12px 14px;
    font-size: 13px;
  }

  .nav-icon {
    width: 18px;
    height: 18px;
  }

  .sidebar-footer {
    padding: 18px;
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

@media (max-width: 480px) {
  .burger-btn {
    width: 40px;
    height: 40px;
    top: 6px;
    left: 12px;
  }

  .burger-btn span {
    width: 20px;
    height: 2px;
  }

  .sidebar {
    width: 240px;
    padding-top: 52px;
  }

  .nav-link {
    font-size: 12px;
    padding: 11px 13px;
  }

  .nav-icon {
    width: 17px;
    height: 17px;
  }

  .sidebar-footer {
    padding: 16px;
  }

  .user-info {
    padding: 9px;
  }

  .user-avatar {
    width: 34px;
    height: 34px;
  }

  .user-name {
    font-size: 12px;
  }

  .user-role {
    font-size: 10px;
  }
}

@media (max-width: 360px) {
  .burger-btn {
    width: 36px;
    height: 36px;
    top: 4px;
    left: 8px;
  }

  .burger-btn span {
    width: 18px;
    height: 2px;
  }

  .sidebar {
    width: 220px;
    padding-top: 48px;
  }

  .nav-link {
    font-size: 11px;
    padding: 10px 12px;
  }

  .nav-icon {
    width: 16px;
    height: 16px;
  }

  .sidebar-footer {
    padding: 14px;
  }

  .user-info {
    padding: 8px;
  }

  .user-avatar {
    width: 32px;
    height: 32px;
  }

  .user-name {
    font-size: 11px;
  }

  .user-role {
    font-size: 9px;
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
