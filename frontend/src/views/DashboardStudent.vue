<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  ClockIcon,
  CloudArrowUpIcon,
  ArrowPathIcon,
} from '@heroicons/vue/24/outline';
import TopicChangeRequestModal from '../components/TopicChangeRequestModal.vue';
import { useSubmissionStore } from '../stores/submissionStore';
import { useAuthStore } from '../stores/authStore';
import assignmentService from '../services/assignmentService';
import feedbackService, { type FeedbackItem } from '../services/feedbackService';
import activityService from '../services/activityService';
import topicChangeRequestService from '../services/topicChangeRequestService';

const router = useRouter();
const submissionStore = useSubmissionStore();
const authStore = useAuthStore();
const isTopicChangeModalOpen = ref(false);

// Real data refs
const assignment = ref<any>(null);
const recentFeedback = ref<FeedbackItem[]>([]);
const loadingAssignment = ref(true);
const loadingFeedback = ref(true);
const errorMessage = ref<string | null>(null);

// Reply state
const replyingTo = ref<string | null>(null);
const replyText = ref('');
const submittingReply = ref(false);

const toggleReply = (feedbackId: string) => {
  if (replyingTo.value === feedbackId) {
    replyingTo.value = null;
    replyText.value = '';
  } else {
    replyingTo.value = feedbackId;
    replyText.value = '';
  }
};

const submitReply = async (feedbackId: string) => {
  if (!replyText.value.trim() || submittingReply.value) return;
  submittingReply.value = true;
  try {
    const newReply = await feedbackService.replyToFeedback(feedbackId, replyText.value.trim());
    const fb = recentFeedback.value.find(f => f._id === feedbackId);
    if (fb) {
      if (!fb.replies) fb.replies = [];
      fb.replies.push(newReply);
    }
    replyingTo.value = null;
    replyText.value = '';
  } catch (e) {
    console.error('Reply error:', e);
  } finally {
    submittingReply.value = false;
  }
};

// Derived data from assignment
const topicTitle = computed(() => assignment.value?.topic_id?.title ?? 'No topic assigned');
const studentConcentration = computed(() => authStore.user?.concentration ?? '');
const supervisorName = computed(() => assignment.value?.supervisor_id?.fullName ?? 'Not assigned');
const supervisorEmail = computed(() => assignment.value?.supervisor_id?.email ?? '');
const supervisorAvatar = computed(() => {
  const name = supervisorName.value.replace(/\s+/g, '+');
  return `https://ui-avatars.com/api/?name=${name}&background=0F172A&color=fff`;
});
// Completion based on real submission data
const completion = computed(() => submissionStore.submissionProgress);

// Upcoming deadlines computed from real submissions
const upcomingDeadlines = computed(() => {
  const now = new Date();
  return submissionStore.phases
    .filter(p => p.status !== 'Submitted' && p.status !== 'Declared Not Needed')
    .map(p => {
      const due = new Date(p.dueDate);
      const diffMs = due.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const isOverdue = diffDays < 0;
      return {
        _id: p._id,
        phase: p.phase,
        dueDate: due,
        dueDateFormatted: due.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        diffDays: Math.abs(diffDays),
        isOverdue,
        label: isOverdue ? `${Math.abs(diffDays)} days overdue` : `${diffDays} days remaining`,
      };
    })
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
});



const openTopicChangeModal = () => { isTopicChangeModalOpen.value = true; };
const closeTopicChangeModal = () => { isTopicChangeModalOpen.value = false; };

const handleTopicChangeSubmit = async (data: { newTopic: string; reason: string }) => {
  if (!assignment.value?.topic_id?._id) {
    console.error('No current topic assigned');
    errorMessage.value = 'Please ensure you have a topic assigned before requesting a change.';
    return;
  }
  
  try {
    await topicChangeRequestService.createTopicChangeRequest(
      assignment.value.topic_id._id,
      data.reason,
      undefined,
      data.newTopic
    );
    errorMessage.value = null;
    closeTopicChangeModal();
  } catch (error: any) {
    console.error('Error submitting topic change request:', error);
    errorMessage.value = error.message || 'Failed to submit topic change request. Please try again.';
  }
};

const goToSubmissions = () => { router.push('/submissions'); };

// Fetch all data on mount
onMounted(async () => {
  // Fetch submissions (already in store pattern)
  submissionStore.fetchSubmissionPhases().catch(e => console.error('Submissions error:', e));

  // Fetch assignment (topic + supervisor)
  try {
    const res = await assignmentService.getMyAssignment();
    assignment.value = res.data;
  } catch (e: any) {
    console.error('Assignment fetch error:', e);
    if (e.response?.status !== 404) {
      errorMessage.value = 'Failed to load assignment info';
    }
  } finally {
    loadingAssignment.value = false;
  }

  // Fetch recent feedback
  try {
    const data = await feedbackService.getStudentRecentFeedback(3);
    recentFeedback.value = data;
  } catch (e) {
    console.error('Feedback fetch error:', e);
  } finally {
    loadingFeedback.value = false;
  }


});
</script>

<template>
  <div>
    <main class="px-4 sm:px-6 pb-6 pt-4 sm:pt-5">
      <section class="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)]">
        <!-- Current topic hero -->
        <article class="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm shadow-slate-200/70">
          <header class="flex items-start justify-between gap-3">
            <div>
              <p class="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                Current topic
              </p>
              <h2 v-if="!loadingAssignment" class="mt-1 text-sm font-semibold text-slate-900">
                {{ topicTitle }}
              </h2>
              <div v-else class="mt-1 h-5 w-48 animate-pulse rounded bg-slate-200" />
              <p v-if="studentConcentration" class="mt-1 text-xs text-slate-600">
                {{ studentConcentration }}
              </p>
            </div>
            <!-- Progress ring -->
            <div class="flex flex-col items-end gap-1 text-right">
              <div class="relative h-12 w-12">
                <svg class="h-12 w-12 -rotate-90" viewBox="0 0 36 36">
                  <path
                    class="text-slate-200"
                    stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    class="text-blue-500"
                    stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round"
                    :stroke-dasharray="`${completion}, 100`"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div class="absolute inset-0 flex items-center justify-center">
                  <span class="text-[11px] font-semibold text-slate-900">{{ completion }}%</span>
                </div>
              </div>
              <p class="text-[11px] text-slate-500">Overall progress</p>
            </div>
          </header>

          <div class="mt-4 space-y-3 text-xs">
            <div v-if="!loadingAssignment && assignment" class="flex flex-wrap items-center gap-3">
              <div class="flex items-center gap-2">
                <img
                  :src="supervisorAvatar"
                  alt="Supervisor avatar"
                  class="h-8 w-8 rounded-full object-cover"
                >
                <div>
                  <p class="text-slate-900 text-xs font-medium">{{ supervisorName }}</p>
                  <p class="text-[11px] text-slate-500">{{ supervisorEmail }}</p>
                </div>
              </div>
              <span class="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200">
                Assigned
              </span>
            </div>
            <div v-else-if="loadingAssignment" class="flex items-center gap-2">
              <div class="h-8 w-8 animate-pulse rounded-full bg-slate-200" />
              <div class="space-y-1">
                <div class="h-3 w-32 animate-pulse rounded bg-slate-200" />
                <div class="h-3 w-24 animate-pulse rounded bg-slate-200" />
              </div>
            </div>
            <div v-else class="text-slate-500">
              No active assignment found. Apply to a topic to get started.
            </div>

            <div v-if="studentConcentration" class="flex flex-wrap gap-2 text-[11px] text-slate-600">
              <span class="rounded-full bg-blue-50 px-2.5 py-0.5 border border-blue-200 text-blue-700">
                Concentration · {{ studentConcentration }}
              </span>
              <span class="rounded-full bg-slate-100 px-2.5 py-0.5 border border-slate-200">
                Student View
              </span>
            </div>
          </div>

          <div class="mt-4 flex flex-wrap gap-2 text-[11px]">
            <button
              type="button"
              @click="openTopicChangeModal"
              class="inline-flex items-center gap-1 rounded-full border border-blue-500 bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-500"
            >
              <ArrowPathIcon class="h-3.5 w-3.5" />
              Request topic change
            </button>
            <button
              type="button"
              @click="goToSubmissions"
              class="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50"
            >
              <CloudArrowUpIcon class="h-3.5 w-3.5" />
              Upload document
            </button>
          </div>
        </article>

        <!-- Deadlines / countdown -->
        <article class="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm shadow-slate-200/70">
          <header class="flex items-center justify-between gap-2">
            <div>
              <h2 class="text-sm font-semibold text-slate-900">Upcoming deadlines</h2>
              <p class="mt-1 text-xs text-slate-600">Based on your submission schedule</p>
            </div>
            <ClockIcon class="h-5 w-5 text-slate-400" />
          </header>

          <ul v-if="upcomingDeadlines.length > 0" class="mt-3 space-y-2 text-xs">
            <li
              v-for="d in upcomingDeadlines"
              :key="d._id"
              class="flex items-center justify-between rounded-lg px-3 py-2"
              :class="d.isOverdue
                ? 'border border-rose-200 bg-rose-50'
                : 'border border-amber-200 bg-amber-50'"
            >
              <div>
                <p class="font-medium" :class="d.isOverdue ? 'text-rose-800' : 'text-amber-900'">
                  {{ d.phase }}
                </p>
                <p class="text-[11px]" :class="d.isOverdue ? 'text-rose-700' : 'text-amber-700'">
                  Due {{ d.dueDateFormatted }} · {{ d.label }}
                </p>
              </div>
              <span
                class="rounded-full px-2.5 py-0.5 text-[11px] font-medium text-white"
                :class="d.isOverdue ? 'bg-rose-600' : 'bg-amber-500'"
              >
                {{ d.isOverdue ? 'Overdue' : 'Upcoming' }}
              </span>
            </li>
          </ul>
          <div v-else-if="submissionStore.loading" class="mt-3 space-y-2">
            <div class="h-12 animate-pulse rounded-lg bg-slate-100" />
            <div class="h-12 animate-pulse rounded-lg bg-slate-100" />
          </div>
          <p v-else class="mt-3 text-xs text-slate-500">
            All submissions are up to date. Great job!
          </p>
        </article>
      </section>

      <!-- Submission status + feedback -->
      <section class="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)]">
        <!-- Submission grid -->
        <article class="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm shadow-slate-200/70">
          <header class="flex items-center justify-between gap-2">
            <div>
              <h2 class="text-sm font-semibold text-slate-900">Submission status</h2>
              <p class="mt-1 text-xs text-slate-600">Your checklist for the whole FYP lifecycle.</p>
            </div>
          </header>

          <div class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-[11px]">
            <div
              v-for="phase in submissionStore.phases"
              :key="phase._id"
              class="rounded-lg px-3 py-2.5 cursor-pointer"
              :class="{
                'border border-emerald-200 bg-emerald-50': phase.status === 'Submitted',
                'border border-rose-200 bg-rose-50': phase.status === 'Overdue',
                'border border-amber-200 bg-amber-50': phase.status === 'Not Submitted' && phase.dueDate,
                'border border-slate-200 bg-slate-50': phase.status === 'Not Submitted' && !phase.dueDate,
                'border border-blue-200 bg-blue-50': phase.status === 'Declared Not Needed',
              }"
              @click="goToSubmissions"
            >
              <p class="font-medium" :class="{
                'text-emerald-900': phase.status === 'Submitted',
                'text-rose-900': phase.status === 'Overdue',
                'text-amber-900': phase.status === 'Not Submitted' && phase.dueDate,
                'text-slate-900': phase.status === 'Not Submitted' && !phase.dueDate,
                'text-blue-900': phase.status === 'Declared Not Needed',
              }">
                {{ phase.phase }}
              </p>
              <p class="mt-0.5" :class="{
                'text-emerald-700': phase.status === 'Submitted',
                'text-rose-700': phase.status === 'Overdue',
                'text-amber-700': phase.status === 'Not Submitted' && phase.dueDate,
                'text-slate-600': phase.status === 'Not Submitted' && !phase.dueDate,
                'text-blue-700': phase.status === 'Declared Not Needed',
              }">
                <template v-if="phase.status === 'Submitted'">
                  Submitted {{ new Date(phase.submittedAt!).toLocaleDateString() }}
                </template>
                <template v-else-if="phase.status === 'Overdue'">
                  Overdue – please submit soon
                </template>
                <template v-else-if="phase.status === 'Declared Not Needed'">
                  Not required
                </template>
                <template v-else-if="phase.dueDate">
                  Due {{ new Date(phase.dueDate).toLocaleDateString() }}
                </template>
                <template v-else>
                  Not started
                </template>
              </p>
            </div>

            <!-- Loading state -->
            <template v-if="submissionStore.loading">
              <div class="h-14 animate-pulse rounded-lg bg-slate-100" />
              <div class="h-14 animate-pulse rounded-lg bg-slate-100" />
              <div class="h-14 animate-pulse rounded-lg bg-slate-100" />
            </template>

            <!-- Empty state -->
            <div v-if="submissionStore.phases.length === 0 && !submissionStore.loading" class="col-span-full text-xs text-slate-500 text-center py-4">
              No submission data available. You may not have an active assignment yet.
            </div>
          </div>
        </article>

        <!-- Recent feedback -->
        <article class="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm shadow-slate-200/70">
          <header class="flex items-center justify-between gap-2">
            <div>
              <h2 class="text-sm font-semibold text-slate-900">Recent supervisor feedback</h2>
              <p class="mt-1 text-xs text-slate-600">Latest comments from your supervisor.</p>
            </div>
          </header>

          <div v-if="loadingFeedback" class="mt-3 space-y-2">
            <div class="h-16 animate-pulse rounded-lg bg-slate-100" />
          </div>
          <div v-else-if="recentFeedback.length > 0" class="mt-3 space-y-3">
            <div
              v-for="fb in recentFeedback"
              :key="fb._id"
              class="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs"
            >
              <div class="flex items-center gap-2">
                <img
                  :src="`https://ui-avatars.com/api/?name=${encodeURIComponent(fb.supervisor_id?.fullName || 'S')}&background=0F172A&color=fff`"
                  alt="Supervisor avatar"
                  class="h-7 w-7 rounded-full object-cover"
                >
                <div>
                  <p class="font-medium text-slate-900">{{ fb.supervisor_id?.fullName ?? 'Supervisor' }}</p>
                  <p class="text-[11px] text-slate-500">
                    {{ fb.submission_id?.phase ?? '' }} · {{ new Date(fb.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }}
                  </p>
                </div>
              </div>
              <p class="mt-2 text-[11px] text-slate-700 leading-relaxed">{{ fb.feedbackText }}</p>

              <!-- Existing replies -->
              <div v-if="fb.replies?.length" class="mt-2 space-y-1.5 border-t border-slate-100 pt-2">
                <div
                  v-for="reply in fb.replies"
                  :key="reply._id"
                  class="flex items-start gap-2 rounded bg-slate-50 px-2 py-1.5"
                >
                  <img
                    :src="`https://ui-avatars.com/api/?name=${encodeURIComponent(reply.user_id?.fullName || 'U')}&background=${reply.user_id?.role === 'Supervisor' ? '0F172A' : '3B82F6'}&color=fff&size=24`"
                    class="h-5 w-5 rounded-full mt-0.5"
                  >
                  <div class="min-w-0 flex-1">
                    <p class="text-[11px]">
                      <span class="font-medium text-slate-900">{{ reply.user_id?.fullName ?? 'User' }}</span>
                      <span class="text-slate-400 ml-1">{{ new Date(reply.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }}</span>
                    </p>
                    <p class="text-[11px] text-slate-600">{{ reply.replyText }}</p>
                  </div>
                </div>
              </div>

              <!-- Reply toggle -->
              <div class="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  class="text-[11px] text-blue-600 hover:text-blue-800 font-medium"
                  @click="toggleReply(fb._id)"
                >
                  {{ replyingTo === fb._id ? 'Cancel' : 'Reply' }}
                </button>
              </div>

              <!-- Reply input -->
              <div v-if="replyingTo === fb._id" class="mt-2">
                <textarea
                  v-model="replyText"
                  rows="2"
                  class="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-[11px] text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                  placeholder="Write a reply…"
                />
                <div class="mt-1.5 flex justify-end">
                  <button
                    type="button"
                    :disabled="!replyText.trim() || submittingReply"
                    class="inline-flex items-center rounded-full bg-blue-600 px-3 py-1 text-[11px] font-medium text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    @click="submitReply(fb._id)"
                  >
                    {{ submittingReply ? 'Sending…' : 'Send reply' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <p v-else class="mt-3 text-xs text-slate-500">
            No feedback received yet. Your supervisor will leave comments after reviewing your submissions.
          </p>
        </article>
      </section>


    </main>

    <!-- Topic Change Request Modal -->
    <TopicChangeRequestModal
      :isOpen="isTopicChangeModalOpen"
      @close="closeTopicChangeModal"
      @submit="handleTopicChangeSubmit"
    />
  </div>
</template>

