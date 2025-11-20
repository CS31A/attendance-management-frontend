<script setup>
import { Bell, ChevronLeft, ChevronRight, User } from 'lucide-vue-next'
import { ref } from 'vue'

// Props
const props = defineProps({
  notificationCount: {
    type: Number,
    default: 0,
  },
  isMobile: {
    type: Boolean,
    default: false,
  },
  isSidebarOpen: {
    type: Boolean,
    default: false,
  },
  showSidebar: {
    type: Boolean,
    default: true,
  },
})

// Emits
const emit = defineEmits(['notificationClick', 'profileClick', 'toggleCollapse', 'sidebarToggle'])

// Reactive state
const isCollapsed = ref(false)

// Handle notification click
function handleNotificationClick() {
  emit('notificationClick')
}

// Handle profile click
function handleProfileClick() {
  emit('profileClick')
}

// Methods
function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
  emit('toggleCollapse', isCollapsed.value)
  emit('sidebarToggle', { isOpen: props.isSidebarOpen, isCollapsed: isCollapsed.value })
}

// Handle collapse toggle (for backward compatibility)
function handleToggleCollapse() {
  toggleCollapse()
}
</script>

<template>
  <header>
    <div
      class="header-left" :class="{
        'sidebar-collapsed': showSidebar && !isMobile && isCollapsed,
      }"
    >
      <div class="logo-container">
        <div class="logo">
          <img src="@/components/icons/ACLCLogo.png" alt="Logo" class="logo-image" loading="lazy">
        </div>
        <div v-show="true" class="brand-info">
          <h1 class="brand-name">
            Attendance
          </h1>
          <p class="brand-subtitle">
            Monitoring System
          </p>
        </div>
        <!-- Collapse Toggle Button (Desktop Only) -->
        <button
          v-show="!isMobile"
          class="header-collapse-btn"
          @click="handleToggleCollapse"
        >
          <component :is="isCollapsed ? ChevronRight : ChevronLeft" size="16" />
        </button>
      </div>
    </div>

    <div class="header-right">
      <button class="icon-button notification-button" @click="handleNotificationClick">
        <Bell size="20" />
        <span v-if="notificationCount > 0" class="notification-badge">{{ notificationCount }}</span>
      </button>

      <button class="icon-button profile-button" @click="handleProfileClick">
        <User size="20" />
      </button>
    </div>
  </header>
</template>

<style scoped>
/* Header Styles */
header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 70px;
  background-color: #2563eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px 0 0;
  z-index: 1001;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.15);
}

.header-left {
  width: 280px;
  height: 100%;
  background: #2563eb;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  transition: all 0.3s ease;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
}

.header-left.sidebar-collapsed {
    justify-content: flex-start;
  }

.header-left.sidebar-collapsed .header-collapse-btn {
  margin-left: 8px;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding-right: 8px;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.logo-image {
  width: 4.25rem;
  height: 4.25rem;
  object-fit: contain;
  border-radius: 6px;
}

.brand-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.brand-name {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
  color: white;
  letter-spacing: -0.025em;
  line-height: 1.1;
}

.brand-subtitle {
  font-size: 13px;
  font-weight: 500;
  margin: 0;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-right: 0;
}

.icon-button {
  position: relative;
  width: 40px;
  height: 40px;
  border: none;
  background-color: transparent;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: background-color 0.2s;
}

.icon-button:hover {
  background-color: rgba(255, 255, 255, 0.15);
}

.notification-button {
  position: relative;
}

.notification-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  background-color: #ef4444;
  color: white;
  font-size: 10px;
  font-weight: 600;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .header-left {
    width: 260px;
  }

  .brand-name {
    font-size: 20px;
  }

  .brand-subtitle {
    font-size: 12px;
  }
}

@media (max-width: 968px) {
  header {
    padding: 0 20px 0 0;
  }

  .header-left {
    width: 240px;
    padding: 0 16px;
  }

  .brand-name {
    font-size: 18px;
  }

  .brand-subtitle {
    font-size: 11px;
  }

  .logo-image {
    width: 3rem;
    height: 3rem;
  }
}

@media (max-width: 768px) {
  header {
    padding: 0 16px 0 0;
    height: 60px;
  }

  .header-left {
    width: auto;
    padding: 0 20px;
    border-right: none;
    flex: 1;
  }

  .brand-name {
    font-size: 18px;
  }

  .brand-subtitle {
    font-size: 11px;
  }

  .logo-image {
    width: 2.5rem;
    height: 2.5rem;
  }

  .logo {
    padding: 8px;
  }

  .header-right {
    gap: 8px;
  }

  .icon-button {
    width: 36px;
    height: 36px;
  }

  .notification-badge {
    width: 14px;
    height: 14px;
    font-size: 9px;
  }
}

@media (max-width: 640px) {
  header {
    padding: 0 12px 0 0;
    height: 56px;
  }

  .header-left {
    padding: 0 16px;
  }

  .brand-name {
    font-size: 16px;
  }

  .brand-subtitle {
    font-size: 10px;
  }

  .logo-image {
    width: 2.25rem;
    height: 2.25rem;
  }

  .logo {
    padding: 6px;
  }

  .header-right {
    gap: 6px;
  }

  .icon-button {
    width: 32px;
    height: 32px;
  }

  .icon-button svg {
    width: 16px;
    height: 16px;
  }

  .notification-badge {
    width: 12px;
    height: 12px;
    font-size: 8px;
    top: 4px;
    right: 4px;
  }
}

@media (max-width: 480px) {
  header {
    padding: 0 8px 0 0;
    height: 52px;
  }

  .header-left {
    padding: 0 12px;
  }

  .brand-name {
    font-size: 14px;
  }

  .brand-subtitle {
    font-size: 9px;
  }

  .logo-image {
    width: 2rem;
    height: 2rem;
  }

  .logo {
    padding: 4px;
  }

  .header-right {
    gap: 4px;
  }

  .icon-button {
    width: 28px;
    height: 28px;
  }

  .icon-button svg {
    width: 14px;
    height: 14px;
  }

  .notification-badge {
    width: 10px;
    height: 10px;
    font-size: 7px;
    top: 3px;
    right: 3px;
  }
}

@media (max-width: 360px) {
  header {
    padding: 0 4px 0 0;
    height: 48px;
  }

  .header-left {
    padding: 0 8px;
  }

  .brand-name {
    font-size: 12px;
  }

  .brand-subtitle {
    font-size: 8px;
  }

  .logo-image {
    width: 1.75rem;
    height: 1.75rem;
  }

  .logo {
    padding: 2px;
  }

  .header-right {
    gap: 2px;
  }

  .icon-button {
    width: 24px;
    height: 24px;
  }

  .icon-button svg {
    width: 12px;
    height: 12px;
  }

  .notification-badge {
    width: 8px;
    height: 8px;
    font-size: 6px;
    top: 2px;
    right: 2px;
  }
}

/* Header Collapse Button */
.header-collapse-btn {
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
  transition: background-color 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
  margin-left: 12px;
  flex-shrink: 0;
  opacity: 0.8;
}

.header-collapse-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  opacity: 1;
  transform: translateY(-1px);
}

.header-collapse-btn:active {
  transform: translateY(0);
  background: rgba(255, 255, 255, 0.15);
}

.header-collapse-btn svg {
  width: 16px;
  height: 16px;
  transition: transform 0.2s ease;
}

.header-collapse-btn:hover svg {
  transform: scale(1.1);
}

/* Large screens */
@media (min-width: 1200px) {
  .header-left {
    width: 300px;
  }

  .header-left.sidebar-collapsed {
    justify-content: flex-start;
  }

  .brand-name {
    font-size: 24px;
  }
}
</style>
