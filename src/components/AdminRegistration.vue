<template>
  <div class="register-container">
    <div class="register-card">
      <router-link to="/admin-dashboard" class="back-button">
        <span class="back-arrow">←</span> Back to Dashboard
      </router-link>

      <div class="register-header">
        <h1>Admin Registration</h1>
        <p>Create an admin account for CocoFlow</p>
      </div>

      <form @submit.prevent="handleRegister" class="register-form">
        <div class="form-group">
          <label for="displayName">Display Name</label>
          <div class="input-wrapper">
            <input
              id="displayName"
              v-model="displayName"
              type="text"
              required
              placeholder="Enter display name"
            />
            <div class="input-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <div class="input-wrapper">
            <input
              id="email"
              v-model="email"
              type="email"
              required
              placeholder="Enter your email"
            />
            <div class="input-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <div class="input-wrapper">
            <input
              id="password"
              v-model="password"
              type="password"
              required
              placeholder="Enter your password"
              minlength="8"
            />
            <div class="input-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          <p v-if="passwordError" class="error-text">{{ passwordError }}</p>
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirm Password</label>
          <div class="input-wrapper">
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              required
              placeholder="Confirm your password"
              minlength="8"
            />
            <div class="input-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Error Message for Existing Account -->
        <div v-if="error" :class="['error-message', { 'account-exists': error.includes('already') }]">
          <p>
            {{ error }}
            <router-link v-if="error.includes('already')" to="/login">Sign in instead</router-link>
          </p>
        </div>

        <button
          type="submit"
          :disabled="isLoading || !isFormValid"
          class="register-button"
        >
          <span v-if="isLoading" class="loading-spinner"></span>
          <span v-else>Create Admin Account</span>
        </button>

        <div class="divider">
          <span>or</span>
        </div>

        <button
          type="button"
          @click="handleGoogleSignUp"
          :disabled="isLoading"
          class="google-button"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" class="google-icon" />
          Sign up with Google
        </button>
      </form>

      <!-- Success Modal -->
      <div v-if="showSuccessModal" class="modal-overlay">
        <div class="modal-content success">
          <div class="modal-icon">✓</div>
          <h3>Success!</h3>
          <p>Admin account has been created successfully.</p>
          <button @click="closeModal" class="modal-button">OK</button>
        </div>
      </div>

      <!-- Error Modal -->
      <div v-if="showErrorModal" class="modal-overlay">
        <div class="modal-content error">
          <div class="modal-icon">!</div>
          <h3>Error</h3>
          <p>{{ error }}</p>
          <button @click="closeModal" class="modal-button">Try Again</button>
        </div>
      </div>

      <p class="login-link">
        Already have an account?
        <router-link to="/login">Sign in</router-link>
      </p>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

export default {
  name: 'AdminRegistration',
  setup() {
    const router = useRouter();
    const email = ref('');
    const password = ref('');
    const confirmPassword = ref('');
    const displayName = ref('');
    const error = ref('');
    const passwordError = ref('');
    const isLoading = ref(false);
    const showSuccessModal = ref(false);
    const showErrorModal = ref(false);

    const googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });

    const validatePassword = (pwd) => {
      const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      return regex.test(pwd);
    };

    const isFormValid = computed(() => {
      return (
        email.value &&
        displayName.value &&
        password.value &&
        confirmPassword.value &&
        password.value === confirmPassword.value &&
        validatePassword(password.value)
      );
    });

    // Clear error messages when user starts typing
    watch([email, password, confirmPassword, displayName], () => {
      error.value = '';
      showErrorModal.value = false;
      passwordError.value = validatePassword(password.value)
        ? ''
        : 'Password must be at least 8 characters, including uppercase, lowercase, number, and special character.';
    });

    const closeModal = () => {
      if (showSuccessModal.value) {
        router.push('/admin-list');
      }
      showSuccessModal.value = false;
      showErrorModal.value = false;
    };

    const handleRegister = async () => {
      if (!isFormValid.value || isLoading.value) return;

      isLoading.value = true;
      error.value = '';

      try {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.value)) {
          throw new Error('Please enter a valid email address');
        }

        // Check if email already exists in Firestore
        const userDoc = await getDoc(doc(db, 'users', email.value));
        if (userDoc.exists()) {
          throw new Error('This email is already registered.');
        }

        // Get current user to restore session later
        const currentUser = auth.currentUser;

        // Create authentication account
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email.value,
          password.value
        );

        // Restore original user session
        if (currentUser) {
          await auth.updateCurrentUser(currentUser);
        }

        // Create admin document in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: email.value,
          displayName: displayName.value,
          role: 'admin',
          createdAt: serverTimestamp(),
          status: 'active',
          uid: userCredential.user.uid,
          registrationSource: 'email',
        });

        // Show success modal
        showSuccessModal.value = true;
        // Clear form
        email.value = '';
        password.value = '';
        confirmPassword.value = '';
        displayName.value = '';
      } catch (err) {
        console.error('Registration error:', err);
        if (err.code === 'auth/email-already-in-use' || err.message.includes('already registered')) {
          error.value = 'This email is already registered.';
        } else if (err.code === 'auth/invalid-email') {
          error.value = 'Please enter a valid email address.';
        } else if (err.code === 'auth/weak-password') {
          error.value = 'Password is too weak.';
        } else if (err.code === 'auth/requires-recent-login') {
          error.value = 'Please re-authenticate to perform this action.';
          router.push('/reauthenticate');
          return;
        } else if (err.code === 'permission-denied') {
          error.value = 'You do not have permission to create admin accounts.';
        } else {
          error.value = 'Failed to create admin account. Please check your connection and try again.';
        }
        showErrorModal.value = true;
      } finally {
        isLoading.value = false;
      }
    };

    const handleGoogleSignUp = async () => {
      if (isLoading.value) return;
      isLoading.value = true;
      error.value = '';

      try {
        // Get current user to restore session later
        const currentUser = auth.currentUser;

        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        // Restore original user session
        if (currentUser) {
          await auth.updateCurrentUser(currentUser);
        }

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          error.value = 'This Google account is already registered.';
          showErrorModal.value = true;
          return;
        }

        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          displayName: user.displayName || displayName.value || 'Admin',
          role: 'admin',
          createdAt: serverTimestamp(),
          status: 'active',
          uid: user.uid,
          registrationSource: 'google',
        });

        // Show success modal
        showSuccessModal.value = true;
        // Clear form
        email.value = '';
        password.value = '';
        confirmPassword.value = '';
        displayName.value = '';
      } catch (err) {
        console.error('Google sign-up error:', err);
        if (err.code === 'auth/account-exists-with-different-credential') {
          error.value = 'This email is already registered with a different sign-in method.';
        } else if (err.code === 'auth/popup-closed-by-user') {
          error.value = 'Google sign-in was cancelled. Please try again.';
        } else if (err.code === 'auth/popup-blocked') {
          error.value = 'Pop-up was blocked by your browser. Please allow pop-ups and try again.';
        } else if (err.code === 'auth/requires-recent-login') {
          error.value = 'Please re-authenticate to perform this action.';
          router.push('/reauthenticate');
          return;
        } else if (err.code === 'permission-denied') {
          error.value = 'You do not have permission to create admin accounts.';
        } else {
          error.value = 'Failed to create admin account. Please check your connection and try again.';
        }
        showErrorModal.value = true;
      } finally {
        isLoading.value = false;
      }
    };

    return {
      email,
      password,
      confirmPassword,
      displayName,
      error,
      passwordError,
      isLoading,
      isFormValid,
      handleRegister,
      handleGoogleSignUp,
      showSuccessModal,
      showErrorModal,
      closeModal,
    };
  },
};
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
  padding: 20px;
}

.register-card {
  background: rgba(255, 255, 255, 0.95);
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 420px;
  backdrop-filter: blur(8px);
}

.register-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.register-header h1 {
  font-size: 2rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.75rem;
}

.register-header p {
  color: #7f8c8d;
  font-size: 1rem;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #2c3e50;
}

.input-wrapper {
  position: relative;
}

.input-wrapper input {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: #f8f9fa;
}

.input-wrapper input:focus {
  outline: none;
  border-color: #3498db;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.input-icon {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #95a5a6;
}

.input-icon svg {
  width: 1.25rem;
  height: 1.25rem;
}

.register-button {
  width: 100%;
  padding: 0.875rem 1rem;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.register-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.2);
}

.register-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-spinner {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid #ffffff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 0.5rem;
}

.error-message {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 8px;
}

.error-message p {
  color: #e74c3c;
  text-align: center;
  font-size: 0.9rem;
}

.error-message a {
  color: #3498db;
  text-decoration: none;
  font-weight: 500;
}

.error-message a:hover {
  color: #2980b9;
}

.account-exists {
  background: #fff3cd;
  border: 1px solid #ffeeba;
}

.account-exists p {
  color: #856404;
}

.error-text {
  color: #e74c3c;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.login-link {
  margin-top: 2rem;
  text-align: center;
  color: #7f8c8d;
  font-size: 0.9rem;
}

.login-link a {
  color: #3498db;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.login-link a:hover {
  color: #2980b9;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 1rem 0;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #e0e0e0;
}

.divider span {
  padding: 0 1rem;
  color: #7f8c8d;
  font-size: 0.9rem;
}

.google-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 0.875rem;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  color: #2c3e50;
  cursor: pointer;
  transition: all 0.2s ease;
}

.google-button:hover {
  background: #f8f9fa;
  border-color: #d0d0d0;
}

.google-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.google-icon {
  width: 20px;
  height: 20px;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #3498db;
  text-decoration: none;
  font-weight: 500;
  margin-bottom: 1.5rem;
  transition: all 0.2s ease;
}

.back-button:hover {
  color: #2980b9;
  transform: translateX(-2px);
}

.back-arrow {
  font-size: 1.2rem;
}

@media (max-width: 640px) {
  .back-button {
    font-size: 0.9rem;
  }
}

.modal-overlay {
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

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  animation: popup 0.3s ease-out;
}

.modal-content.success {
  border-top: 4px solid #2ecc71;
}

.modal-content.error {
  border-top: 4px solid #e74c3c;
}

.modal-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.modal-content.success .modal-icon {
  color: #2ecc71;
}

.modal-content.error .modal-icon {
  color: #e74c3c;
}

.modal-content h3 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.modal-content p {
  color: #7f8c8d;
  margin-bottom: 1.5rem;
}

.modal-button {
  background: #3498db;
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.modal-button:hover {
  background: #2980b9;
  transform: translateY(-1px);
}

@keyframes popup {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@media (max-width: 640px) {
  .modal-content {
    width: 95%;
    padding: 1.5rem;
  }
}
</style>