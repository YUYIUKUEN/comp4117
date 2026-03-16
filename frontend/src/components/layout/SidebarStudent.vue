<script setup lang="ts">
import { useRouter } from 'vue-router'

const props = defineProps<{
  current?: string
}>()

const router = useRouter()

const items = [
  { id: 'home', label: 'Home', path: '/dashboard' },
  { id: 'topic', label: 'My Topic & Supervisor', path: '/topics' },
  { id: 'submissions', label: 'My Submissions', path: '/submissions' },
  { id: 'feedback', label: 'Feedback Received', path: '/feedback' },
  { id: 'archive', label: 'Topic Archive', path: '/archive' },
  { id: 'reminders', label: 'Reminders', path: '/reminders' },
  { id: 'activity', label: 'Activity Log', path: '/activity-logs' },
  { id: 'meetings', label: 'Meeting Bookings', path: '/meetings' },
]

const navigate = (path: string) => {
  router.push(path)
}
</script>

<template>
  <aside
    class="hidden md:flex md:flex-col w-60 border-r border-slate-200 bg-white shadow-sm"
    aria-label="Student sidebar"
  >
    <div class="px-4 pt-4 pb-2">
      <span class="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Navigation</span>
    </div>
    <nav class="px-3 space-y-0.5 text-sm flex-1">
      <button
        v-for="item in items"
        :key="item.id"
        type="button"
        @click="navigate(item.path)"
        class="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-[13px] transition-all duration-150"
        :class="item.id === (props.current || 'home')
          ? 'bg-blue-50 text-blue-700 font-semibold border-l-[3px] border-blue-600 -ml-[3px]'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'"
      >
        <span>{{ item.label }}</span>
      </button>
    </nav>

    <div class="mt-auto px-4 py-3 border-t border-slate-100">
      <span class="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700">
        Student View
      </span>
    </div>
  </aside>
</template>

