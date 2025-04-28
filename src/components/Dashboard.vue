<template>
    <div class="dashboard">
      <h1>Dashboard</h1>
      <div v-if="user">
        <p>Welcome, {{ user.email }}!</p>
      </div>
      <div v-else>
        <p>Loading...</p>
      </div>
      <button @click="signOut">Sign Out</button>
    </div>
  </template>
  
  <script>
  import { auth } from '../firebaseConfig';
  import { signOut } from '../services/auth';
  
  export default {
    data() {
      return {
        user: null
      };
    },
    created() {
      auth.onAuthStateChanged((user) => {
        this.user = user;
        if (!user) {
          this.$router.push('/login');
        }
      });
    },
    methods: {
      signOut() {
        signOut()
          .then(() => {
            this.$router.push('/login');
          })
          .catch((error) => {
            console.error('Error signing out', error);
          });
      }
    }
  };
  </script>