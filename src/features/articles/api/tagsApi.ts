import { apiClient } from '../../../shared/lib/apiClient';

export interface OrgTag {
  id:             string;
  name:           string;
  display_name:   string;
  articles_count: number;
  created_at:     string;
}

export const tagsApi = {
  list:        ()                                          => apiClient.get<OrgTag[]>('/tags'),
  setForArticle: (articleId: string, tags: string[])       => apiClient.put<{ tags: string[] }>(`/articles/${articleId}/tags`, { tags }),
};
