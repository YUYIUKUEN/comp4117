<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import MainLayout from './components/MainLayout.vue';
import { useAuthStore } from './stores/authStore';
import { onMounted } from 'vue';

const route = useRoute();
const authStore = useAuthStore();

const isPublicPage = computed(() => {
  const publicPaths = ['/login', '/register', '/forgot-password', '/verify-email'];
  return publicPaths.includes(route.path) || route.path.startsWith('/reset-password');
});

onMounted(() => {
  authStore.loadAuthFromStorage();
});
</script>

<template>
  <div v-if="isPublicPage">
    <router-view />
  </div>
  <MainLayout v-else />
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
  background: #f5f5f5;
  color: #2c3e50;
}
</style>
