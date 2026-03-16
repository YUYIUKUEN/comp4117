<template>
  <header class="header" :style="{ backgroundImage: 'url(/hkbu-banner.webp)' }">
    <div class="header-overlay"></div>
    <div class="header-content">
      <div class="header-left">
        <h1>FYP Management System</h1>
      </div>
      <div class="header-right">
        <span v-if="user" class="welcome-text">Welcome, {{ user.fullName }}</span>
        <button
          class="logout-btn"
          @click="handleLogout"
        >
          Logout
        </button>
      </div>
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

const handleLogout = () => {
  // Clear auth and redirect immediately
  authStore.clearAuth();
  router.push('/login');
  // Fire backend logout in background (don't await)
  authService.logout().catch(() => {});
};
</script>

<style scoped>
.header {
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  color: white;
  padding: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  position: relative;
  min-height: 200px;
}

.header-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1;
}

.header-content {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 2rem;
  gap: 2rem;
}

.header-left {
  flex: 1;
}

h1 {
  margin: 0;
  font-size: 2.5rem;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  letter-spacing: 0.5px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  white-space: nowrap;
}

.welcome-text {
  font-size: 1.1rem;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
  font-weight: 500;
}

.logout-btn {
  background: rgba(231, 76, 60, 0.9);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  font-size: 1rem;
  font-weight: 600;
}

.logout-btn:hover {
  background: rgba(192, 57, 43, 0.9);
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    text-align: center;
    padding: 1.5rem;
  }

  h1 {
    font-size: 1.8rem;
  }

  .header-right {
    width: 100%;
    justify-content: center;
  }
}
</style>
