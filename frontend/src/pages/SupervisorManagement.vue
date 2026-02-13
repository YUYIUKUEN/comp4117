<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/vue/24/outline';

const router = useRouter();
const sidebarOpen = ref(false);
const activeTab = ref('students'); // 'students', 'proposals', 'feedback'

const supervisedStudents = ref([
  {
    id: 1,
    name: 'Student Chan Hoi Ting',
    email: 'chan.ht@student.edu.hk',
    programme: 'BSocSc Geography',
    topic: 'Smart City Walkability in Kowloon East',
    status: 'Active',
    progress: 65,
  },
  {
    id: 2,
    name: 'Student Ho Pui Kwan',
    email: 'ho.pk@student.edu.hk',
    programme: 'BSocSc Sociology',
    topic: 'Digital Platforms and Youth Political Participation',
    status: 'In Progress',
    progress: 45,
  },
  {
    id: 3,
    name: 'Student Lee Man Kei',
    email: 'lee.mk@student.edu.hk',
    programme: 'BA English',
    topic: 'Literary Analysis and Digital Storytelling',
    status: 'Active',
    progress: 80,
  },
]);

const topicProposals = ref([
  {
    id: 1,
    title: 'Smart City Walkability in Kowloon East',
    description: 'Analysis of urban planning and pedestrian accessibility',
    concentration: 'Urban Studies',
    status: 'Published',
    applicants: 5,
    createdAt: '2025-01-15',
  },
  {
    id: 2,
    title: 'Digital Transformation in Non-Profit Organizations',
    description: 'How digital tools can enhance nonprofit effectiveness',
    concentration: 'Social Sector',
    status: 'Draft',
    applicants: 0,
    createdAt: '2025-02-01',
  },
  {
    id: 3,
    title: 'Environmental Sustainability and Corporate Responsibility',
    description: 'Corporate strategies for environmental sustainability',
    concentration: 'Sustainability',
    status: 'Published',
    applicants: 8,
    createdAt: '2025-01-20',
  },
]);

const feedbackItems = ref([
  {
    id: 1,
    studentName: 'Student Chan Hoi Ting',
    topic: 'Smart City Walkability in Kowloon East',
    feedbackType: 'Progress Report Review',
    status: 'Pending',
    dueDate: '2025-02-20',
  },
  {
    id: 2,
    studentName: 'Student Ho Pui Kwan',
    topic: 'Digital Platforms and Youth Political Participation',
    feedbackType: 'Midterm Review',
    status: 'Completed',
    dueDate: '2025-02-10',
  },
  {
    id: 3,
    studentName: 'Student Lee Man Kei',
    topic: 'Literary Analysis and Digital Storytelling',
    feedbackType: 'Progress Report Review',
    status: 'Pending',
    dueDate: '2025-02-25',
  },
]);

const handleBack = () => {
  router.push('/supervisor/dashboard');
};

const handleAddTopic = () => {
  console.log('Add topic');
};

const handleEditTopic = (topicId: number) => {
  console.log('Edit topic', topicId);
};

const handleViewStudent = (studentId: number) => {
  console.log('View student', studentId);
};

const handleProvideFeedback = (feedbackId: number) => {
  console.log('Provide feedback', feedbackId);
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
      <!-- Navigation Tabs -->
      <div class="mb-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
        <button
          @click="router.push('/supervisor/dashboard')"
          class="p-3 rounded-lg border-2 border-slate-200 bg-white hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
        >
          <p class="text-xs font-semibold text-slate-900">Dashboard</p>
          <p class="text-[10px] text-slate-500 mt-1">Overview & stats</p>
        </button>
        <button
          @click="router.push('/supervisor/topics')"
          class="p-3 rounded-lg border-2 border-slate-200 bg-white hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
        >
          <p class="text-xs font-semibold text-slate-900">Topics</p>
          <p class="text-[10px] text-slate-500 mt-1">Manage topics</p>
        </button>
        <button
          @click="router.push('/supervisor/management')"
          class="p-3 rounded-lg border-2 border-blue-500 bg-blue-50 transition-colors text-left"
        >
          <p class="text-xs font-semibold text-blue-900">Management</p>
          <p class="text-[10px] text-blue-600 mt-1">Current view</p>
        </button>
      </div>

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

        <div class="overflow-x-auto">
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
                  Progress
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
                  <div class="flex items-center gap-2">
                    <div class="w-16 bg-slate-200 rounded-full h-1.5">
                      <div
                        class="bg-blue-500 h-1.5 rounded-full"
                        :style="{ width: student.progress + '%' }"
                      ></div>
                    </div>
                    <span class="text-[11px] text-slate-600">{{ student.progress }}%</span>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <span
                    :class="[
                      'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5',
                      student.status === 'Active'
                        ? 'border-emerald-500/50 bg-emerald-50 text-emerald-700'
                        : 'border-blue-500/50 bg-blue-50 text-blue-700'
                    ]"
                  >
                    <span
                      class="h-1.5 w-1.5 rounded-full"
                      :class="student.status === 'Active' ? 'bg-emerald-500' : 'bg-blue-500'"
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

        <div class="space-y-3">
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

        <div class="space-y-3">
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
