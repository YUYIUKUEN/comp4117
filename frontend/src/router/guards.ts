import type { RouteLocationNormalized, NavigationGuardNext } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';

export const authGuard = (to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
  const authStore = useAuthStore();
  
  if (to.meta.requiresAuth === false) {
    // Public routes (login, register, etc)
    next();
  } else if (authStore.isAuthenticated) {
    // User is logged in
    next();
  } else {
    // User not logged in, redirect to login
    next('/login');
  }
};

export const roleGuard = (requiredRoles: string[] = []) => {
  return (_to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
    const authStore = useAuthStore();
    
    if (!authStore.isAuthenticated) {
      next('/login');
      return;
    }
    
    if (requiredRoles.length === 0 || requiredRoles.includes(authStore.userRole as string)) {
      next();
    } else {
      next('/dashboard');
    }
  };
};

