<template>
  <div class="user-list-container">
    <div class="user-list-card">
      <div class="user-list-header">
        <div class="header-content">
          <router-link to="/admin-dashboard" class="back-button">
            <span class="back-icon">←</span> Back to Dashboard
          </router-link>
          <h1>User List</h1>
          <p>View all registered user accounts</p>
        </div>
      </div>

      <div v-if="isLoading" class="loading-wrapper">
        <div class="spinner"></div>
        <p>Loading users...</p>
      </div>

      <div v-else-if="error" class="error-message">
        <p>{{ error }}</p>
      </div>

      <div v-else>
        <div class="user-list-filters">
          <div class="search-box">
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Search users..."
              class="search-input"
            />
            <div class="search-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="user-table-container">
          <table class="user-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Created At</th>
                <th>Last Active</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in filteredUsers" :key="user.id">
                <td>{{ user.email }}</td>
                <td>{{ formatDate(user.createdAt) }}</td>
                <td>
                  <span :class="['status-badge', isUserActive(user.lastActive) ? 'active' : 'inactive']">
                    {{ isUserActive(user.lastActive) ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td>
                  <span :class="['status-badge', user.status]">
                    {{ user.status }}
                  </span>
                </td>
                <td>
                  <button 
                    @click="confirmDeleteUser(user)"
                    class="delete-button"
                    :disabled="user.id === currentUserId"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="filteredUsers.length === 0" class="no-results">
          <p>No user accounts found</p>
        </div>
      </div>

      <!-- Delete Confirmation Dialog -->
      <div v-if="showDeleteDialog" class="dialog-overlay">
        <div class="dialog">
          <h3>Confirm Delete</h3>
          <p>Are you sure you want to delete this user account?</p>
          <p class="warning">This action cannot be undone.</p>
          <div class="dialog-actions">
            <button @click="cancelDelete" class="cancel-button">Cancel</button>
            <button @click="deleteUser" class="confirm-button">Delete</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { collection, query, where, getDocs, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

export default {
  name: 'UserList',
  setup() {
    const router = useRouter();
    const users = ref([]);
    const isLoading = ref(true);
    const error = ref('');
    const searchQuery = ref('');
    const showDeleteDialog = ref(false);
    const userToDelete = ref(null);
    const currentUserId = ref('');

    const isUserActive = (lastActive) => {
      if (!lastActive) return false;
      const lastActiveTime = lastActive.toDate ? lastActive.toDate() : new Date(lastActive);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      return lastActiveTime > fiveMinutesAgo;
    };

    const filteredUsers = computed(() => {
      if (!searchQuery.value) return users.value;
      
      const query = searchQuery.value.toLowerCase();
      return users.value.filter(user => 
        user.email.toLowerCase().includes(query)
      );
    });

    const fetchUsers = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          where('role', '==', 'user')
        );
        
        // Set up real-time listener for users
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          users.value = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          isLoading.value = false;
        }, (err) => {
          console.error('Error fetching users:', err);
          error.value = 'Failed to load user list';
          isLoading.value = false;
        });

        // Get current user ID
        const user = auth.currentUser;
        if (user) {
          currentUserId.value = user.uid;
        }

        // Cleanup subscription on component unmount
        onUnmounted(() => {
          unsubscribe();
        });
      } catch (err) {
        console.error('Error fetching users:', err);
        error.value = 'Failed to load user list';
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

    const confirmDeleteUser = (user) => {
      userToDelete.value = user;
      showDeleteDialog.value = true;
    };

    const cancelDelete = () => {
      showDeleteDialog.value = false;
      userToDelete.value = null;
    };

    const deleteUser = async () => {
      if (!userToDelete.value) return;

      try {
        await deleteDoc(doc(db, 'users', userToDelete.value.id));
        users.value = users.value.filter(user => user.id !== userToDelete.value.id);
        showDeleteDialog.value = false;
        userToDelete.value = null;
      } catch (err) {
        console.error('Error deleting user:', err);
        if (err.code === 'auth/requires-recent-login') {
          error.value = 'Please re-authenticate to perform this action.';
          router.push('/reauthenticate');
        } else {
          error.value = 'Failed to delete user account: ' + err.message;
        }
      }
    };

    onMounted(() => {
      fetchUsers();
    });

    return {
      users,
      isLoading,
      error,
      searchQuery,
      filteredUsers,
      showDeleteDialog,
      currentUserId,
      formatDate,
      confirmDeleteUser,
      cancelDelete,
      deleteUser,
      isUserActive
    };
  }
};
</script>

<style scoped>
.user-list-container {
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.user-list-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.user-list-header {
  margin-bottom: 2rem;
}

.header-content {
  text-align: center;
}

.back-button {
  display: inline-flex;
  align-items: center;
  color: #3b82f6;
  text-decoration: none;
  margin-bottom: 1rem;
  font-weight: 500;
}

.back-icon {
  margin-right: 0.5rem;
}

h1 {
  font-size: 2rem;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

p {
  color: #64748b;
  margin: 0;
}

.loading-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-message {
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
  color: #dc2626;
}

.user-list-filters {
  margin-bottom: 2rem;
}

.search-box {
  position: relative;
  max-width: 400px;
  margin: 0 auto;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  padding-right: 3rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-icon {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}

.user-table-container {
  overflow-x: auto;
  margin: 1rem 0;
}

.user-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.user-table th,
.user-table td {
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.user-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-badge.active {
  background-color: #dcfce7;
  color: #166534;
}

.status-badge.inactive {
  background-color: #fee2e2;
  color: #991b1b;
}

/* Account status badge styles */
.status-badge.enabled {
  background-color: #dcfce7;
  color: #166534;
}

.status-badge.disabled {
  background-color: #fee2e2;
  color: #991b1b;
}

.status-badge.suspended {
  background-color: #fef3c7;
  color: #92400e;
}

.status-badge.pending {
  background-color: #e0e7ff;
  color: #3730a3;
}

.delete-button {
  padding: 0.5rem 1rem;
  background: #fee2e2;
  color: #dc2626;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.delete-button:hover:not(:disabled) {
  background: #fecaca;
}

.delete-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.no-results {
  text-align: center;
  padding: 2rem;
  color: #64748b;
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
  color: #1e293b;
}

.dialog p {
  margin-bottom: 1rem;
}

.dialog .warning {
  color: #dc2626;
  font-weight: 500;
}

.dialog-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.cancel-button,
.confirm-button {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-button {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.confirm-button {
  background: #dc2626;
  color: white;
  border: none;
}

.cancel-button:hover {
  background: #e2e8f0;
}

.confirm-button:hover {
  background: #b91c1c;
}

@media (max-width: 768px) {
  .user-list-container {
    padding: 1rem;
  }

  .user-list-card {
    padding: 1rem;
  }

  .user-table th,
  .user-table td {
    padding: 0.75rem;
  }

  .dialog {
    width: 95%;
    padding: 1.5rem;
  }
}
</style> 