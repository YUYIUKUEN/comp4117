import httpClient from './httpClient'

interface AssignmentParams {
  page?: number
  limit?: number
  status?: string
}

interface Assignment {
  _id: string
  student_id: {
    _id: string
    email: string
    fullName: string
    role: string
    concentration?: string
    phone?: string
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
  supervisor_id: string
  assigned_at: string
  status: 'Active' | 'Completed'
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
   * Get the current student's active assignment (with populated topic & supervisor)
   */
  async getMyAssignment(): Promise<{ success: boolean; data: Assignment }> {
    const response = await httpClient.get('/assignments/my-assignment')
    return response.data
  },

  /**
   * Get all assignments for the supervisor's topics
   * Returns only matched/assigned students (not pending applications)
   */
  async getSupervisorAssignments(
    params: AssignmentParams = {}
  ): Promise<PaginatedResponse<Assignment>> {
    try {
      const response = await httpClient.get('/assignments/supervisor/assignments', {
        params,
      })
      return response.data
    } catch (error) {
      console.error('Error fetching supervisor assignments:', error)
      throw error
    }
  },

  /**
   * Get a specific assignment by ID
   */
  async getAssignmentById(id: string): Promise<{ success: boolean; data: Assignment }> {
    const response = await httpClient.get(`/assignments/${id}`)
    return response.data
  },

  /**
   * Complete an assignment
   */
  async completeAssignment(id: string): Promise<{ success: boolean; data: Assignment }> {
    const response = await httpClient.post(`/assignments/${id}/complete`)
    return response.data
  },
}
