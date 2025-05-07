<template>
  <div class="user-settings">
    <h2>User Settings</h2>
    <div class="settings-content">
      <div class="back-to-dashboard">
        <button @click="goToDashboard" class="back-button">
          <span class="back-icon">←</span>
          Back to Dashboard
        </button>
      </div>
      <div class="settings-section">
        <h3>Profile Settings</h3>
        <div class="form-group">
          <label for="displayName">Display Name</label>
          <input 
            type="text" 
            id="displayName" 
            v-model="displayName" 
            placeholder="Enter your display name"
          />
        </div>
        <div class="form-group">
          <label for="email">Email</label>
          <input 
            type="email" 
            id="email" 
            v-model="email" 
            disabled 
          />
        </div>
      </div>
      <div class="settings-section">
        <h3>Preferences</h3>
        <div class="form-group">
          <label class="toggle-label">
            <input 
              type="checkbox" 
              v-model="darkMode" 
              @change="toggleDarkMode"
            />
            Dark Mode
          </label>
        </div>
      </div>
      <div class="settings-actions">
        <button 
          class="save-button" 
          @click="saveSettings"
          :disabled="!hasChanges"
        >
          Save Changes
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { auth, db } from '../firebaseConfig';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

export default {
  name: 'UserSettings',
  data() {
    return {
      displayName: '',
      email: '',
      darkMode: false,
      originalSettings: null
    };
  },
  computed: {
    hasChanges() {
      return this.originalSettings && (
        this.displayName !== this.originalSettings.displayName ||
        this.darkMode !== this.originalSettings.darkMode
      );
    }
  },
  async created() {
    await this.loadUserSettings();
  },
  methods: {
    goToDashboard() {
      this.$router.push('/dashboard');
    },
    async loadUserSettings() {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          this.displayName = userData.displayName || '';
          this.email = user.email;
          this.darkMode = userData.darkMode || false;
          
          // Store original settings for change detection
          this.originalSettings = {
            displayName: this.displayName,
            darkMode: this.darkMode
          };
        }
      } catch (error) {
        console.error('Error loading user settings:', error);
      }
    },
    async saveSettings() {
      try {
        const user = auth.currentUser;
        if (!user) return;

        await updateDoc(doc(db, 'users', user.uid), {
          displayName: this.displayName,
          darkMode: this.darkMode,
          updatedAt: new Date()
        });

        // Update original settings after successful save
        this.originalSettings = {
          displayName: this.displayName,
          darkMode: this.darkMode
        };

        alert('Settings saved successfully!');
      } catch (error) {
        console.error('Error saving settings:', error);
        alert('Failed to save settings. Please try again.');
      }
    },
    toggleDarkMode() {
      document.documentElement.classList.toggle('dark-mode', this.darkMode);
      localStorage.setItem('theme', this.darkMode ? 'dark' : 'light');
    }
  }
};
</script>

<style scoped>
.user-settings {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.settings-content {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.settings-section {
  margin-bottom: 2rem;
}

.settings-section h3 {
  color: #2d3748;
  margin-bottom: 1rem;
  font-size: 1.25rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #4a5568;
  font-weight: 500;
}

.form-group input[type="text"],
.form-group input[type="email"] {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input[type="text"]:focus,
.form-group input[type="email"]:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

.form-group input[type="email"]:disabled {
  background-color: #f7fafc;
  cursor: not-allowed;
}

.toggle-label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.toggle-label input[type="checkbox"] {
  margin-right: 0.5rem;
}

.settings-actions {
  margin-top: 2rem;
  display: flex;
  justify-content: flex-end;
}

.save-button {
  background: #4299e1;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.save-button:hover {
  background: #3182ce;
}

.save-button:disabled {
  background: #cbd5e0;
  cursor: not-allowed;
}

/* Dark mode styles */
:root.dark-mode .settings-content {
  background: #2d3748;
}

:root.dark-mode .settings-section h3 {
  color: #e2e8f0;
}

:root.dark-mode .form-group label {
  color: #a0aec0;
}

:root.dark-mode .form-group input[type="text"],
:root.dark-mode .form-group input[type="email"] {
  background: #4a5568;
  border-color: #4a5568;
  color: #e2e8f0;
}

:root.dark-mode .form-group input[type="email"]:disabled {
  background: #2d3748;
}

.back-to-dashboard {
  margin-bottom: 2rem;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0.75rem 1.5rem;
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-button:hover {
  background: #3182ce;
  transform: translateY(-1px);
}

.back-icon {
  font-size: 1.2rem;
}

:root.dark-mode .back-button {
  background: #2b6cb0;
}

:root.dark-mode .back-button:hover {
  background: #2c5282;
}

@media (max-width: 640px) {
  .user-settings {
    padding: 1rem;
  }

  .settings-content {
    padding: 1.5rem;
  }

  .settings-section {
    margin-bottom: 1.5rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }
}
</style> 