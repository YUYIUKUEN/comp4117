<template>
  <div class="main-layout">
    <Header />
    <div class="content-wrapper">
      <SidebarDemo v-if="userRole === 'demo'" :current="currentRoute" />
      <SidebarStudent v-else-if="userRole === 'student'" :current="currentRoute" />
      <SidebarAdmin v-else-if="userRole === 'admin'" :role="userRole" />
      <SidebarSupervisor v-else-if="userRole === 'supervisor'" :current="currentRoute" />
      <Sidebar v-else />
      <main class="main-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import Header from './Header.vue';
import Sidebar from './Sidebar.vue';
import SidebarDemo from './layout/SidebarDemo.vue';
import SidebarStudent from './layout/SidebarStudent.vue';
import SidebarAdmin from './layout/SidebarAdmin.vue';
import SidebarSupervisor from './layout/SidebarSupervisor.vue';

const authStore = useAuthStore();
const route = useRoute();

const userRole = computed(() => {
  const role = authStore.userRole;
  if (!role) return null;
  return role.toLowerCase();
});

const currentRoute = computed(() => {
  const path = route.path;
  // Student routes
  if (path === '/dashboard') return 'home';
  if (path === '/topics' || path.startsWith('/topic/')) return 'topic';
  if (path === '/submissions') return 'submissions';
  if (path === '/feedback') return 'feedback';
  if (path === '/archive') return 'archive';
  if (path === '/reminders') return 'reminders';
  // Supervisor routes
  if (path === '/supervisor/dashboard') return 'sup-dashboard';
  if (path === '/supervisor/overview') return 'overview';
  if (path === '/supervisor/topics') return 'sup-topics';
  if (path === '/supervisor/feedback') return 'feedback';
  if (path === '/supervisor/activity') return 'activity';
  // Admin routes
  if (path === '/admin') return 'admin';
  if (path === '/admin/students-cohorts') return 'admin-cohorts';
  return null;
});

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
