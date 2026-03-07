import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import { auth } from '../services/firebase';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/RegisterView.vue')
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/ProfileView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('../views/customer/HomeView.vue'),
    meta: { requiresAuth: true, customerOnly: true }
  },
  {
    path: '/restaurant/:id',
    name: 'RestaurantDetail',
    component: () => import('../views/customer/RestaurantDetailView.vue'),
    meta: { requiresAuth: true, customerOnly: true }
  },
  {
    path: '/restaurant/:id/menu',
    name: 'Menu',
    component: () => import('../views/customer/MenuView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/my-queue',
    name: 'QueueStatus',
    component: () => import('../views/customer/QueueStatusView.vue'),
    meta: { requiresAuth: true, customerOnly: true }
  },
  {
    path: '/cart',
    name: 'Cart',
    component: () => import('../views/customer/CartView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/staff/dashboard',
    name: 'StaffDashboard',
    component: () => import('../views/staff/StaffDashboard.vue'),
    meta: { requiresAuth: true, staffOnly: true }
  },
  {
    path: '/staff/scanner',
    name: 'StaffScanner',
    component: () => import('../views/staff/ScannerView.vue'),
    meta: { requiresAuth: true, staffOnly: true }
  },
  {
    path: '/staff/management',
    name: 'StaffManagement',
    component: () => import('../views/staff/RestaurantEditView.vue'),
    meta: { requiresAuth: true, staffOnly: true }
  },
  {
    path: '/staff/tables',
    name: 'TableManagement',
    component: () => import('../views/staff/TableListView.vue'),
    meta: { requiresAuth: true, staffOnly: true }
  },
  {
    path: '/staff/menu',
    name: 'MenuManagement',
    component: () => import('../views/staff/MenuListView.vue'),
    meta: { requiresAuth: true, staffOnly: true }
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

// Navigation guard
router.beforeEach(async (to, _from, next) => {
  const requiresAuth = to.meta.requiresAuth;
  const user = auth.currentUser;

  if (requiresAuth && !user) {
    return next('/login');
  }

  // If user is logged in, check role for redirection
  if (user) {
    // We need the userStore to check profile role
    // Dynamic import to avoid circular dependency if any
    const { useUserStore } = await import('../stores/userStore');
    const userStore = useUserStore();

    // Wait for profile to load if it's still loading
    if (userStore.loading) {
      // Small delay or recursive call could be needed, but usually initialize() is called in main.ts
      // For simplicity, we assume profile is being fetched.
    }

    const role = userStore.profile?.role;

    // 1. If Admin/Staff tries to access customer-only pages (like Home), redirect to Staff Dashboard
    if (to.meta.customerOnly && (role === 'admin' || role === 'staff')) {
      return next('/staff/dashboard');
    }

    // 2. If Customer tries to access staff-only pages, redirect to Home
    if (to.meta.staffOnly && role === 'customer') {
      return next('/home');
    }
  }

  next();
});

export default router;


