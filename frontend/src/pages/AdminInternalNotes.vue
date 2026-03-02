<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeftIcon,
  ShieldExclamationIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  AcademicCapIcon,
} from '@heroicons/vue/24/outline'
import feedbackService from '../services/feedbackService'

const router = useRouter()

interface InternalNoteItem {
  _id: string
  feedbackText: string
  internalNote: string
  grade?: string
  createdAt: string
  supervisor_id: {
    _id: string
    fullName: string
    email: string
  }
  submission_id: {
    _id: string
    phase: string
    student_id?: { _id: string; fullName: string; email: string }
    topic_id?: { _id: string; title: string }
  }
}

const notes = ref<InternalNoteItem[]>([])
const isLoading = ref(true)
const loadError = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const totalNotes = ref(0)

const fetchNotes = async (page = 1) => {
  isLoading.value = true
  loadError.value = ''
  try {
    const res = await feedbackService.getAdminInternalNotes(page, 20)
    notes.value = res.data as any
    currentPage.value = res.pagination.page
    totalPages.value = res.pagination.pages
    totalNotes.value = res.pagination.total
  } catch (e: any) {
    loadError.value = e?.response?.data?.error || 'Failed to load internal notes'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => fetchNotes())

const hasPrev = computed(() => currentPage.value > 1)
const hasNext = computed(() => currentPage.value < totalPages.value)
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Header -->
    <header
      class="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur"
    >
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        @click="router.push('/admin')"
      >
        <ArrowLeftIcon class="h-6 w-6" />
      </button>
      <div>
        <p class="text-[11px] uppercase tracking-[0.2em] text-slate-500">Admin</p>
        <p class="text-sm font-semibold text-slate-900">Internal Notes from Supervisors</p>
      </div>
      <span
        v-if="totalNotes > 0"
        class="ml-auto rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800"
      >
        {{ totalNotes }} note{{ totalNotes !== 1 ? 's' : '' }}
      </span>
    </header>

    <main class="max-w-5xl mx-auto px-4 sm:px-6 pb-8 pt-5">
      <!-- Info Banner -->
      <div class="mb-6 rounded-xl border-2 border-amber-300 bg-amber-50/70 p-4 flex items-start gap-3">
        <ShieldExclamationIcon class="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <p class="text-sm font-semibold text-amber-900">Confidential — Internal Use Only</p>
          <p class="text-xs text-amber-700 mt-1">
            These notes are written by supervisors for internal communication. They are never shown to students.
          </p>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <span class="loading loading-spinner loading-md text-blue-600"></span>
        <span class="ml-2 text-sm text-slate-600">Loading internal notes...</span>
      </div>

      <!-- Error -->
      <div
        v-else-if="loadError"
        class="rounded-xl border border-red-200 bg-red-50 p-5 text-center"
      >
        <p class="text-sm font-medium text-red-700">{{ loadError }}</p>
        <button
          @click="fetchNotes()"
          class="mt-3 text-sm text-blue-600 hover:underline"
        >
          Retry
        </button>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="notes.length === 0"
        class="rounded-xl border-2 border-dashed border-slate-300 bg-white p-10 text-center"
      >
        <ChatBubbleLeftRightIcon class="h-10 w-10 mx-auto text-slate-400" />
        <p class="mt-3 text-sm font-medium text-slate-600">No internal notes yet</p>
        <p class="text-xs text-slate-500 mt-1">
          When supervisors leave internal notes on their feedback forms, they will appear here.
        </p>
      </div>

      <!-- Notes List -->
      <div v-else class="space-y-4">
        <div
          v-for="note in notes"
          :key="note._id"
          class="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
        >
          <!-- Note Header -->
          <div class="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
            <div class="flex items-center gap-2 text-sm">
              <UserIcon class="h-4 w-4 text-slate-500" />
              <span class="font-medium text-slate-900">
                {{ note.supervisor_id?.fullName || 'Unknown Supervisor' }}
              </span>
            </div>
            <span class="text-slate-300">•</span>
            <div class="flex items-center gap-2 text-sm">
              <AcademicCapIcon class="h-4 w-4 text-slate-500" />
              <span class="text-slate-700">
                {{ note.submission_id?.student_id?.fullName || 'Unknown Student' }}
              </span>
            </div>
            <span class="text-slate-300">•</span>
            <span class="text-xs text-slate-500">
              {{ new Date(note.createdAt).toLocaleDateString() }}
            </span>
            <span
              v-if="note.submission_id?.phase"
              class="ml-auto rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-semibold text-blue-800 uppercase tracking-wide"
            >
              {{ note.submission_id.phase }}
            </span>
          </div>

          <!-- Note Body -->
          <div class="px-4 py-4 space-y-3">
            <!-- Internal Note (highlighted) -->
            <div class="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p class="text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-1">
                Internal Note
              </p>
              <p class="text-sm text-slate-800 whitespace-pre-wrap">{{ note.internalNote }}</p>
            </div>

            <!-- Context: feedback + grade -->
            <div class="text-xs text-slate-500 space-y-1">
              <p v-if="note.submission_id?.topic_id?.title">
                <strong class="text-slate-700">Topic:</strong> {{ note.submission_id.topic_id.title }}
              </p>
              <p v-if="note.grade">
                <strong class="text-slate-700">Grade Given:</strong>
                <span class="font-semibold text-blue-600">{{ note.grade }}</span>
              </p>
              <details class="mt-2">
                <summary class="cursor-pointer text-slate-500 hover:text-slate-700 text-xs">
                  View student-facing feedback
                </summary>
                <p class="mt-2 text-sm text-slate-600 whitespace-pre-wrap bg-slate-50 rounded p-2 border border-slate-200">
                  {{ note.feedbackText }}
                </p>
              </details>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div
        v-if="totalPages > 1"
        class="mt-6 flex items-center justify-center gap-4"
      >
        <button
          @click="fetchNotes(currentPage - 1)"
          :disabled="!hasPrev"
          class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span class="text-sm text-slate-600">
          Page {{ currentPage }} of {{ totalPages }}
        </span>
        <button
          @click="fetchNotes(currentPage + 1)"
          :disabled="!hasNext"
          class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </main>
  </div>
</template>

<style scoped>
</style>
