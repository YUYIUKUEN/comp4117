<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/vue/24/outline';

const router = useRouter();

const pendingApprovals = ref([
  {
    id: 1,
    type: 'Topic Change Request',
    studentName: 'Student Chan Hoi Ting',
    currentTopic: 'Smart City Walkability in Kowloon East',
    proposedTopic: 'Sustainable Urban Transportation Systems',
    reason: 'Want to focus more on transportation aspects',
    submittedDate: '2025-02-10',
    status: 'Pending Review',
  },
  {
    id: 2,
    type: 'Progress Report Review',
    studentName: 'Student Ho Pui Kwan',
    topic: 'Digital Platforms and Youth Political Participation',
    summary: 'Completed literature review and started data collection',
    submittedDate: '2025-02-08',
    status: 'Awaiting Approval',
  },
  {
    id: 3,
    type: 'Extension Request',
    studentName: 'Student Lee Man Kei',
    topic: 'Literary Analysis and Digital Storytelling',
    reason: 'Need extra time for final manuscript review',
    requestedDays: 14,
    submittedDate: '2025-02-11',
    status: 'Pending Review',
  },
]);

const handleApprove = (id: number) => {
  console.log('Approve request', id);
};

const handleReject = (id: number) => {
  console.log('Reject request', id);
};
</script>

<template>
  <div class="min-h-[calc(100vh-3.25rem)] bg-slate-50">
    <header class="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur">
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        @click="router.back()"
      >
        <ArrowLeftIcon class="h-6 w-6" />
      </button>
      <div>
        <p class="text-[11px] uppercase tracking-[0.2em] text-slate-500">Supervision</p>
        <p class="text-sm font-semibold text-slate-900">Pending Approvals</p>
      </div>
      <button
        @click="router.push('/supervisor')"
        class="ml-auto text-xs font-medium text-blue-600 hover:text-blue-700 px-3 py-2 rounded hover:bg-blue-50"
      >
        Back to Menu
      </button>
    </header>

    <main class="px-4 sm:px-6 pb-6 pt-4 sm:pt-5">
      <div class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <h2 class="text-sm font-semibold text-slate-900 mb-4">
          {{ pendingApprovals.length }} Pending Items
        </h2>

        <div class="space-y-3">
          <div
            v-for="item in pendingApprovals"
            :key="item.id"
            class="border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
          >
            <div class="flex items-start justify-between gap-4 mb-3">
              <div>
                <p class="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                  {{ item.type }}
                </p>
                <h3 class="text-sm font-semibold text-slate-900 mt-1">{{ item.studentName }}</h3>
              </div>
              <span class="inline-flex items-center gap-1 rounded-full border border-amber-500/50 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                <ClockIcon class="h-3 w-3" />
                {{ item.status }}
              </span>
            </div>

            <div class="space-y-2 mb-4">
              <p v-if="item.currentTopic" class="text-xs text-slate-600">
                <span class="font-medium text-slate-900">Current Topic:</span> {{ item.currentTopic }}
              </p>
              <p v-if="item.proposedTopic" class="text-xs text-slate-600">
                <span class="font-medium text-slate-900">Proposed:</span> {{ item.proposedTopic }}
              </p>
              <p v-if="item.topic" class="text-xs text-slate-600">
                <span class="font-medium text-slate-900">Topic:</span> {{ item.topic }}
              </p>
              <p v-if="item.reason" class="text-xs text-slate-600">
                <span class="font-medium text-slate-900">Reason:</span> {{ item.reason }}
              </p>
              <p v-if="item.summary" class="text-xs text-slate-600">
                <span class="font-medium text-slate-900">Summary:</span> {{ item.summary }}
              </p>
              <p v-if="item.requestedDays" class="text-xs text-slate-600">
                <span class="font-medium text-slate-900">Requested Days:</span> {{ item.requestedDays }}
              </p>
            </div>

            <p class="text-[11px] text-slate-500 mb-3">Submitted: {{ item.submittedDate }}</p>

            <div class="flex gap-2">
              <button
                @click="handleApprove(item.id)"
                class="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
              >
                <CheckCircleIcon class="h-4 w-4" />
                Approve
              </button>
              <button
                @click="handleReject(item.id)"
                class="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 border border-red-200"
              >
                <XCircleIcon class="h-4 w-4" />
                Reject
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
</style>
