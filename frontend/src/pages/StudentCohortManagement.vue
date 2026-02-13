<script setup lang="ts">
import { ref } from 'vue';
import {
  Bars3Icon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  EllipsisVerticalIcon,
} from '@heroicons/vue/24/outline';
import { useRouter } from 'vue-router';

const router = useRouter();
const sidebarOpen = ref(false);
const activeTab = ref('students'); // 'students' or 'cohorts'

const students = ref([
  {
    id: 1,
    name: 'Student Chan Hoi Ting',
    email: 'chan.ht@student.edu.hk',
    programme: 'BSocSc Geography',
    cohort: '2024-2025',
    status: 'Active',
  },
  {
    id: 2,
    name: 'Student Ho Pui Kwan',
    email: 'ho.pk@student.edu.hk',
    programme: 'BSocSc Sociology',
    cohort: '2024-2025',
    status: 'Inactive',
  },
  {
    id: 3,
    name: 'Student Lee Man Kei',
    email: 'lee.mk@student.edu.hk',
    programme: 'BA English',
    cohort: '2023-2024',
    status: 'Active',
  },
]);

const cohorts = ref([
  {
    id: 1,
    name: '2024-2025',
    totalStudents: 150,
    academicYear: '2024/2025',
    status: 'Active',
  },
  {
    id: 2,
    name: '2023-2024',
    totalStudents: 148,
    academicYear: '2023/2024',
    status: 'Active',
  },
  {
    id: 3,
    name: '2022-2023',
    totalStudents: 142,
    academicYear: '2022/2023',
    status: 'Archived',
  },
]);

const handleBack = () => {
  router.push('/admin');
};

const handleAddStudent = () => {
  console.log('Add student');
};

const handleAddCohort = () => {
  console.log('Add cohort');
};

const handleEditStudent = (studentId: number) => {
  console.log('Edit student', studentId);
};

const handleDeleteStudent = (studentId: number) => {
  console.log('Delete student', studentId);
};

const handleEditCohort = (cohortId: number) => {
  console.log('Edit cohort', cohortId);
};

const handleDeleteCohort = (cohortId: number) => {
  console.log('Delete cohort', cohortId);
};
</script>

<template>
  <div class="min-h-[calc(100vh-3.25rem)] bg-slate-50 text-slate-900 flex flex-col">
    <header
      class="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur"
    >
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          aria-label="Go back"
          @click="handleBack"
        >
          <ArrowLeftIcon class="h-6 w-6" aria-hidden="true" />
        </button>
        <div>
          <p class="text-[11px] uppercase tracking-[0.2em] text-slate-500">
            Administration
          </p>
          <p class="text-sm font-semibold text-slate-900">
            Students & Cohorts
          </p>
        </div>
      </div>
    </header>

    <main class="flex-1 px-4 sm:px-6 pb-6 pt-4 sm:pt-5">
      <!-- Tabs -->
      <div class="flex gap-4 border-b border-slate-200 mb-5">
        <button
          @click="activeTab = 'students'"
          :class="[
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'students'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          ]"
        >
          Students
        </button>
        <button
          @click="activeTab = 'cohorts'"
          :class="[
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'cohorts'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          ]"
        >
          Cohorts
        </button>
      </div>

      <!-- Students Tab -->
      <section v-if="activeTab === 'students'" class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 class="text-sm font-semibold text-slate-900">
              All Students
            </h2>
            <p class="mt-1 text-xs text-slate-500">
              Manage student records and cohort assignments.
            </p>
          </div>
          <button
            @click="handleAddStudent"
            type="button"
            class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            <PlusIcon class="h-4 w-4" />
            Add Student
          </button>
        </div>

        <div class="mb-4 flex items-center gap-3">
          <div class="relative flex-1 max-w-md">
            <MagnifyingGlassIcon
              class="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              class="block w-full rounded-lg border border-slate-300 bg-white px-9 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
              placeholder="Search students..."
            >
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full text-xs">
            <thead class="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th scope="col" class="px-4 py-3 text-left font-medium">
                  Name
                </th>
                <th scope="col" class="px-4 py-3 text-left font-medium">
                  Email
                </th>
                <th scope="col" class="px-4 py-3 text-left font-medium">
                  Programme
                </th>
                <th scope="col" class="px-4 py-3 text-left font-medium">
                  Cohort
                </th>
                <th scope="col" class="px-4 py-3 text-left font-medium">
                  Status
                </th>
                <th scope="col" class="px-4 py-3 text-right font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr v-for="student in students" :key="student.id" class="hover:bg-slate-50">
                <td class="px-4 py-3">
                  <p class="font-medium text-slate-900">{{ student.name }}</p>
                </td>
                <td class="px-4 py-3">
                  <p class="text-slate-600">{{ student.email }}</p>
                </td>
                <td class="px-4 py-3">
                  <p class="text-slate-600">{{ student.programme }}</p>
                </td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-blue-700 border border-blue-200">
                    {{ student.cohort }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <span
                    :class="[
                      'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5',
                      student.status === 'Active'
                        ? 'border-emerald-500/50 bg-emerald-50 text-emerald-700'
                        : 'border-slate-500/50 bg-slate-50 text-slate-700'
                    ]"
                  >
                    <span
                      class="h-1.5 w-1.5 rounded-full"
                      :class="student.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-500'"
                    />
                    {{ student.status }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right">
                  <div class="flex justify-end gap-2">
                    <button
                      @click="handleEditStudent(student.id)"
                      class="text-blue-600 hover:text-blue-700 text-xs font-medium"
                    >
                      Edit
                    </button>
                    <button
                      @click="handleDeleteStudent(student.id)"
                      class="text-red-600 hover:text-red-700 text-xs font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Cohorts Tab -->
      <section v-if="activeTab === 'cohorts'" class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 class="text-sm font-semibold text-slate-900">
              All Cohorts
            </h2>
            <p class="mt-1 text-xs text-slate-500">
              Manage academic cohorts and their assignments.
            </p>
          </div>
          <button
            @click="handleAddCohort"
            type="button"
            class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            <PlusIcon class="h-4 w-4" />
            Add Cohort
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full text-xs">
            <thead class="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th scope="col" class="px-4 py-3 text-left font-medium">
                  Cohort Name
                </th>
                <th scope="col" class="px-4 py-3 text-left font-medium">
                  Academic Year
                </th>
                <th scope="col" class="px-4 py-3 text-left font-medium">
                  Total Students
                </th>
                <th scope="col" class="px-4 py-3 text-left font-medium">
                  Status
                </th>
                <th scope="col" class="px-4 py-3 text-right font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr v-for="cohort in cohorts" :key="cohort.id" class="hover:bg-slate-50">
                <td class="px-4 py-3">
                  <p class="font-medium text-slate-900">{{ cohort.name }}</p>
                </td>
                <td class="px-4 py-3">
                  <p class="text-slate-600">{{ cohort.academicYear }}</p>
                </td>
                <td class="px-4 py-3">
                  <p class="text-slate-600">{{ cohort.totalStudents }}</p>
                </td>
                <td class="px-4 py-3">
                  <span
                    :class="[
                      'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5',
                      cohort.status === 'Active'
                        ? 'border-emerald-500/50 bg-emerald-50 text-emerald-700'
                        : 'border-slate-500/50 bg-slate-50 text-slate-700'
                    ]"
                  >
                    <span
                      class="h-1.5 w-1.5 rounded-full"
                      :class="cohort.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-500'"
                    />
                    {{ cohort.status }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right">
                  <div class="flex justify-end gap-2">
                    <button
                      @click="handleEditCohort(cohort.id)"
                      class="text-blue-600 hover:text-blue-700 text-xs font-medium"
                    >
                      Edit
                    </button>
                    <button
                      @click="handleDeleteCohort(cohort.id)"
                      class="text-red-600 hover:text-red-700 text-xs font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
</style>
