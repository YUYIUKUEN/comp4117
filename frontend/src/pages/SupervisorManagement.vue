<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/vue/24/outline';
import assignmentService from '@/services/assignmentService';
import httpClient from '@/services/httpClient';

const router = useRouter();
const sidebarOpen = ref(false);
const activeTab = ref('students'); // 'students', 'proposals', 'feedback'
const isLoading = ref(false);
const errorMessage = ref('');

// ── Students (from assignments API) ─────────────────────────────
const assignments = ref<any[]>([]);

const supervisedStudents = computed(() => {
  return assignments.value
    .filter((a: any) => a.student_id && a.topic_id)
    .map((a: any) => ({
      id: a._id,
      name: a.student_id.fullName,
      email: a.student_id.email || '—',
      topic: a.topic_id?.title || 'No Topic',
      status: a.status === 'Active' ? 'Active' : a.status === 'Completed' ? 'Completed' : 'In Progress',
      progress: a.status === 'Completed' ? 100 : a.status === 'Active' ? 50 : 0,
    }));
});

const fetchStudents = async () => {
  try {
    const response = await assignmentService.getSupervisorAssignments({ limit: 100, page: 1 });
    assignments.value = response.data;
  } catch (error: any) {
    console.error('Failed to fetch students:', error);
  }
};

// ── Topics (from topics API) ────────────────────────────────────
const topicProposals = ref<any[]>([]);

const fetchTopics = async () => {
  try {
    const response = await httpClient.get('/topics/supervisor/topics');
    const topics = response.data.data || response.data || [];
    topicProposals.value = topics.map((t: any) => ({
      id: t._id,
      title: t.title,
      description: t.description,
      concentration: t.concentration || '—',
      status: t.status === 'Active' ? 'Published' : t.status,
      applicants: t.currentApplications || 0,
      createdAt: t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—',
    }));
  } catch (error: any) {
    console.error('Failed to fetch topics:', error);
  }
};

// ── Feedback (from submissions API) ─────────────────────────────
const feedbackItems = ref<any[]>([]);

const fetchFeedback = async () => {
  try {
    const response = await httpClient.get('/submissions/supervisor/submissions');
    const subs = response.data.data || [];

    const items: any[] = [];
    for (const sub of subs) {
      let feedbacks: any[] = [];
      try {
        const fbRes = await httpClient.get(`/feedback/submissions/${sub._id}/feedback`);
        feedbacks = fbRes.data.data || [];
      } catch { /* no feedback yet */ }

      items.push({
        id: sub._id,
        studentName: sub.student_id?.fullName || 'Unknown Student',
        topic: sub.topic_id?.title || 'Unknown Topic',
        feedbackType: sub.phase || 'Submission',
        status: feedbacks.length > 0 ? 'Completed' : (sub.status === 'Submitted' ? 'Pending' : sub.status),
        dueDate: sub.dueDate ? new Date(sub.dueDate).toLocaleDateString() : '—',
      });
    }
    feedbackItems.value = items;
  } catch (error: any) {
    console.error('Failed to fetch feedback:', error);
  }
};

// ── Load data on mount ──────────────────────────────────────────
onMounted(async () => {
  isLoading.value = true;
  await Promise.all([fetchStudents(), fetchTopics(), fetchFeedback()]);
  isLoading.value = false;
});

const handleBack = () => {
  router.push('/supervisor/dashboard');
};

const handleAddTopic = () => {
  router.push('/supervisor/topics');
};

const handleEditTopic = (topicId: string) => {
  router.push(`/supervisor/topics?edit=${topicId}`);
};

const handleViewStudent = (studentId: string) => {
  router.push(`/supervisor/feedback-grading?student=${studentId}`);
};

const handleProvideFeedback = (submissionId: string) => {
  router.push(`/supervisor/feedback-form?id=${submissionId}`);
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
            Supervision
          </p>
          <p class="text-sm font-semibold text-slate-900">
            Students, Topics & Feedback
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
          My Students
        </button>
        <button
          @click="activeTab = 'proposals'"
          :class="[
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'proposals'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          ]"
        >
          Topic Proposals
        </button>
        <button
          @click="activeTab = 'feedback'"
          :class="[
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'feedback'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          ]"
        >
          Feedback & Reviews
        </button>
      </div>

      <!-- My Students Tab -->
      <section v-if="activeTab === 'students'" class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 class="text-sm font-semibold text-slate-900">
              Supervised Students
            </h2>
            <p class="mt-1 text-xs text-slate-500">
              Students assigned to you for FYP supervision.
            </p>
          </div>
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

        <!-- Loading State -->
        <div v-if="isLoading" class="py-8 text-center text-sm text-slate-500">Loading students...</div>

        <!-- Empty State -->
        <div v-else-if="supervisedStudents.length === 0" class="py-8 text-center">
          <p class="text-sm font-medium text-slate-900">No supervised students yet</p>
          <p class="mt-1 text-xs text-slate-500">Students will appear here once they are assigned to your topics.</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full text-xs">
            <thead class="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th scope="col" class="px-4 py-3 text-left font-medium">
                  Student Name
                </th>
                <th scope="col" class="px-4 py-3 text-left font-medium">
                  Topic
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
              <tr v-for="student in supervisedStudents" :key="student.id" class="hover:bg-slate-50">
                <td class="px-4 py-3">
                  <div>
                    <p class="font-medium text-slate-900">{{ student.name }}</p>
                    <p class="text-[11px] text-slate-500">{{ student.email }}</p>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <p class="text-slate-600 line-clamp-2">{{ student.topic }}</p>
                </td>
                <td class="px-4 py-3">
                  <span
                    :class="[
                      'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5',
                      student.status === 'Active'
                        ? 'border-emerald-500/50 bg-emerald-50 text-emerald-700'
                        : student.status === 'Completed'
                          ? 'border-blue-500/50 bg-blue-50 text-blue-700'
                          : 'border-amber-500/50 bg-amber-50 text-amber-700'
                    ]"
                  >
                    <span
                      class="h-1.5 w-1.5 rounded-full"
                      :class="student.status === 'Active' ? 'bg-emerald-500' : student.status === 'Completed' ? 'bg-blue-500' : 'bg-amber-500'"
                    />
                    {{ student.status }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right">
                  <button
                    @click="handleViewStudent(student.id)"
                    class="text-blue-600 hover:text-blue-700 text-xs font-medium"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Topic Proposals Tab -->
      <section v-if="activeTab === 'proposals'" class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 class="text-sm font-semibold text-slate-900">
              Topic Proposals
            </h2>
            <p class="mt-1 text-xs text-slate-500">
              Manage and publish your FYP topic proposals for students.
            </p>
          </div>
          <button
            @click="handleAddTopic"
            type="button"
            class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            <PlusIcon class="h-4 w-4" />
            New Topic
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="py-8 text-center text-sm text-slate-500">Loading topics...</div>

        <!-- Empty State -->
        <div v-else-if="topicProposals.length === 0" class="py-8 text-center">
          <p class="text-sm font-medium text-slate-900">No topics yet</p>
          <p class="mt-1 text-xs text-slate-500">Create your first FYP topic proposal for students.</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="proposal in topicProposals"
            :key="proposal.id"
            class="border border-slate-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <h3 class="font-semibold text-slate-900">{{ proposal.title }}</h3>
                <p class="mt-1 text-xs text-slate-600">{{ proposal.description }}</p>
                <div class="mt-3 flex items-center gap-4 text-xs">
                  <span class="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 text-slate-600">
                    {{ proposal.concentration }}
                  </span>
                  <span class="text-slate-500">
                    Created {{ proposal.createdAt }}
                  </span>
                  <span class="text-slate-500">
                    {{ proposal.applicants }} applicants
                  </span>
                </div>
              </div>
              <div class="flex flex-col items-end gap-2">
                <span
                  :class="[
                    'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                    proposal.status === 'Published'
                      ? 'border-emerald-500/50 bg-emerald-50 text-emerald-700'
                      : 'border-amber-500/50 bg-amber-50 text-amber-700'
                  ]"
                >
                  <CheckCircleIcon v-if="proposal.status === 'Published'" class="h-3 w-3" />
                  <ClockIcon v-else class="h-3 w-3" />
                  {{ proposal.status }}
                </span>
                <button
                  @click="handleEditTopic(proposal.id)"
                  class="text-blue-600 hover:text-blue-700 text-xs font-medium"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Feedback & Reviews Tab -->
      <section v-if="activeTab === 'feedback'" class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 class="text-sm font-semibold text-slate-900">
              Feedback & Reviews
            </h2>
            <p class="mt-1 text-xs text-slate-500">
              Progress reports and feedback items for your students.
            </p>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="py-8 text-center text-sm text-slate-500">Loading feedback...</div>

        <!-- Empty State -->
        <div v-else-if="feedbackItems.length === 0" class="py-8 text-center">
          <p class="text-sm font-medium text-slate-900">No feedback items</p>
          <p class="mt-1 text-xs text-slate-500">Feedback items will appear once students submit their work.</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="item in feedbackItems"
            :key="item.id"
            class="border border-slate-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <h3 class="font-semibold text-slate-900">{{ item.feedbackType }}</h3>
                <p class="mt-1 text-xs text-slate-600">{{ item.studentName }}</p>
                <p class="text-xs text-slate-500 line-clamp-1">Topic: {{ item.topic }}</p>
                <p class="mt-2 text-xs text-slate-500">
                  Due: {{ item.dueDate }}
                </p>
              </div>
              <div class="flex flex-col items-end gap-2">
                <span
                  :class="[
                    'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                    item.status === 'Completed'
                      ? 'border-emerald-500/50 bg-emerald-50 text-emerald-700'
                      : 'border-amber-500/50 bg-amber-50 text-amber-700'
                  ]"
                >
                  {{ item.status }}
                </span>
                <button
                  @click="handleProvideFeedback(item.id)"
                  class="text-blue-600 hover:text-blue-700 text-xs font-medium"
                >
                  {{ item.status === 'Completed' ? 'View' : 'Provide Feedback' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
</style>
