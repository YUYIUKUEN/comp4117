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
    return response.data.data
  },

  /**
   * Reply to a feedback item
   */
  async replyToFeedback(feedbackId: string, replyText: string): Promise<FeedbackReply> {
    const response = await httpClient.post(`/feedback/${feedbackId}/replies`, { replyText })
    return response.data.data
  },
}
