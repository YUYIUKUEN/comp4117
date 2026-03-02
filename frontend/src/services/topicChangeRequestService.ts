import httpClient from './httpClient'

export interface TopicChangeRequest {
  _id: string
  student_id: {
    _id: string
    fullName: string
    email: string
  }
  current_topic_id: {
    _id: string
    title: string
  }
  proposed_topic_id?: {
    _id: string
    title: string
  }
  proposed_topic_title?: string
  reason: string
  status: 'Pending' | 'Approved' | 'Rejected'
  supervisor_notes?: string
  createdAt: string
  updatedAt: string
}

export default {
  /**
   * Get pending topic change requests for supervisor
   */
  async getSupervisorPendingRequests(): Promise<TopicChangeRequest[]> {
    const response = await httpClient.get('/topic-change-requests/supervisor/pending')
    return response.data.data?.requests || response.data.data || []
  },

  /**
   * Create topic change request (student)
   */
  async createTopicChangeRequest(
    current_topic_id: string,
    reason: string,
    proposed_topic_id?: string,
    proposed_topic_title?: string
  ): Promise<TopicChangeRequest> {
    const response = await httpClient.post('/topic-change-requests', {
      current_topic_id,
      reason,
      proposed_topic_id,
      proposed_topic_title,
    })
    return response.data.data
  },

  /**
   * Approve topic change request
   */
  async approveTopicChangeRequest(
    requestId: string,
    supervisor_notes?: string
  ): Promise<TopicChangeRequest> {
    const response = await httpClient.post(`/topic-change-requests/${requestId}/approve`, {
      supervisor_notes,
    })
    return response.data.data
  },

  /**
   * Reject topic change request
   */
  async rejectTopicChangeRequest(
    requestId: string,
    supervisor_notes?: string
  ): Promise<TopicChangeRequest> {
    const response = await httpClient.post(`/topic-change-requests/${requestId}/reject`, {
      supervisor_notes,
    })
    return response.data.data
  },
}
