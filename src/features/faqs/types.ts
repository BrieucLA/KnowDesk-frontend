export type FaqStatus     = 'draft' | 'published';
export type FaqVisibility = 'internal' | 'public';

export interface FaqListItem {
  id:                string;
  question:          string;
  status:            FaqStatus;
  visibility:        FaqVisibility;
  category_id:       string | null;
  category_name:     string | null;
  linked_article_id: string | null;
  position:          number;
  views:             number;
  helpful_yes:       number;
  helpful_no:        number;
  last_reviewed_at:  string | null;
  updated_at:        string;
  tags:              string[];
  is_stale:          boolean;
}

export interface FaqDetail extends FaqListItem {
  answer:            string;
  created_by:        string | null;
  created_at:        string;
}

export interface FaqListFilters {
  status?:     FaqStatus;
  categoryId?: string;
  q?:          string;
  staleOnly?:  boolean;
  page?:       number;
  perPage?:    number;
}

export interface FaqInput {
  question:         string;
  answer:           string;
  status?:          FaqStatus;
  visibility?:      FaqVisibility;
  categoryId?:      string | null;
  linkedArticleId?: string | null;
  tags?:            string[];
}
