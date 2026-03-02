<script setup lang="ts">
import { ref, onMounted } from 'vue';
import feedbackService, { type FeedbackItem } from '../services/feedbackService';

const feedbackItems = ref<FeedbackItem[]>([]);
const loading = ref(true);

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
    const fb = feedbackItems.value.find(f => f._id === feedbackId);
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

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const avatarUrl = (name: string, bg = '0F172A') => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff`;
};

onMounted(async () => {
  try {
    const data = await feedbackService.getStudentRecentFeedback(50);
    feedbackItems.value = data;
  } catch (e) {
    console.error('Feedback fetch error:', e);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div>
    <main class="px-4 sm:px-6 pb-6 pt-4 sm:pt-5">
      <!-- Header -->
      <section class="mb-6">
        <h1 class="text-2xl font-bold text-slate-900">Feedback Received</h1>
        <p class="mt-1 text-sm text-slate-600">
          All feedback and grades from your supervisor
        </p>
      </section>

      <!-- Loading -->
      <section v-if="loading" class="space-y-4">
        <div v-for="i in 3" :key="i" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 animate-pulse rounded-full bg-slate-200" />
            <div class="space-y-1">
              <div class="h-4 w-32 animate-pulse rounded bg-slate-200" />
              <div class="h-3 w-24 animate-pulse rounded bg-slate-200" />
            </div>
          </div>
          <div class="mt-3 h-4 w-48 animate-pulse rounded bg-slate-200" />
          <div class="mt-2 h-16 animate-pulse rounded bg-slate-100" />
        </div>
      </section>

      <!-- Feedback Items -->
      <section v-else-if="feedbackItems.length > 0" class="space-y-4">
        <div
          v-for="feedback in feedbackItems"
          :key="feedback._id"
          class="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm shadow-slate-200/70"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <!-- Supervisor info -->
              <div class="flex items-center gap-3">
                <img
                  :src="avatarUrl(feedback.supervisor_id?.fullName || 'S', '7C3AED')"
                  alt="Supervisor avatar"
                  class="h-10 w-10 rounded-full object-cover"
                >
                <div>
                  <p class="font-medium text-slate-900">{{ feedback.supervisor_id?.fullName ?? 'Supervisor' }}</p>
                  <p class="text-xs text-slate-500">
                    Supervisor · {{ formatDate(feedback.createdAt) }}
                  </p>
                </div>
              </div>

              <!-- Phase / subject -->
              <h3 class="mt-3 text-sm font-semibold text-slate-900">
                {{ feedback.submission_id?.phase ?? 'Submission' }} – Feedback
              </h3>

              <!-- Feedback content -->
              <p class="mt-2 text-sm text-slate-700 leading-relaxed">
                {{ feedback.feedbackText }}
              </p>

              <!-- Existing replies -->
              <div v-if="feedback.replies?.length" class="mt-4 space-y-2 border-t border-slate-100 pt-3">
                <p class="text-xs font-medium text-slate-500 uppercase tracking-wide">Replies</p>
                <div
                  v-for="reply in feedback.replies"
                  :key="reply._id"
                  class="flex items-start gap-2.5 rounded-lg bg-slate-50 px-3 py-2"
                >
                  <img
                    :src="avatarUrl(reply.user_id?.fullName || 'U', reply.user_id?.role === 'Supervisor' ? '7C3AED' : '3B82F6')"
                    class="h-7 w-7 rounded-full mt-0.5"
                  >
                  <div class="min-w-0 flex-1">
                    <p class="text-xs">
                      <span class="font-medium text-slate-900">{{ reply.user_id?.fullName ?? 'User' }}</span>
                      <span class="text-slate-400 ml-1.5">{{ formatDate(reply.createdAt) }}</span>
                    </p>
                    <p class="mt-0.5 text-xs text-slate-600 leading-relaxed">{{ reply.replyText }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Reply button -->
            <button
              type="button"
              class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 shrink-0"
              @click="toggleReply(feedback._id)"
            >
              {{ replyingTo === feedback._id ? 'Cancel' : 'Reply' }}
            </button>
          </div>

          <!-- Reply input area -->
          <div v-if="replyingTo === feedback._id" class="mt-4 border-t border-slate-100 pt-3">
            <textarea
              v-model="replyText"
              rows="3"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none placeholder:text-slate-400"
              placeholder="Write your reply…"
            />
            <div class="mt-2 flex justify-end">
              <button
                type="button"
                :disabled="!replyText.trim() || submittingReply"
                class="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                @click="submitReply(feedback._id)"
              >
                {{ submittingReply ? 'Sending…' : 'Send Reply' }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Empty State -->
      <div v-else class="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center">
        <p class="text-sm text-slate-600">No feedback received yet</p>
        <p class="mt-1 text-xs text-slate-500">Your supervisor will leave comments after reviewing your submissions.</p>
      </div>
    </main>
  </div>
</template>
