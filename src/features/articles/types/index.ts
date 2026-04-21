export type ArticleStatus  = 'draft' | 'published' | 'archived';

export interface ArticleVersion {
  version:   number;
  updatedAt: string;
  authorName: string;
  summary?:  string;  // optional change summary
}

export interface Article {
  id:          string;
  title:       string;
  content:     string;       // stored as HTML (from Tiptap)
  status:      ArticleStatus;
  categoryId:  string;
  categoryName: string;
  version:     number;
  versions:    ArticleVersion[];
  authorName:  string;
  updatedAt:   string;
  createdAt:   string;
  faqs:        ArticleFaq[];
}

export interface ArticleFaq {
  id:       string;
  question: string;
  answer:   string;
  followUpQuestions?: string[];
}

export interface ArticleListItem {
  id:           string;
  title:        string;
  status:       ArticleStatus;
  categoryId:   string;
  categoryName: string;
  version:      number;
  authorName:   string;
  updatedAt:    string;
}
