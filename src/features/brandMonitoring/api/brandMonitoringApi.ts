import { apiClient } from '../../../shared/lib/apiClient';
import type {
  BrandProject, MonitoredBrand, MonitoringPrompt, PromptRun,
  ShareOfVoice, TopicSov, Timeline, ResponseWithMentions,
  IndustryMeta, IndustryKey, SuggestPromptsPayload, LlmMode,
} from '../types';

const BASE = '/brand-monitoring';

// apiClient.get/post/etc retournent déjà body.data déballé.
// Pas de wrap ApiEnvelope ici sinon double-déballage → undefined.

export const brandMonitoringApi = {
  // Projects
  listProjects:  () => apiClient.get<BrandProject[]>(`${BASE}/projects`),
  getProject:    (id: string) => apiClient.get<BrandProject>(`${BASE}/projects/${id}`),
  createProject: (name: string, marketCountry = 'FR', industry?: IndustryKey) =>
    apiClient.post<BrandProject>(`${BASE}/projects`, { name, marketCountry, industry }),
  updateProject: (id: string, body: { name?: string; industry?: IndustryKey | null; sentimentEnabled?: boolean; llmMode?: LlmMode }) =>
    apiClient.patch<BrandProject>(`${BASE}/projects/${id}`, body),
  deleteProject: (id: string) => apiClient.delete<null>(`${BASE}/projects/${id}`),

  // Industries / suggestions (Sprint 4)
  listIndustries: () => apiClient.get<IndustryMeta[]>(`${BASE}/industries`),
  suggestPrompts: (projectId: string, industry?: IndustryKey) =>
    apiClient.get<SuggestPromptsPayload>(
      `${BASE}/projects/${projectId}/suggest-prompts${industry ? `?industry=${industry}` : ''}`,
    ),

  // Brands
  listBrands:    (projectId: string) =>
    apiClient.get<MonitoredBrand[]>(`${BASE}/projects/${projectId}/brands`),
  createBrand:   (projectId: string, body: { name: string; aliases: string[]; isOwner: boolean }) =>
    apiClient.post<MonitoredBrand>(`${BASE}/projects/${projectId}/brands`, body),
  updateBrand:   (brandId: string, body: { name?: string; aliases?: string[]; isOwner?: boolean }) =>
    apiClient.patch<MonitoredBrand>(`${BASE}/brands/${brandId}`, body),
  deleteBrand:   (brandId: string) => apiClient.delete<null>(`${BASE}/brands/${brandId}`),

  // Prompts
  listPrompts:   (projectId: string) =>
    apiClient.get<MonitoringPrompt[]>(`${BASE}/projects/${projectId}/prompts`),
  createPrompt:  (projectId: string, body: { text: string; topicHint?: string; active?: boolean }) =>
    apiClient.post<MonitoringPrompt>(`${BASE}/projects/${projectId}/prompts`, body),
  bulkPrompts:   (projectId: string, prompts: Array<{ text: string; topicHint?: string; active?: boolean }>) =>
    apiClient.post<{ inserted: number; prompts: MonitoringPrompt[] }>(
      `${BASE}/projects/${projectId}/prompts/bulk`, { prompts },
    ),
  updatePrompt:  (promptId: string, body: { text?: string; topicHint?: string; active?: boolean }) =>
    apiClient.patch<MonitoringPrompt>(`${BASE}/prompts/${promptId}`, body),
  deletePrompt:  (promptId: string) => apiClient.delete<null>(`${BASE}/prompts/${promptId}`),

  // Runs / Analytics
  triggerRun:    (projectId: string) =>
    apiClient.post<{ enqueued: boolean }>(`${BASE}/projects/${projectId}/runs`, {}),
  listRuns:      (projectId: string, page = 1, perPage = 20) =>
    apiClient.get<PromptRun[]>(`${BASE}/projects/${projectId}/runs?page=${page}&perPage=${perPage}`),
  shareOfVoice:  (projectId: string) =>
    apiClient.get<ShareOfVoice>(`${BASE}/projects/${projectId}/share-of-voice`),
  listResponses: (projectId: string, page = 1, perPage = 20) =>
    apiClient.get<ResponseWithMentions[]>(`${BASE}/projects/${projectId}/responses?page=${page}&perPage=${perPage}`),

  // Topics (Sprint 2)
  clusterTopics: (projectId: string) =>
    apiClient.post<{ topics: Array<{ name: string; promptCount: number }>; assigned: number; costEur: number }>(
      `${BASE}/projects/${projectId}/cluster-topics`, {},
    ),
  topics:        (projectId: string) =>
    apiClient.get<{ topics: TopicSov[] }>(`${BASE}/projects/${projectId}/topics`),
  timeline:      (projectId: string, bucket: 'day' | 'week' = 'week', rangeDays = 90) =>
    apiClient.get<Timeline>(`${BASE}/projects/${projectId}/timeline?bucket=${bucket}&rangeDays=${rangeDays}`),
};
