import { apiClient } from '../../../shared/lib/apiClient';
import type { FaqDetail, FaqListItem, FaqListFilters, FaqInput } from '../types';

function buildQuery(filters: FaqListFilters): string {
  const p = new URLSearchParams();
  if (filters.status)            p.set('status',     filters.status);
  if (filters.categoryId)        p.set('categoryId', filters.categoryId);
  if (filters.q?.trim())         p.set('q',          filters.q.trim());
  if (filters.page    !== undefined) p.set('page',    String(filters.page));
  if (filters.perPage !== undefined) p.set('perPage', String(filters.perPage));
  const qs = p.toString();
  return qs ? `?${qs}` : '';
}

export const faqsApi = {
  list: (filters: FaqListFilters = {}) =>
    apiClient.get<FaqListItem[]>(`/faqs${buildQuery(filters)}`),

  get: (id: string, opts?: { noTrack?: boolean }) =>
    apiClient.get<FaqDetail>(`/faqs/${id}${opts?.noTrack ? '?noTrack=1' : ''}`),

  create: (data: FaqInput) =>
    apiClient.post<FaqDetail>('/faqs', data),

  update: (id: string, data: Partial<FaqInput>) =>
    apiClient.patch<FaqDetail>(`/faqs/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<{ message: string }>(`/faqs/${id}`),

  setTags: (id: string, tags: string[]) =>
    apiClient.put<{ tags: string[] }>(`/faqs/${id}/tags`, { tags }),
};
