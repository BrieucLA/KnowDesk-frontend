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
  /** Cumulatif depuis la création — gardé pour compat. */
  views:             number;
  /** Vues sur les 30 derniers jours (event `faq.view`), parité avec articles. */
  views_30d:         number;
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

export type FaqSortBy  = 'updated' | 'views' | 'helpful' | 'category';
export type FaqSortDir = 'asc' | 'desc';

export interface FaqListFilters {
  status?:     FaqStatus;
  categoryId?: string;
  /** Si true et categoryId fourni → backend élargit aux sous-catégories. */
  includeSubcategories?: boolean;
  q?:          string;
  staleOnly?:  boolean;
  /** Multi-tag AND : la FAQ doit porter tous les tags. Slugs lowercase. */
  tags?:       string[];
  sortBy?:     FaqSortBy;
  sortDir?:    FaqSortDir;
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

export interface FaqHistoryActor {
  id:        string;
  email:     string | null;
  firstName: string | null;
  lastName:  string | null;
}

export interface FaqHistoryEntry {
  id:        string;
  action:    'faq.updated' | 'faq.deleted';
  createdAt: string;
  actor:     FaqHistoryActor | null;
}

export interface FaqHistory {
  creation: {
    createdAt: string;
    actorId:   string | null;
  };
  entries: FaqHistoryEntry[];
}
