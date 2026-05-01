import { apiClient } from '../../../shared/lib/apiClient';
import type { DashboardData } from '../types';

export const dashboardApi = {
  get: (): Promise<DashboardData> => apiClient.get<DashboardData>('/dashboard'),
};
