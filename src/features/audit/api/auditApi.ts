import { apiClient } from '../../../shared/lib/apiClient';

export type AuditAction =
  | 'article.published' | 'article.deleted' | 'article.restored' | 'article.archived'
  | 'member.invited' | 'member.role_changed' | 'member.disabled'
  | 'org.settings_updated' | 'org.general_updated' | 'org.chat_settings_updated' | 'org.chat_model.changed' | 'org.ai_settings_updated'
  | 'account.password_changed' | 'account.email_change_requested' | 'account.email_change_confirmed'
  | 'apikey.created' | 'apikey.revoked'
  | 'tag.deleted' | 'synonym.deleted'
  | 'faq.created' | 'faq.updated' | 'faq.deleted'
  | 'tree.created' | 'tree.deleted' | 'tree.archived'
  | 'category.created' | 'category.deleted' | 'category.moved'
  | 'learning.path.created' | 'learning.path.updated' | 'learning.path.deleted'
  | 'learning.module.created' | 'learning.module.updated' | 'learning.module.deleted'
  | 'learning.assigned' | 'learning.unassigned'
  | 'superadmin.impersonate.start' | 'superadmin.impersonate.stop';

export interface AuditLogItem {
  id:         string;
  action:     AuditAction;
  resourceId: string | null;
  metadata:   Record<string, unknown> | null;
  createdAt:  string;
  userId:     string | null;
  user:       { email: string; firstName: string | null; lastName: string | null } | null;
}

export interface AuditListResponse {
  items:   AuditLogItem[];
  total:   number;
  page:    number;
  perPage: number;
}

export interface AuditListParams {
  action?:     AuditAction;
  userId?:     string;
  resourceId?: string;
  since?:      string;  // ISO date
  until?:      string;
  page?:       number;
  perPage?:    number;
}

export const auditApi = {
  async list(params: AuditListParams): Promise<AuditListResponse> {
    const qs = new URLSearchParams();
    if (params.action)     qs.set('action', params.action);
    if (params.userId)     qs.set('userId', params.userId);
    if (params.resourceId) qs.set('resourceId', params.resourceId);
    if (params.since)      qs.set('since', params.since);
    if (params.until)      qs.set('until', params.until);
    if (params.page)       qs.set('page', String(params.page));
    if (params.perPage)    qs.set('perPage', String(params.perPage));
    const suffix = qs.toString();
    return apiClient.get<AuditListResponse>(`/audit-logs${suffix ? `?${suffix}` : ''}`);
  },
};
