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
    <aside class="sidebar" :class="{ 'mobile-open': isSidebarOpen }">
      <div class="logo-section">
        <div class="logo">
          <img src="./icons/image.png" alt="Logo" class="logo-image" />
        </div>
        <div class="brand-info">
          <h2 class="brand-name">Attendance</h2>
          <p class="brand-subtitle">Monitoring System</p>
        </div>
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
              <span class="nav-text">Dashboard</span>
            </router-link>
          </li>
          <li>
            <router-link to="/students" class="nav-link" @click="closeSidebar">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span class="nav-text">Students</span>
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
              <span class="nav-text">QR Generator</span>
            </router-link>
          </li>
          <li>
            <router-link to="/qr-scanner" class="nav-link" @click="closeSidebar">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 12l2 2 4-4"/>
                <path d="M21 12c.552 0 1-.448 1-1V5a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v6c0 .552.448 1 1 1"/>
                <path d="M3 12v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6"/>
                <path d="M8 7h.01"/>
                <path d="M16 7h.01"/>
                <path d="M12 7h.01"/>
              </svg>
              <span class="nav-text">QR Scanner</span>
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
          <div class="user-details">
            <span class="user-name">Admin User</span>
            <span class="user-role">Administrator</span>
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>

<script>
export default {
  name: 'Sidebar',
  data() {
    return {
      isSidebarOpen: false
    }
  },
  methods: {
    toggleSidebar() {
      this.isSidebarOpen = !this.isSidebarOpen
    },
    closeSidebar() {
      this.isSidebarOpen = false
    }
  },
  mounted() {
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768) {
        const sidebar = document.querySelector('.sidebar')
        const burgerBtn = document.querySelector('.burger-btn')
        
        if (!sidebar.contains(e.target) && !burgerBtn.contains(e.target)) {
          this.isSidebarOpen = false
        }
      }
    })

    // Close sidebar on window resize to desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        this.isSidebarOpen = false
      }
    })
  }
}
</script>

<style scoped>
/* Burger Menu Button */
.burger-btn {
  display: none;
  position: fixed;
  top: 20px;
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
  padding: 0;
  box-shadow: 4px 0 20px rgba(37, 99, 235, 0.2);
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: transform 0.3s ease;
}

.logo-section {
  padding: 32px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(0, 0, 0, 0.1);
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.logo-image {
  width: 32px;
  height: 32px;
  object-fit: contain;
  border-radius: 6px;
}

.brand-info {
  flex: 1;
}

.brand-name {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 4px 0;
  color: white;
  letter-spacing: -0.025em;
  line-height: 1.1;
}

.brand-subtitle {
  font-size: 13px;
  font-weight: 500;
  margin: 0;
  color: rgba(255, 255, 255, 0.7);
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

.user-info:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-1px);
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
}

.user-avatar svg {
  width: 20px;
  height: 20px;
}

.user-details {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: white;
  line-height: 1.2;
}

.user-role {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
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
  }
  
  .sidebar.mobile-open {
    transform: translateX(0);
  }
}

@media (max-width: 480px) {
  .sidebar {
    width: 260px;
  }
  
  .logo-section {
    padding: 24px 20px;
  }
  
  .brand-name {
    font-size: 20px;
  }
  
  .nav-link {
    font-size: 13px;
    padding: 12px 14px;
  }
  
  .nav-icon {
    width: 18px;
    height: 18px;
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
</style>