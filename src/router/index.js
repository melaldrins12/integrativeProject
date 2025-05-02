import { createRouter, createWebHistory } from 'vue-router';
import { auth } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Import Login component directly to ensure it's available immediately
import Login from '../components/Login.vue';

// Lazy load components for better initial load time
const routes = [
  { 
    path: '/', 
    redirect: '/login' 
  },
  { 
    path: '/login', 
    component: () => import('../components/Login.vue'),
    meta: { requiresAuth: false } 
  },
  { 
    path: '/user-register', 
    component: () => import('../components/UserRegistration.vue'),
    meta: { requiresAuth: false } 
  },
  { 
    path: '/admin-register', 
    component: () => import('../components/AdminRegistration.vue'),
    meta: { requiresAuth: false } 
  },
  {
    path: '/admin-dashboard',
    component: () => import('../components/AdminDashboard.vue'),
    meta: { requiresAuth: true, role: 'admin' },
  },
  {
    path: '/user-dashboard',
    component: () => import('../components/UserDashboard.vue'),
    meta: { requiresAuth: true, role: 'user' },
  },
  { 
    path: '/:pathMatch(.*)*', 
    redirect: '/login' 
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
});

// Cache for user roles to prevent unnecessary Firestore reads
const roleCache = new Map();

// Navigation guard for role-based access
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const requiredRole = to.meta.role;

  // If route doesn't require auth, allow access
  if (!requiresAuth) {
    next();
    return;
  }

  // Get current user
  const user = auth.currentUser;

  // If no user and route requires auth, redirect to login
  if (!user) {
    next('/login');
    return;
  }

  try {
    // Check role cache first
    let role = roleCache.get(user.uid);
    
    if (!role) {
      // If not in cache, fetch from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        role = userDoc.data().role;
        // Cache the role
        roleCache.set(user.uid, role);
      } else {
        // No user document, sign out and redirect to login
        await auth.signOut();
        next('/login');
        return;
      }
    }

    // Check if user has required role
    if (role === requiredRole) {
      next(); // Allow access if role matches
    } else {
      // Redirect to appropriate dashboard based on role
      next(role === 'admin' ? '/admin-dashboard' : '/user-dashboard');
    }
  } catch (error) {
    console.error('Error checking user role:', error);
    // On error, allow the current navigation to proceed
    next();
  }
});

// Clear role cache on sign out
auth.onAuthStateChanged((user) => {
  if (!user) {
    roleCache.clear();
  }
});

export default router;