```vue
<template>
  <router-view v-if="isAuthInitialized"></router-view>
  <div v-else class="loading-screen">
    <div class="spinner"></div>
    <p>Loading...</p>
  </div>
</template>

<script>
import { auth } from './firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { useRouter } from 'vue-router';
import { ref, onMounted } from 'vue';

export default {
  setup() {
    const router = useRouter();
    const isAuthInitialized = ref(false);
    
    onMounted(() => {
      // Listen for auth state changes
      auth.onAuthStateChanged(async (user) => {
        if (user) {
          try {
            // Check user role
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              const role = userDoc.data().role;
              const currentPath = router.currentRoute.value.path;
              
              // Only redirect if we're on the login page or root
              if (currentPath === '/login' || currentPath === '/') {
                // Check if user explicitly logged in
                const isExplicitLogin = sessionStorage.getItem('explicitLogin') === 'true';
                if (isExplicitLogin) {
                  if (role === 'admin') {
                    router.push('/admin-dashboard');
                  } else if (role === 'user') {
                    router.push('/user-dashboard');
                  }
                } else {
                  // If not explicit login, sign out
                  await auth.signOut();
                  router.push('/login');
                }
              }
            }
          } catch (error) {
            console.error('Error checking user role:', error);
          }
        } else {
          // Clear explicit login flag when signed out
          sessionStorage.removeItem('explicitLogin');
          
          // If no user and not on login or registration pages, redirect to login
          const currentPath = router.currentRoute.value.path;
          const publicPaths = ['/login', '/register', '/user-register', '/admin-register'];
          if (!publicPaths.includes(currentPath)) {
            router.push('/login');
          }
        }
        // Set initialized after auth state is processed
        isAuthInitialized.value = true;
      });
    });

    return {
      isAuthInitialized
    };
  }
};
</script>

<style>
/* Global styles */
body {
  margin: 0;
  padding: 0;
  font-family: 'Lato', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  min-height: 100vh;
}

.loading-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
  color: white;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>