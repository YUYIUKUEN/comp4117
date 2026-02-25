<script setup lang="ts">
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
    <header class="border-b border-slate-200 bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div>
          <h1 class="text-3xl font-bold text-slate-900">Supervisor Dashboard</h1>
          <p class="text-slate-600 mt-2">Welcome back! Use the sidebar to navigate your supervision tasks.</p>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
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
