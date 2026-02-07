import client from './httpClient';

interface Credentials {
  email: string;
  password: string;
}

interface LoginResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
  token: string;
}

const authService = {
  login(credentials: Credentials) {
    return client.post<LoginResponse>('/auth/login', credentials);
  },
  logout() {
    return client.post('/auth/logout');
  },
  refresh() {
    return client.post('/auth/refresh-token');
  }
};

export default authService;
