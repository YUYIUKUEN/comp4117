<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useMeetingStore } from '@/stores/meetingStore'
import type { CreateSlotPayload } from '@/services/meetingService'

const authStore = useAuthStore()
const meetingStore = useMeetingStore()

const supervisor = computed(() => ({
  name: authStore.user?.fullName || 'Supervisor',
}))

// ─── Filter / View ───
const statusFilter = ref<string>('')
const viewMode = ref<'upcoming' | 'all'>('upcoming')

// ─── Create Slot Form ───
const showCreateForm = ref(false)
const form = ref<CreateSlotPayload & { meetingType: 'one-to-one' | 'group'; maxAttendees: number }>({
  title: '',
  description: '',
  date: '',
  startTime: '',
  endTime: '',
  location: '',
  meetingType: 'one-to-one',
  maxAttendees: 1,
})
const formError = ref('')
const formSuccess = ref('')

function resetForm() {
  form.value = {
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    meetingType: 'one-to-one',
    maxAttendees: 1,
  }
  formError.value = ''
  formSuccess.value = ''
}

async function handleCreateSlot() {
  formError.value = ''
  formSuccess.value = ''

  if (!form.value.title || !form.value.date || !form.value.startTime || !form.value.endTime) {
    formError.value = 'Please fill in all required fields'
    return
  }
  if (form.value.startTime >= form.value.endTime) {
    formError.value = 'End time must be after start time'
    return
  }

  try {
    await meetingStore.createSlot({
      title: form.value.title,
      description: form.value.description,
      date: form.value.date,
      startTime: form.value.startTime,
      endTime: form.value.endTime,
      location: form.value.location,
      meetingType: form.value.meetingType,
      maxAttendees: form.value.meetingType === 'one-to-one' ? 1 : form.value.maxAttendees,
    })
    formSuccess.value = 'Meeting slot created successfully!'
    resetForm()
    showCreateForm.value = false
    await meetingStore.fetchSupervisorSlots()
  } catch {
    formError.value = meetingStore.error || 'Failed to create slot'
  }
}

// ─── Actions ───
async function handleCancel(slotId: string) {
  if (!confirm('Are you sure you want to cancel this meeting slot? Booked students will be notified.')) return
  try {
    await meetingStore.deleteSlot(slotId)
    await meetingStore.fetchSupervisorSlots()
  } catch {
    // error shown via store
  }
}

async function handleComplete(slotId: string) {
  try {
    await meetingStore.completeSlot(slotId)
    await meetingStore.fetchSupervisorSlots()
  } catch {
    // error shown via store
  }
}

// ─── Computed slots ───
const filteredSlots = computed(() => {
  let slots = meetingStore.supervisorSlots
  if (statusFilter.value) {
    slots = slots.filter((s) => s.status === statusFilter.value)
  }
  if (viewMode.value === 'upcoming') {
    const now = new Date().toISOString().split('T')[0] || ''
    slots = slots.filter((s) => s.date >= now && s.status !== 'Cancelled')
  }
  return slots
})

const slotStats = computed(() => {
  const all = meetingStore.supervisorSlots
  return {
    total: all.length,
    available: all.filter((s) => s.status === 'Available').length,
    booked: all.filter((s) => s.status === 'Booked').length,
    completed: all.filter((s) => s.status === 'Completed').length,
    cancelled: all.filter((s) => s.status === 'Cancelled').length,
  }
})

// ─── Helpers ───
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function statusColor(status: string) {
  switch (status) {
    case 'Available': return 'bg-green-100 text-green-800'
    case 'Booked': return 'bg-blue-100 text-blue-800'
    case 'Completed': return 'bg-gray-100 text-gray-600'
    case 'Cancelled': return 'bg-red-100 text-red-700'
    default: return 'bg-gray-100 text-gray-600'
  }
}

onMounted(() => {
  meetingStore.fetchSupervisorSlots({ limit: 100, sortBy: 'date', order: 'asc' })
  meetingStore.fetchNotifications()
})
</script>

<template>
  <div class="bg-gray-50 min-h-full">
      <!-- Header -->
      <div class="bg-white border-b border-gray-200 px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-xl font-bold text-gray-900">Meeting Slots</h1>
            <p class="text-sm text-gray-500 mt-0.5">
              Propose time slots for your students &middot; {{ supervisor.name }}
            </p>
          </div>
          <div class="flex items-center gap-3">
            <!-- Notification badge -->
            <button
              v-if="meetingStore.hasUnread"
              class="relative inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              @click="meetingStore.markAllRead()"
            >
              🔔
              <span class="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {{ meetingStore.unreadCount }}
              </span>
            </button>
            <button
              class="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition"
              @click="showCreateForm = !showCreateForm"
            >
              {{ showCreateForm ? 'Close' : '+ New Slot' }}
            </button>
          </div>
        </div>
      </div>

      <div class="px-6 py-5 space-y-5">
        <!-- Stats Row -->
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div class="bg-white rounded-lg border border-gray-200 px-4 py-3 text-center">
            <p class="text-2xl font-bold text-gray-900">{{ slotStats.total }}</p>
            <p class="text-xs text-gray-500">Total</p>
          </div>
          <div class="bg-white rounded-lg border border-green-200 px-4 py-3 text-center">
            <p class="text-2xl font-bold text-green-700">{{ slotStats.available }}</p>
            <p class="text-xs text-gray-500">Available</p>
          </div>
          <div class="bg-white rounded-lg border border-blue-200 px-4 py-3 text-center">
            <p class="text-2xl font-bold text-blue-700">{{ slotStats.booked }}</p>
            <p class="text-xs text-gray-500">Booked</p>
          </div>
          <div class="bg-white rounded-lg border border-gray-200 px-4 py-3 text-center">
            <p class="text-2xl font-bold text-gray-500">{{ slotStats.completed }}</p>
            <p class="text-xs text-gray-500">Completed</p>
          </div>
          <div class="bg-white rounded-lg border border-red-200 px-4 py-3 text-center">
            <p class="text-2xl font-bold text-red-500">{{ slotStats.cancelled }}</p>
            <p class="text-xs text-gray-500">Cancelled</p>
          </div>
        </div>

        <!-- Create Slot Form -->
        <Transition name="slide">
          <div v-if="showCreateForm" class="bg-white rounded-xl border border-gray-200 p-5">
            <h2 class="text-base font-semibold text-gray-900 mb-4">Create New Meeting Slot</h2>

            <div v-if="formError" class="mb-3 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
              {{ formError }}
            </div>
            <div v-if="formSuccess" class="mb-3 rounded-lg bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700">
              {{ formSuccess }}
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input v-model="form.title" type="text" placeholder="e.g. Weekly Progress Check-in"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea v-model="form.description" rows="2" placeholder="Optional details about the meeting"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input v-model="form.date" type="date"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Start *</label>
                  <input v-model="form.startTime" type="time"
                    class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">End *</label>
                  <input v-model="form.endTime" type="time"
                    class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input v-model="form.location" type="text" placeholder="e.g. Room 301 or Zoom link"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Meeting Type</label>
                <select v-model="form.meetingType"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                  <option value="one-to-one">One-to-One</option>
                  <option value="group">Group</option>
                </select>
              </div>
              <div v-if="form.meetingType === 'group'">
                <label class="block text-sm font-medium text-gray-700 mb-1">Max Attendees</label>
                <input v-model.number="form.maxAttendees" type="number" min="2" max="50"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              </div>
            </div>

            <div class="mt-4 flex justify-end gap-2">
              <button class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                @click="showCreateForm = false; resetForm()">Cancel</button>
              <button
                class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                :disabled="meetingStore.loading"
                @click="handleCreateSlot()">
                {{ meetingStore.loading ? 'Creating...' : 'Create Slot' }}
              </button>
            </div>
          </div>
        </Transition>

        <!-- Filters -->
        <div class="flex items-center gap-3">
          <div class="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
            <button
              class="px-3 py-1.5 font-medium transition"
              :class="viewMode === 'upcoming' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'"
              @click="viewMode = 'upcoming'">Upcoming</button>
            <button
              class="px-3 py-1.5 font-medium transition"
              :class="viewMode === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'"
              @click="viewMode = 'all'">All</button>
          </div>
          <select v-model="statusFilter"
            class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
            <option value="">All statuses</option>
            <option value="Available">Available</option>
            <option value="Booked">Booked</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <!-- Error -->
        <div v-if="meetingStore.error" class="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {{ meetingStore.error }}
        </div>

        <!-- Loading -->
        <div v-if="meetingStore.loading" class="text-center py-12 text-gray-400">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
          <p class="text-sm">Loading meeting slots...</p>
        </div>

        <!-- Slot List -->
        <div v-else-if="filteredSlots.length === 0" class="text-center py-12">
          <p class="text-gray-400 text-sm">No meeting slots found.</p>
          <button class="mt-3 text-indigo-600 text-sm font-medium hover:underline" @click="showCreateForm = true">
            Create your first slot
          </button>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="slot in filteredSlots"
            :key="slot._id"
            class="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <h3 class="text-sm font-semibold text-gray-900 truncate">{{ slot.title }}</h3>
                  <span class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium" :class="statusColor(slot.status)">
                    {{ slot.status }}
                  </span>
                  <span class="text-[11px] text-gray-400 bg-gray-50 rounded-full px-2 py-0.5">
                    {{ slot.meetingType === 'one-to-one' ? '1:1' : `Group (max ${slot.maxAttendees})` }}
                  </span>
                </div>
                <p v-if="slot.description" class="text-xs text-gray-500 mt-1 line-clamp-1">{{ slot.description }}</p>
                <div class="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span>📅 {{ formatDate(slot.date) }}</span>
                  <span>🕐 {{ slot.startTime }} – {{ slot.endTime }}</span>
                  <span v-if="slot.location">📍 {{ slot.location }}</span>
                </div>

                <!-- Bookings -->
                <div v-if="slot.bookings && slot.bookings.length > 0" class="mt-3 border-t border-gray-100 pt-2">
                  <p class="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">
                    Bookings ({{ slot.bookings.length }}/{{ slot.maxAttendees }})
                  </p>
                  <div class="space-y-1">
                    <div
                      v-for="booking in slot.bookings"
                      :key="booking._id"
                      class="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-1.5"
                    >
                      <div class="flex items-center gap-2">
                        <div class="w-6 h-6 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                          {{ booking.student_id?.fullName?.charAt(0) || '?' }}
                        </div>
                        <div>
                          <p class="text-xs font-medium text-gray-800">{{ booking.student_id?.fullName || 'Unknown' }}</p>
                          <p class="text-[10px] text-gray-500">{{ booking.student_id?.email || '' }}</p>
                        </div>
                      </div>
                      <div class="text-[10px] text-gray-400">
                        {{ new Date(booking.bookedAt).toLocaleDateString() }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-1 shrink-0">
                <button
                  v-if="slot.status === 'Booked'"
                  class="rounded-lg bg-green-50 border border-green-200 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition"
                  @click="handleComplete(slot._id)"
                >✓ Complete</button>
                <button
                  v-if="slot.status === 'Available' || slot.status === 'Booked'"
                  class="rounded-lg bg-red-50 border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 transition"
                  @click="handleCancel(slot._id)"
                >Cancel</button>
              </div>
            </div>
          </div>
        </div>
      </div>
  </div>
</template>

<style scoped>
.slide-enter-active, .slide-leave-active {
  transition: all 0.25s ease;
}
.slide-enter-from, .slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
