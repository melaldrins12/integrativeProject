<!-- src/components/AdminDashboard.vue -->
<template>
    <div class="admin-dashboard-wrapper" :class="{ 'dark-mode': isDarkMode }">
      <nav class="sidebar" :class="{ 'sidebar-open': isSidebarOpen }">
        <div class="sidebar-header">
          <h2 class="logo">CocoFlow Admin</h2>
          <button class="hamburger" @click="toggleSidebar" aria-label="Toggle Sidebar">
            <span class="hamburger-icon">☰</span>
          </button>
        </div>
        <div class="sidebar-content">
          <div class="sidebar-links">
            <a href="/admin-dashboard" class="sidebar-link active" @click="toggleSidebar">Admin Dashboard</a>
            <a href="/settings" class="sidebar-link" @click="toggleSidebar">Settings</a>
          </div>
          <button @click="signOut" class="sign-out-button" aria-label="Sign Out">Sign Out</button>
        </div>
      </nav>
      <div class="main-content">
        <header class="dashboard-header">
          <div class="header-content">
            <button class="hamburger mobile-only" @click="toggleSidebar" aria-label="Toggle Sidebar">
              <span class="hamburger-icon">☰</span>
            </button>
            <div class="header-right">
              <button class="theme-toggle" @click="toggleTheme" :aria-label="isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
                {{ isDarkMode ? '☀️' : '🌙' }}
              </button>
            </div>
          </div>
        </header>
        <main class="dashboard">
          <h1>Admin Dashboard</h1>
          <div v-if="isAuthLoading">
            <div class="loading-wrapper">
              <div class="spinner"></div>
              <p class="loading-text">Loading...</p>
            </div>
          </div>
          <div v-else-if="user">
            <p class="welcome-text">Welcome, {{ user.email }}!</p>
            <p class="role-text">Logged in as {{ userRole | capitalize }}</p>
            <div class="dashboard-content">
              <div class="card">
                <h3>User Management</h3>
                <div v-if="users.length">
                  <table class="user-table">
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="user in users" :key="user.uid">
                        <td>{{ user.email }}</td>
                        <td>{{ user.role | capitalize }}</td>
                        <td>
                          <button
                            v-if="user.role !== 'admin'"
                            @click="updateUserRole(user.uid, 'admin')"
                            class="action-button"
                          >
                            Make Admin
                          </button>
                          <button
                            v-if="user.role !== 'user'"
                            @click="updateUserRole(user.uid, 'user')"
                            class="action-button"
                          >
                            Make User
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p v-else>No users found.</p>
              </div>
            </div>
          </div>
          <div v-else>
            <div class="loading-wrapper">
              <div class="spinner"></div>
              <p class="loading-text">Redirecting to login...</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  </template>
  
  <script>
  import { auth, db } from '../firebaseConfig';
  import { signOut } from '../services/auth';
  import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
  
  export default {
    name: 'AdminDashboard',
    filters: {
      capitalize(value) {
        if (!value) return '';
        return value.charAt(0).toUpperCase() + value.slice(1);
      }
    },
    data() {
      return {
        user: null,
        userRole: 'Loading...',
        isAuthLoading: true,
        isDarkMode: false,
        isSidebarOpen: false,
        users: []
      };
    },
    async created() {
      auth.onAuthStateChanged(async (user) => {
        this.isAuthLoading = false;
        this.user = user;
        if (!user) {
          this.$router.push('/login');
        } else {
          // Fetch user role
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          this.userRole = userDoc.exists() ? userDoc.data().role : 'user';
          await this.fetchUsers();
        }
      });
      this.isDarkMode = localStorage.getItem('theme') === 'dark';
    },
    methods: {
      async fetchUsers() {
        try {
          const querySnapshot = await getDocs(collection(db, 'users'));
          this.users = querySnapshot.docs.map((doc) => ({
            uid: doc.id,
            ...doc.data()
          }));
        } catch (error) {
          console.error('Error fetching users', error);
        }
      },
      async updateUserRole(uid, role) {
        try {
          await updateDoc(doc(db, 'users', uid), { role });
          await this.fetchUsers();
          alert(`User role updated to ${role}`);
        } catch (error) {
          console.error('Error updating user role', error);
          alert('Failed to update role');
        }
      },
      signOut() {
        signOut()
          .then(() => {
            this.$router.push('/login');
          })
          .catch((error) => {
            console.error('Error signing out', error);
          });
      },
      toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
      },
      toggleSidebar() {
        this.isSidebarOpen = !this.isSidebarOpen;
      }
    }
  };
  </script>
  
  <style scoped>
  @import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;500;600;700&display=swap');
  .admin-dashboard-wrapper {
    display: flex;
    min-height: 100vh;
    font-family: 'Lato', sans-serif;
    background: linear-gradient(135deg, #f5f7fa 0%, #e4e7eb 100%);
    transition: background 0.3s, color 0.3s;
  }
  .admin-dashboard-wrapper.dark-mode {
    background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
    color: #e2e8f0;
  }
  .sidebar {
    width: 250px;
    background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
    color: #e2e8f0;
    position: fixed;
    top: 0;
    left: 0;
    height: 100%;
    padding: 20px;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }
  .sidebar-open {
    transform: translateX(0);
  }
  .sidebar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
  }
  .logo {
    font-size: 24px;
    font-weight: 700;
  }
  .hamburger {
    display: none;
    background: none;
    border: none;
    color: #e2e8f0;
    font-size: 24px;
    cursor: pointer;
  }
  .hamburger-icon {
    display: block;
  }
  .sidebar-content {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .sidebar-links {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .sidebar-link {
    color: #e2e8f0;
    text-decoration: none;
    padding: 10px;
    border-radius: 8px;
    transition: background 0.2s;
  }
  .sidebar-link:hover,
  .sidebar-link.active {
    background: rgba(255, 255, 255, 0.1);
  }
  .sign-out-button {
    background: #e53e3e;
    color: white;
    padding: 10px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s;
  }
  .sign-out-button:hover {
    background: #c53030;
  }
  .main-content {
    flex-grow: 1;
    margin-left: 0;
    transition: margin-left 0.3s;
    padding: 20px;
  }
  .dashboard-header {
    background: #ffffff;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
  }
  .dark-mode .dashboard-header {
    background: #2d3748;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .header-right {
    display: flex;
    align-items: center;
    gap: 15px;
  }
  .theme-toggle {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
  }
  .dashboard {
    max-width: 1200px;
    margin: 0 auto;
  }
  .welcome-text {
    font-size: 18px;
    margin-bottom: 10px;
    color: #2d3748;
  }
  .dark-mode .welcome-text {
    color: #e2e8f0;
  }
  .role-text {
    font-size: 16px;
    margin-bottom: 20px;
    color: #2d3748;
    font-weight: 500;
  }
  .dark-mode .role-text {
    color: #e2e8f0;
  }
  .dashboard-content {
    display: grid;
    gap: 20px;
  }
  .card {
    background: #ffffff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s;
  }
  .dark-mode .card {
    background: #2d3748;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  .card:hover {
    transform: translateY(-5px);
  }
  .user-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 15px;
  }
  .user-table th,
  .user-table td {
    padding: 10px;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
  }
  .dark-mode .user-table th,
  .dark-mode .user-table td {
    border-bottom: 1px solid #4a5568;
  }
  .user-table th {
    font-weight: 600;
    color: #1a202c;
  }
  .dark-mode .user-table th {
    color: #e2e8f0;
  }
  .action-button {
    padding: 6px 12px;
    font-size: 13px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    background: #63b3ed;
    color: #ffffff;
    margin-right: 5px;
    transition: background 0.3s, transform 0.2s;
  }
  .action-button:hover {
    background: #4299e1;
    transform: translateY(-2px);
  }
  .loading-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 50vh;
  }
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #e2e8f0;
    border-top: 4px solid #63b3ed;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  .dark-mode .spinner {
    border: 4px solid #4a5568;
    border-top: 4px solid #63b3ed;
  }
  .loading-text {
    margin-top: 10px;
    color: #2d3748;
  }
  .dark-mode .loading-text {
    color: #e2e8f0;
  }
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @media (max-width: 768px) {
    .sidebar {
      width: 100%;
      max-width: 250px;
    }
    .hamburger {
      display: block;
    }
    .main-content {
      margin-left: 0;
    }
  }
  @media (min-width: 769px) {
    .sidebar {
      transform: translateX(0);
    }
    .main-content {
      margin-left: 250px;
    }
    .mobile-only {
      display: none;
    }
  }
  </style>