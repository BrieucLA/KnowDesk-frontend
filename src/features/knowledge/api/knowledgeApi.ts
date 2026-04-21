import { apiClient }  from '../../../shared/lib/apiClient';
import type { Category } from '../types';

export const knowledgeApi = {
  getCategories: () =>
    apiClient.get<Category[]>('/categories'),
};
