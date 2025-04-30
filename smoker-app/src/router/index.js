
import { createRouter, createWebHistory } from 'vue-router';
import AdminRegister from '../components/AdminRegister.vue';
import UserRegistration from '../components/UserRegistration.vue';
import Login from '../components/Login.vue';
import AdminDashboard from '../components/AdminDashboard.vue';
import UserDashboard from '../components/UserDashboard.vue';
import { auth } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login },
  { path: '/register', component: AdminRegister }, // Admin registration
  { path: '/user-register', component: UserRegistration }, // User registration
  {
    path: '/admin-dashboard',
    component: AdminDashboard,
    meta: { requiresAuth: true, role: 'admin' },
  },
  {
    path: '/user-dashboard',
    component: UserDashboard,
    meta: { requiresAuth: true, role: 'user' },
  },
  { path: '/:pathMatch(.*)*', redirect: '/login' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation guard for role-based access
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const requiredRole = to.meta.role;

  const user = auth.currentUser;

  if (requiresAuth && !user) {
    // Redirect unauthenticated users to login
    next('/login');
  } else if (requiresAuth && user) {
    // Check user role
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      const role = userDoc.data().role;
      if (role === requiredRole) {
        next(); // Allow access if role matches
      } else {
        // Redirect to appropriate dashboard or login
        next(role === 'admin' ? '/admin-dashboard' : '/user-dashboard');
      }
    } else {
      // No user document, sign out and redirect to login
      await auth.signOut();
      next('/login');
    }
  } else {
    // Allow access to public routes (e.g., /login, /register, /user-register)
    next();
  }
});

export default router;