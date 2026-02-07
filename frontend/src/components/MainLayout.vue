<template>
  <div class="main-layout">
    <Header />
    <div class="content-wrapper">
      <Sidebar />
      <main class="main-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import Header from './Header.vue';
import Sidebar from './Sidebar.vue';

const authStore = useAuthStore();

onMounted(() => {
  authStore.loadAuthFromStorage();
});
</script>

<style scoped>
.main-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.content-wrapper {
  display: flex;
  flex: 1;
}

.main-content {
  flex: 1;
  padding: 2rem;
  background: #f5f5f5;
  overflow-y: auto;
}
</style>
