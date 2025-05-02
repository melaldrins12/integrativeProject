<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>Welcome to CocoFlow</h1>
        <p>Sign in to manage your smoking process</p>
      </div>
      
      <!-- Email/Password Login Form -->
      <form @submit.prevent="loginWithEmail" class="login-form">
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
        <button
          type="submit"
          :disabled="isLoading"
          class="login-button"
        >
          <span v-if="isLoading" class="loading-spinner"></span>
          <span v-else>Sign In</span>
        </button>
      </form>

      <!-- Divider -->
      <div class="divider">
        <span>Or continue with</span>
      </div>

      <!-- Google Sign-In Button -->
      <button
        @click="loginWithGoogle"
        :disabled="isLoading"
        class="google-button"
      >
        <svg class="google-icon" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M12.24 10.667H7.843v2.667h4.397c-.413 1.467-1.733 2.667-3.563 2.667-2.067 0-3.733-1.667-3.733-3.733s1.667-3.733 3.733-3.733c.933 0 1.8.333 2.467 1l1.867-1.867C11.067 6.267 9.267 5.333 7.377 5.333c-3.467 0-6.267 2.8-6.267 6.267s2.8 6.267 6.267 6.267c3.6 0 6-2.533 6-6.267v-.933z"
          />
        </svg>
        <span v-if="isLoading">Logging in...</span>
        <span v-else>Continue with Google</span>
      </button>

      <!-- Error Message -->
      <div v-if="error" class="error-message">
        <p>{{ error }}</p>
      </div>

      <!-- Register Link -->
      <p class="register-link">
        Don't have an account?
        <router-link to="/user-register">Create user account</router-link>
      </p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebaseConfig';

export default {
  name: 'Login',
  setup() {
    const email = ref('');
    const password = ref('');
    const error = ref('');
    const isLoading = ref(false);
    const router = useRouter();
    let authUnsubscribe = null;

    onMounted(() => {
      authUnsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              const role = userDoc.data().role;
              router.push(role === 'admin' ? '/admin-dashboard' : '/user-dashboard');
            }
          } catch (err) {
            console.error('Error checking user role:', err);
          }
        }
      });
    });

    onBeforeUnmount(() => {
      if (authUnsubscribe) {
        authUnsubscribe();
      }
    });

    const loginWithEmail = async () => {
      if (isLoading.value) return;
      isLoading.value = true;
      error.value = '';
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value);
        sessionStorage.setItem('explicitLogin', 'true');
        await redirectBasedOnRole(userCredential.user.uid);
      } catch (err) {
        error.value = getFriendlyError(err.code);
      } finally {
        isLoading.value = false;
      }
    };

    const loginWithGoogle = async () => {
      if (isLoading.value) return;
      isLoading.value = true;
      error.value = '';
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        
        sessionStorage.setItem('explicitLogin', 'true');
        
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (!userDoc.exists()) {
          await setDoc(doc(db, 'users', user.uid), {
            email: user.email,
            displayName: user.displayName,
            role: 'user',
            createdAt: new Date().toISOString()
          });
        }
        
        await redirectBasedOnRole(user.uid);
      } catch (err) {
        console.error('Google sign-in error:', err);
        error.value = getFriendlyError(err.code);
      } finally {
        isLoading.value = false;
      }
    };

    const redirectBasedOnRole = async (uid) => {
      try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          const role = userDoc.data().role;
          router.push(role === 'admin' ? '/admin-dashboard' : '/user-dashboard');
        } else {
          error.value = 'User role not found';
          await auth.signOut();
        }
      } catch (err) {
        console.error('Error checking user role:', err);
        error.value = 'Error checking user role';
        await auth.signOut();
      }
    };

    const getFriendlyError = (code) => {
      const errorMessages = {
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/invalid-email': 'Please enter a valid email.',
        'auth/too-many-requests': 'Too many attempts. Try again later.',
        'auth/popup-closed-by-user': 'Sign-in popup was closed before completing the sign-in.',
        'auth/cancelled-popup-request': 'Sign-in popup was cancelled.',
        'auth/popup-blocked': 'Sign-in popup was blocked by the browser.',
        'auth/account-exists-with-different-credential': 'An account already exists with the same email address but different sign-in credentials.',
        'auth/network-request-failed': 'Network error. Please check your internet connection.',
        'auth/operation-not-allowed': 'Google sign-in is not enabled. Please contact support.',
      };
      return errorMessages[code] || 'An error occurred. Please try again.';
    };

    return {
      email,
      password,
      error,
      isLoading,
      loginWithEmail,
      loginWithGoogle,
    };
  },
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
  padding: 20px;
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 420px;
  backdrop-filter: blur(8px);
}

.login-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.login-header h1 {
  font-size: 2rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.75rem;
}

.login-header p {
  color: #7f8c8d;
  font-size: 1rem;
}

.login-form {
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

.login-button {
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

.login-button:hover {
  background: #2980b9;
}

.login-button:disabled {
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

.register-link {
  margin-top: 2rem;
  text-align: center;
  color: #7f8c8d;
  font-size: 0.9rem;
}

.register-link a {
  color: #3498db;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.register-link a:hover {
  color: #2980b9;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
