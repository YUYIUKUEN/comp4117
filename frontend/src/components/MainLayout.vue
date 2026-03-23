<template>
  <div class="main-layout">
    <Header :is-mobile-sidebar-open="isMobileSidebarOpen" @toggle-mobile-sidebar="isMobileSidebarOpen = !isMobileSidebarOpen" />
    <div class="content-wrapper">
      <!-- Mobile Sidebar Overlay -->
      <div v-if="isMobileSidebarOpen" class="mobile-sidebar-overlay" @click="isMobileSidebarOpen = false"></div>

      <!-- Mobile Sidebar Drawer -->
      <template v-if="userRole">
        <div class="mobile-sidebar-drawer" :class="{ 'open': isMobileSidebarOpen }">
          <div class="mobile-drawer-header">
            <span>Navigation</span>
            <button class="close-btn" @click="isMobileSidebarOpen = false" aria-label="Close navigation menu">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div class="mobile-drawer-content">
            <SidebarDemo v-if="userRole === 'demo'" :current="currentRoute" @navigate="isMobileSidebarOpen = false" />
            <SidebarStudent v-else-if="userRole === 'student'" :current="currentRoute" @navigate="isMobileSidebarOpen = false" />
            <SidebarAdmin v-else-if="userRole === 'admin'" :role="userRole" @navigate="isMobileSidebarOpen = false" />
            <SidebarSupervisor v-else-if="userRole === 'supervisor'" :current="currentRoute" @navigate="isMobileSidebarOpen = false" />
            <Sidebar v-else @navigate="isMobileSidebarOpen = false" />
          </div>
        </div>
      </template>

      <!-- Desktop Sidebar -->
      <div class="desktop-sidebar">
        <SidebarDemo v-if="userRole === 'demo'" :current="currentRoute" />
        <SidebarStudent v-else-if="userRole === 'student'" :current="currentRoute" />
        <SidebarAdmin v-else-if="userRole === 'admin'" :role="userRole" />
        <SidebarSupervisor v-else-if="userRole === 'supervisor'" :current="currentRoute" />
        <Sidebar v-else />
      </div>

      <main ref="mainContent" class="main-content">
        <router-view :key="route.path" />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, watch, ref } from 'vue';
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
const isMobileSidebarOpen = ref(false);

const userRole = computed((): string | undefined => {
  const role = authStore.userRole;
  if (!role) return undefined;
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
  if (path === '/meetings') return 'meetings';
  // Supervisor routes
  if (path === '/supervisor/dashboard') return 'dashboard';
  if (path === '/supervisor/students') return 'students';
  if (path === '/supervisor/topics') return 'topics';
  if (path === '/supervisor/pending-approvals') return 'pending-approvals';
  if (path === '/supervisor/feedback-grading') return 'feedback';
  if (path === '/supervisor/feedback-form') return 'feedback';
  if (path === '/supervisor/feedback') return 'feedback';
  if (path === '/supervisor/activity-logs') return 'activity';
  if (path === '/supervisor/reminders') return 'reminders';
  if (path === '/supervisor/meetings') return 'meetings';
  // Admin routes
  if (path === '/admin') return 'admin';
  if (path === '/admin/students-cohorts') return 'admin-cohorts';
  if (path === '/admin/grading-standards') return 'admin-grading';
  if (path === '/admin/rubric-templates') return 'rubric-templates';
  if (path === '/admin/internal-notes') return 'internal-notes';
  return undefined;
});

const mainContent = ref<HTMLElement | null>(null);

// Reset scroll position when route changes
watch(() => route.path, () => {
  if (mainContent.value) {
    mainContent.value.scrollTop = 0;
  }
  isMobileSidebarOpen.value = false;
});

onMounted(() => {
  authStore.loadAuthFromStorage();
});
</script>

<style scoped>
.main-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f0f2f5;
}

.content-wrapper {
  display: flex;
  flex: 1;
  min-height: 0;
  position: relative;
  margin-top: 158px;
}

.main-content {
  flex: 1;
  padding: 1.75rem 2rem;
  background: #f0f2f5;
  overflow-y: auto;
  min-height: 0;
}

/* Mobile Sidebar Overlay */
.mobile-sidebar-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 39;
}

/* Mobile Sidebar Drawer */
.mobile-sidebar-drawer {
  display: none;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: min(86vw, 340px);
  background: #ffffff;
  box-shadow: 12px 0 36px rgba(15, 23, 42, 0.22);
  z-index: 40;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  overflow: hidden;
  flex-direction: column;
  border-right: 1px solid #e2e8f0;
}

.mobile-sidebar-drawer.open {
  transform: translateX(0);
}

.mobile-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.95rem 1rem;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(180deg, #f8fbff 0%, #f1f5f9 100%);
}

.mobile-drawer-header span {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #64748b;
}

.mobile-drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: 0.35rem 0 0.75rem;
}

.mobile-sidebar-drawer .close-btn {
  padding: 0.35rem;
  background: none;
  border: 1px solid #dbeafe;
  border-radius: 0.5rem;
  cursor: pointer;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.mobile-sidebar-drawer .close-btn:hover {
  color: #1d4ed8;
  background: #eff6ff;
}

.mobile-sidebar-overlay {
  backdrop-filter: blur(1.5px);
}

.desktop-sidebar {
  display: contents;
}

/* Show mobile drawer and overlay on small screens */
@media (max-width: 768px) {
  .mobile-sidebar-overlay {
    display: block;
  }

  .mobile-sidebar-drawer {
    display: flex;
  }

  /* Hide only desktop sidebars on mobile */
  .desktop-sidebar {
    display: none !important;
  }

  .mobile-sidebar-drawer :deep(aside) {
    display: flex !important;
    width: 100% !important;
    min-height: 100%;
    border-right: none !important;
    box-shadow: none !important;
  }

  .mobile-drawer-content :deep(aside > div:first-child) {
    display: none;
  }

  .mobile-drawer-content :deep(nav) {
    padding-top: 0.35rem !important;
  }

  .mobile-drawer-content :deep(button) {
    border-radius: 0.7rem !important;
    min-height: 44px;
    font-size: 0.98rem !important;
    line-height: 1.2;
    margin-bottom: 0.2rem;
  }

  .mobile-drawer-content :deep(button span) {
    white-space: normal;
    word-break: keep-all;
  }

  .main-content {
    padding: 1rem;
  }

  .content-wrapper {
    margin-top: 104px;
  }
}

/* Hide mobile drawer on desktop */
@media (min-width: 769px) {
  .mobile-sidebar-drawer {
    display: none;
  }

  .mobile-sidebar-overlay {
    display: none;
  }
}
</style>
