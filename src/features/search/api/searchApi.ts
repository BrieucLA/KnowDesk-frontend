import { apiClient } from '../../../shared/lib/apiClient';
import type { SearchResult } from '../types';

export const searchApi = {
  query: (q: string): Promise<SearchResult[]> => {
    const params = new URLSearchParams({ q, limit: '7' });
    return apiClient.get<SearchResult[]>(`/search?${params}`);
  },
};
