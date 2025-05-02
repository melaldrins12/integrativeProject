<template>
  <div class="register-container">
    <div class="register-card">
      <div class="register-header">
        <h1>Create User Account</h1>
        <p>Join CocoFlow to manage your smoking process</p>
      </div>
      
      <!-- Error Message -->
      <div v-if="error" class="error-message">
        <div class="error-icon">⚠️</div>
        <p>{{ error }}</p>
        <p v-if="error.includes('already registered') || error.includes('already exists') || error.includes('different sign-in method')" class="error-suggestion">
          This account is already registered. Would you like to <router-link to="/login">sign in</router-link> instead?
        </p>
      </div>

      <!-- Email/Password Registration Form -->
      <form @submit.prevent="registerWithEmail" class="register-form">
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
            />
            <div class="input-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
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
            />
            <div class="input-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
        </div>
        <button
          type="submit"
          :disabled="isLoading"
          class="register-button"
        >
          <span v-if="isLoading" class="loading-spinner"></span>
          <span v-else>Create Account</span>
        </button>
      </form>

      <!-- Divider -->
      <div class="divider">
        <span>Or continue with</span>
      </div>

      <!-- Google Sign-Up Button -->
      <button
        @click="registerWithGoogle"
        :disabled="isLoading"
        class="google-button"
      >
        <svg class="google-icon" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M12.24 10.667H7.843v2.667h4.397c-.413 1.467-1.733 2.667-3.563 2.667-2.067 0-3.733-1.667-3.733-3.733s1.667-3.733 3.733-3.733c.933 0 1.8.333 2.467 1l1.867-1.867C11.067 6.267 9.267 5.333 7.377 5.333c-3.467 0-6.267 2.8-6.267 6.267s2.8 6.267 6.267 6.267c3.6 0 6-2.533 6-6.267v-.933z"
          />
        </svg>
        <span v-if="isLoading">Signing up...</span>
        <span v-else>Sign up with Google</span>
      </button>

      <!-- Login Link -->
      <p class="login-link">
        Already have an account?
        <router-link to="/login">Sign in</router-link>
      </p>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebaseConfig';

export default {
  name: 'UserRegistration',
  setup() {
    const email = ref('');
    const password = ref('');
    const confirmPassword = ref('');
    const error = ref('');
    const isLoading = ref(false);
    const router = useRouter();

    const registerWithEmail = async () => {
      if (isLoading.value) return;
      
      if (password.value !== confirmPassword.value) {
        error.value = 'Passwords do not match';
        return;
      }

      isLoading.value = true;
      error.value = '';
      
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value);
        const user = userCredential.user;

        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          role: 'user',
          createdAt: new Date().toISOString()
        });

        router.push('/user-dashboard');
      } catch (err) {
        console.error('Registration error:', err);
        if (err.code === 'auth/email-already-in-use') {
          error.value = 'This email is already registered';
        } else {
          error.value = getFriendlyError(err.code);
        }
      } finally {
        isLoading.value = false;
      }
    };

    const registerWithGoogle = async () => {
      if (isLoading.value) return;
      isLoading.value = true;
      error.value = '';
      
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (userDoc.exists()) {
          error.value = 'This Google account is already registered';
          return;
        }

        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          displayName: user.displayName,
          role: 'user',
          createdAt: new Date().toISOString()
        });

        router.push('/user-dashboard');
      } catch (err) {
        console.error('Google sign-up error:', err);
        if (err.code === 'auth/account-exists-with-different-credential') {
          error.value = 'This email is already registered with a different sign-in method';
        } else {
          error.value = getFriendlyError(err.code);
        }
      } finally {
        isLoading.value = false;
      }
    };

    const getFriendlyError = (code) => {
      const errorMessages = {
        'auth/email-already-in-use': 'This email is already registered',
        'auth/invalid-email': 'Please enter a valid email address',
        'auth/operation-not-allowed': 'Email/password accounts are not enabled',
        'auth/weak-password': 'Password should be at least 6 characters',
        'auth/popup-closed-by-user': 'Sign-up popup was closed before completing the sign-up',
        'auth/cancelled-popup-request': 'Sign-up popup was cancelled',
        'auth/popup-blocked': 'Sign-up popup was blocked by the browser',
        'auth/account-exists-with-different-credential': 'This email is already registered with a different sign-in method',
        'auth/network-request-failed': 'Network error. Please check your internet connection',
      };
      return errorMessages[code] || 'An error occurred. Please try again';
    };

    return {
      email,
      password,
      confirmPassword,
      error,
      isLoading,
      registerWithEmail,
      registerWithGoogle,
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
  background: #3498db;
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

.register-button:hover {
  background: #2980b9;
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

.divider {
  position: relative;
  text-align: center;
  margin: 2rem 0;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #e0e0e0;
}

.divider span {
  position: relative;
  background: white;
  padding: 0 1rem;
  color: #7f8c8d;
  font-size: 0.9rem;
}

.google-button {
  width: 100%;
  padding: 0.875rem 1rem;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  color: #2c3e50;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.google-button:hover {
  background: #f8f9fa;
  border-color: #bdc3c7;
}

.google-icon {
  width: 1.25rem;
  height: 1.25rem;
  margin-right: 0.75rem;
}

.error-message {
  background-color: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  animation: slideDown 0.3s ease-out;
}

.error-icon {
  font-size: 1.5rem;
  color: #e74c3c;
}

.error-message p {
  color: #e74c3c;
  margin: 0;
  font-size: 0.9rem;
  font-weight: 500;
}

.error-suggestion {
  color: #7f8c8d !important;
  font-size: 0.85rem !important;
  margin-top: 0.5rem !important;
}

.error-suggestion a {
  color: #3498db;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.error-suggestion a:hover {
  color: #2980b9;
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

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
  