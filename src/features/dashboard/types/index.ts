import type { UserRole } from '../../../shared/types';

export interface DashboardStats {
  totalArticles:   number;
  publishedArticles: number;
  totalFaqs:       number;
  teamMembers:     number;
}

export interface RecentArticle {
  id:        string;
  title:     string;
  category:  string;
  status:    'draft' | 'published' | 'archived';
  updatedAt: string; // ISO string
  version:   number;
  authorName: string;
}

export interface ActivityItem {
  id:        string;
  type:      'article_published' | 'article_updated' | 'member_joined' | 'faq_created';
  message:   string;
  timestamp: string;
  authorName: string;
}

export interface ChecklistItem {
  id:        string;
  label:     string;
  completed: boolean;
  href:      string;
}

/** Role-aware dashboard data — admins see more than advisors */
export interface DashboardData {
  stats:       DashboardStats;
  recentItems: RecentArticle[];
  activity:    ActivityItem[];
  checklist:   ChecklistItem[]; // only for admins with incomplete onboarding
}
