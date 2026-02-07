import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { authGuard, roleGuard } from './guards';
import { useAuthStore } from '@/stores/authStore';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('../views/ForgotPassword.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/reset-password/:token',
    name: 'ResetPassword',
    component: () => import('../views/ResetPassword.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/DashboardStudent.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/topics',
    name: 'TopicBrowse',
    component: () => import('../pages/TopicBrowse.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/applications',
    name: 'Applications',
    component: () => import('../pages/MatchingWizard.vue'),
    meta: { requiresAuth: true, roles: ['Student'] }
  },
  {
    path: '/submissions',
    name: 'Submissions',
    component: () => import('../pages/SubmissionDetail.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: () => import('../pages/AdminOverview.vue'),
    meta: { requiresAuth: true, roles: ['Admin'] }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/Login.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Apply auth guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  authStore.loadAuthFromStorage();

  const requiresAuth = to.meta.requiresAuth;
  const requiredRoles = to.meta.roles as string[] | undefined;
  const isAuthenticated = authStore.isAuthenticated;
  const userRole = authStore.userRole;

  // Check auth requirement
  if (requiresAuth && !isAuthenticated) {
    next('/login');
    return;
  }

  // Check role requirement
  if (requiredRoles && requiredRoles.length > 0) {
    if (!requiredRoles.includes(userRole)) {
      next('/dashboard');
      return;
    }
  }

  next();
});

export default router;
