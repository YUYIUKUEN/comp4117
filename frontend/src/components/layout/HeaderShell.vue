<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { AcademicCapIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'
import { useDummyData, type Role } from '../../composables/useDummyData'

const { role, currentStudent, supervisor } = useDummyData()

const roles: Role[] = ['student', 'supervisor', 'admin']

const currentUser = computed(() =>
  role.value === 'student'
    ? { name: currentStudent.value.name, email: currentStudent.value.email, avatar: currentStudent.value.avatar }
    : { name: supervisor.value.name, email: supervisor.value.email, avatar: supervisor.value.avatar },
)

const roleLabel = computed(() => {
  if (role.value === 'student') return 'Student View'
  if (role.value === 'supervisor') return 'Supervisor View'
  return 'Admin View'
})

function setRole(r: Role) {
  role.value = r
}
</script>

<template>
  <header
    class="flex items-center justify-between px-4 sm:px-8 py-3 border-b border-slate-200 bg-white/95 backdrop-blur"
  >
    <div class="flex items-center gap-3">
      <div
        class="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-sm shadow-blue-500/40"
      >
        <AcademicCapIcon class="h-5 w-5 text-white" />
      </div>
      <div>
        <p class="text-xs uppercase tracking-[0.2em] text-slate-500">
          Final Year Project Management System
        </p>
        <p class="text-xs text-slate-500">
          HKBU Faculty of Social Sciences · Shared Data Across Roles
        </p>
      </div>
    </div>

    <nav class="hidden md:flex items-center gap-2 text-xs">
      <RouterLink to="/student" class="rounded-full px-3 py-1.5 text-slate-700 hover:bg-slate-100 hover:text-slate-900">Student</RouterLink>
      <RouterLink to="/supervisor" class="rounded-full px-3 py-1.5 text-slate-700 hover:bg-slate-100 hover:text-slate-900">Supervisor</RouterLink>
      <RouterLink to="/admin" class="rounded-full px-3 py-1.5 text-slate-700 hover:bg-slate-100 hover:text-slate-900">Admin</RouterLink>
      <RouterLink to="/topics" class="rounded-full px-3 py-1.5 text-slate-700 hover:bg-slate-100 hover:text-slate-900">Topics</RouterLink>
      <RouterLink to="/submission" class="rounded-full px-3 py-1.5 text-slate-700 hover:bg-slate-100 hover:text-slate-900">Submission</RouterLink>
    </nav>

    <div class="flex items-center gap-4">
      <!-- Role watermark -->
      <span
        class="hidden sm:inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-700"
      >
        {{ roleLabel }}
      </span>

      <!-- Fake user + role switcher -->
      <div class="flex items-center gap-2">
        <div class="hidden sm:flex flex-col items-end text-[11px]">
          <span class="font-medium text-slate-900">
            {{ currentUser.name }}
          </span>
          <span class="text-slate-500">
            {{ currentUser.email }}
          </span>
        </div>
        <div class="relative">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 hover:border-blue-500 hover:bg-blue-50"
          >
            <img
              :src="currentUser.avatar"
              alt="User avatar"
              class="h-8 w-8 rounded-full object-cover"
            />
            <span class="hidden sm:inline">
              Switch role
            </span>
            <ChevronDownIcon class="h-4 w-4 text-slate-500" />
          </button>
          <!-- Simple inline "dropdown" for demo (always visible on hover in real app; here static list) -->
          <div
            class="absolute right-0 mt-1 w-40 rounded-lg border border-slate-200 bg-white shadow-sm shadow-slate-200 text-xs py-1"
          >
            <button
              v-for="r in roles"
              :key="r"
              type="button"
              class="flex w-full items-center justify-between px-3 py-1.5 hover:bg-slate-50"
              :class="role === r ? 'text-blue-600 font-medium' : 'text-slate-600'"
              @click="setRole(r)"
            >
              <span class="capitalize">{{ r }}</span>
              <span v-if="role === r" class="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

