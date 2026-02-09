import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '@/stores/authStore';

describe('authStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('initializes with empty state', () => {
    const authStore = useAuthStore();
    expect(authStore.user).toBeNull();
    expect(authStore.token).toBeNull();
    expect(authStore.isAuthenticated).toBe(false);
    expect(authStore.userRole).toBe('Guest');
  });

  it('sets auth with user and token', () => {
    const authStore = useAuthStore();
    const user = { id: '1', email: 'test@test.com', fullName: 'Test User', role: 'Student' };
    const token = 'test-token';

    authStore.setAuth(user, token);

    expect(authStore.user).toEqual(user);
    expect(authStore.token).toBe(token);
    expect(authStore.isAuthenticated).toBe(true);
    expect(authStore.userRole).toBe('Student');
  });

  it('persists token and user to localStorage on setAuth', () => {
    const authStore = useAuthStore();
    const user = { id: '1', email: 'test@test.com', fullName: 'Test User', role: 'Student' };
    const token = 'test-token';

    authStore.setAuth(user, token);

    expect(localStorage.getItem('authToken')).toBe(token);
    expect(JSON.parse(localStorage.getItem('user') || '{}')).toEqual(user);
  });

  it('clears auth state', () => {
    const authStore = useAuthStore();
    const user = { id: '1', email: 'test@test.com', fullName: 'Test User', role: 'Student' };
    const token = 'test-token';

    authStore.setAuth(user, token);
    authStore.clearAuth();

    expect(authStore.user).toBeNull();
    expect(authStore.token).toBeNull();
    expect(authStore.isAuthenticated).toBe(false);
    expect(localStorage.getItem('authToken')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('loads auth from localStorage', () => {
    const user = { id: '1', email: 'test@test.com', fullName: 'Test User', role: 'Admin' };
    const token = 'stored-token';

    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));

    const authStore = useAuthStore();
    authStore.loadAuthFromStorage();

    expect(authStore.user).toEqual(user);
    expect(authStore.token).toBe(token);
    expect(authStore.isAuthenticated).toBe(true);
    expect(authStore.userRole).toBe('Admin');
  });

  it('handles invalid stored user data gracefully', () => {
    const token = 'test-token';

    localStorage.setItem('authToken', token);
    localStorage.setItem('user', 'invalid-json');

    const authStore = useAuthStore();
    authStore.loadAuthFromStorage();

    expect(authStore.user).toBeNull();
    expect(authStore.token).toBeNull();
    expect(authStore.isAuthenticated).toBe(false);
  });
});
