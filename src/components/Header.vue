<script setup>
// Props
const props = defineProps({
  notificationCount: {
    type: Number,
    default: 0
  },
  isMobile: {
    type: Boolean,
    default: false
  },
  isSidebarOpen: {
    type: Boolean,
    default: false
  },
  isSidebarCollapsed: {
    type: Boolean,
    default: false
  },
  showSidebar: {
    type: Boolean,
    default: true
  }
});

// Emits
const emit = defineEmits(['notification-click', 'profile-click']);

// Handle notification click
const handleNotificationClick = () => {
  emit('notification-click');
};

// Handle profile click
const handleProfileClick = () => {
  emit('profile-click');
};
</script>

<template>
  <header>
    <div class="header-left" :class="{
      'sidebar-collapsed': showSidebar && !isMobile && isSidebarCollapsed
    }">
      <div class="logo-container">
        <div class="logo">
          <img src="@/components/icons/image.png" alt="Logo" class="logo-image" />
        </div>
        <div class="brand-info" v-show="!isSidebarCollapsed || isMobile">
          <h1 class="brand-name">Attendance</h1>
          <p class="brand-subtitle">Monitoring System</p>
        </div>
      </div>
    </div>

    <div class="header-right">
      <button class="icon-button notification-button" @click="handleNotificationClick">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        <span v-if="notificationCount > 0" class="notification-badge">{{ notificationCount }}</span>
      </button>

      <button class="icon-button profile-button" @click="handleProfileClick">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
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
  background-color: #d4d4d8;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px 0 0;
  z-index: 1001;
  transition: all 0.3s ease;
}

.header-left {
  width: 280px;
  height: 100%;
  background: #2563eb;
  display: flex;
  align-items: center;
  padding: 0 24px;
  transition: all 0.3s ease;
}

.header-left.sidebar-collapsed {
  width: 80px;
  padding: 0 16px;
  justify-content: center;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.header-left.sidebar-collapsed .logo-container {
  justify-content: center;
  gap: 0;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
}

.logo-image {
  width: 32px;
  height: 32px;
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
  color: rgba(255, 255, 255, 0.7);
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
  color: #27272a;
  transition: background-color 0.2s;
}

.icon-button:hover {
  background-color: rgba(39, 39, 42, 0.1);
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

/* Responsive behavior for mobile */
@media (max-width: 768px) {
  header {
    padding: 0 16px 0 0;
  }
  
  .header-left {
    width: auto;
    padding: 0 20px;
  }
  
  .brand-name {
    font-size: 20px;
  }
  
  .brand-subtitle {
    font-size: 12px;
  }
  
  .logo-image {
    width: 28px;
    height: 28px;
  }
  
  .logo {
    padding: 10px;
  }
}

/* Large screens */
@media (min-width: 1200px) {
  .header-left {
    width: 300px;
    padding: 0 28px;
  }
  
  .header-left.sidebar-collapsed {
    width: 80px;
  }
  
  .brand-name {
    font-size: 24px;
  }
}
</style>
