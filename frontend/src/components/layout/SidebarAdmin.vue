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
  { id: 'rubric-templates', label: 'Rubric Templates', route: '/admin/rubric-templates' },
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
    class="hidden md:flex md:flex-col w-64 border-r border-slate-200 bg-white shadow-sm"
    aria-label="Supervisor/admin sidebar"
  >
    <div class="px-4 pt-4 pb-2">
      <span class="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Navigation</span>
    </div>
    <nav class="px-3 space-y-0.5 text-sm flex-1">
      <button
        v-for="item in baseItems"
        :key="item.id"
        type="button"
        @click="handleNavigation(item)"
        class="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-[13px] transition-all duration-150"
        :class="item.id === (props.current || 'dashboard')
          ? 'bg-blue-50 text-blue-700 font-semibold border-l-[3px] border-blue-600 -ml-[3px]'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'"
      >
        <span>{{ item.label }}</span>
      </button>

      <div v-if="props.role === 'admin'" class="mt-3 pt-2 border-t border-slate-200">
        <button
          v-for="item in adminExtra"
          :key="item.id"
          type="button"
          @click="handleNavigation(item)"
          class="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-[13px] transition-all duration-150"
          :class="item.id === props.current
            ? 'bg-blue-50 text-blue-700 font-semibold border-l-[3px] border-blue-600 -ml-[3px]'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'"
        >
          <span>{{ item.label }}</span>
        </button>
      </div>
    </nav>

    <div class="mt-auto px-4 py-3 border-t border-slate-100">
      <span class="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium"
        :class="props.role === 'admin'
          ? 'border-amber-100 bg-amber-50 text-amber-700'
          : 'border-emerald-100 bg-emerald-50 text-emerald-700'"
      >
        {{ props.role === 'admin' ? 'Admin View' : 'Supervisor View' }}
      </span>
    </div>
  </aside>
</template>

