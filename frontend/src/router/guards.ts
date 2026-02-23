import { useAuthStore } from '@/stores/authStore';

export const authGuard = (to, from, next) => {
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

export const roleGuard = (requiredRoles = []) => {
  return (to, from, next) => {
    const authStore = useAuthStore();
    
    if (!authStore.isAuthenticated) {
      next('/login');
      return;
    }
    
    if (requiredRoles.length === 0 || requiredRoles.includes(authStore.userRole)) {
      next();
    } else {
      next('/dashboard');
    }
  };
};

