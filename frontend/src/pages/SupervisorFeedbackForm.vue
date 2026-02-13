<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  ArrowLeftIcon,
  CheckIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline';

const router = useRouter();
const route = useRoute();

const submissionId = route.query.id || '1';

const submission = ref({
  id: submissionId,
  studentName: 'Student Chan Hoi Ting',
  topic: 'Smart City Walkability in Kowloon East',
  assignmentType: 'Progress Report 1',
  submissionDate: '2025-02-13',
  submissionContent: `
    This progress report provides an overview of my research on smart city walkability in Kowloon East.
    
    Research Completed:
    - Literature review on urban planning and walkability metrics
    - Analysis of existing infrastructure in Kowloon East
    - Interviews with 5 local residents
    
    Findings So Far:
    - Poor pedestrian connectivity in commercial areas
    - Limited seating and resting areas for elderly pedestrians
    - Insufficient signage for public facilities
    
    Next Steps:
    - Conduct more interviews (target 10 more)
    - Develop recommendations for improvement
    - Create walkability improvement proposal
  `,
  currentFeedback: null,
  currentGrade: null,
});

const feedbackText = ref('');
const gradeSystem = ref('points'); // 'points' | 'custom'
const maxPoints = ref(100);
const earnedPoints = ref('');
const customGradeName = ref('');
const useGradeScale = ref(true);

// Predefined grade scales
const gradeScales = ref([
  {
    name: 'Standard Letter Grades (A-F)',
    grades: [
      { label: 'A', minPoints: 90, maxPoints: 100, description: 'Excellent' },
      { label: 'B', minPoints: 80, maxPoints: 89, description: 'Very Good' },
      { label: 'C', minPoints: 70, maxPoints: 79, description: 'Good' },
      { label: 'D', minPoints: 60, maxPoints: 69, description: 'Satisfactory' },
      { label: 'F', minPoints: 0, maxPoints: 59, description: 'Needs Improvement' },
    ]
  },
  {
    name: 'HD/D/C/P/F Scale',
    grades: [
      { label: 'HD', minPoints: 85, maxPoints: 100, description: 'High Distinction' },
      { label: 'D', minPoints: 75, maxPoints: 84, description: 'Distinction' },
      { label: 'C', minPoints: 65, maxPoints: 74, description: 'Credit' },
      { label: 'P', minPoints: 50, maxPoints: 64, description: 'Pass' },
      { label: 'F', minPoints: 0, maxPoints: 49, description: 'Fail' },
    ]
  },
  {
    name: 'Percentage (0-100)',
    grades: [
      { label: '90-100%', minPoints: 90, maxPoints: 100, description: 'Outstanding' },
      { label: '80-89%', minPoints: 80, maxPoints: 89, description: 'Excellent' },
      { label: '70-79%', minPoints: 70, maxPoints: 79, description: 'Good' },
      { label: '60-69%', minPoints: 60, maxPoints: 69, description: 'Satisfactory' },
      { label: 'Below 60%', minPoints: 0, maxPoints: 59, description: 'Needs Work' },
    ]
  },
]);

const customGrades = ref([
  { label: '', minPoints: '', maxPoints: '', description: '' }
]);

const selectedScale = ref('0'); // Index of selected scale

const isSaving = ref(false);

const addCustomGradeRow = () => {
  customGrades.value.push({ label: '', minPoints: '', maxPoints: '', description: '' });
};

const removeCustomGradeRow = (index: number) => {
  customGrades.value.splice(index, 1);
};

const getGradeFromPoints = (points: number) => {
  const scale = gradeScales.value[parseInt(selectedScale.value)];
  const grade = scale.grades.find(g => points >= g.minPoints && points <= g.maxPoints);
  return grade ? grade.label : 'N/A';
};

const getCustomGradeFromPoints = (points: number) => {
  const grade = customGrades.value.find(g => 
    points >= parseInt(g.minPoints) && points <= parseInt(g.maxPoints)
  );
  return grade ? grade.label : 'N/A';
};

const handleSaveFeedback = async () => {
  if (!feedbackText.value) {
    alert('Please add feedback');
    return;
  }

  if (gradeSystem.value === 'points' && !earnedPoints.value) {
    alert('Please enter the earned points');
    return;
  }

  if (useGradeScale.value) {
    let gradeLabel = '';
    if (gradeSystem.value === 'points') {
      const points = parseInt(earnedPoints.value);
      if (gradeSystem.value === 'custom') {
        gradeLabel = getCustomGradeFromPoints(points);
      } else {
        gradeLabel = getGradeFromPoints(points);
      }
    } else {
      gradeLabel = customGradeName.value;
    }

    if (!gradeLabel || gradeLabel === 'N/A') {
      alert('Please select a valid grade');
      return;
    }
  }

  isSaving.value = true;
  setTimeout(() => {
    console.log('Saved feedback:', {
      submissionId: submission.value.id,
      feedback: feedbackText.value,
      gradeSystem: gradeSystem.value,
      earnedPoints: earnedPoints.value,
      maxPoints: maxPoints.value,
      customGradeName: customGradeName.value,
      customGrades: customGrades.value,
    });
    alert('Feedback saved successfully!');
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

      <!-- Feedback Form -->
      <div class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm mb-6">
        <h3 class="text-lg font-semibold text-slate-900 mb-4">Provide Feedback</h3>

        <!-- Feedback Text -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-slate-900 mb-2">
            Feedback Comments
          </label>
          <textarea
            v-model="feedbackText"
            placeholder="Write your detailed feedback here... Include strengths, areas for improvement, and suggestions."
            class="block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
            rows="6"
          ></textarea>
        </div>

        <!-- Grading System Type Selection -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-slate-900 mb-3">Grading Method</label>
          <div class="space-y-2">
            <label class="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors"
              :class="gradeSystem === 'points' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'">
              <input type="radio" v-model="gradeSystem" value="points" class="w-4 h-4" />
              <span class="font-medium text-slate-900">Points-Based Grading</span>
            </label>
            <label class="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors"
              :class="gradeSystem === 'custom' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'">
              <input type="radio" v-model="gradeSystem" value="custom" class="w-4 h-4" />
              <span class="font-medium text-slate-900">Custom Grade Name</span>
            </label>
          </div>
        </div>

        <!-- Points-Based Grading Section -->
        <div v-if="gradeSystem === 'points'" class="space-y-4 mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <!-- Max Points Input -->
          <div>
            <label class="block text-sm font-medium text-slate-900 mb-1">Maximum Points</label>
            <input v-model.number="maxPoints" type="number" min="1" 
              class="block w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/60"
              placeholder="e.g., 100" />
          </div>

          <!-- Earned Points Input -->
          <div>
            <label class="block text-sm font-medium text-slate-900 mb-1">Earned Points</label>
            <div class="flex gap-2">
              <input v-model.number="earnedPoints" type="number" :max="maxPoints" min="0" 
                class="block flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/60"
                placeholder="e.g., 85" />
              <div class="flex items-center px-3 py-2 bg-white rounded-lg font-medium text-slate-700 border border-slate-300">
                / {{ maxPoints }}
              </div>
            </div>
            <p v-if="earnedPoints" class="text-xs text-slate-600 mt-1">
              Percentage: <span class="font-semibold text-blue-600">{{ ((earnedPoints / maxPoints) * 100).toFixed(1) }}%</span>
            </p>
          </div>

          <!-- Predefined Scale Selector -->
          <div>
            <label class="block text-sm font-medium text-slate-900 mb-1">Apply Grade Scale (Optional)</label>
            <select v-model="selectedScale" 
              class="block w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/60">
              <option value="0">Standard Letter Grades (A-F)</option>
              <option value="1">HD/D/C/P/F Scale</option>
              <option value="2">Percentage (0-100)</option>
            </select>
          </div>

          <!-- Display Selected Scale -->
          <div v-if="useGradeScale" class="pt-2 space-y-2">
            <p class="text-xs font-medium text-slate-700">Grade Breakdown:</p>
            <div class="space-y-1">
              <div v-for="(grade, idx) in gradeScales[parseInt(selectedScale)].grades" :key="idx"
                class="flex items-center justify-between p-2 bg-white rounded text-xs">
                <div class="flex gap-2">
                  <span class="font-semibold text-slate-900">{{ grade.label }}</span>
                  <span class="text-slate-600">({{ grade.minPoints }}-{{ grade.maxPoints }})</span>
                </div>
                <span class="text-slate-500">{{ grade.description }}</span>
              </div>
            </div>
            <div v-if="earnedPoints" class="mt-2 p-2 bg-white border border-blue-300 rounded text-xs font-medium text-blue-900">
              Assigned Grade: <span class="text-blue-700 font-bold">{{ getGradeFromPoints(parseInt(earnedPoints)) }}</span>
            </div>
          </div>

          <!-- Custom Grade Scale Editor -->
          <div class="pt-4 border-t border-blue-300">
            <div class="flex items-center justify-between mb-2">
              <label class="block text-sm font-medium text-slate-900">Create Custom Scale</label>
              <button @click="addCustomGradeRow"
                class="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition">
                <PlusIcon class="w-4 h-4" />
                Add Grade
              </button>
            </div>
            <div class="space-y-2">
              <div v-for="(grade, idx) in customGrades" :key="idx" class="flex gap-2 items-end">
                <input v-model="grade.label" type="text" placeholder="Label (A, 90%)" 
                  class="px-2 py-1 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-500" />
                <input v-model.number="grade.minPoints" type="number" placeholder="Min" 
                  class="w-16 px-2 py-1 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-500" />
                <span class="text-slate-500">-</span>
                <input v-model.number="grade.maxPoints" type="number" placeholder="Max" 
                  class="w-16 px-2 py-1 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-500" />
                <input v-model="grade.description" type="text" placeholder="Description" 
                  class="flex-1 px-2 py-1 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-500" />
                <button v-show="customGrades.length > 1" @click="removeCustomGradeRow(idx)"
                  class="px-2 py-1 text-red-600 hover:bg-red-50 rounded transition">
                  <XMarkIcon class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Custom Grade Name Section -->
        <div v-if="gradeSystem === 'custom'" class="space-y-4 mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div>
            <label class="block text-sm font-medium text-slate-900 mb-1">Grade Label</label>
            <input v-model="customGradeName" type="text" placeholder="e.g., Excellent, Good, Pass, HD, 5/5"
              class="block w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/60" />
          </div>
          <p class="text-xs text-slate-600">Enter any custom grade name or label for this submission</p>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3">
          <button
            @click="handleSaveFeedback"
            :disabled="isSaving"
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
