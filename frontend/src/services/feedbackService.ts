import httpClient from './httpClient'

export interface FeedbackReply {
  _id: string
  user_id: {
    _id: string
    fullName: string
    email: string
    role: string
  }
  replyText: string
  createdAt: string
}

export interface FeedbackItem {
  _id: string
  submission_id: {
    _id: string
    phase: string
  }
  supervisor_id: {
    _id: string
    fullName: string
    email: string
  }
  feedbackText: string
  rating?: number
  isPrivate: boolean
  grade?: string
  gradingSystem?: string
  gradingStandard_id?: string
  rubricLevels?: Record<string, number>
  internalNote?: string
  replies: FeedbackReply[]
  createdAt: string
  updatedAt: string
}

export default {
  /**
   * Get recent public feedback for the current student across all submissions
   */
  async getStudentRecentFeedback(limit = 5): Promise<FeedbackItem[]> {
    const response = await httpClient.get('/feedback/student/recent', {
      params: { limit },
    })
    return response.data.data
  },

  /**
   * Get feedback for a specific submission
   */
  async getSubmissionFeedback(submissionId: string): Promise<FeedbackItem[]> {
    const response = await httpClient.get(`/feedback/submissions/${submissionId}/feedback`)
    return response.data.data?.feedback || response.data.data || []
  },

  /**
   * Reply to a feedback item
   */
  async replyToFeedback(feedbackId: string, replyText: string): Promise<FeedbackReply> {
    const response = await httpClient.post(`/feedback/${feedbackId}/replies`, { replyText })
    return response.data.data
  },

  /**
   * Delete a reply to feedback
   */
  async deleteReply(feedbackId: string, replyId: string): Promise<{ success: boolean }> {
    const response = await httpClient.delete(`/feedback/${feedbackId}/replies/${replyId}`)
    return response.data.data
  },

  /**
   * Add feedback (with optional grade and internal note) to a submission
   */
  async addFeedback(
    submissionId: string,
    data: {
      feedbackText: string
      isPrivate?: boolean
      grade?: string
      gradingStandard_id?: string
      rubricLevels?: Record<string, number>
      internalNote?: string
    },
  ): Promise<FeedbackItem> {
    const response = await httpClient.post(`/feedback/submissions/${submissionId}/feedback`, data)
    return response.data.data
  },

  /**
   * Update feedback
   */
  async updateFeedback(
    feedbackId: string,
    data: {
      feedbackText: string
      isPrivate?: boolean
      grade?: string
      gradingStandard_id?: string
      rubricLevels?: Record<string, number>
      internalNote?: string
    },
  ): Promise<FeedbackItem> {
    const response = await httpClient.put(`/feedback/${feedbackId}`, data)
    return response.data.data
  },

  /**
   * Get all internal notes (admin only)
   */
  async getAdminInternalNotes(page = 1, limit = 20): Promise<{
    data: (FeedbackItem & { internalNote: string })[]
    pagination: { page: number; limit: number; total: number; pages: number }
  }> {
    const response = await httpClient.get('/feedback/admin/internal-notes', {
      params: { page, limit },
    })
    return response.data
  },

  /**
   * Delete feedback (supervisor only — must own the feedback)
   */
  async deleteFeedback(feedbackId: string): Promise<void> {
    await httpClient.delete(`/feedback/${feedbackId}`)
  },
}
