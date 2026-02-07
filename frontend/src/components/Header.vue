<template>
  <header class="header">
    <div class="header-left">
      <h1>FYP Management System</h1>
    </div>
    <div class="header-right">
      <span v-if="user">Welcome, {{ user.fullName }}</span>
      <button @click="handleLogout" class="logout-btn">Logout</button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import authService from '@/services/authService';

const router = useRouter();
const authStore = useAuthStore();

const user = computed(() => authStore.user);

const handleLogout = async () => {
  try {
    await authService.logout();
  } catch (err) {
    console.error('Logout error:', err);
  } finally {
    authStore.clearAuth();
    await router.push('/login');
  }
};
</script>

<style scoped>
.header {
  background: #2c3e50;
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h1 {
  margin: 0;
  font-size: 1.5rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logout-btn {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.logout-btn:hover {
  background: #c0392b;
}
</style>
