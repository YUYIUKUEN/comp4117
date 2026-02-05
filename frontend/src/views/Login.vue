<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { AcademicCapIcon, ArrowRightOnRectangleIcon } from '@heroicons/vue/24/outline'
import { useDummyData, type Role } from '../composables/useDummyData'

const { role } = useDummyData()

const email = ref('s22123456@life.hkbu.edu.hk')
const password = ref('••••••••')
const selectedRole = ref<Role>('student')

const roles: Role[] = ['student', 'supervisor', 'admin']

// For demo: keep login button static; role is mainly controlled via header switcher.
// But we sync the selector into global role reactively so dashboard reflects it.
watchEffect(() => {
  role.value = selectedRole.value
})
</script>

<template>
  <div class="min-h-[calc(100vh-3.25rem)] flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-blue-100 px-4">
    <div class="max-w-5xl w-full grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] items-center">
      <section class="space-y-6">
        <div class="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs text-slate-700 ring-1 ring-slate-200 shadow-sm">
          <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          Final Year Project Management System
        </div>

        <div>
          <h1 class="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-slate-900">
            Final Year Project
            <span class="block text-blue-600">
              Management System
            </span>
          </h1>
          <p class="mt-3 text-sm sm:text-base text-slate-600">
            HKBU Faculty of Social Sciences ·
            <span class="font-medium">COMP4117 – Spring 2026 Verbal Report | Group D</span>
          </p>
        </div>

        <div class="grid gap-3 text-xs text-slate-700 sm:grid-cols-3">
          <div class="rounded-xl bg-white/80 p-3 ring-1 ring-slate-200 shadow-sm">
            <p class="font-semibold text-slate-900">
              Student Version FYP System
            </p>
            <p class="mt-1 text-[11px]">
              Focused view for your own topic, submissions, and supervisor feedback.
            </p>
          </div>
          <div class="rounded-xl bg-white/80 p-3 ring-1 ring-slate-200 shadow-sm">
            <p class="font-semibold text-slate-900">
              Admin/Supervisor Version FYP System
            </p>
            <p class="mt-1 text-[11px]">
              Management dashboards for students, topics, and approvals with the same data.
            </p>
          </div>
          <div class="rounded-xl bg-white/80 p-3 ring-1 ring-slate-200 shadow-sm">
            <p class="font-semibold text-slate-900">
              Single source of truth
            </p>
            <p class="mt-1 text-[11px]">
              Topics and submissions are shared; each role sees only the actions they need.
            </p>
          </div>
        </div>
      </section>

      <section
        aria-label="Fake login form"
        class="rounded-2xl bg-white px-6 py-7 sm:px-8 sm:py-8 shadow-xl shadow-slate-200/70 ring-1 ring-slate-200"
      >
        <div class="mb-5 flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-400/70">
              <AcademicCapIcon class="h-5 w-5" />
            </div>
            <div>
              <h2 class="text-base font-semibold text-slate-900">
                Final Year Project Management System
              </h2>
              <p class="mt-0.5 text-[11px] text-slate-500">
                Fake login · data is hardcoded for demo
              </p>
            </div>
          </div>
          <ArrowRightOnRectangleIcon class="h-6 w-6 text-slate-400" aria-hidden="true" />
        </div>

        <form class="space-y-4" @submit.prevent>
          <div class="space-y-1.5">
            <label for="email" class="block text-xs font-medium text-slate-800">
              University email
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
              placeholder="e.g. s22123456@life.hkbu.edu.hk"
              autocomplete="email"
            />
          </div>

          <div class="space-y-1.5">
            <label for="password" class="block text-xs font-medium text-slate-800">
              Password
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
              placeholder="••••••••"
              autocomplete="current-password"
            />
          </div>

          <fieldset class="space-y-2">
            <legend class="block text-xs font-medium text-slate-800">
              Role
            </legend>
            <div class="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Select role">
              <button
                v-for="r in roles"
                :key="r"
                type="button"
                class="flex flex-col items-center justify-center rounded-lg border px-2.5 py-2 text-[11px] transition
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70
                  hover:bg-slate-50"
                :class="selectedRole === r
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-300 bg-white text-slate-600'"
                @click="selectedRole = r"
                :aria-pressed="selectedRole === r"
              >
                <span class="font-medium capitalize">
                  {{ r }}
                </span>
                <span class="mt-0.5 text-[10px] text-slate-500">
                  {{ r === 'student' ? 'My own FYP' : r === 'supervisor' ? 'Supervising students' : 'Programme staff' }}
                </span>
              </button>
            </div>
          </fieldset>

          <button
            type="button"
            class="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-blue-400/60"
            disabled
            aria-disabled="true"
          >
            Login
          </button>

          <p class="mt-2 text-[11px] text-slate-500">
            This button is intentionally static for the verbal report. Use the role switcher in the top navigation bar
            to preview the Student Version and Admin/Supervisor Version dashboards.
          </p>
        </form>
      </section>
    </div>
  </div>
</template>

