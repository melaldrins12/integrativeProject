// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import Login from '../components/Login.vue';
import Dashboard from '../components/Dashboard.vue';
import { auth } from '../firebaseConfig';

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    beforeEnter: (to, from, next) => {
      auth.onAuthStateChanged((user) => {
        if (user) {
          next();
        } else {
          next('/login');
        }
      });
    }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;