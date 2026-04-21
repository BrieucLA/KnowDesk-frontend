export type SearchResultType = 'article' | 'faq' | 'tree';

export interface SearchResult {
  id:       string;
  type:     SearchResultType;
  title:    string;
  excerpt:  string;        // snippet with matched terms highlighted
  category: string;
  score:    number;        // relevance 0-1, used for ordering
  updatedAt: string;
}

export interface SearchState {
  query:   string;
  results: SearchResult[];
  status:  'idle' | 'loading' | 'success' | 'error';
  message?: string;        // error message
}

/** What the user last selected — used for navigation */
export interface SearchSelection {
  resultId: string;
  type:     SearchResultType;
}
