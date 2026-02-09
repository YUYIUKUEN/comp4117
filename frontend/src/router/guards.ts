import { useAuthStore } from '@/stores/authStore';

export const authGuard = (to, from, next) => {
  const authStore = useAuthStore();
  const token = localStorage.getItem('authToken');

  if (to.meta.requiresAuth) {
    if (!token || !authStore.isAuthenticated) {
      next('/login');
      return;
    }
  }

  next();
};

export const roleGuard = (requiredRoles = []) => {
  return (to, from, next) => {
    const authStore = useAuthStore();

    if (requiredRoles.length === 0) {
      next();
      return;
    }

    if (requiredRoles.includes(authStore.userRole)) {
      next();
    } else {
      next('/dashboard');
    }
  };
};
