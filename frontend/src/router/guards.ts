import { useAuthStore } from '@/stores/authStore';

export const authGuard = (to, from, next) => {
  // DEMO MODE: Disable authentication, allow all access
  next();
};

export const roleGuard = (requiredRoles = []) => {
  return (to, from, next) => {
    // DEMO MODE: Disable role-based access control
    next();
  };
};
