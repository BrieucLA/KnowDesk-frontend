export type NotificationType =
  | 'article_published'
  | 'article_updated'
  | 'member_joined';

export interface Notification {
  id:         string;
  org_id:     string;
  user_id:    string;
  type:       NotificationType;
  payload:    Record<string, unknown>;
  read_at:    string | null;
  created_at: string;
}

export interface NotificationMeta {
  unreadCount: number;
  page:        number;
  perPage:     number;
}
