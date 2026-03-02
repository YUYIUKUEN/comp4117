<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline';
import topicChangeRequestService from '../services/topicChangeRequestService';
import applicationService from '../services/applicationService';

const router = useRouter();

const pendingApprovals = ref<any[]>([]);
const isLoading = ref(true);
const loadError = ref('');
const approving = ref<string | null>(null);
const rejecting = ref<string | null>(null);

// Combine topic change requests and pending applications
const fetchPendingItems = async () => {
  isLoading.value = true;
  loadError.value = '';
  pendingApprovals.value = [];

  try {
    // Fetch topic change requests
    const topicChangeRequests = await topicChangeRequestService.getSupervisorPendingRequests();
    
    // Fetch pending applications
    const applicationsResponse = await applicationService.getSupervisorApplications({ status: 'Pending' });
    const applications = applicationsResponse || [];

    // Transform topic change requests
    const transformedRequests = topicChangeRequests.map((request: any) => ({
      _id: request._id,
      type: 'Topic Change Request',
      id: request._id,
      studentName: request.student_id?.fullName || 'Unknown Student',
      studentId: request.student_id?._id,
      currentTopic: request.current_topic_id?.title || 'Unknown',
      proposedTopic: request.proposed_topic_id?.title || request.proposed_topic_title || 'Not specified',
      reason: request.reason,
      submittedDate: new Date(request.createdAt).toLocaleDateString(),
      status: 'Pending Review',
      requestType: 'topicChange',
    }));

    // Transform pending applications
    const transformedApplications = (applications as any[]).map((app: any) => ({
      _id: app._id,
      type: 'Topic Application',
      id: app._id,
      studentName: app.student_id?.fullName || 'Unknown Student',
      studentId: app.student_id?._id,
      topic: app.topic_id?.title || 'Unknown',
      submittedDate: new Date(app.createdAt).toLocaleDateString(),
      status: 'Awaiting Approval',
      requestType: 'application',
    }));

    // Combine and sort by date
    pendingApprovals.value = [...transformedRequests, ...transformedApplications].sort(
      (a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime()
    );
  } catch (error: any) {
    loadError.value = error?.response?.data?.error || 'Failed to load pending approvals';
    console.error('Error fetching pending approvals:', error);
  } finally {
    isLoading.value = false;
  }
};

const handleApprove = async (item: any) => {
  approving.value = item._id;

  try {
    if (item.requestType === 'topicChange') {
      await topicChangeRequestService.approveTopicChangeRequest(item._id);
    } else if (item.requestType === 'application') {
      await applicationService.approveApplication(item._id);
    }

    await fetchPendingItems();
  } catch (error: any) {
    alert(error?.response?.data?.error || 'Failed to approve');
  } finally {
    approving.value = null;
  }
};

const handleReject = async (item: any) => {
  if (!confirm('Are you sure you want to reject this request?')) return;

  rejecting.value = item._id;

  try {
    if (item.requestType === 'topicChange') {
      await topicChangeRequestService.rejectTopicChangeRequest(item._id);
    } else if (item.requestType === 'application') {
      await applicationService.rejectApplication(item._id);
    }

    await fetchPendingItems();
  } catch (error: any) {
    alert(error?.response?.data?.error || 'Failed to reject');
  } finally {
    rejecting.value = null;
  }
};

onMounted(() => {
  fetchPendingItems();
});
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
      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <span class="loading loading-spinner loading-md text-blue-600"></span>
        <span class="ml-2 text-sm text-slate-600">Loading pending approvals...</span>
      </div>

      <!-- Error State -->
      <div v-else-if="loadError" class="rounded-xl border border-red-200 bg-red-50 p-5 text-center">
        <p class="text-sm font-medium text-red-700">{{ loadError }}</p>
        <button
          @click="fetchPendingItems"
          class="mt-3 text-sm text-blue-600 hover:underline"
        >
          Retry
        </button>
      </div>

      <!-- Empty State -->
      <div v-else-if="pendingApprovals.length === 0" class="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p class="text-sm font-medium text-slate-900">No pending approvals</p>
        <p class="mt-1 text-xs text-slate-500">All topic change requests and applications have been reviewed.</p>
      </div>

      <!-- Pending Items -->
      <div v-else class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <h2 class="text-sm font-semibold text-slate-900 mb-4">
          {{ pendingApprovals.length }} Pending Item<span v-if="pendingApprovals.length !== 1">s</span>
        </h2>

        <div class="space-y-3">
          <div
            v-for="item in pendingApprovals"
            :key="item._id"
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
              <p v-if="item.proposedTopic && item.requestType === 'topicChange'" class="text-xs text-slate-600">
                <span class="font-medium text-slate-900">Proposed Topic:</span> {{ item.proposedTopic }}
              </p>
              <p v-if="item.topic && item.requestType === 'application'" class="text-xs text-slate-600">
                <span class="font-medium text-slate-900">Applied Topic:</span> {{ item.topic }}
              </p>
              <p v-if="item.reason" class="text-xs text-slate-600">
                <span class="font-medium text-slate-900">Reason:</span> {{ item.reason }}
              </p>
            </div>

            <p class="text-[11px] text-slate-500 mb-3">Submitted: {{ item.submittedDate }}</p>

            <div class="flex gap-2">
              <button
                @click="handleApprove(item)"
                :disabled="approving === item._id"
                class="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100 border border-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircleIcon class="h-4 w-4" />
                {{ approving === item._id ? 'Approving...' : 'Approve' }}
              </button>
              <button
                @click="handleReject(item)"
                :disabled="rejecting === item._id"
                class="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XCircleIcon class="h-4 w-4" />
                {{ rejecting === item._id ? 'Rejecting...' : 'Reject' }}
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
