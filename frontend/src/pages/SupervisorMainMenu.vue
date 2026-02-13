<script setup lang="ts">
import { useRouter } from 'vue-router';
import {
  ChartBarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  StarIcon,
  ClipboardListIcon,
  BellIcon,
} from '@heroicons/vue/24/outline';

const router = useRouter();

const menuItems = [
  {
    title: 'Dashboard',
    description: 'Overview & statistics',
    icon: ChartBarIcon,
    route: '/supervisor/dashboard',
    color: 'bg-blue-50 border-blue-200 text-blue-700',
  },
  {
    title: 'All Students',
    description: 'View supervised students',
    icon: UserGroupIcon,
    route: '/supervisor/students',
    color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  },
  {
    title: 'Topic Proposals',
    description: 'Create & manage topics',
    icon: DocumentTextIcon,
    route: '/supervisor/topics',
    color: 'bg-purple-50 border-purple-200 text-purple-700',
  },
  {
    title: 'Pending Approvals',
    description: 'Review pending requests',
    icon: CheckCircleIcon,
    route: '/supervisor/pending-approvals',
    color: 'bg-amber-50 border-amber-200 text-amber-700',
  },
  {
    title: 'Feedback & Grading',
    description: 'Grade submissions & provide feedback',
    icon: StarIcon,
    route: '/supervisor/feedback-grading',
    color: 'bg-pink-50 border-pink-200 text-pink-700',
  },
  {
    title: 'Activity Logs',
    description: 'View system activity',
    icon: ClipboardListIcon,
    route: '/supervisor/activity-logs',
    color: 'bg-indigo-50 border-indigo-200 text-indigo-700',
  },
  {
    title: 'Reminders Queue',
    description: 'Send reminders & track deadlines',
    icon: BellIcon,
    route: '/supervisor/reminders',
    color: 'bg-red-50 border-red-200 text-red-700',
  },
];
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
    <header class="border-b border-slate-200 bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div>
          <h1 class="text-3xl font-bold text-slate-900">Supervisor Dashboard</h1>
          <p class="text-slate-600 mt-2">Welcome back! Select a section to manage your supervision tasks.</p>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <button
          v-for="item in menuItems"
          :key="item.route"
          @click="router.push(item.route)"
          :class="[
            'relative rounded-xl border-2 p-6 text-left transition-all duration-200 hover:shadow-lg hover:-translate-y-1',
            item.color
          ]"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h3 class="text-lg font-semibold">{{ item.title }}</h3>
              <p class="text-sm mt-1 opacity-75">{{ item.description }}</p>
            </div>
            <component :is="item.icon" class="h-6 w-6 ml-4 flex-shrink-0" />
          </div>
          <div class="mt-4">
            <span class="inline-block text-xs font-medium opacity-75">Click to view →</span>
          </div>
        </button>
      </div>

      <div class="mt-12 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-slate-900 mb-4">Quick Info</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="rounded-lg bg-slate-50 p-4">
            <p class="text-sm text-slate-600">Supervised Students</p>
            <p class="text-2xl font-bold text-slate-900 mt-1">8</p>
          </div>
          <div class="rounded-lg bg-slate-50 p-4">
            <p class="text-sm text-slate-600">Pending Items</p>
            <p class="text-2xl font-bold text-amber-600 mt-1">5</p>
          </div>
          <div class="rounded-lg bg-slate-50 p-4">
            <p class="text-sm text-slate-600">Recent Activities</p>
            <p class="text-2xl font-bold text-blue-600 mt-1">12</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
button:active {
  transform: translateY(0);
}
</style>
