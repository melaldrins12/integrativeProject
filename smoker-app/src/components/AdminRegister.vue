<template>
    <div class="min-h-screen flex items-center justify-center bg-gray-100">
      <div class="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 class="text-2xl font-bold mb-6 text-center">Register</h2>
        
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
            class="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Register with Email
          </button>
        </form>
  
        <!-- Google Sign-In Button -->
        <div class="mt-6">
          <button
            @click="registerWithGoogle"
            class="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center justify-center"
          >
            <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12.24 10.667H7.843v2.667h4.397c-.413 1.467-1.733 2.667-3.563 2.667-2.067 0-3.733-1.667-3.733-3.733s1.667-3.733 3.733-3.733c.933 0 1.8.333 2.467 1l1.867-1.867C11.067 6.267 9.267 5.333 7.377 5.333c-3.467 0-6.267 2.8-6.267 6.267s2.8 6.267 6.267 6.267c3.6 0 6-2.533 6-6.267v-.933z"
              />
            </svg>
            Register with Google
          </button>
        </div>
  
        <!-- Error Message -->
        <p v-if="error" class="mt-4 text-red-600 text-center">{{ error }}</p>
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
  import { doc, setDoc } from 'firebase/firestore';
  import { auth, db } from '../firebaseConfig';
  
  export default {
    name: 'Register',
    setup() {
      const email = ref('');
      const password = ref('');
      const error = ref('');
      const router = useRouter();
      const googleProvider = new GoogleAuthProvider();
  
     // In Register.vue (relevant parts)
const registerWithEmail = async () => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value);
    const user = userCredential.user;
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      role: 'admin', // Sets role to 'admin'
      createdAt: new Date(),
    });
    router.push('/dashboard'); // Needs fixing (no /dashboard route)
  } catch (err) {
    error.value = err.message;
  }
};

const registerWithGoogle = async () => {
  try {
    const userCredential = await signInWithPopup(auth, googleProvider);
    const user = userCredential.user;
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      role: 'admin', // Sets role to 'admin'
      createdAt: new Date(),
    });
    router.push('/dashboard'); // Needs fixing (no /dashboard route)
  } catch (err) {
    error.value = err.message;
  }
};
  
      return {
        email,
        password,
        error,
        registerWithEmail,
        registerWithGoogle,
      };
    },
  };
  </script>
  
  <style scoped>
  /* Tailwind CSS is used via CDN or installed in the project */
  </style>