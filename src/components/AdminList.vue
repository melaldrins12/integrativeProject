<template>
    <div class="admin-list-container">
      <div class="admin-list-card">
        <div class="admin-list-header">
          <div class="header-content">
            <router-link to="/admin-dashboard" class="back-button">
              <span class="back-icon">←</span> Back to Dashboard
            </router-link>
            <h1>Admin List</h1>
            <p>View all registered admin accounts</p>
          </div>
        </div>
  
        <div v-if="isLoading" class="loading-wrapper">
          <div class="spinner"></div>
          <p>Loading admins...</p>
        </div>
  
        <div v-else-if="error" class="error-message">
          <p>{{ error }}</p>
        </div>
  
        <div v-else>
          <div class="admin-list-filters">
            <div class="search-box">
              <input
                type="text"
                v-model="searchQuery"
                placeholder="Search admins..."
                class="search-input"
              />
              <div class="search-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
  
          <div class="admin-table-container">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="admin in filteredAdmins" :key="admin.id">
                  <td>{{ admin.email }}</td>
                  <td>{{ formatDate(admin.createdAt) }}</td>
                  <td>
                    <button 
                      @click="confirmDeleteAdmin(admin)"
                      class="delete-button"
                      :disabled="admin.id === currentUserId"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
  
          <div v-if="filteredAdmins.length === 0" class="no-results">
            <p>No admin accounts found</p>
          </div>
        </div>
  
        <!-- Delete Confirmation Dialog -->
        <div v-if="showDeleteDialog" class="dialog-overlay">
          <div class="dialog">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this admin account?</p>
            <p class="warning">This action cannot be undone.</p>
            <div class="dialog-actions">
              <button @click="cancelDelete" class="cancel-button">Cancel</button>
              <button @click="deleteAdmin" class="confirm-button">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, computed, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
  import { auth, db } from '../firebaseConfig';
  
  export default {
    name: 'AdminList',
    setup() {
      const router = useRouter();
      const admins = ref([]);
      const isLoading = ref(true);
      const error = ref('');
      const searchQuery = ref('');
      const showDeleteDialog = ref(false);
      const adminToDelete = ref(null);
      const currentUserId = ref('');
  
      const filteredAdmins = computed(() => {
        if (!searchQuery.value) return admins.value;
        
        const query = searchQuery.value.toLowerCase();
        return admins.value.filter(admin => 
          admin.email.toLowerCase().includes(query)
        );
      });
  
      const fetchAdmins = async () => {
        try {
          const q = query(
            collection(db, 'users'),
            where('role', '==', 'admin')
          );
          
          const querySnapshot = await getDocs(q);
          admins.value = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
  
          // Get current user ID
          const user = auth.currentUser;
          if (user) {
            currentUserId.value = user.uid;
          }
        } catch (err) {
          console.error('Error fetching admins:', err);
          error.value = 'Failed to load admin list';
        } finally {
          isLoading.value = false;
        }
      };
  
      const formatDate = (date) => {
        if (!date) return 'N/A';
        const dateObj = date.toDate ? date.toDate() : new Date(date);
        return dateObj.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      };
  
      const confirmDeleteAdmin = (admin) => {
        adminToDelete.value = admin;
        showDeleteDialog.value = true;
      };
  
      const cancelDelete = () => {
        showDeleteDialog.value = false;
        adminToDelete.value = null;
      };
  
      const deleteAdmin = async () => {
        if (!adminToDelete.value) return;
  
        try {
          await deleteDoc(doc(db, 'users', adminToDelete.value.id));
          admins.value = admins.value.filter(admin => admin.id !== adminToDelete.value.id);
          showDeleteDialog.value = false;
          adminToDelete.value = null;
        } catch (err) {
          console.error('Error deleting admin:', err);
          if (err.code === 'auth/requires-recent-login') {
            error.value = 'Please re-authenticate to perform this action.';
            router.push('/reauthenticate');
          } else {
            error.value = 'Failed to delete admin account: ' + err.message;
          }
        }
      };
  
      onMounted(() => {
        fetchAdmins();
      });
  
      return {
        admins,
        isLoading,
        error,
        searchQuery,
        filteredAdmins,
        showDeleteDialog,
        currentUserId,
        formatDate,
        confirmDeleteAdmin,
        cancelDelete,
        deleteAdmin
      };
    }
  };
  </script>
  
  <style scoped>
  .admin-list-container {
    min-height: 100vh;
    padding: 2rem;
    background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
  }
  
  .admin-list-card {
    background: rgba(255, 255, 255, 0.95);
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    max-width: 1200px;
    margin: 0 auto;
    backdrop-filter: blur(8px);
  }
  
  .admin-list-header {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .admin-list-header h1 {
    font-size: 2rem;
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 0.5rem;
  }
  
  .admin-list-header p {
    color: #7f8c8d;
    font-size: 1rem;
  }
  
  .admin-list-filters {
    margin-bottom: 1.5rem;
  }
  
  .search-box {
    position: relative;
    max-width: 400px;
    margin: 0 auto;
  }
  
  .search-input {
    width: 100%;
    padding: 0.875rem 1rem;
    padding-left: 2.5rem;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.2s ease;
    background: #f8f9fa;
  }
  
  .search-input:focus {
    outline: none;
    border-color: #3498db;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  }
  
  .search-icon {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #95a5a6;
  }
  
  .search-icon svg {
    width: 1.25rem;
    height: 1.25rem;
  }
  
  .admin-table-container {
    overflow-x: auto;
    margin: 1rem 0;
  }
  
  .admin-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
  }
  
  .admin-table th,
  .admin-table td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #e0e0e0;
  }
  
  .admin-table th {
    font-weight: 600;
    color: #2c3e50;
    background: #f8f9fa;
  }
  
  .admin-table tr:hover {
    background: #f8f9fa;
  }
  
  .delete-button {
    padding: 0.5rem 1rem;
    background: #e74c3c;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .delete-button:hover {
    background: #c0392b;
  }
  
  .delete-button:disabled {
    background: #95a5a6;
    cursor: not-allowed;
  }
  
  .loading-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    margin: 2rem 0;
  }
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  .error-message {
    margin: 1rem 0;
    padding: 1rem;
    background: #fee2e2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    color: #e74c3c;
    text-align: center;
  }
  
  .no-results {
    text-align: center;
    color: #7f8c8d;
    margin: 2rem 0;
  }
  
  .dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .dialog {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    max-width: 400px;
    width: 90%;
  }
  
  .dialog h3 {
    margin: 0 0 1rem;
    color: #2c3e50;
  }
  
  .dialog p {
    margin: 0 0 1rem;
    color: #7f8c8d;
  }
  
  .dialog .warning {
    color: #e74c3c;
    font-weight: 500;
  }
  
  .dialog-actions {
    display: flex;
    gap: 1rem;
    margin-top: 1.5rem;
  }
  
  .dialog-actions button {
    flex: 1;
    padding: 0.75rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease;
  }
  
  .cancel-button {
    background: #e0e0e0;
    color: #2c3e50;
  }
  
  .cancel-button:hover {
    background: #d0d0d0;
  }
  
  .confirm-button {
    background: #e74c3c;
    color: white;
  }
  
  .confirm-button:hover {
    background: #c0392b;
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  @media (max-width: 768px) {
    .admin-list-container {
      padding: 1rem;
    }
  
    .admin-list-card {
      padding: 1rem;
    }
  
    .admin-table th,
    .admin-table td {
      padding: 0.75rem;
    }
  
    .admin-table th:nth-child(2),
    .admin-table td:nth-child(2) {
      display: none;
    }
  
    .back-button {
      position: static;
      transform: none;
      margin-bottom: 1rem;
      align-self: flex-start;
    }
    
    .back-button:hover {
      transform: translateX(-4px);
    }
  }
  
  .header-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
  }
  
  .back-button {
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: #f8f9fa;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    color: #2c3e50;
    text-decoration: none;
    font-weight: 500;
    transition: all 0.2s ease;
  }
  
  .back-button:hover {
    background: #e9ecef;
    transform: translateY(-50%) translateX(-4px);
  }
  
  .back-icon {
    font-size: 18px;
  }
  </style>