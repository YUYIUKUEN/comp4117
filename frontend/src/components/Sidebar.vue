<template>
  <aside
    v-if="isAuthenticated"
    class="sidebar"
  >
    <nav class="nav-menu">
      <router-link
        to="/dashboard"
        class="nav-item"
      >
        Dashboard
      </router-link>
      <router-link
        to="/topics"
        class="nav-item"
      >
        Topics
      </router-link>
      <router-link
        v-if="isStudent"
        to="/applications"
        class="nav-item"
      >
        Applications
      </router-link>
      <router-link
        to="/submissions"
        class="nav-item"
      >
        Submissions
      </router-link>
      <router-link
        v-if="isAdmin"
        to="/admin"
        class="nav-item"
      >
        Admin Panel
      </router-link>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '@/stores/authStore';

const authStore = useAuthStore();

const isAuthenticated = computed(() => authStore.isAuthenticated);
const isStudent = computed(() => authStore.userRole === 'Student');
const isAdmin = computed(() => authStore.userRole === 'Admin');
</script>

<style scoped>
.sidebar {
  width: 240px;
  background: #34495e;
  color: white;
  padding: 2rem 0;
  border-right: 1px solid #2c3e50;
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.nav-item {
  padding: 1rem 1.5rem;
  color: white;
  text-decoration: none;
  display: block;
  transition: background-color 0.3s;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background-color: #2c3e50;
}

.nav-item.router-link-active {
  background-color: #3498db;
  border-left-color: #e74c3c;
}
</style>
