import httpClient from './httpClient'

export interface User {
  _id: string
  fullName: string
  email: string
  role: string
}

export interface ActivityItem {
  _id: string
  user_id: User
  action: string
  entityType: string
  entityId?: string
  details?: Record<string, any>
  timestamp: string
}

export default {
  /**
   * Get activity logs for a specific user
   */
  async getUserActivity(userId: string, limit = 10, page = 1): Promise<{ logs: ActivityItem[]; pagination: any }> {
    const response = await httpClient.get(`/activity/user/${userId}`, {
      params: { limit, page },
    })
    return response.data.data
  },

  /**
   * Get activity logs for a specific entity
   */
  async getEntityActivity(entityType: string, entityId: string, limit = 10, page = 1): Promise<{ logs: ActivityItem[]; pagination: any }> {
    const response = await httpClient.get(`/activity/${entityType}/${entityId}`, {
      params: { limit, page },
    })
    return response.data.data
  },

  /**
   * Get all activity logs - Admin only
   */
  async getActivityLogs(filter = {}, limit = 100, page = 1): Promise<{ logs: ActivityItem[]; pagination: any }> {
    const response = await httpClient.get('/activity', {
      params: { ...filter, limit, page },
    })
    return response.data.data
  },
}
