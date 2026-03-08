import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';

// 1. นำเข้า getAuth และ onAuthStateChanged เพื่อดึง Session
import { getAuth, onAuthStateChanged } from 'firebase/auth';
// 2. นำเข้า getUserProfile จาก Service เพื่อเช็คสิทธิ์ (Role)
import { getUserProfile } from '../services/authService';
// 3. นำเข้า Layout ของ Navbar ลูกค้า
import CustomerTabs from '../views/customer/CustomerTabs.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    component: () => import('@/views/Welcome.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue')
  },
  {
    path: '/select-role',
    component: () => import('@/views/SelectRole.vue')
  },

  // ==========================================
  // กลุ่มของลูกค้า (มี Navbar ด้านล่าง)
  // ==========================================
  {
    path: '/tabs',
    component: CustomerTabs,
    meta: { requiresAuth: true },
    children: [
      {
        path: '/home', // ใช้ /home ตรงๆ เพื่อให้ URL สวยงามและเข้าถึงง่าย
        name: 'Home',
        component: () => import('../views/customer/HomeView.vue'),
        meta: { customerOnly: true }
      },
      {
        path: '/profile',
        name: 'Profile',
        component: () => import('../views/ProfileView.vue'),
      },
      {
        path: '/my-queue',
        name: 'QueueStatus',
        component: () => import('../views/customer/QueueStatusView.vue'),
        meta: { customerOnly: true }
      },
      {
        path: '/cart',
        name: 'Cart',
        component: () => import('../views/customer/CartView.vue'),
      },
      {
        path: '/notifications',
        name: 'Notifications',
        component: () => import('../views/customer/NotificationsView.vue'),
      }
    ]
  },

  // ==========================================
  // หน้ารายละเอียด (ไม่มี Navbar ด้านล่าง จะได้จอใหญ่ๆ)
  // ==========================================
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
    path: '/restaurant/:id/cart',
    name: 'RestaurantCart',
    component: () => import('../views/customer/RestaurantCartView.vue'),
    meta: { requiresAuth: true }
  },

  // ==========================================
  // กลุ่มของพนักงาน (ไม่มี Navbar ของลูกค้า)
  // ==========================================
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

// ==========================================
// ฟังก์ชันรอให้ Firebase โหลด Session เสร็จก่อน
// ==========================================
const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const removeListener = onAuthStateChanged(
      getAuth(),
      (user) => {
        removeListener();
        resolve(user);
      },
      reject
    );
  });
};

// ==========================================
// Navigation guard (ยามเฝ้าประตู)
// ==========================================
router.beforeEach(async (to, _from, next) => {
  const requiresAuth = to.meta.requiresAuth;
  
  // 1. ดึงข้อมูล User จาก Firebase อย่างปลอดภัย
  const user: any = await getCurrentUser();

  // 2. ถ้าหน้าที่กำลังจะไป "ต้องล็อกอิน" แต่ "ยังไม่ได้ล็อกอิน" -> เตะไป Login
  if (requiresAuth && !user) {
    return next('/login');
  }

  // 3. ถ้าล็อกอินอยู่แล้ว ให้ทำการเช็คสิทธิ์ (Role)
  if (user) {
    // ดึงข้อมูล Role จาก Firestore
    const profileRes = await getUserProfile(user.uid);
    // สมมติว่าในระบบลูกค้าทั่วไปชื่อ 'user' หรือ 'customer'
    const role = profileRes.success && profileRes.data ? profileRes.data.role : 'customer';

    // จัดการการเตะ (Redirect) เมื่อผู้ใช้ที่ล็อกอินแล้ว พยายามเข้าหน้าแรก หรือ หน้าล็อกอิน
    if (to.path === '/' || to.path === '/login' || to.path === '/register') {
      if (role === 'admin' || role === 'staff') {
        return next('/staff/dashboard');
      } else {
        return next('/home');
      }
    }

    // กฎสำหรับแอดมิน/พนักงาน: ห้ามเข้าหน้าของลูกค้า
    if (to.meta.customerOnly && (role === 'admin' || role === 'staff')) {
      return next('/staff/dashboard');
    }

    // กฎสำหรับลูกค้า: ห้ามเข้าหน้าของพนักงาน
    if (to.meta.staffOnly && (role === 'customer' || role === 'user')) {
      return next('/home');
    }
  }

  // ผ่านเงื่อนไขทั้งหมด ให้ไปหน้าที่ต้องการได้
  next();
});

export default router;