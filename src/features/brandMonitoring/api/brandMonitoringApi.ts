import { apiClient } from '../../../shared/lib/apiClient';
import type {
  BrandProject, MonitoredBrand, MonitoringPrompt, PromptRun,
  ShareOfVoice, TopicSov, Timeline, ResponseWithMentions,
} from '../types';

const BASE = '/brand-monitoring';

interface ApiEnvelope<T> { data: T; error: string | null }

export const brandMonitoringApi = {
  // Projects
  listProjects:  () => apiClient.get<ApiEnvelope<BrandProject[]>>(`${BASE}/projects`).then(r => r.data),
  getProject:    (id: string) => apiClient.get<ApiEnvelope<BrandProject>>(`${BASE}/projects/${id}`).then(r => r.data),
  createProject: (name: string, marketCountry = 'FR') =>
    apiClient.post<ApiEnvelope<BrandProject>>(`${BASE}/projects`, { name, marketCountry }).then(r => r.data),
  deleteProject: (id: string) => apiClient.delete(`${BASE}/projects/${id}`),

  // Brands
  listBrands:    (projectId: string) =>
    apiClient.get<ApiEnvelope<MonitoredBrand[]>>(`${BASE}/projects/${projectId}/brands`).then(r => r.data),
  createBrand:   (projectId: string, body: { name: string; aliases: string[]; isOwner: boolean }) =>
    apiClient.post<ApiEnvelope<MonitoredBrand>>(`${BASE}/projects/${projectId}/brands`, body).then(r => r.data),
  updateBrand:   (brandId: string, body: { name?: string; aliases?: string[]; isOwner?: boolean }) =>
    apiClient.patch<ApiEnvelope<MonitoredBrand>>(`${BASE}/brands/${brandId}`, body).then(r => r.data),
  deleteBrand:   (brandId: string) => apiClient.delete(`${BASE}/brands/${brandId}`),

  // Prompts
  listPrompts:   (projectId: string) =>
    apiClient.get<ApiEnvelope<MonitoringPrompt[]>>(`${BASE}/projects/${projectId}/prompts`).then(r => r.data),
  createPrompt:  (projectId: string, body: { text: string; topicHint?: string; active?: boolean }) =>
    apiClient.post<ApiEnvelope<MonitoringPrompt>>(`${BASE}/projects/${projectId}/prompts`, body).then(r => r.data),
  bulkPrompts:   (projectId: string, prompts: Array<{ text: string; topicHint?: string; active?: boolean }>) =>
    apiClient.post<ApiEnvelope<{ inserted: number; prompts: MonitoringPrompt[] }>>(
      `${BASE}/projects/${projectId}/prompts/bulk`, { prompts },
    ).then(r => r.data),
  updatePrompt:  (promptId: string, body: { text?: string; topicHint?: string; active?: boolean }) =>
    apiClient.patch<ApiEnvelope<MonitoringPrompt>>(`${BASE}/prompts/${promptId}`, body).then(r => r.data),
  deletePrompt:  (promptId: string) => apiClient.delete(`${BASE}/prompts/${promptId}`),

  // Runs / Analytics
  triggerRun:    (projectId: string) =>
    apiClient.post<ApiEnvelope<{ enqueued: boolean }>>(`${BASE}/projects/${projectId}/runs`, {}).then(r => r.data),
  listRuns:      (projectId: string, page = 1, perPage = 20) =>
    apiClient.get<ApiEnvelope<PromptRun[]>>(`${BASE}/projects/${projectId}/runs?page=${page}&perPage=${perPage}`).then(r => r.data),
  shareOfVoice:  (projectId: string) =>
    apiClient.get<ApiEnvelope<ShareOfVoice>>(`${BASE}/projects/${projectId}/share-of-voice`).then(r => r.data),
  listResponses: (projectId: string, page = 1, perPage = 20) =>
    apiClient.get<ApiEnvelope<ResponseWithMentions[]>>(`${BASE}/projects/${projectId}/responses?page=${page}&perPage=${perPage}`).then(r => r.data),

  // Topics (Sprint 2)
  clusterTopics: (projectId: string) =>
    apiClient.post<ApiEnvelope<{ topics: Array<{ name: string; promptCount: number }>; assigned: number; costEur: number }>>(
      `${BASE}/projects/${projectId}/cluster-topics`, {},
    ).then(r => r.data),
  topics:        (projectId: string) =>
    apiClient.get<ApiEnvelope<{ topics: TopicSov[] }>>(`${BASE}/projects/${projectId}/topics`).then(r => r.data),
  timeline:      (projectId: string, bucket: 'day' | 'week' = 'week', rangeDays = 90) =>
    apiClient.get<ApiEnvelope<Timeline>>(`${BASE}/projects/${projectId}/timeline?bucket=${bucket}&rangeDays=${rangeDays}`).then(r => r.data),
};
