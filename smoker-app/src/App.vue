```vue
<template>
  <div v-if="loading" class="min-h-screen flex items-center justify-center">
    <p class="mt-4 text-center">
  Don't have an account? 
  <router-link to="/register" class="text-indigo-600 hover:underline">Register as Admin</router-link> or 
  <router-link to="/user-register" class="text-indigo-600 hover:underline">Register as User</router-link>
</p>
  </div>
  <router-view v-else></router-view>
</template>

<script>
import { auth } from './firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { useRouter } from 'vue-router';

export default {
  data() {
    return {
      loading: true,
    };
  },
  created() {
    const router = useRouter();
    auth.onAuthStateChanged(async (user) => {
      this.loading = false;
      if (user) {
        // Redirect based on role
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const role = userDoc.data().role;
          if (role === 'admin') {
            router.push('/admin-dashboard');
          } else if (role === 'user') {
            router.push('/user-dashboard');
          } else {
            await auth.signOut();
            router.push('/login');
          }
        } else {
          await auth.signOut();
          router.push('/login');
        }
      } else {
        // Unauthenticated users go to login
        router.push('/login');
      }
    });
  },
};
</script>