import httpClient from './httpClient'

// ─── Types ───

export interface TimeSlot {
  startTime: string
  endTime: string
}

export interface RecurrencePattern {
  pattern: 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly'
  endDate?: string | null
  daysOfWeek?: number[] // 0-6 for weekly recurrence
}

export interface MeetingSlotBooking {
  _id: string
  student_id: {
    _id: string
    fullName: string
    email: string
  }
  bookedAt: string
  notes: string
  timeSlotIndex?: number | null
}

export interface MeetingSlot {
  _id: string
  supervisor_id: {
    _id: string
    fullName: string
    email: string
  } | string
  title: string
  description: string
  date: string
  startTime?: string
  endTime?: string
  timeSlots?: TimeSlot[]
  location: string
  meetingType: 'one-to-one' | 'group'
  maxAttendees: number
  status: 'Available' | 'Booked' | 'Completed' | 'Cancelled'
  bookings: MeetingSlotBooking[]
  recurrence?: RecurrencePattern
  isFullyBooked: boolean
  myBooking?: MeetingSlotBooking | null
  createdAt: string
  updatedAt: string
}

export interface CreateSlotPayload {
  title: string
  description?: string
  date: string
  startTime?: string
  endTime?: string
  timeSlots?: TimeSlot[]
  location?: string
  meetingType?: 'one-to-one' | 'group'
  maxAttendees?: number
  recurrence?: RecurrencePattern
}

export interface MeetingNotification {
  _id: string
  recipient_id: string
  sender_id: {
    _id: string
    fullName: string
    email: string
    role: string
  } | null
  type: string
  title: string
  message: string
  entityType: string | null
  entityId: string | null
  read: boolean
  readAt: string | null
  createdAt: string
}

// ─── Service ───

export default {
  // ═══ Supervisor ═══

  async createSlot(payload: CreateSlotPayload): Promise<{ success: boolean; data: MeetingSlot }> {
    const response = await httpClient.post('/meetings/slots', payload)
    return response.data
  },

  async createSlotsBatch(
    slots: CreateSlotPayload[]
  ): Promise<{ success: boolean; data: MeetingSlot[]; count: number }> {
    const response = await httpClient.post('/meetings/slots/batch', { slots })
    return response.data
  },

  async getSupervisorSlots(params?: {
    status?: string
    page?: number
    limit?: number
    sortBy?: string
    order?: string
  }): Promise<{
    success: boolean
    data: MeetingSlot[]
    pagination: { page: number; limit: number; total: number; pages: number }
  }> {
    const response = await httpClient.get('/meetings/slots/my-slots', { params })
    return response.data
  },

  async updateSlot(
    slotId: string,
    payload: Partial<CreateSlotPayload>
  ): Promise<{ success: boolean; data: MeetingSlot }> {
    const response = await httpClient.put(`/meetings/slots/${slotId}`, payload)
    return response.data
  },

  async deleteSlot(slotId: string): Promise<{ success: boolean; message: string }> {
    const response = await httpClient.delete(`/meetings/slots/${slotId}`)
    return response.data
  },

  async completeSlot(slotId: string): Promise<{ success: boolean; data: MeetingSlot }> {
    const response = await httpClient.post(`/meetings/slots/${slotId}/complete`)
    return response.data
  },

  // ═══ Student ═══

  async getAvailableSlots(): Promise<{ success: boolean; data: MeetingSlot[] }> {
    const response = await httpClient.get('/meetings/slots/available')
    return response.data
  },

  async bookSlot(
    slotId: string,
    notes?: string,
    timeSlotIndex?: number | null
  ): Promise<{ success: boolean; data: MeetingSlot }> {
    const response = await httpClient.post(`/meetings/slots/${slotId}/book`, { notes, timeSlotIndex })
    return response.data
  },

  async cancelBooking(slotId: string): Promise<{ success: boolean; message: string }> {
    const response = await httpClient.delete(`/meetings/slots/${slotId}/book`)
    return response.data
  },

  // ═══ Notifications ═══

  async getNotifications(params?: {
    unreadOnly?: boolean
    page?: number
    limit?: number
  }): Promise<{
    success: boolean
    data: MeetingNotification[]
    unreadCount: number
    pagination: { page: number; limit: number; total: number; pages: number }
  }> {
    const response = await httpClient.get('/meetings/notifications', { params })
    return response.data
  },

  async markNotificationsRead(
    notificationIds?: string[]
  ): Promise<{ success: boolean; message: string }> {
    const response = await httpClient.put('/meetings/notifications/read', { notificationIds })
    return response.data
  },
}
