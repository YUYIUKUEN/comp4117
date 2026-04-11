import httpClient from './httpClient';

const cohortService = {
  // Get all cohorts
  getCohorts(params: any = {}) {
    return httpClient.get('/admin/cohorts', { params });
  },

  // Get a specific cohort
  getCohortById(cohortId: string) {
    return httpClient.get(`/admin/cohorts/${cohortId}`);
  },

  // Create a new cohort
  createCohort(data: any) {
    return httpClient.post('/admin/cohorts', data);
  },

  // Update a cohort
  updateCohort(cohortId: string, data: any) {
    return httpClient.put(`/admin/cohorts/${cohortId}`, data);
  },

  // Delete/archive a cohort
  deleteCohort(cohortId: string) {
    return httpClient.delete(`/admin/cohorts/${cohortId}`);
  },
};

export default cohortService;
