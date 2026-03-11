<template>
  <div class="header-wrapper">
    <!-- Top Navigation Bar -->
    <header class="top-bar">
      <div class="top-bar-left">
        <div class="brand-logo">
          <svg class="logo-icon" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="40" rx="8" fill="white" fill-opacity="0.15"/>
            <path d="M12 28V12h4v6.5h8V12h4v16h-4v-7h-8v7h-4z" fill="white"/>
          </svg>
        </div>
        <div class="brand-text">
          <span class="brand-title">HKBU FYP Management System</span>
          <span class="brand-subtitle">BSocSc (Hons) in Global and China Studies</span>
        </div>
      </div>
      <div class="top-bar-right">
        <span v-if="user" class="welcome-text">Welcome, {{ user.fullName }}</span>
        <button class="logout-btn" @click="handleLogout">
          Logout
        </button>
      </div>
    </header>

    <!-- Banner Image Strip -->
    <div class="banner-strip" :class="{ 'banner-no-img': bannerError }">
      <img
        v-if="!bannerError"
        src="/hkbu-banner.jpg"
        alt="HKBU Campus"
        class="banner-img"
        @error="bannerError = true"
      />
      <div class="banner-overlay"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import authService from '@/services/authService';

const router = useRouter();
const authStore = useAuthStore();

const user = computed(() => authStore.user);
const bannerError = ref(false);

const handleLogout = () => {
  authStore.clearAuth();
  router.push('/login');
  authService.logout().catch(() => {});
};
</script>

<style scoped>
.header-wrapper {
  flex-shrink: 0;
}

/* ── Top Navigation Bar ── */
.top-bar {
  background: linear-gradient(135deg, #1a2744 0%, #2a4073 100%);
  color: white;
  padding: 0.65rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 10;
}

.top-bar-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.brand-logo {
  flex-shrink: 0;
}

.logo-icon {
  width: 36px;
  height: 36px;
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.brand-title {
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.brand-subtitle {
  font-size: 0.7rem;
  opacity: 0.8;
  letter-spacing: 0.04em;
  font-weight: 400;
}

.top-bar-right {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.welcome-text {
  font-size: 0.82rem;
  font-weight: 500;
  opacity: 0.92;
}

.logout-btn {
  background: rgba(255, 255, 255, 0.12);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.25);
  padding: 0.38rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 500;
  transition: all 0.2s ease;
  letter-spacing: 0.02em;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.22);
  border-color: rgba(255, 255, 255, 0.45);
}

/* ── Banner Image Strip ── */
.banner-strip {
  height: 110px;
  position: relative;
  overflow: hidden;
  background: #2a4073;
}

.banner-no-img {
  background: linear-gradient(135deg, #1a2744 0%, #2a4073 40%, #3d5a99 70%, #1a2744 100%);
  height: 80px;
}

.banner-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 35%;
  display: block;
}

.banner-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(26, 39, 68, 0.25) 0%,
    rgba(26, 39, 68, 0.05) 50%,
    rgba(26, 39, 68, 0.15) 100%
  );
  pointer-events: none;
}
</style>
