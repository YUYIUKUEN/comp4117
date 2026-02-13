<script setup lang="ts">
import { ref } from 'vue';
import {
  XMarkIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline';

defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  close: [];
  submit: [data: { newTopic: string; reason: string }];
}>();

const newTopic = ref('');
const reason = ref('');
const submitted = ref(false);

const handleSubmit = () => {
  if (newTopic.trim() && reason.trim()) {
    emit('submit', {
      newTopic: newTopic.value,
      reason: reason.value,
    });
    submitted.value = true;
    setTimeout(() => {
      newTopic.value = '';
      reason.value = '';
      submitted.value = false;
      emit('close');
    }, 2000);
  }
};

const handleClose = () => {
  if (!submitted.value) {
    emit('close');
  }
};
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
    <!-- Backdrop -->
    <div
      class="fixed inset-0 bg-black/40 backdrop-blur-sm"
      @click="handleClose"
    />

    <!-- Modal -->
    <div
      class="relative z-50 w-full sm:w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-lg sm:shadow-2xl p-4 sm:p-6"
    >
      <!-- Header -->
      <div class="flex items-start justify-between gap-3 mb-4">
        <div class="flex items-center gap-3">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
            <ExclamationTriangleIcon class="h-5 w-5 text-amber-600" />
          </div>
          <h2 class="text-sm font-semibold text-slate-900">
            Request Topic Change
          </h2>
        </div>
        <button
          type="button"
          @click="handleClose"
          class="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        >
          <XMarkIcon class="h-5 w-5" />
        </button>
      </div>

      <!-- Success Message -->
      <div v-if="submitted" class="mb-4 rounded-lg border border-green-200 bg-green-50 p-3">
        <p class="text-sm font-medium text-green-800">
          ✓ Topic change request submitted successfully
        </p>
        <p class="mt-1 text-xs text-green-700">
          Your supervisor will review your request and contact you soon.
        </p>
      </div>

      <!-- Form -->
      <div v-if="!submitted" class="space-y-4">
        <p class="text-xs text-slate-600">
          Topic changes require supervisor approval. Please provide details about your new topic and reason for the change.
        </p>

        <!-- New Topic Field -->
        <div>
          <label
            for="new-topic"
            class="block text-xs font-medium text-slate-900 mb-2"
          >
            Proposed New Topic
          </label>
          <textarea
            id="new-topic"
            v-model="newTopic"
            placeholder="Enter your proposed new topic..."
            rows="3"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <p class="mt-1 text-[11px] text-slate-500">
            Be specific about your new research direction or topic.
          </p>
        </div>

        <!-- Reason Field -->
        <div>
          <label
            for="reason"
            class="block text-xs font-medium text-slate-900 mb-2"
          >
            Reason for Change
          </label>
          <textarea
            id="reason"
            v-model="reason"
            placeholder="Explain why you're requesting this change..."
            rows="3"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <p class="mt-1 text-[11px] text-slate-500">
            Help your supervisor understand your reasoning.
          </p>
        </div>

        <!-- Warning -->
        <div class="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p class="text-[11px] font-medium text-amber-900">
            ⚠ Topic changes may delay your project timeline
          </p>
          <p class="mt-1 text-[11px] text-amber-800">
            Your supervisor must approve this change. You may need to adjust your deadlines and submission schedule.
          </p>
        </div>

        <!-- Buttons -->
        <div class="flex gap-3 pt-2">
          <button
            type="button"
            @click="handleClose"
            class="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="handleSubmit"
            :disabled="!newTopic.trim() || !reason.trim()"
            class="flex-1 rounded-lg border border-blue-500 bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Submit Request
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
