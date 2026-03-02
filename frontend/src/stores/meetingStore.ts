import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import meetingService, {
  type MeetingSlot,
  type MeetingNotification,
  type CreateSlotPayload,
} from '@/services/meetingService'

export const useMeetingStore = defineStore('meeting', () => {
  // ─── State ───
  const supervisorSlots = ref<MeetingSlot[]>([])
  const studentSlots = ref<MeetingSlot[]>([])
  const notifications = ref<MeetingNotification[]>([])
  const unreadCount = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({ page: 1, limit: 20, total: 0, pages: 0 })

  // ─── Computed ───
  const availableSlots = computed(() =>
    studentSlots.value.filter((s) => s.status === 'Available')
  )
  const bookedSlots = computed(() =>
    studentSlots.value.filter((s) => s.status === 'Booked')
  )
  const myBookedSlots = computed(() =>
    studentSlots.value.filter((s) => s.myBooking)
  )
  const completedSlots = computed(() =>
    studentSlots.value.filter((s) => s.status === 'Completed')
  )
  const hasUnread = computed(() => unreadCount.value > 0)

  // ─── Supervisor Actions ───
  async function fetchSupervisorSlots(params?: {
    status?: string
    page?: number
    limit?: number
    sortBy?: string
    order?: string
  }) {
    loading.value = true
    error.value = null
    try {
      const res = await meetingService.getSupervisorSlots(params)
      supervisorSlots.value = res.data
      pagination.value = res.pagination
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to load meeting slots'
      console.error('fetchSupervisorSlots error:', err)
    } finally {
      loading.value = false
    }
  }

  async function createSlot(payload: CreateSlotPayload) {
    loading.value = true
    error.value = null
    try {
      const res = await meetingService.createSlot(payload)
      supervisorSlots.value.unshift(res.data)
      return res.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to create meeting slot'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createSlotsBatch(slots: CreateSlotPayload[]) {
    loading.value = true
    error.value = null
    try {
      const res = await meetingService.createSlotsBatch(slots)
      supervisorSlots.value.unshift(...res.data)
      return res.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to create meeting slots'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateSlot(slotId: string, payload: Partial<CreateSlotPayload>) {
    error.value = null
    try {
      const res = await meetingService.updateSlot(slotId, payload)
      const idx = supervisorSlots.value.findIndex((s) => s._id === slotId)
      if (idx !== -1) supervisorSlots.value[idx] = res.data
      return res.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to update slot'
      throw err
    }
  }

  async function deleteSlot(slotId: string) {
    error.value = null
    try {
      await meetingService.deleteSlot(slotId)
      supervisorSlots.value = supervisorSlots.value.filter((s) => s._id !== slotId)
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to cancel slot'
      throw err
    }
  }

  async function completeSlot(slotId: string) {
    error.value = null
    try {
      const res = await meetingService.completeSlot(slotId)
      const idx = supervisorSlots.value.findIndex((s) => s._id === slotId)
      if (idx !== -1) supervisorSlots.value[idx] = res.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to complete slot'
      throw err
    }
  }

  // ─── Student Actions ───
  async function fetchAvailableSlots() {
    loading.value = true
    error.value = null
    try {
      const res = await meetingService.getAvailableSlots()
      studentSlots.value = res.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to load available slots'
      console.error('fetchAvailableSlots error:', err)
    } finally {
      loading.value = false
    }
  }

  async function bookSlot(slotId: string, notes?: string) {
    error.value = null
    try {
      const res = await meetingService.bookSlot(slotId, notes)
      const idx = studentSlots.value.findIndex((s) => s._id === slotId)
      if (idx !== -1) studentSlots.value[idx] = res.data
      return res.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to book slot'
      throw err
    }
  }

  async function cancelBooking(slotId: string) {
    error.value = null
    try {
      await meetingService.cancelBooking(slotId)
      // Refresh to get updated state
      await fetchAvailableSlots()
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to cancel booking'
      throw err
    }
  }

  // ─── Notifications ───
  async function fetchNotifications(params?: {
    unreadOnly?: boolean
    page?: number
    limit?: number
  }) {
    try {
      const res = await meetingService.getNotifications(params)
      notifications.value = res.data
      unreadCount.value = res.unreadCount
    } catch (err: any) {
      console.error('fetchNotifications error:', err)
    }
  }

  async function markAllRead() {
    try {
      await meetingService.markNotificationsRead()
      notifications.value.forEach((n) => {
        n.read = true
      })
      unreadCount.value = 0
    } catch (err: any) {
      console.error('markAllRead error:', err)
    }
  }

  async function markRead(notificationIds: string[]) {
    try {
      await meetingService.markNotificationsRead(notificationIds)
      notifications.value.forEach((n) => {
        if (notificationIds.includes(n._id)) {
          n.read = true
        }
      })
      unreadCount.value = Math.max(0, unreadCount.value - notificationIds.length)
    } catch (err: any) {
      console.error('markRead error:', err)
    }
  }

  return {
    // state
    supervisorSlots,
    studentSlots,
    notifications,
    unreadCount,
    loading,
    error,
    pagination,
    // computed
    availableSlots,
    bookedSlots,
    myBookedSlots,
    completedSlots,
    hasUnread,
    // supervisor actions
    fetchSupervisorSlots,
    createSlot,
    createSlotsBatch,
    updateSlot,
    deleteSlot,
    completeSlot,
    // student actions
    fetchAvailableSlots,
    bookSlot,
    cancelBooking,
    // notifications
    fetchNotifications,
    markAllRead,
    markRead,
  }
})
