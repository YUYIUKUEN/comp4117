<script setup lang="ts">
import { useRouter } from 'vue-router'

defineProps<{
  current?: string
}>()

defineEmits<{
  navigate: []
}>()

const router = useRouter()

const items = [
  { id: 'dashboard', label: 'Dashboard', path: '/supervisor/dashboard' },
  { id: 'students', label: 'All Students', path: '/supervisor/students' },
  { id: 'topics', label: 'My Topics', path: '/supervisor/topics' },
  { id: 'pending-approvals', label: 'Pending Approvals', path: '/supervisor/pending-approvals' },
  { id: 'feedback', label: 'Feedback & Grading', path: '/supervisor/feedback-grading' },
  { id: 'activity', label: 'Activity Logs', path: '/supervisor/activity-logs' },
  { id: 'reminders', label: 'Reminders Queue', path: '/supervisor/reminders' },
  { id: 'meetings', label: 'Meeting Slots', path: '/supervisor/meetings' },
]

const navigate = (path: string) => {
  router.push(path)
}
</script>

<template>
  <aside
    class="hidden md:flex md:flex-col w-60 border-r border-slate-200 bg-white shadow-sm"
    aria-label="Supervisor sidebar"
  >
    <div class="px-4 pt-4 pb-2">
      <span class="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Navigation</span>
    </div>
    <nav class="px-3 space-y-0.5 text-sm flex-1">
      <button
        v-for="item in items"
        :key="item.id"
        type="button"
        @click="navigate(item.path); $emit('navigate')"
        class="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-[13px] transition-all duration-150"
        :class="item.id === (current || 'dashboard')
          ? 'bg-blue-50 text-blue-700 font-semibold border-l-[3px] border-blue-600 -ml-[3px]'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'"
      >
        <span>{{ item.label }}</span>
      </button>
    </nav>

    <div class="mt-auto px-4 py-3 border-t border-slate-100">
      <span class="inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
        Supervisor View
      </span>
    </div>
  </aside>
</template>
