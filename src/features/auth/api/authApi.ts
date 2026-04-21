import { apiClient } from '../../../shared/lib/apiClient';
import type { AuthSession } from '../types';

export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    apiClient.post<AuthSession>('/auth/login', credentials),

  logout: () =>
    apiClient.post<{ message: string }>('/auth/logout', {}),

  refreshSession: () =>
    apiClient.post<{ accessToken: string }>('/auth/refresh', {}),
};
