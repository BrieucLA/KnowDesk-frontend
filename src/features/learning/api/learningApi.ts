import { apiClient } from '../../../shared/lib/apiClient';
import type {
  LearningPath, LearningPathDetail, LearningModule, LearningModuleResource,
  LearningQuiz, LearningQuizQuestion, LearningAssignment,
  LearningPathRenewal, LearningResourceType, LearningQuizSource,
  MyLearningPath, LearningPathCompletions,
} from '../types';

export const learningApi = {
  // ── Paths ────────────────────────────────────────────────

  listPaths: () => apiClient.get<LearningPath[]>('/learning/paths'),

  getPath: (id: string) => apiClient.get<LearningPathDetail>(`/learning/paths/${id}`),

  createPath: (data: {
    name: string; description?: string | null;
    mandatory?: boolean; renewal_months?: LearningPathRenewal;
  }) => apiClient.post<LearningPath>('/learning/paths', data),

  updatePath: (id: string, data: {
    name?: string; description?: string | null;
    mandatory?: boolean; renewal_months?: LearningPathRenewal;
  }) => apiClient.patch<LearningPath>(`/learning/paths/${id}`, data),

  deletePath: (id: string) => apiClient.delete<{ message: string }>(`/learning/paths/${id}`),

  // ── Modules ──────────────────────────────────────────────

  createModule: (pathId: string, data: { name: string; position?: number }) =>
    apiClient.post<LearningModule>(`/learning/paths/${pathId}/modules`, data),

  updateModule: (id: string, data: { name?: string; position?: number }) =>
    apiClient.patch<LearningModule>(`/learning/modules/${id}`, data),

  deleteModule: (id: string) =>
    apiClient.delete<{ message: string }>(`/learning/modules/${id}`),

  // ── Ressources ────────────────────────────────────────────

  listResources: (moduleId: string) =>
    apiClient.get<LearningModuleResource[]>(`/learning/modules/${moduleId}/resources`),

  setResources: (moduleId: string, resources: Array<{
    resource_type: LearningResourceType;
    resource_id:   string;
    position?:     number;
  }>) => apiClient.put<LearningModuleResource[]>(
    `/learning/modules/${moduleId}/resources`, { resources },
  ),

  // ── Quiz ─────────────────────────────────────────────────

  getQuiz: (moduleId: string) =>
    apiClient.get<LearningQuiz | null>(`/learning/modules/${moduleId}/quiz`),

  saveQuiz: (moduleId: string, data: {
    questions: LearningQuizQuestion[];
    passing_score?: number;
    generated_by?: LearningQuizSource;
  }) => apiClient.put<LearningQuiz>(`/learning/modules/${moduleId}/quiz`, data),

  generateQuiz: (moduleId: string, count?: number) =>
    apiClient.post<{ questions: LearningQuizQuestion[]; generated_by: LearningQuizSource }>(
      `/learning/modules/${moduleId}/quiz/generate`, { count },
    ),

  // ── Assignments ───────────────────────────────────────────

  listAssignments: (pathId: string) =>
    apiClient.get<LearningAssignment[]>(`/learning/paths/${pathId}/assignments`),

  assignUsers: (pathId: string, userIds: string[]) =>
    apiClient.post<LearningAssignment[]>(`/learning/paths/${pathId}/assignments`, { user_ids: userIds }),

  unassignUser: (pathId: string, userId: string) =>
    apiClient.delete<{ message: string }>(`/learning/paths/${pathId}/assignments/${userId}`),

  // ── Dashboard admin ───────────────────────────────────────

  pathCompletions: (pathId: string) =>
    apiClient.get<LearningPathCompletions>(`/learning/paths/${pathId}/completions`),

  // ── Conseiller ───────────────────────────────────────────

  myLearning: () => apiClient.get<MyLearningPath[]>('/learning/my'),

  startModule: (moduleId: string) =>
    apiClient.post(`/learning/modules/${moduleId}/start`, {}),

  completeModule: (moduleId: string, answers?: number[]) =>
    apiClient.post(`/learning/modules/${moduleId}/complete`, { answers }),
};
