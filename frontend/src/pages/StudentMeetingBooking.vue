<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useMeetingStore } from '@/stores/meetingStore'
import type { MeetingSlot } from '@/services/meetingService'

const authStore = useAuthStore()
const meetingStore = useMeetingStore()

const student = computed(() => ({
  name: authStore.user?.fullName || 'Student',
}))

// ─── UI State ───
const selectedSlot = ref<MeetingSlot | null>(null)
const selectedTimeSlotIndex = ref<number | null>(null)
const bookingNotes = ref('')
const showBookingModal = ref(false)
const actionLoading = ref(false)
const successMsg = ref('')
const tabFilter = ref<'available' | 'myBookings' | 'all'>('available')

// ─── Computed ───
const filteredSlots = computed(() => {
  const slots = meetingStore.studentSlots
  switch (tabFilter.value) {
    case 'available':
      return slots.filter((s) => s.status === 'Available')
    case 'myBookings':
      return slots.filter((s) => s.myBooking)
    case 'all':
    default:
      return slots
  }
})

const stats = computed(() => {
  const all = meetingStore.studentSlots
  return {
    available: all.filter((s) => s.status === 'Available').length,
    myBookings: all.filter((s) => s.myBooking).length,
    total: all.length,
  }
})

// ─── Actions ───
function openBookingModal(slot: MeetingSlot) {
  selectedSlot.value = slot
  selectedTimeSlotIndex.value = null
  bookingNotes.value = ''
  showBookingModal.value = true
  successMsg.value = ''
}

async function confirmBooking() {
  if (!selectedSlot.value) return
  
  // If slot has multiple timeSlots, require selection
  if (selectedSlot.value.timeSlots && selectedSlot.value.timeSlots.length > 0) {
    if (selectedTimeSlotIndex.value === null) {
      alert('Please select a time slot')
      return
    }
  }
  
  actionLoading.value = true
  successMsg.value = ''
  try {
    await meetingStore.bookSlot(selectedSlot.value._id, bookingNotes.value || undefined, selectedTimeSlotIndex.value ?? undefined)
    successMsg.value = `Successfully booked "${selectedSlot.value.title}"!`
    showBookingModal.value = false
    await meetingStore.fetchAvailableSlots()
  } catch {
    // error visible via store
  } finally {
    actionLoading.value = false
  }
}

async function handleCancelBooking(slotId: string) {
  if (!confirm('Cancel your booking for this slot?')) return
  actionLoading.value = true
  try {
    await meetingStore.cancelBooking(slotId)
    successMsg.value = 'Booking cancelled.'
  } catch {
    // error visible via store
  } finally {
    actionLoading.value = false
  }
}

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

function supervisorName(slot: MeetingSlot) {
  if (typeof slot.supervisor_id === 'object' && slot.supervisor_id?.fullName) {
    return slot.supervisor_id.fullName
  }
  return 'Supervisor'
}

function getTimeSlotDisplay(slot: MeetingSlot): string {
  if (slot.timeSlots && slot.timeSlots.length > 0) {
    if (slot.timeSlots.length === 1) {
      const ts = slot.timeSlots[0]!
      return `${ts.startTime} – ${ts.endTime}`
    }
    return `${slot.timeSlots.length} time slots available`
  }
  return `${slot.startTime || '--'} – ${slot.endTime || '--'}`
}

function getBookedTimeSlot(slot: MeetingSlot): string | null {
  if (!slot.myBooking) return null
  if (slot.timeSlots && slot.timeSlots.length > 0 && slot.myBooking.timeSlotIndex !== undefined && slot.myBooking.timeSlotIndex !== null) {
    const ts = slot.timeSlots[slot.myBooking.timeSlotIndex]
    if (ts) {
      return `${ts.startTime} – ${ts.endTime}`
    }
  }
  return null
}

onMounted(() => {
  meetingStore.fetchAvailableSlots()
  meetingStore.fetchNotifications()
})
</script>

<template>
  <div class="bg-gray-50 min-h-full">
      <!-- Header -->
      <div class="bg-white border-b border-gray-200 px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-xl font-bold text-gray-900">Meeting Bookings</h1>
            <p class="text-sm text-gray-500 mt-0.5">
              Book meetings with your supervisor &middot; {{ student.name }}
            </p>
          </div>
          <div class="flex items-center gap-3">
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
          </div>
        </div>
      </div>

      <div class="px-6 py-5 space-y-5">
        <!-- Success message -->
        <div v-if="successMsg" class="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 flex items-center justify-between">
          <span>{{ successMsg }}</span>
          <button class="text-green-400 hover:text-green-600" @click="successMsg = ''">✕</button>
        </div>

        <!-- Stats Row -->
        <div class="grid grid-cols-3 gap-3">
          <div class="bg-white rounded-lg border border-green-200 px-4 py-3 text-center cursor-pointer hover:shadow-sm transition" @click="tabFilter = 'available'">
            <p class="text-2xl font-bold text-green-700">{{ stats.available }}</p>
            <p class="text-xs text-gray-500">Available Slots</p>
          </div>
          <div class="bg-white rounded-lg border border-blue-200 px-4 py-3 text-center cursor-pointer hover:shadow-sm transition" @click="tabFilter = 'myBookings'">
            <p class="text-2xl font-bold text-blue-700">{{ stats.myBookings }}</p>
            <p class="text-xs text-gray-500">My Bookings</p>
          </div>
          <div class="bg-white rounded-lg border border-gray-200 px-4 py-3 text-center cursor-pointer hover:shadow-sm transition" @click="tabFilter = 'all'">
            <p class="text-2xl font-bold text-gray-700">{{ stats.total }}</p>
            <p class="text-xs text-gray-500">All Slots</p>
          </div>
        </div>

        <!-- Tabs -->
        <div class="flex rounded-lg border border-gray-300 overflow-hidden text-sm w-fit">
          <button
            class="px-4 py-1.5 font-medium transition"
            :class="tabFilter === 'available' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'"
            @click="tabFilter = 'available'">Available</button>
          <button
            class="px-4 py-1.5 font-medium transition"
            :class="tabFilter === 'myBookings' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'"
            @click="tabFilter = 'myBookings'">My Bookings</button>
          <button
            class="px-4 py-1.5 font-medium transition"
            :class="tabFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'"
            @click="tabFilter = 'all'">All</button>
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

        <!-- Empty -->
        <div v-else-if="filteredSlots.length === 0" class="text-center py-12">
          <p class="text-gray-400 text-sm">
            <template v-if="tabFilter === 'available'">No available meeting slots right now.</template>
            <template v-else-if="tabFilter === 'myBookings'">You haven't booked any meetings yet.</template>
            <template v-else>No meeting slots from your supervisor yet.</template>
          </p>
        </div>

        <!-- Slot Cards -->
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
                  <span v-if="slot.myBooking" class="inline-flex items-center rounded-full bg-indigo-100 text-indigo-700 px-2 py-0.5 text-[11px] font-medium">
                    ✓ You booked this
                  </span>
                  <span class="text-[11px] text-gray-400 bg-gray-50 rounded-full px-2 py-0.5">
                    {{ slot.meetingType === 'one-to-one' ? '1:1' : `Group (${slot.bookings?.length || 0}/${slot.maxAttendees})` }}
                  </span>
                </div>
                <p v-if="slot.description" class="text-xs text-gray-500 mt-1">{{ slot.description }}</p>
                <div class="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span>📅 {{ formatDate(slot.date) }}</span>
                  <span v-if="slot.myBooking && getBookedTimeSlot(slot)" class="text-indigo-600 font-medium">
                    🕐 {{ getBookedTimeSlot(slot) }}
                  </span>
                  <span v-else>🕐 {{ getTimeSlotDisplay(slot) }}</span>
                  <span v-if="slot.location">📍 {{ slot.location }}</span>
                  <span>👤 {{ supervisorName(slot) }}</span>
                </div>
              </div>

              <!-- Actions -->
              <div class="shrink-0 flex items-center gap-2">
                <button
                  v-if="slot.status === 'Available' && !slot.myBooking"
                  class="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-700 transition"
                  @click="openBookingModal(slot)"
                >Book</button>
                <button
                  v-if="slot.myBooking && slot.status !== 'Completed' && slot.status !== 'Cancelled'"
                  class="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 transition"
                  @click="handleCancelBooking(slot._id)"
                >Cancel Booking</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Notifications Section -->
        <div v-if="meetingStore.notifications.length > 0" class="mt-6">
          <h2 class="text-base font-semibold text-gray-900 mb-3">Recent Notifications</h2>
          <div class="space-y-2">
            <div
              v-for="notif in meetingStore.notifications.slice(0, 5)"
              :key="notif._id"
              class="bg-white rounded-lg border px-4 py-3 text-sm"
              :class="notif.read ? 'border-gray-200' : 'border-indigo-200 bg-indigo-50'"
            >
              <div class="flex items-start justify-between">
                <div>
                  <p class="font-medium text-gray-900">{{ notif.title }}</p>
                  <p class="text-xs text-gray-500 mt-0.5">{{ notif.message }}</p>
                </div>
                <span class="text-[10px] text-gray-400 whitespace-nowrap ml-3">
                  {{ new Date(notif.createdAt).toLocaleDateString() }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

    <!-- Booking Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showBookingModal && selectedSlot" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showBookingModal = false">
          <div class="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-5">
            <h2 class="text-base font-semibold text-gray-900 mb-1">Confirm Booking</h2>
            <p class="text-xs text-gray-500 mb-4">You are about to book the following meeting slot:</p>

            <div class="bg-gray-50 rounded-lg p-3 mb-4 text-sm space-y-1">
              <p><span class="font-medium text-gray-700">Meeting:</span> {{ selectedSlot.title }}</p>
              <p><span class="font-medium text-gray-700">Date:</span> {{ formatDate(selectedSlot.date) }}</p>
              <p v-if="selectedSlot.location"><span class="font-medium text-gray-700">Location:</span> {{ selectedSlot.location }}</p>
              <p><span class="font-medium text-gray-700">Type:</span> {{ selectedSlot.meetingType === 'one-to-one' ? 'One-to-One' : 'Group' }}</p>
            </div>

            <!-- Time Slot Selection (if multiple slots available) -->
            <div v-if="selectedSlot.timeSlots && selectedSlot.timeSlots.length > 0" class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Select Time Slot *</label>
              <div class="space-y-2">
                <button
                  v-for="(slot, idx) in selectedSlot.timeSlots"
                  :key="idx"
                  @click="selectedTimeSlotIndex = idx"
                  :class="[
                    'w-full rounded-lg border-2 p-3 text-sm font-medium transition',
                    selectedTimeSlotIndex === idx
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  ]"
                >
                  {{ slot.startTime }} – {{ slot.endTime }}
                </button>
              </div>
            </div>

            <!-- Single time slot display (if only legacy slot) -->
            <div v-else-if="selectedSlot.startTime" class="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
              <p><span class="font-medium text-gray-700">Time:</span> {{ selectedSlot.startTime }} – {{ selectedSlot.endTime }}</p>
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <textarea
                v-model="bookingNotes"
                rows="2"
                placeholder="Any specific topics you'd like to discuss..."
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div v-if="meetingStore.error" class="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
              {{ meetingStore.error }}
            </div>

            <div class="flex justify-end gap-2">
              <button
                class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                @click="showBookingModal = false"
              >Cancel</button>
              <button
                class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition"
                :disabled="actionLoading"
                @click="confirmBooking()"
              >{{ actionLoading ? 'Booking...' : 'Confirm Booking' }}</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
