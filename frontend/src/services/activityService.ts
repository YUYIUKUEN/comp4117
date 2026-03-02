import httpClient from './httpClient'

export interface ActivityItem {
  _id: string
  user_id: {
    _id: string
    fullName: string
    email: string
    role: string
  }
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
}
