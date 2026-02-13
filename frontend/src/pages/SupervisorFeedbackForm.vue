<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  ArrowLeftIcon,
  CheckIcon,
} from '@heroicons/vue/24/outline';
import { useGradingStandards } from '../composables/useGradingStandards';
import type { GradingStandard } from '../composables/useGradingStandards';

const router = useRouter();
const route = useRoute();
const { gradingStandards } = useGradingStandards();

const submissionId = parseInt(route.query.id as string) || 1;

// Test data for submissions
const submissionsMap = new Map([
  [1, {
    id: 1,
    studentName: 'Student Chan Hoi Ting',
    topic: 'Smart City Walkability in Kowloon East',
    assignmentType: 'Progress Report',
    submissionDate: '2025-02-13',
    submissionContent: `This progress report provides an overview of my research on smart city walkability in Kowloon East.\n\nResearch Completed:\n- Literature review on urban planning and walkability metrics\n- Analysis of existing infrastructure in Kowloon East\n- Interviews with 5 local residents\n\nFindings So Far:\n- Poor pedestrian connectivity in commercial areas\n- Limited seating and resting areas for elderly pedestrians\n- Insufficient signage for public facilities\n\nNext Steps:\n- Conduct more interviews (target 10 more)\n- Develop recommendations for improvement\n- Create walkability improvement proposal`,
  }],
  [2, {
    id: 2,
    studentName: 'Student Ho Pui Kwan',
    topic: 'Digital Platforms and Youth Political Participation',
    assignmentType: 'Final Presentation',
    submissionDate: '2025-02-12',
    submissionContent: `Presentation Summary: This research explores how digital platforms influence youth political engagement.\n\nKey Points:\n- Survey of 200+ youth participants\n- Analysis of social media trends\n- Impact assessment of digital activism\n\nFindings:\n- Significant correlation between platform usage and participation\n- TikTok and Instagram are primary channels\n- Need for improved digital literacy\n\nRecommendations:\n- Educational programs on digital engagement\n- Platform policy improvements\n- Further longitudinal studies`,
  }],
  [3, {
    id: 3,
    studentName: 'Student Lee Man Kei',
    topic: 'Literary Analysis and Digital Storytelling',
    assignmentType: 'Final Report',
    submissionDate: '2025-02-10',
    submissionContent: `This final report examines the intersection of classical literary analysis and modern digital storytelling.\n\nChapter 1: Literature Review\n- Classical narrative structures\n- Digital media evolution\n- Hybrid storytelling approaches\n\nChapter 2: Analysis\n- Case studies of 5 contemporary digital narratives\n- Application of traditional literary criticism\n- New frameworks for digital analysis\n\nConclusion:\n- Literature remains relevant in digital age\n- New methodologies emerging\n- Future directions for study`,
  }],
  [4, {
    id: 4,
    studentName: 'Student Chen Wei',
    topic: 'AI Applications in Healthcare',
    assignmentType: 'Proposal Review',
    submissionDate: '2025-02-08',
    submissionContent: `Research Proposal: AI Applications in Healthcare\n\nObjective:\nExplore practical applications of machine learning in medical diagnosis and treatment planning.\n\nProposed Methods:\n- Deep learning models for image analysis\n- Natural language processing for patient records\n- Predictive analytics for patient outcomes\n\nExpected Outcomes:\n- Improved diagnostic accuracy\n- Reduced treatment planning time\n- Better patient outcome predictions\n\nEthical Considerations:\n- Data privacy and security\n- Algorithm bias mitigation\n- Clinical validation requirements`,
  }],
  [5, {
    id: 5,
    studentName: 'Student Wong Man Ho',
    topic: 'Climate Change Resilience',
    assignmentType: 'Progress Report',
    submissionDate: '2025-02-05',
    submissionContent: `Progress Report: Climate Change Resilience in Urban Areas\n\nPhase 1 Completed:\n- Literature review on climate resilience\n- Mapping of vulnerable areas in Hong Kong\n- Stakeholder interviews (10 completed)\n\nPhase 2 In Progress:\n- Data analysis of climate patterns\n- Resilience assessment framework development\n- Policy review and recommendations\n\nKey Findings:\n- Coastal areas most vulnerable\n- Infrastructure improvements needed\n- Community engagement crucial\n\nNext Phase:\n- Complete stakeholder interviews (target 20)\n- Finalize resilience framework\n- Develop policy recommendations`,
  }],
]);

const submission = ref(submissionsMap.get(submissionId) || submissionsMap.get(1)!);

const feedbackText = ref('');
const selectedGrade = ref('');
const pointsInput = ref('');
const isSaving = ref(false);

// Get the grading standard for this submission type
const applicableStandard = computed<GradingStandard | undefined>(() => {
  return gradingStandards.value.find(
    (gs) => gs.submissionType === submission.value.assignmentType && gs.enabled
  );
});

// Validation
const isValid = computed(() => {
  if (!feedbackText.value.trim()) return false;
  
  if (!applicableStandard.value) return false;

  if (applicableStandard.value.gradingSystem === 'point-range') {
    const points = parseInt(pointsInput.value);
    const min = applicableStandard.value.pointRange?.min || 0;
    const max = applicableStandard.value.pointRange?.max || 100;
    return !isNaN(points) && points >= min && points <= max;
  }

  if (applicableStandard.value.gradingSystem === 'letter-grade') {
    return applicableStandard.value.letterGrades?.includes(selectedGrade.value) || false;
  }

  if (applicableStandard.value.gradingSystem === 'custom') {
    return applicableStandard.value.customOptions?.includes(selectedGrade.value) || false;
  }

  return false;
});


const handleSaveFeedback = async () => {
  if (!feedbackText.value.trim()) {
    alert('Please add feedback');
    return;
  }

  if (!applicableStandard.value) {
    alert('No grading standard found for this submission type');
    return;
  }

  // Validate grade based on grading system
  if (applicableStandard.value.gradingSystem === 'point-range') {
    if (!pointsInput.value) {
      alert('Please enter a point value');
      return;
    }
    const points = parseInt(pointsInput.value);
    const min = applicableStandard.value.pointRange?.min || 0;
    const max = applicableStandard.value.pointRange?.max || 100;
    if (isNaN(points) || points < min || points > max) {
      alert(`Please enter a value between ${min} and ${max}`);
      return;
    }
  } else if (!selectedGrade.value) {
    alert('Please select a grade');
    return;
  }

  isSaving.value = true;
  setTimeout(() => {
    const gradeValue = applicableStandard.value?.gradingSystem === 'point-range' 
      ? pointsInput.value 
      : selectedGrade.value;

    console.log('Saved feedback:', {
      submissionId: submission.value.id,
      studentName: submission.value.studentName,
      feedback: feedbackText.value,
      grade: gradeValue,
      gradingSystem: applicableStandard.value?.gradingSystem,
      submissionType: submission.value.assignmentType,
    });
    alert('Feedback and grade saved successfully!');
    isSaving.value = false;
    router.back();
  }, 500);
};

const handleCancel = () => {
  router.back();
};
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <header class="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur">
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        @click="handleCancel"
      >
        <ArrowLeftIcon class="h-6 w-6" />
      </button>
      <div>
        <p class="text-[11px] uppercase tracking-[0.2em] text-slate-500">Feedback Form</p>
        <p class="text-sm font-semibold text-slate-900">Add Feedback & Grade</p>
      </div>
      <button
        @click="router.push('/supervisor')"
        class="ml-auto text-xs font-medium text-blue-600 hover:text-blue-700 px-3 py-2 rounded hover:bg-blue-50"
      >
        Back to Menu
      </button>
    </header>

    <main class="max-w-4xl mx-auto px-4 sm:px-6 pb-6 pt-4 sm:pt-5">
      <!-- Submission Details -->
      <div class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm mb-6">
        <div class="mb-4">
          <p class="text-xs font-semibold text-blue-600 uppercase tracking-wide">{{ submission.assignmentType }}</p>
          <h2 class="text-lg font-semibold text-slate-900 mt-2">{{ submission.studentName }}</h2>
          <p class="text-sm text-slate-600 mt-1">{{ submission.topic }}</p>
          <p class="text-xs text-slate-500 mt-2">Submitted: {{ submission.submissionDate }}</p>
        </div>

        <div class="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <h3 class="text-sm font-semibold text-slate-900 mb-2">Submission Content:</h3>
          <p class="text-sm text-slate-700 whitespace-pre-wrap">{{ submission.submissionContent }}</p>
        </div>
      </div>

      <!-- Error State: No Grading Standard -->
      <div v-if="!applicableStandard" class="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 sm:p-5 mb-6">
        <h3 class="text-sm font-semibold text-amber-900 mb-2">No Grading Standard Configured</h3>
        <p class="text-sm text-amber-800">
          The administrator has not set up a grading standard for "{{ submission.assignmentType }}". 
          Please contact the admin to configure the grading standard first.
        </p>
      </div>

      <!-- Feedback & Grading Form -->
      <div v-else class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm mb-6">
        <h3 class="text-lg font-semibold text-slate-900 mb-4">Provide Feedback & Grade</h3>

        <!-- Grading Standard Info -->
        <div class="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p class="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Grading Standard</p>
          <p class="text-sm text-slate-900 font-medium">{{ applicableStandard.submissionType }}</p>
          <p v-if="applicableStandard.description" class="text-xs text-slate-600 mt-1">
            {{ applicableStandard.description }}
          </p>
        </div>

        <!-- Feedback Text -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-slate-900 mb-2">
            Feedback Comments *
          </label>
          <textarea
            v-model="feedbackText"
            placeholder="Write your detailed feedback here... Include strengths, areas for improvement, and suggestions."
            class="block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
            rows="6"
          ></textarea>
        </div>

        <!-- Grade Input - Point Range -->
        <div v-if="applicableStandard.gradingSystem === 'point-range'" class="mb-6">
          <label class="block text-sm font-medium text-slate-900 mb-2">
            Points *
          </label>
          <div class="flex gap-2 items-end">
            <input
              v-model.number="pointsInput"
              type="number"
              :min="applicableStandard.pointRange?.min"
              :max="applicableStandard.pointRange?.max"
              :placeholder="`Enter points (${applicableStandard.pointRange?.min} - ${applicableStandard.pointRange?.max})`"
              class="block flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/60"
            />
            <div class="px-4 py-2 bg-slate-100 rounded-lg border border-slate-300 font-medium text-slate-600 whitespace-nowrap">
              / {{ applicableStandard.pointRange?.max }}
            </div>
          </div>
          <p v-if="pointsInput && pointsInput >= (applicableStandard.pointRange?.min || 0) && pointsInput <= (applicableStandard.pointRange?.max || 100)" 
            class="text-xs text-slate-600 mt-2">
            Percentage: <span class="font-semibold text-blue-600">{{ ((pointsInput / (applicableStandard.pointRange?.max || 100)) * 100).toFixed(1) }}%</span>
          </p>
          <p v-if="pointsInput && (pointsInput < (applicableStandard.pointRange?.min || 0) || pointsInput > (applicableStandard.pointRange?.max || 100))" 
            class="text-xs text-red-600 mt-2">
            Invalid: Must be between {{ applicableStandard.pointRange?.min }} - {{ applicableStandard.pointRange?.max }}
          </p>
        </div>

        <!-- Grade Input - Letter Grade -->
        <div v-else-if="applicableStandard.gradingSystem === 'letter-grade'" class="mb-6">
          <label class="block text-sm font-medium text-slate-900 mb-3">
            Grade *
          </label>
          <div class="grid grid-cols-5 gap-2">
            <button
              v-for="grade in applicableStandard.letterGrades"
              :key="grade"
              @click="selectedGrade = grade"
              type="button"
              :class="[
                'py-2 px-1 rounded-lg font-semibold text-sm transition',
                selectedGrade === grade
                  ? 'bg-blue-600 text-white border border-blue-600'
                  : 'border border-slate-300 bg-white text-slate-900 hover:border-blue-500 hover:bg-blue-50'
              ]"
            >
              {{ grade }}
            </button>
          </div>
        </div>

        <!-- Grade Input - Custom Options -->
        <div v-else-if="applicableStandard.gradingSystem === 'custom'" class="mb-6">
          <label class="block text-sm font-medium text-slate-900 mb-3">
            Grade *
          </label>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              v-for="option in applicableStandard.customOptions"
              :key="option"
              @click="selectedGrade = option"
              type="button"
              :class="[
                'py-2 px-3 rounded-lg font-medium text-sm transition',
                selectedGrade === option
                  ? 'bg-blue-600 text-white border border-blue-600'
                  : 'border border-slate-300 bg-white text-slate-900 hover:border-blue-500 hover:bg-blue-50'
              ]"
            >
              {{ option }}
            </button>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3">
          <button
            @click="handleSaveFeedback"
            :disabled="isSaving || !isValid"
            class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckIcon class="h-5 w-5" />
            {{ isSaving ? 'Saving...' : 'Save Feedback & Grade' }}
          </button>
          <button
            @click="handleCancel"
            class="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </div>

      <!-- Preview of Current Feedback -->
      <div v-if="submission.currentFeedback || submission.currentGrade" class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <h3 class="text-lg font-semibold text-slate-900 mb-4">Current Feedback</h3>
        <div v-if="submission.currentGrade" class="mb-4">
          <p class="text-sm text-slate-600">Current Grade:</p>
          <p class="text-2xl font-bold text-slate-900">{{ submission.currentGrade }}</p>
        </div>
        <div v-if="submission.currentFeedback">
          <p class="text-sm text-slate-600 mb-2">Current Feedback:</p>
          <p class="text-sm text-slate-700 whitespace-pre-wrap">{{ submission.currentFeedback }}</p>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
</style>
