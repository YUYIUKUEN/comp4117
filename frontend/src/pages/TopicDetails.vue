<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PencilIcon,
} from '@heroicons/vue/24/outline';

const router = useRouter();
const route = useRoute();

const studentId = parseInt(route.params.id as string) || 1;

// Mock topic data
const topicsMap = new Map([
  [1, {
    id: 1,
    studentName: 'Student Chan Hoi Ting',
    topic: 'Smart City Walkability in Kowloon East',
    abstract: 'This research explores pedestrian infrastructure and accessibility in Kowloon East, analyzing how smart city initiatives can improve walkability for diverse populations including elderly residents, people with disabilities, and families with young children.',
    objectives: [
      'To assess current pedestrian infrastructure in Kowloon East',
      'To identify gaps and barriers to walkability',
      'To evaluate smart city technologies that improve walkability',
      'To propose recommendations for policy makers',
    ],
    methodology: 'Mixed-methods approach combining quantitative pedestrian counts, qualitative interviews with local residents and stakeholders, and spatial analysis of infrastructure data. Field surveys will be conducted across 5 key districts in Kowloon East.',
    expectedOutcomes: [
      'Comprehensive walkability assessment report',
      'GIS-based maps of pedestrian infrastructure',
      'Policy recommendations for urban planners',
      'Academic publications in geography and urban planning journals',
    ],
    timeline: [
      { phase: 'Literature Review & Scoping', timeline: 'Jan-Feb 2025' },
      { phase: 'Stakeholder Engagement', timeline: 'Mar-Apr 2025' },
      { phase: 'Field Research & Data Collection', timeline: 'May-Jun 2025' },
      { phase: 'Analysis & Reporting', timeline: 'Jul-Aug 2025' },
      { phase: 'Dissemination & Final Review', timeline: 'Sep 2025' },
    ],
    status: 'Approved',
    submittedDate: '2025-01-15',
    approvedDate: '2025-01-20',
    supervisor: 'Dr. Emily Lee',
    supervisorEmail: 'emily.lee@edu.hk',
  }],
  [2, {
    id: 2,
    studentName: 'Student Lau Tsz Yan',
    topic: 'Urban Farming and Community Resilience in Sham Shui Po',
    abstract: 'An investigation into community-led urban farming initiatives and their contribution to neighborhood resilience in Sham Shui Po, examining social, economic, and environmental impacts. The research evaluates how these grassroots initiatives strengthen community bonds while improving food security and environmental sustainability.',
    objectives: [
      'To understand community-led urban farming initiatives in Sham Shui Po',
      'To assess their impact on food security and livelihood',
      'To evaluate social capital and community building outcomes',
      'To determine environmental benefits and sustainability practices',
      'To develop policy recommendations for municipal support',
    ],
    methodology: 'Ethnographic study with participant observation at 3 urban farms, semi-structured interviews with 20+ farmers and 30+ community members, participatory action research components, and environmental sampling.',
    expectedOutcomes: [
      'Ethnographic report documenting practices and impacts',
      'Social impact assessment framework',
      'Policy brief for municipal authorities',
      'Community resource guide',
      'Academic outputs for journals and conferences',
    ],
    timeline: [
      { phase: 'Site Selection & Community Access', timeline: 'Jan-Feb 2025' },
      { phase: 'Participant Observation & Interviews', timeline: 'Mar-Jun 2025' },
      { phase: 'Environmental Assessment', timeline: 'May-Jun 2025' },
      { phase: 'Data Analysis & Report Writing', timeline: 'Jul-Aug 2025' },
      { phase: 'Community Dissemination', timeline: 'Sep-Oct 2025' },
    ],
    status: 'Approved',
    submittedDate: '2025-01-10',
    approvedDate: '2025-01-12',
    supervisor: 'Dr. Emily Lee',
    supervisorEmail: 'emily.lee@edu.hk',
  }],
]);

const topic = computed(() => topicsMap.get(studentId) || topicsMap.get(1)!);

const isEditing = ref(false);

const navBack = () => {
  router.back();
};
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Header -->
    <header class="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur">
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        @click="navBack"
      >
        <ArrowLeftIcon class="h-6 w-6" />
      </button>
      <div>
        <p class="text-[11px] uppercase tracking-[0.2em] text-slate-500">My Topic</p>
        <p class="text-sm font-semibold text-slate-900">Topic Details</p>
      </div>
      <button
        type="button"
        class="ml-auto inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100"
      >
        <PencilIcon class="h-4 w-4" />
        Edit Topic
      </button>
    </header>

    <main class="max-w-4xl mx-auto px-4 sm:px-6 pb-6 pt-4 sm:pt-5">
      <!-- Status Banner -->
      <div v-if="topic.status === 'Approved'" class="mb-6 rounded-xl border border-emerald-300 bg-emerald-50 p-4">
        <div class="flex items-start gap-3">
          <CheckCircleIcon class="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 class="text-sm font-semibold text-emerald-900">Topic Approved</h3>
            <p class="text-sm text-emerald-800 mt-1">
              Your topic was approved on {{ topic.approvedDate }} by {{ topic.supervisor }}
            </p>
          </div>
        </div>
      </div>

      <!-- Topic Title Card -->
      <div class="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm mb-6">
        <div class="mb-4">
          <p class="text-xs text-slate-500 uppercase tracking-wide mb-2">Topic Title</p>
          <h1 class="text-2xl font-bold text-slate-900">{{ topic.topic }}</h1>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
          <div>
            <p class="text-xs text-slate-500 mb-1">Student</p>
            <p class="text-sm font-medium text-slate-900">{{ topic.studentName }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-500 mb-1">Supervisor</p>
            <p class="text-sm font-medium text-slate-900">{{ topic.supervisor }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-500 mb-1">Submitted</p>
            <p class="text-sm font-medium text-slate-900">{{ topic.submittedDate }}</p>
          </div>
        </div>
      </div>

      <!-- Abstract -->
      <div class="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm mb-6">
        <h2 class="text-lg font-semibold text-slate-900 mb-3">Abstract</h2>
        <p class="text-sm leading-relaxed text-slate-700">{{ topic.abstract }}</p>
      </div>

      <!-- Research Objectives -->
      <div class="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm mb-6">
        <h2 class="text-lg font-semibold text-slate-900 mb-3">Research Objectives</h2>
        <ul class="space-y-2">
          <li v-for="(obj, idx) in topic.objectives" :key="idx" class="flex gap-2 text-sm">
            <span class="text-slate-400 flex-shrink-0">{{ idx + 1 }}.</span>
            <span class="text-slate-700">{{ obj }}</span>
          </li>
        </ul>
      </div>

      <!-- Methodology -->
      <div class="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm mb-6">
        <h2 class="text-lg font-semibold text-slate-900 mb-3">Methodology</h2>
        <p class="text-sm leading-relaxed text-slate-700">{{ topic.methodology }}</p>
      </div>

      <!-- Expected Outcomes -->
      <div class="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm mb-6">
        <h2 class="text-lg font-semibold text-slate-900 mb-3">Expected Outcomes</h2>
        <ul class="space-y-2">
          <li v-for="(outcome, idx) in topic.expectedOutcomes" :key="idx" class="flex gap-2 text-sm">
            <CheckCircleIcon class="h-5 w-5 text-emerald-500 flex-shrink-0" />
            <span class="text-slate-700">{{ outcome }}</span>
          </li>
        </ul>
      </div>

      <!-- Timeline -->
      <div class="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm mb-6">
        <h2 class="text-lg font-semibold text-slate-900 mb-4">Research Timeline</h2>
        <div class="space-y-3">
          <div v-for="(item, idx) in topic.timeline" :key="idx" class="flex gap-4 items-start">
            <div class="flex flex-col items-center pt-1">
              <div class="h-8 w-8 rounded-full bg-blue-100 border-2 border-blue-500 flex items-center justify-center text-xs font-semibold text-blue-700">
                {{ idx + 1 }}
              </div>
              <div v-if="idx < topic.timeline.length - 1" class="h-8 w-0.5 bg-slate-200 mt-2"></div>
            </div>
            <div class="flex-1 pt-1 pb-3">
              <p class="font-medium text-slate-900 text-sm">{{ item.phase }}</p>
              <p class="text-xs text-slate-600 mt-0.5">{{ item.timeline }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Supervisor Notes -->
      <div class="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-slate-900 mb-3">Supervisor Notes</h2>
        <div class="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <p class="text-sm text-blue-900">
            "This is an excellent proposal with clear research questions and a well-structured methodology. The focus on community perspectives is commendable. I recommend proceeding with the data collection phase. Please ensure proper ethical clearance before field work begins."
          </p>
          <p class="text-xs text-blue-700 mt-2">— {{ topic.supervisor }}</p>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
</style>
