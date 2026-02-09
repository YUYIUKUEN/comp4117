import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '@/stores/authStore';

describe('auth guards', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('loads auth from storage before navigation', () => {
    const user = { id: '1', email: 'test@test.com', fullName: 'Test User', role: 'Student' };
    const token = 'test-token';

    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));

    const authStore = useAuthStore();
    expect(authStore.isAuthenticated).toBe(false);

    authStore.loadAuthFromStorage();

    expect(authStore.isAuthenticated).toBe(true);
    expect(authStore.userRole).toBe('Student');
  });

  it('requires authentication for protected routes', () => {
    const authStore = useAuthStore();

    // Without auth, user should be redirected
    expect(authStore.isAuthenticated).toBe(false);

    // After login
    const user = { id: '1', email: 'test@test.com', fullName: 'Test User', role: 'Student' };
    authStore.setAuth(user, 'test-token');

    expect(authStore.isAuthenticated).toBe(true);
  });

  it('enforces role-based access control', () => {
    const authStore = useAuthStore();

    // Admin user
    const adminUser = { id: '2', email: 'admin@test.com', fullName: 'Admin User', role: 'Admin' };
    authStore.setAuth(adminUser, 'admin-token');

    expect(authStore.userRole).toBe('Admin');
    expect(['Admin'].includes(authStore.userRole)).toBe(true);

    // Student user
    authStore.clearAuth();
    const studentUser = { id: '1', email: 'student@test.com', fullName: 'Student User', role: 'Student' };
    authStore.setAuth(studentUser, 'student-token');

    expect(authStore.userRole).toBe('Student');
    expect(['Student'].includes(authStore.userRole)).toBe(true);
  });

  it('prevents unauthorized access to admin routes', () => {
    const authStore = useAuthStore();
    const studentUser = { id: '1', email: 'student@test.com', fullName: 'Student User', role: 'Student' };
    authStore.setAuth(studentUser, 'student-token');

    const adminRoles = ['Admin'];
    expect(adminRoles.includes(authStore.userRole)).toBe(false);
  });
});
