import httpClient from './httpClient'

interface TopicParams {
  page?: number
  limit?: number
  search?: string
  concentration?: string
  status?: string
}

interface Topic {
  _id: string
  title: string
  description: string
  concentration: string
  keywords: string[]
  supervisorId: string
  supervisorName: string
  status: 'Draft' | 'Active' | 'Archived'
  maxStudents?: number
  currentApplications?: number
  createdAt?: string
}

interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default {
  async getTopics(params: TopicParams = {}): Promise<PaginatedResponse<Topic>> {
    try {
      const response = await httpClient.get('/topics', { params })
      return response.data
    } catch (error) {
      throw error
    }
  },

  async getTopicById(id: string): Promise<Topic> {
    try {
      const response = await httpClient.get(`/topics/${id}`)
      return response.data
    } catch (error) {
      throw error
    }
  },

  async searchTopics(
    searchTerm: string,
    filters?: TopicParams
  ): Promise<PaginatedResponse<Topic>> {
    try {
      const response = await httpClient.get('/topics/search', {
        params: {
          q: searchTerm,
          ...filters
        }
      })
      return response.data
    } catch (error) {
      throw error
    }
  },

  async getTopicsByConcentration(
    concentration: string,
    params: TopicParams = {}
  ): Promise<PaginatedResponse<Topic>> {
    try {
      const response = await httpClient.get('/topics', {
        params: {
          concentration,
          ...params
        }
      })
      return response.data
    } catch (error) {
      throw error
    }
  },

  async applyForTopic(topicId: string): Promise<{ success: boolean }> {
    try {
      const response = await httpClient.post(`/topics/${topicId}/apply`)
      return response.data
    } catch (error) {
      throw error
    }
  },

  async getTopicApplications(topicId: string): Promise<any[]> {
    try {
      const response = await httpClient.get(`/topics/${topicId}/applications`)
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Supervisor-specific endpoints
  async getSupervisorTopics(params: TopicParams = {}): Promise<PaginatedResponse<Topic>> {
    try {
      const response = await httpClient.get('/supervisor/topics', { params })
      return response.data
    } catch (error) {
      throw error
    }
  },

  async createTopic(topicData: Partial<Topic>): Promise<Topic> {
    try {
      const response = await httpClient.post('/supervisor/topics', topicData)
      return response.data
    } catch (error) {
      throw error
    }
  },

  async updateTopic(id: string, topicData: Partial<Topic>): Promise<Topic> {
    try {
      const response = await httpClient.put(`/supervisor/topics/${id}`, topicData)
      return response.data
    } catch (error) {
      throw error
    }
  },

  async publishTopic(id: string): Promise<Topic> {
    try {
      const response = await httpClient.put(`/supervisor/topics/${id}/publish`, {
        status: 'Active'
      })
      return response.data
    } catch (error) {
      throw error
    }
  },

  async deleteTopic(id: string): Promise<{ success: boolean }> {
    try {
      const response = await httpClient.delete(`/supervisor/topics/${id}`)
      return response.data
    } catch (error) {
      throw error
    }
  }
}
