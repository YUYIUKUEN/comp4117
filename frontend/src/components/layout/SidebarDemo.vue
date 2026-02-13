<script setup lang="ts">
import { useRouter } from 'vue-router'

const props = defineProps<{
  current?: string
}>()

const router = useRouter()

const studentItems = [
  { id: 'home', label: 'Home', path: '/dashboard' },
  { id: 'topic', label: 'My Topic & Supervisor', path: '/topics' },
  { id: 'submissions', label: 'My Submissions', path: '/submissions' },
  { id: 'feedback', label: 'Feedback Received', path: '/feedback' },
  { id: 'archive', label: 'Topic Archive', path: '/archive' },
  { id: 'reminders', label: 'Reminders', path: '/reminders' },
]

const supervisorItems = [
  { id: 'sup-dashboard', label: 'Supervisor Dashboard', path: '/supervisor/dashboard' },
  { id: 'overview', label: 'Supervisee Overview', path: '/supervisor/overview' },
  { id: 'sup-topics', label: 'My Topics', path: '/supervisor/topics' },
]

const adminItems = [
  { id: 'admin', label: 'Admin Dashboard', path: '/admin' },
  { id: 'admin-cohorts', label: 'Student Cohorts', path: '/admin/students-cohorts' },
]

const navigate = (path: string) => {
  router.push(path)
}
</script>

<template>
  <aside
    class="hidden md:flex md:flex-col w-64 border-r border-slate-200 bg-white overflow-y-auto"
    aria-label="Demo sidebar"
  >
    <nav class="mt-3 px-3 space-y-1 text-sm">
      <!-- Student Section -->
      <div class="mb-2">
        <p class="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Student
        </p>
        <button
          v-for="item in studentItems"
          :key="item.id"
          type="button"
          @click="navigate(item.path)"
          class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition hover:bg-slate-100 hover:text-slate-900"
          :class="item.id === props.current ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-600'"
        >
          <span>{{ item.label }}</span>
        </button>
      </div>

      <div class="border-t border-slate-200 my-2"></div>

      <!-- Supervisor Section -->
      <div class="mb-2">
        <p class="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Supervisor
        </p>
        <button
          v-for="item in supervisorItems"
          :key="item.id"
          type="button"
          @click="navigate(item.path)"
          class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition hover:bg-slate-100 hover:text-slate-900"
          :class="item.id === props.current ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-600'"
        >
          <span>{{ item.label }}</span>
        </button>
      </div>

      <div class="border-t border-slate-200 my-2"></div>

      <!-- Admin Section -->
      <div class="mb-2">
        <p class="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Admin
        </p>
        <button
          v-for="item in adminItems"
          :key="item.id"
          type="button"
          @click="navigate(item.path)"
          class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition hover:bg-slate-100 hover:text-slate-900"
          :class="item.id === props.current ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-600'"
        >
          <span>{{ item.label }}</span>
        </button>
      </div>
    </nav>

    <div class="mt-auto px-4 py-3 text-[11px] text-slate-500">
      <span class="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-amber-700 font-medium">
        Demo Mode
      </span>
    </div>
  </aside>
</template>
