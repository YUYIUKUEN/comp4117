import { defineStore } from 'pinia';
import { ref } from 'vue';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export const useUserStore = defineStore('user', () => {
  const users = ref<User[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchUsers = async () => {
    loading.value = true;
    error.value = null;

    try {
      // Placeholder for API integration
      // const response = await apiClient.get('/users');
      // users.value = response.data;
      users.value = [];
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch users';
    } finally {
      loading.value = false;
    }
  };

  return {
    users,
    loading,
    error,
    fetchUsers
  };
});
