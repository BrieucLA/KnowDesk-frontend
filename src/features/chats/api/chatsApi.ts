import { apiClient } from '../../../shared/lib/apiClient';

// Phase D — 'abandoned' supprimé : chaque conv close est resolved/unresolved/escalated.
// 'abandoned' peut encore apparaître côté front pour les vieilles rows non recalculées.
export type ChatStatus = 'active' | 'resolved' | 'unresolved' | 'escalated' | 'abandoned';

export interface ChatListItem {
  id:                 string;
  topic:              string | null;
  status:             ChatStatus;
  csat:               number | null;
  resolvedHelpful:    boolean | null;
  resolutionReason:   string | null;
  startedAt:          string;
  endedAt:            string | null;
  visitorFingerprint: string | null;
  firstQuestion:      string | null;
  turnsCount:         number;
}

export interface ChatListResponse {
  items:    ChatListItem[];
  total:    number;
  page:     number;
  perPage:  number;
}

export interface ChatTurn {
  id:        string;
  role:      'visitor' | 'assistant' | 'system' | 'user' | 'bot';
  content:   string;
  metadata:  Record<string, unknown>;
  createdAt: string;
}

export interface ChatDetail {
  id:                 string;
  topic:              string | null;
  status:             ChatStatus;
  csat:               number | null;
  resolvedHelpful:    boolean | null;
  resolutionReason:   string | null;
  channel:            string;
  visitorFingerprint: string | null;
  startedAt:          string;
  endedAt:            string | null;
  turns:              ChatTurn[];
}

export const chatsApi = {
  async list(params: { q?: string; status?: ChatStatus; page?: number; perPage?: number }): Promise<ChatListResponse> {
    const qs = new URLSearchParams();
    if (params.q && params.q.trim().length > 0) qs.set('q', params.q.trim());
    if (params.status)                          qs.set('status', params.status);
    if (params.page)                            qs.set('page', String(params.page));
    if (params.perPage)                         qs.set('perPage', String(params.perPage));
    const suffix = qs.toString();
    return apiClient.get<ChatListResponse>(`/chats${suffix ? `?${suffix}` : ''}`);
  },
  async get(id: string): Promise<ChatDetail> {
    return apiClient.get<ChatDetail>(`/chats/${encodeURIComponent(id)}`);
  },
};
