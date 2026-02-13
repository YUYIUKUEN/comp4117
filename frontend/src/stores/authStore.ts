import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export const useAuthStore = defineStore('auth', () => {
  // DEMO MODE: Initialize with demo user
  const demoUser: User = {
    id: 'demo-user-123',
    email: 'demo@example.com',
    fullName: 'Demo User',
    role: 'Demo'
  };
  const demoToken = 'demo-token-123';

  const user = ref<User | null>(demoUser);
  const token = ref<string | null>(demoToken);

  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const userRole = computed(() => user.value?.role || 'Admin');

  const setAuth = (userData: User, authToken: string) => {
    user.value = userData;
    token.value = authToken;
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const clearAuth = () => {
    user.value = null;
    token.value = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  };

  const loadAuthFromStorage = () => {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        token.value = storedToken;
        user.value = JSON.parse(storedUser);
      } catch (error) {
        // DEMO MODE: Keep demo user on error
        user.value = demoUser;
        token.value = demoToken;
      }
    } else {
      // DEMO MODE: Set demo user if nothing in storage
      user.value = demoUser;
      token.value = demoToken;
    }
  };

  return {
    user,
    token,
    isAuthenticated,
    userRole,
    setAuth,
    clearAuth,
    loadAuthFromStorage
  };
});
