<script setup lang="ts">
import { ref } from 'vue'
import { ArrowRightOnRectangleIcon } from '@heroicons/vue/24/outline'

const role = ref<'Student' | 'Supervisor' | 'Admin'>('Student')
const email = ref('student001@life.hkbu.edu.hk')
const password = ref('••••••••')

const roles = ['Student', 'Supervisor', 'Admin'] as const
</script>

<template>
  <div
    class="min-h-[calc(100vh-3.25rem)] flex flex-col bg-slate-50 text-slate-900"
    aria-labelledby="fypms-title"
  >
    <div
      class="pointer-events-none fixed inset-x-0 top-12 -z-10 bg-gradient-to-br from-blue-50 via-slate-50 to-sky-100"
      aria-hidden="true"
    >
      <div
        class="absolute inset-0 opacity-20 bg-[url('https://images.pexels.com/photos/207691/pexels-photo-207691.jpeg?auto=compress&cs=tinysrgb&w=1600')] bg-cover bg-center mix-blend-soft-light grayscale"
      ></div>
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.35),_transparent_55%)]"></div>
    </div>

    <main
      class="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8"
      role="main"
    >
      <section
        class="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] items-center"
      >
        <div class="space-y-6">
          <div class="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs text-slate-700 ring-1 ring-blue-100">
            <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            Unified Final Year Project Portal
          </div>

          <div>
            <h1
              id="fypms-title"
              class="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-slate-900"
            >
              Final Year Project
              <span class="block text-blue-600">
                Management System
              </span>
            </h1>
          </div>

          <div class="space-y-3 text-sm text-slate-700">
            <ul class="flex flex-wrap gap-2 text-xs sm:text-sm text-slate-700">
              <li class="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 ring-1 ring-slate-200">
                <span class="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                Supervisor–student matching
              </li>
              <li class="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 ring-1 ring-slate-200">
                <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                Flexible submissions & feedback
              </li>
              <li class="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 ring-1 ring-slate-200">
                <span class="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                Transparent progress tracking
              </li>
            </ul>
          </div>
        </div>

        <div>
          <section
            aria-label="Login form"
            class="rounded-2xl bg-white px-6 py-7 sm:px-8 sm:py-8 shadow-xl shadow-slate-200/70 ring-1 ring-slate-200"
          >
            <div class="mb-5 flex items-center justify-between gap-2">
              <div>
                <h2 class="text-lg font-semibold text-slate-900">
                  Sign in to your FYP workspace
                </h2>
                <p class="mt-1 text-xs text-slate-500">
                  Use the menu above to switch between student, supervisor, and admin views.
                </p>
              </div>
              <ArrowRightOnRectangleIcon class="h-7 w-7 text-blue-400" aria-hidden="true" />
            </div>

            <form
              class="space-y-4"
              aria-describedby="login-disabled-helper"
            >
              <div class="space-y-1.5">
                <label for="email" class="block text-xs font-medium text-slate-800">
                  University email
                </label>
                <input
                  id="email"
                  v-model="email"
                  type="email"
                  class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                  placeholder="e.g. s1234567@life.hkbu.edu.hk"
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
                    class="flex flex-col items-center justify-center rounded-lg border px-2.5 py-2 text-xs transition
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70
                      hover:bg-slate-50"
                    :class="role === r
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-300 bg-white text-slate-600'"
                    @click="role = r"
                    :aria-pressed="role === r"
                  >
                    <span class="font-medium">{{ r }}</span>
                    <span class="mt-0.5 text-[10px] text-slate-500">
                      {{ r === 'Student' ? 'Year 3–4 FYP' : r === 'Supervisor' ? 'Faculty member' : 'Programme staff' }}
                    </span>
                  </button>
                </div>
              </fieldset>

              <button
                type="button"
                disabled
                class="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500/70 px-4 py-2.5 text-sm font-medium text-white
                  ring-1 ring-blue-500/70 shadow-sm shadow-blue-300/60
                  opacity-60 cursor-not-allowed select-none"
                aria-disabled="true"
                id="login-disabled-helper"
              >
                <span>Login</span>
              </button>

              <p class="mt-2 text-[11px] text-slate-500">
                This prototype focuses on layout and user experience. In a production system, authentication would be integrated with your university account.
              </p>
            </form>
          </section>
        </div>
      </section>
    </main>
  </div>
</template>

