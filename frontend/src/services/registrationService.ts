import client from './httpClient';

interface RegisterPayload {
  fullName: string;
  email: string;
  role?: string;
  password: string;
}

interface RegisterResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
  token: string;
}

const registrationService = {
  register(data: RegisterPayload) {
    return client.post<RegisterResponse>('/auth/register', data);
  },
  verifyEmail(token: string) {
    return client.post('/auth/verify-email', { token });
  },
  resendVerification(email: string) {
    return client.post('/auth/resend-verification', { email });
  }
};

export default registrationService;
