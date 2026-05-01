import { apiClient } from '../../../shared/lib/apiClient';
import type { AnalyticsOverview } from '../types';

export const analyticsApi = {
  getOverview: () => apiClient.get<AnalyticsOverview>('/analytics/overview'),
};
