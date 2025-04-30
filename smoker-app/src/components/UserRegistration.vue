<template>
    <div class="min-h-screen flex items-center justify-center bg-gray-100">
      <div class="bg-white p-8 rounded-lg shadow-lg w-full max-w-md animate-fade-in">
        <h2 class="text-2xl font-bold mb-6 text-center">User Registration</h2>
  
        <!-- Email/Password Registration Form -->
        <form @submit.prevent="registerWithEmail" class="space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter your password"
            />
          </div>
          <button
            type="submit"
            :disabled="isLoading"
            :class="['w-full py-2 px-4 rounded-md focus:outline-none focus:ring-2', isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white']"
          >
            <span v-if="isLoading">
              <div class="spinner"></div>
            </span>
            <span v-else>Register as User</span>
          </button>
        </form>
  
        <!-- Google Sign-In Button -->
        <div class="mt-6">
          <button
            @click="registerWithGoogle"
            :disabled="isLoading"
            :class="['w-full py-2 px-4 rounded-md flex items-center justify-center focus:outline-none focus:ring-2', isLoading ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white']"
          >
            <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12.24 10.667H7.843v2.667h4.397c-.413 1.467-1.733 2.667-3.563 2.667-2.067 0-3.733-1.667-3.733-3.733s1.667-3.733 3.733-3.733c.933 0 1.8.333 2.467 1l1.867-1.867C11.067 6.267 9.267 5.333 7.377 5.333c-3.467 0-6.267 2.8-6.267 6.267s2.8 6.267 6.267 6.267c3.6 0 6-2.533 6-6.267v-.933z"
              />
            </svg>
            <span v-if="isLoading">
              <div class="spinner"></div>
            </span>
            <span v-else>Register with Google</span>
          </button>
        </div>
  
        <!-- Error Message -->
        <p v-if="error" class="mt-4 text-red-600 text-center animate-fade-in">{{ error }}</p>
  
        <!-- Login Link -->
        <p class="mt-4 text-center">
          Already have an account? <router-link to="/login" class="text-indigo-600 hover:underline">Login</router-link>
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
    GoogleAuthProvider,
  } from 'firebase/auth';
  import { doc, getDoc, setDoc } from 'firebase/firestore';
  import { auth, db } from '../firebaseConfig';
  
  export default {
    name: 'UserRegistration',
    setup() {
      const email = ref('');
      const password = ref('');
      const error = ref('');
      const isLoading = ref(false);
      const router = useRouter();
      const googleProvider = new GoogleAuthProvider();
  
      const registerWithEmail = async () => {
        if (isLoading.value) return;
        isLoading.value = true;
        error.value = '';
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value);
          const user = userCredential.user;
          await setDoc(doc(db, 'users', user.uid), {
            email: user.email,
            role: 'user',
            createdAt: new Date(),
          });
          router.push('/user-dashboard');
        } catch (err) {
          error.value = getFriendlyError(err.code);
        } finally {
          isLoading.value = false;
        }
      };
  
      const registerWithGoogle = async () => {
        if (isLoading.value) return;
        isLoading.value = true;
        error.value = '';
        try {
          const userCredential = await signInWithPopup(auth, googleProvider);
          const user = userCredential.user;
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (!userDoc.exists()) {
            await setDoc(doc(db, 'users', user.uid), {
              email: user.email,
              role: 'user',
              createdAt: new Date(),
            });
          }
          router.push('/user-dashboard');
        } catch (err) {
          error.value = getFriendlyError(err.code);
        } finally {
          isLoading.value = false;
        }
      };
  
      const getFriendlyError = (code) => {
        const errorMessages = {
          'auth/email-already-in-use': 'This email is already registered.',
          'auth/weak-password': 'Password must be at least 6 characters.',
          'auth/invalid-email': 'Please enter a valid email.',
          'auth/account-exists-with-different-credential': 'This account exists with a different sign-in method.',
        };
        return errorMessages[code] || 'An error occurred. Please try again.';
      };
  
      return {
        email,
        password,
        error,
        isLoading,
        registerWithEmail,
        registerWithGoogle,
      };
    },
  };
  </script>
  
  <style scoped>
  @import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;500;600;700&display=swap');
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .spinner {
    width: 20px;
    height: 20px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #63b3ed;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  .animate-fade-in {
    animation: fadeIn 0.6s ease-out forwards;
  }
  </style>
  