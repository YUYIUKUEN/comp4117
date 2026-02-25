import httpClient from './httpClient'

interface ApplicationParams {
  page?: number
  limit?: number
  status?: string
}

interface Application {
  _id: string
  student_id: {
    _id: string
    email: string
    fullName: string
    role: string
    concentration?: string
    phone?: string
    officeHours?: string
  }
  topic_id: {
    _id: string
    title: string
    description: string
    concentration: string
    keywords: string[]
    supervisor_id: string
    status: string
  }
  preference_rank: number
  status: 'Pending' | 'Approved' | 'Rejected'
  supervisorNotes?: string
  appliedAt: string
  decidedAt?: string
}

interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default {
  /**
   * Get all applications for the supervisor's topics
   * This fetches all students who applied to topics supervised by the current user
   */
  async getSupervisorApplications(
    params: ApplicationParams = {}
  ): Promise<PaginatedResponse<Application>> {
    try {
      const response = await httpClient.get('/applications/supervisor/applications', {
        params
      })
      return response.data
    } catch (error) {
      console.error('Error fetching supervisor applications:', error)
      throw error
    }
  },

  /**
   * Get student's own applications
   */
  async getMyApplications(
    params: ApplicationParams = {}
  ): Promise<PaginatedResponse<Application>> {
    try {
      const response = await httpClient.get('/applications/my-applications', {
        params
      })
      return response.data
    } catch (error) {
      console.error('Error fetching my applications:', error)
      throw error
    }
  },

  /**
   * Apply to a topic
   */
  async applyToTopic(topicId: string, preferenceRank: number): Promise<Application> {
    try {
      const response = await httpClient.post('/applications', {
        topic_id: topicId,
        preference_rank: preferenceRank
      })
      return response.data.data
    } catch (error) {
      console.error('Error applying to topic:', error)
      throw error
    }
  },

  /**
   * Withdraw application
   */
  async withdrawApplication(applicationId: string): Promise<{ success: boolean }> {
    try {
      const response = await httpClient.delete(`/applications/${applicationId}`)
      return response.data
    } catch (error) {
      console.error('Error withdrawing application:', error)
      throw error
    }
  },

  /**
   * Approve application (supervisor only)
   */
  async approveApplication(
    applicationId: string,
    supervisorNotes?: string
  ): Promise<Application> {
    try {
      const response = await httpClient.post(`/applications/${applicationId}/approve`, {
        supervisorNotes
      })
      return response.data.data
    } catch (error) {
      console.error('Error approving application:', error)
      throw error
    }
  },

  /**
   * Reject application (supervisor only)
   */
  async rejectApplication(
    applicationId: string,
    supervisorNotes?: string
  ): Promise<Application> {
    try {
      const response = await httpClient.post(`/applications/${applicationId}/reject`, {
        supervisorNotes
      })
      return response.data.data
    } catch (error) {
      console.error('Error rejecting application:', error)
      throw error
    }
  },

  /**
   * Get application by ID
   */
  async getApplicationById(applicationId: string): Promise<Application> {
    try {
      const response = await httpClient.get(`/applications/${applicationId}`)
      return response.data.data
    } catch (error) {
      console.error('Error fetching application:', error)
      throw error
    }
  }
}
