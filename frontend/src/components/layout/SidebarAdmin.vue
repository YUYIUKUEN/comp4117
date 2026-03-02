<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { Role } from '../../composables/useDummyData'

const router = useRouter()
const props = defineProps<{
  role: Role
  current?: string
}>()

const baseItems = [
  { id: 'dashboard', label: 'Dashboard', route: '/admin' },
  { id: 'students', label: 'All Students', route: '/admin/students-cohorts' },
  { id: 'logs', label: 'Activity Logs', route: '/supervisor/activity-logs' },
  { id: 'reminders', label: 'Reminders Queue', route: '/supervisor/reminders' },
]

const adminExtra = [
  { id: 'grading', label: 'Grading Standards', route: '/admin/grading-standards' },
  { id: 'internal-notes', label: 'Internal Notes', route: '/admin/internal-notes' },
  { id: 'system', label: 'System Overview', route: '/admin' },
]

const handleNavigation = (item: any) => {
  if (item.route) {
    router.push(item.route)
  }
}
</script>

<template>
  <aside
    class="hidden md:flex md:flex-col w-64 border-r border-slate-200 bg-white"
    aria-label="Supervisor/admin sidebar"
  >
    <nav class="mt-3 px-3 space-y-1 text-sm">
      <button
        v-for="item in baseItems"
        :key="item.id"
        type="button"
        @click="handleNavigation(item)"
        class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition hover:bg-slate-100 hover:text-slate-900"
        :class="item.id === (props.current || 'dashboard') ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-600'"
      >
        <span>{{ item.label }}</span>
      </button>

      <div v-if="props.role === 'admin'" class="mt-3 pt-2 border-t border-slate-200">
        <button
          v-for="item in adminExtra"
          :key="item.id"
          type="button"
          @click="handleNavigation(item)"
          class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition hover:bg-slate-100 hover:text-slate-900"
          :class="item.id === props.current ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-600'"
        >
          <span>{{ item.label }}</span>
        </button>
      </div>
    </nav>

    <div class="mt-auto px-4 py-3 text-[11px] text-slate-500">
      <span class="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">
        {{ props.role === 'admin' ? 'Admin View' : 'Supervisor View' }}
      </span>
    </div>
  </aside>
</template>

