import { apiClient } from '../../../shared/lib/apiClient';
import type { AnalyticsOverview } from '../types';

export interface FaqSuggestion {
  query:    string;
  searches: number;
  lastSeen: string;
}

export const analyticsApi = {
  getOverview:  () => apiClient.get<AnalyticsOverview>('/analytics/overview'),
  faqsToCreate: () => apiClient.get<FaqSuggestion[]>('/analytics/faqs-to-create'),
};
