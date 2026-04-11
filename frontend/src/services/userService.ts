import httpClient from './httpClient'

interface CreateUserPayload {
  email: string
  fullName: string
  role: 'Student' | 'Supervisor' | 'Admin'
  concentration?: string
  pathway?: string
  phone?: string
  password?: string
  cohort?: string | null
}

interface User {
  _id: string
  email: string
  fullName: string
  role: string
  concentration?: string
  pathway?: string
  phone?: string
  cohort?: string
  createdAt: string
  deactivatedAt?: string
}

interface PaginatedUsers {
  data: {
    users: User[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }
  status: number
}

export default {
  async getUsers(params: { role?: string; status?: string; page?: number; limit?: number } = {}): Promise<PaginatedUsers> {
    const response = await httpClient.get('/admin/users', { params })
    return response.data
  },

  async createUser(payload: CreateUserPayload): Promise<{ data: User; status: number }> {
    const response = await httpClient.post('/admin/users', payload)
    return response.data
  },

  async deactivateUser(userId: string, reason?: string): Promise<{ data: User; status: number }> {
    const response = await httpClient.post(`/admin/users/${userId}/deactivate`, { reason })
    return response.data
  },

  async updateUser(userId: string, payload: Partial<CreateUserPayload>): Promise<{ data: User; status: number }> {
    const response = await httpClient.put(`/admin/users/${userId}`, payload)
    return response.data
  },

  async reactivateUser(userId: string): Promise<{ data: User; status: number }> {
    const response = await httpClient.post(`/admin/users/${userId}/reactivate`)
    return response.data
  },

  async getStudentSubmissions(studentId: string): Promise<any> {
    const response = await httpClient.get(`/admin/users/${studentId}/submissions`)
    return response.data
  },

  async downloadStudentSubmissionFile(studentId: string, phase: string, filename: string): Promise<Blob> {
    try {
      const response = await httpClient.get(
        `/admin/users/${encodeURIComponent(studentId)}/submissions/${encodeURIComponent(phase)}/files/${encodeURIComponent(filename)}`,
        { responseType: 'blob' }
      )
      return response.data
    } catch (error) {
      console.error(`Failed to download file ${filename}:`, error)
      throw new Error('File download failed')
    }
  },
}
