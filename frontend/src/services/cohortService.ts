import httpClient from './httpClient';

const cohortService = {
  // Get all cohorts
  getCohorts(params = {}) {
    return httpClient.get('/admin/cohorts', { params });
  },

  // Get a specific cohort
  getCohortById(cohortId) {
    return httpClient.get(`/admin/cohorts/${cohortId}`);
  },

  // Create a new cohort
  createCohort(data) {
    return httpClient.post('/admin/cohorts', data);
  },

  // Update a cohort
  updateCohort(cohortId, data) {
    return httpClient.put(`/admin/cohorts/${cohortId}`, data);
  },

  // Delete/archive a cohort
  deleteCohort(cohortId) {
    return httpClient.delete(`/admin/cohorts/${cohortId}`);
  },
};

export default cohortService;
