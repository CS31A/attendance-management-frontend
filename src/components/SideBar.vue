<script setup>
import { BarChart3, BookOpen, Calendar, CalendarClock, ChevronDown, ClipboardCheck, DoorOpen, GraduationCap, Grid3X3, LogOut, UserCircle, Users } from 'lucide-vue-next'
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

// Props
const props = defineProps({
  isCollapsed: {
    type: Boolean,
    default: false,
  },
})

const ConfirmationModal = defineAsyncComponent(() => import('@/components/common/ConfirmationModal.vue'))

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
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
const showLogoutConfirmation = ref(false)
const isLoggingOut = ref(false)

// Submenu expansion state
const expandedMenus = ref({
  academic: false,
  curriculum: false,
})

// Toggle submenu
function toggleSubmenu(menu) {
  expandedMenus.value[menu] = !expandedMenus.value[menu]
}

// Check if submenu item is active
function isSubmenuActive(paths) {
  return paths.includes(route.path)
}

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

function initiateLogout() {
  showLogoutConfirmation.value = true
}

async function handleLogout() {
  showLogoutConfirmation.value = false
  isLoggingOut.value = true
  try {
    await authStore.logout()
    router.push('/login')
  }
  catch (error) {
    console.error('Logout error:', error)
    router.push('/login')
  }
  finally {
    isLoggingOut.value = false
  }
}

// Lifecycle hooks
onMounted(() => {
  // Initialize expanded state based on current route
  const path = route.path
  if (['/sections'].includes(path)) {
    expandedMenus.value.academic = true
  }
  if (['/courses', '/subjects'].includes(path)) {
    expandedMenus.value.curriculum = true
  }

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

          <!-- Academic Submenu -->
          <li v-if="isAdmin" class="has-submenu">
            <div
              class="nav-link submenu-toggle"
              :class="{ active: isSubmenuActive(['/sections']) }"
              @click="isCollapsed ? null : toggleSubmenu('academic')"
            >
              <GraduationCap class="nav-icon" size="20" />
              <span v-show="!isCollapsed" class="nav-text">Academic</span>
              <ChevronDown
                v-show="!isCollapsed"
                class="submenu-arrow"
                :class="{ expanded: expandedMenus.academic }"
                size="16"
              />
            </div>
            <ul v-show="!isCollapsed && expandedMenus.academic" class="submenu">
              <li>
                <router-link to="/sections" class="nav-link submenu-link" @click="closeSidebar">
                  <span class="nav-text">Sections</span>
                </router-link>
              </li>
            </ul>
          </li>

          <!-- Curriculum Submenu -->
          <li v-if="isAdmin" class="has-submenu">
            <div
              class="nav-link submenu-toggle"
              :class="{ active: isSubmenuActive(['/courses', '/subjects']) }"
              @click="isCollapsed ? null : toggleSubmenu('curriculum')"
            >
              <BookOpen class="nav-icon" size="20" />
              <span v-show="!isCollapsed" class="nav-text">Curriculum</span>
              <ChevronDown
                v-show="!isCollapsed"
                class="submenu-arrow"
                :class="{ expanded: expandedMenus.curriculum }"
                size="16"
              />
            </div>
            <ul v-show="!isCollapsed && expandedMenus.curriculum" class="submenu">
              <li>
                <router-link to="/courses" class="nav-link submenu-link" @click="closeSidebar">
                  <span class="nav-text">Courses</span>
                </router-link>
              </li>
              <li>
                <router-link to="/subjects" class="nav-link submenu-link" @click="closeSidebar">
                  <span class="nav-text">Subjects</span>
                </router-link>
              </li>
            </ul>
          </li>

          <li v-if="isAdmin">
            <router-link to="/schedules" class="nav-link" @click="closeSidebar">
              <CalendarClock class="nav-icon" size="20" />
              <span v-show="!isCollapsed" class="nav-text">Schedules</span>
            </router-link>
          </li>
          <li v-if="isAdmin">
            <router-link to="/classrooms" class="nav-link" @click="closeSidebar">
              <DoorOpen class="nav-icon" size="20" />
              <span v-show="!isCollapsed" class="nav-text">Classrooms</span>
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
        <div class="user-info" style="cursor: pointer;" @click="router.push('/profile')">
          <div class="user-avatar">
            <UserCircle size="20" />
          </div>
          <div v-show="!isCollapsed" class="user-details">
            <span class="user-name">{{ user }}</span>
            <span class="user-role">{{ userRole }}</span>
          </div>
        </div>
        <button
          class="logout-icon-btn"
          :disabled="isLoggingOut"
          title="Logout"
          @click="initiateLogout"
        >
          <LogOut size="20" />
        </button>
      </div>
    </aside>

    <ConfirmationModal
      :show="showLogoutConfirmation"
      title="Confirm Logout"
      message="Are you sure you want to logout?"
      confirm-text="Logout"
      cancel-text="Cancel"
      @confirm="handleLogout"
      @cancel="showLogoutConfirmation = false"
    />
  </div>
</template>

<style scoped>
/* Burger Menu Button */
.burger-btn {
  display: none;
  position: fixed;
  top: 10px;
  left: 20px;
  z-index: var(--z-burger);
  background: var(--color-primary);
  border: none;
  border-radius: var(--radius-md);
  width: 50px;
  height: 50px;
  cursor: pointer;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-xs);
  box-shadow: var(--shadow-primary-lg);
  transition: all var(--transition-base);
}

.burger-btn span {
  display: block;
  width: 25px;
  height: 3px;
  background: var(--text-white);
  border-radius: 2px;
  transition: all var(--transition-base);
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
  background: var(--color-primary-light);
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
  background: var(--bg-overlay);
  z-index: var(--z-modal-backdrop);
  opacity: 0;
  visibility: hidden;
  transition: all var(--transition-base);
}

.sidebar-overlay.active {
  opacity: 1;
  visibility: visible;
}

/* Main Sidebar */
.sidebar {
  width: var(--sidebar-width);
  background: var(--gradient-primary);
  color: var(--text-white);
  height: 100vh;
  padding: var(--header-height) 0 0 0;
  position: fixed;
  top: 0;
  left: 0;
  z-index: var(--z-fixed);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all var(--transition-base);
}

.sidebar.collapsed {
  width: var(--sidebar-collapsed-width);
}

.nav-menu {
  flex: 1;
  padding: var(--spacing-md) 0;
  overflow-y: auto;
}

.nav-menu ul {
  list-style: none;
  margin: 0;
  padding: 0 var(--spacing-sm);
}

.sidebar.collapsed .nav-menu ul {
  padding: 0 var(--spacing-xs);
}

.nav-menu li {
  margin: 0 0 4px 0;
}

.nav-link {
  display: flex;
  align-items: center;
  padding: 10px var(--spacing-sm);
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  transition: all var(--transition-base);
  border-radius: var(--radius-lg);
  font-weight: 500;
  font-size: 14px;
  gap: 10px;
}

.sidebar.collapsed .nav-link {
  padding: 12px 10px;
  justify-content: center;
  gap: 0;
}

.nav-link:hover {
  background: rgba(255, 255, 255, var(--opacity-hover));
  color: var(--text-white);
  transform: translateX(4px);
}

.nav-link.router-link-active {
  background: rgba(255, 255, 255, var(--opacity-active));
  color: var(--text-white);
  box-shadow: var(--shadow-md);
}

.nav-icon {
  width: 20px;
  height: 20px;
  stroke-width: 2;
  transition: transform var(--transition-base);
}

.nav-link:hover .nav-icon {
  transform: scale(1.1);
}

.nav-text {
  font-weight: 500;
  letter-spacing: 0.025em;
}

/* Submenu Styles */
.has-submenu {
  position: relative;
}

.submenu-toggle {
  cursor: pointer;
  user-select: none;
  position: relative;
}

.submenu-arrow {
  margin-left: auto;
  transition: transform var(--transition-base);
}

.submenu-arrow.expanded {
  transform: rotate(180deg);
}

.submenu {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow: hidden;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 500px;
  }
}

.submenu li {
  margin: 0;
}

.submenu-link {
  padding-left: calc(var(--spacing-sm) + 30px) !important;
  font-size: 13px;
  font-weight: 400;
}

.sidebar.collapsed .submenu-link {
  padding-left: var(--spacing-sm) !important;
}

.submenu-link:hover {
  transform: translateX(8px);
}

.submenu-link.router-link-active {
  background: rgba(255, 255, 255, 0.15);
}

/* Collapsed state for submenu items */
.sidebar.collapsed .has-submenu .submenu-toggle {
  pointer-events: none;
}

.sidebar-footer {
  padding: var(--spacing-sm);
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(0, 0, 0, 0.15);
  transition: padding var(--transition-base);
  display: flex;
  align-items: center;
  gap: 10px;
}

.sidebar.collapsed .sidebar-footer {
  padding: var(--spacing-sm);
  flex-direction: column;
  gap: var(--spacing-sm);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.15);
  transition: all var(--transition-base);
  flex: 1;
  min-width: 0; /* Prevent overflow */
}

.sidebar.collapsed .user-info {
  padding: var(--spacing-xs);
  gap: 0;
  justify-content: center;
  background: transparent;
  border: none;
  width: 100%;
}

.user-info:hover {
  background: rgba(255, 255, 255, var(--opacity-hover));
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
  color: var(--text-white);
  flex-shrink: 0;
  transition: all var(--transition-base);
}

.sidebar.collapsed .user-avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
}

.user-avatar svg {
  width: 20px;
  height: 20px;
  transition: all var(--transition-base);
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
  transition: opacity var(--transition-base);
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
  color: var(--text-white);
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

.logout-icon-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: var(--text-white);
  cursor: pointer;
  padding: 6px;
  border-radius: var(--radius-lg);
  transition: all var(--transition-base);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.logout-icon-btn:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.2);
  color: var(--color-error-light);
  border-color: rgba(239, 68, 68, 0.3);
  transform: translateY(-1px);
}

.logout-icon-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sidebar.collapsed .logout-icon-btn {
  width: 100%;
  padding: 8px;
  background: transparent;
  border: none;
}

.sidebar.collapsed .logout-icon-btn:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.2);
}

/* Responsive Design */
@media (max-width: 1200px) {
  .sidebar {
    width: var(--sidebar-large-width);
  }

  .sidebar.collapsed {
    width: var(--sidebar-collapsed-width);
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
    width: var(--sidebar-medium-width);
  }

  .sidebar.collapsed {
    width: var(--sidebar-collapsed-width);
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
    padding: 8px;
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
    width: var(--sidebar-width);
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
    padding: 16px;
  }

  .user-info {
    padding: 8px;
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
    width: var(--sidebar-large-width);
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
    padding: 14px;
  }

  .user-info {
    padding: 6px;
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
    width: var(--sidebar-medium-width);
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
    padding: 12px;
  }

  .user-info {
    padding: 6px;
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
    width: var(--sidebar-small-width);
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
    padding: 10px;
  }

  .user-info {
    padding: 4px;
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
    width: var(--sidebar-large-width);
  }

  .sidebar.collapsed {
    width: var(--sidebar-collapsed-width);
  }

  .nav-link {
    padding: 14px 16px;
    font-size: 14px;
  }

  .user-info {
    padding: 8px;
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
</style>
