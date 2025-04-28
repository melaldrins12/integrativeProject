// src/main.js
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { auth } from './firebaseConfig';

const app = createApp(App);

app.use(router);

app.mount('#app');

auth.onAuthStateChanged((user) => {
  if (user) {
    router.push('/dashboard');
  } else {
    router.push('/login');
  }
});