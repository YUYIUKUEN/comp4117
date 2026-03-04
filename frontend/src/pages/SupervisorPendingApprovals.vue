<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
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

// Group pending applications by topic
const groupedByTopic = computed(() => {
  const topicChangeRequests = pendingApprovals.value.filter(item => item.requestType === 'topicChange');
  const applications = pendingApprovals.value.filter(item => item.requestType === 'application');
  
  // Group applications by topic
  const topicsMap = new Map<string, any>();
  
  applications.forEach(app => {
    const topicKey = app.topic_id?._id || app.topicId || 'unknown';
    const topicTitle = app.topic_id?.title || app.topic || 'Unknown Topic';
    
    if (!topicsMap.has(topicKey)) {
      topicsMap.set(topicKey, {
        topicId: topicKey,
        topicTitle: topicTitle,
        applications: [],
        topicChangeRequests: [],
      });
    }
    topicsMap.get(topicKey)!.applications.push(app);
  });
  
  // Add topic change requests to respective topics
  topicChangeRequests.forEach(req => {
    const topicKey = req.currentTopic_id?._id || req.currentTopicId || 'unknown';
    const topicTitle = req.currentTopic_id?.title || req.currentTopic || 'Unknown Topic';
    
    if (!topicsMap.has(topicKey)) {
      topicsMap.set(topicKey, {
        topicId: topicKey,
        topicTitle: topicTitle,
        applications: [],
        topicChangeRequests: [],
      });
    }
    topicsMap.get(topicKey)!.topicChangeRequests.push(req);
  });
  
  // Return sorted by topic name
  return Array.from(topicsMap.values()).sort((a, b) => 
    a.topicTitle.localeCompare(b.topicTitle)
  );
});

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
    const applications = applicationsResponse?.data || [];

    // Transform topic change requests
    const transformedRequests = topicChangeRequests.map((request: any) => ({
      _id: request._id,
      type: 'Topic Change Request',
      id: request._id,
      studentName: request.student_id?.fullName || 'Unknown Student',
      studentId: request.student_id?._id,
      currentTopic: request.current_topic_id?.title || 'Unknown',
      currentTopic_id: request.current_topic_id,
      currentTopicId: request.current_topic_id?._id,
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
      topic_id: app.topic_id,
      topicId: app.topic_id?._id,
      submittedDate: new Date(app.createdAt).toLocaleDateString(),
      status: 'Awaiting Approval',
      requestType: 'application',
      preferenceRank: app.preference_rank,
    }));

    // Combine and sort by date
    pendingApprovals.value = [...transformedRequests, ...transformedApplications].sort(
      (a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime()
    );
  } catch (error: any) {
    console.error('Error fetching pending approvals:', error);
    let errorMsg = 'Failed to load pending approvals';
    if (error?.response?.data?.error) {
      errorMsg = error.response.data.error;
    } else if (error?.message) {
      errorMsg = error.message;
    }
    loadError.value = errorMsg;
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
      <div v-else class="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div class="border-b border-slate-200 p-4 sm:p-5">
          <h2 class="text-sm font-semibold text-slate-900">
            {{ pendingApprovals.length }} Pending Item<span v-if="pendingApprovals.length !== 1">s</span>
          </h2>
          <p class="mt-1 text-xs text-slate-600">Organized by topic</p>
        </div>

        <div class="divide-y divide-slate-200">
          <div
            v-for="topicGroup in groupedByTopic"
            :key="topicGroup.topicId"
            class="p-4 sm:p-5"
          >
            <!-- Topic Header -->
            <div class="mb-4">
              <h3 class="text-sm font-semibold text-slate-900">
                {{ topicGroup.topicTitle }}
              </h3>
              <p class="mt-1 text-xs text-slate-600">
                {{ topicGroup.applications.length }} application<span v-if="topicGroup.applications.length !== 1">s</span>
                <span v-if="topicGroup.topicChangeRequests.length > 0">
                  · {{ topicGroup.topicChangeRequests.length }} change request<span v-if="topicGroup.topicChangeRequests.length !== 1">s</span>
                </span>
              </p>
            </div>

            <!-- Applications for this topic -->
            <div v-if="topicGroup.applications.length > 0" class="space-y-3 mb-4">
              <div
                v-for="item in topicGroup.applications"
                :key="item._id"
                class="border border-slate-200 rounded-lg p-3 hover:border-blue-300 transition-colors"
              >
                <div class="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p class="text-xs font-medium text-slate-900">{{ item.studentName }}</p>
                    <p class="text-[11px] text-slate-600">
                      <span v-if="item.preferenceRank">Preference: #{{ item.preferenceRank }}</span>
                      Applied {{ item.submittedDate }}
                    </p>
                  </div>
                  <span class="inline-flex items-center gap-1 rounded-full border border-amber-500/50 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                    <ClockIcon class="h-3 w-3" />
                    Awaiting
                  </span>
                </div>

                <div class="flex gap-2 mt-3">
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

            <!-- Topic Change Requests for this topic -->
            <div v-if="topicGroup.topicChangeRequests.length > 0" class="space-y-3">
              <p class="text-xs font-medium text-slate-700 mb-2">Change Requests:</p>
              <div
                v-for="item in topicGroup.topicChangeRequests"
                :key="item._id"
                class="border border-slate-200 rounded-lg p-3 hover:border-blue-300 transition-colors bg-slate-50"
              >
                <div class="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p class="text-xs font-medium text-slate-900">{{ item.studentName }}</p>
                    <p class="text-[11px] text-slate-600">
                      Propose: {{ item.proposedTopic }} · Submitted {{ item.submittedDate }}
                    </p>
                    <p v-if="item.reason" class="text-[11px] text-slate-600 mt-1">
                      <span class="font-medium">Reason:</span> {{ item.reason }}
                    </p>
                  </div>
                  <span class="inline-flex items-center gap-1 rounded-full border border-amber-500/50 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 whitespace-nowrap">
                    <ClockIcon class="h-3 w-3" />
                    Pending
                  </span>
                </div>

                <div class="flex gap-2 mt-3">
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
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
</style>
