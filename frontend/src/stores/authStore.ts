import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);

  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const userRole = computed(() => user.value?.role || 'Guest');

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
        clearAuth();
      }
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
