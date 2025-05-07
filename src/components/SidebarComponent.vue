<template>
  <nav class="sidebar" :class="{ 'sidebar-open': isOpen, 'dark-mode': isDarkMode }">
    <div class="sidebar-header">
      <h2 class="logo">CocoFlow</h2>
      <button class="hamburger" @click="toggleSidebar" aria-label="Toggle Sidebar">
        <span class="hamburger-icon">☰</span>
      </button>
    </div>

    <div class="sidebar-content">
      <div class="sidebar-links">
        <!-- Main Navigation -->
        <router-link to="/dashboard" class="sidebar-link" :class="{ active: isActive('/dashboard') }" @click="toggleSidebar">
          <span class="icon">📊</span>
          Dashboard
        </router-link>

        <router-link to="/batch-monitor" class="sidebar-link" :class="{ active: isActive('/batch-monitor') }" @click="toggleSidebar">
          <span class="icon">🔍</span>
          Batch Monitor
        </router-link>

        <router-link to="/smoke-settings" class="sidebar-link" :class="{ active: isActive('/smoke-settings') }" @click="toggleSidebar">
          <span class="icon">⚙️</span>
          Smoke Settings
        </router-link>

        <!-- Batch Management Section -->
        <div class="sidebar-section">
          <h3 class="sidebar-section-title">Batch Management</h3>
          <router-link to="/active-batches" class="sidebar-link" :class="{ active: isActive('/active-batches') }" @click="toggleSidebar">
            <span class="icon">🔥</span>
            Active Batches
          </router-link>
          <router-link to="/batch-history" class="sidebar-link" :class="{ active: isActive('/batch-history') }" @click="toggleSidebar">
            <span class="icon">📜</span>
            Batch History
          </router-link>
          <router-link to="/batch-schedule" class="sidebar-link" :class="{ active: isActive('/batch-schedule') }" @click="toggleSidebar">
            <span class="icon">📅</span>
            Schedule Batch
          </router-link>
        </div>

        <!-- System Management Section -->
        <div class="sidebar-section">
          <h3 class="sidebar-section-title">System Management</h3>
          <router-link to="/sensor-status" class="sidebar-link" :class="{ active: isActive('/sensor-status') }" @click="toggleSidebar">
            <span class="icon">📡</span>
            Sensor Status
          </router-link>
          <router-link to="/ventilation-control" class="sidebar-link" :class="{ active: isActive('/ventilation-control') }" @click="toggleSidebar">
            <span class="icon">💨</span>
            Ventilation Control
          </router-link>
          <router-link to="/system-logs" class="sidebar-link" :class="{ active: isActive('/system-logs') }" @click="toggleSidebar">
            <span class="icon">📝</span>
            System Logs
          </router-link>
        </div>

        <!-- User Management Section -->
        <div class="sidebar-section">
          <h3 class="sidebar-section-title">User Management</h3>
          <router-link to="/admin-register" class="sidebar-link" :class="{ active: isActive('/admin-register') }" @click="toggleSidebar">
            <span class="icon">👤</span>
            Admin Registration
          </router-link>
          <router-link to="/admin-list" class="sidebar-link" :class="{ active: isActive('/admin-list') }" @click="toggleSidebar">
            <span class="icon">👥</span>
            Admin List
          </router-link>
        </div>
      </div>

      <!-- System Status -->
      <div class="system-status">
        <h3 class="status-title">System Status</h3>
        <div class="status-items">
          <div class="status-item" :class="{ 'status-active': isSystemActive }">
            <span class="status-icon">{{ isSystemActive ? '🟢' : '🔴' }}</span>
            <span class="status-text">{{ isSystemActive ? 'System Active' : 'System Inactive' }}</span>
          </div>
          <div class="status-item" :class="{ 'status-warning': hasWarnings }">
            <span class="status-icon">{{ hasWarnings ? '⚠️' : '✅' }}</span>
            <span class="status-text">{{ hasWarnings ? 'Warnings Present' : 'No Warnings' }}</span>
          </div>
        </div>
      </div>

      <!-- Theme Toggle and Sign Out -->
      <div class="sidebar-footer">
        <button class="theme-toggle" @click="toggleTheme" :aria-label="isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
          {{ isDarkMode ? '☀️' : '🌙' }}
        </button>
        <button @click="signOut" class="sign-out-button" aria-label="Sign Out">
          <span class="icon">🚪</span>
          Sign Out
        </button>
      </div>
    </div>
  </nav>
</template>

<script>
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { signOut } from '../services/auth';

export default {
  name: 'SidebarComponent',
  props: {
    isOpen: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { emit }) {
    const router = useRouter();
    const route = useRoute();
    const isDarkMode = ref(localStorage.getItem('theme') === 'dark');
    const isSystemActive = ref(true);
    const hasWarnings = ref(false);

    const isActive = (path) => {
      return route.path === path;
    };

    const toggleSidebar = () => {
      emit('toggle-sidebar');
    };

    const toggleTheme = () => {
      isDarkMode.value = !isDarkMode.value;
      localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light');
      emit('theme-changed', isDarkMode.value);
    };

    const handleSignOut = async () => {
      try {
        await signOut();
        router.push('/login');
      } catch (error) {
        console.error('Error signing out:', error);
      }
    };

    // Check system status periodically
    const checkSystemStatus = () => {
      // Simulate system status check
      isSystemActive.value = Math.random() > 0.1; // 90% chance of being active
      hasWarnings.value = Math.random() > 0.7; // 30% chance of having warnings
    };

    // Set up periodic status check
    setInterval(checkSystemStatus, 30000); // Check every 30 seconds

    return {
      isDarkMode,
      isSystemActive,
      hasWarnings,
      isActive,
      toggleSidebar,
      toggleTheme,
      signOut: handleSignOut
    };
  }
};
</script>

<style scoped>
.sidebar {
  width: 280px;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  color: #e2e8f0;
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  padding: 25px;
  transform: translateX(-100%);
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  box-shadow: 4px 0 15px rgba(0, 0, 0, 0.1);
}

.sidebar-open {
  transform: translateX(0);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 35px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.5px;
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  justify-content: space-between;
}

.sidebar-links {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 30px;
  padding: 0 5px;
}

.sidebar-link {
  color: #e2e8f0;
  font-size: 16px;
  font-weight: 500;
  text-decoration: none;
  padding: 12px 18px;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 12px;
}

.sidebar-link:hover {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  transform: translateX(5px);
}

.sidebar-link.active {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

.icon {
  font-size: 20px;
}

.sidebar-section {
  margin: 1rem 0;
  padding: 0.5rem 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-section-title {
  font-size: 0.9rem;
  color: #888;
  padding: 0.5rem 1rem;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.system-status {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 15px;
  margin: 20px 0;
}

.status-title {
  font-size: 0.9rem;
  color: #888;
  margin: 0 0 10px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
}

.status-active {
  color: #10b981;
}

.status-warning {
  color: #f59e0b;
}

.sidebar-footer {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: auto;
}

.theme-toggle {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 8px;
  border-radius: 50%;
  color: #e2e8f0;
}

.theme-toggle:hover {
  transform: scale(1.1) rotate(15deg);
  background: rgba(255, 255, 255, 0.1);
}

.sign-out-button {
  padding: 12px 20px;
  font-size: 16px;
  font-weight: 500;
  color: #ffffff;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
}

.sign-out-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(245, 101, 101, 0.4);
}

/* Dark Mode Styles */
.dark-mode {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
}

.dark-mode .sidebar-link {
  color: #e2e8f0;
}

.dark-mode .sidebar-link:hover {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.dark-mode .sidebar-link.active {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

/* Responsive Styles */
@media (max-width: 768px) {
  .sidebar {
    width: 250px;
  }

  .sidebar-link {
    font-size: 14px;
    padding: 10px 15px;
  }

  .icon {
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .sidebar {
    width: 220px;
  }

  .logo {
    font-size: 24px;
  }

  .sidebar-link {
    font-size: 13px;
    padding: 8px 12px;
  }

  .icon {
    font-size: 16px;
  }
}
</style> 