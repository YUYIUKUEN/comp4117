<script setup lang="ts">
import { useRoute } from 'vue-router'
import HeaderShell from './components/layout/HeaderShell.vue'

const route = useRoute()
</script>

<template>
  <div class="min-h-screen flex flex-col bg-slate-50 text-slate-900">
    <!-- Shared header with role switcher (hidden on login) -->
    <HeaderShell v-if="route.path !== '/'" />

    <!-- Main content -->
    <main class="flex-1">
      <RouterView />
    </main>
  </div>
</template>
