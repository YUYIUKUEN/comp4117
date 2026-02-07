import client from './httpClient';

interface ForgotPasswordPayload {
  email: string;
}

interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

const passwordResetService = {
  requestReset(data: ForgotPasswordPayload) {
    return client.post('/auth/forgot-password', data);
  },
  resetPassword(data: ResetPasswordPayload) {
    return client.post('/auth/reset-password', data);
  },
  validateResetToken(token: string) {
    return client.get(`/auth/reset-token-valid/${token}`);
  }
};

export default passwordResetService;
