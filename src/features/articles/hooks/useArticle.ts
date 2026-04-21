import { useReducer, useEffect, useCallback } from 'react';
import { apiClient }   from '../../../shared/lib/apiClient';
import type { Article } from '../types';
import type { AsyncState } from '../../../shared/types';

type State  = AsyncState<Article>;
type Action =
  | { type: 'LOADING' }
  | { type: 'SUCCESS'; data: Article }
  | { type: 'ERROR';   message: string };

function reducer(_: State, action: Action): State {
  switch (action.type) {
    case 'LOADING': return { status: 'loading' };
    case 'SUCCESS': return { status: 'success', data: action.data };
    case 'ERROR':   return { status: 'error',   message: action.message };
  }
}

function adaptArticle(raw: any): Article {
  return {
    ...raw,
    // Extraire le HTML du JSONB content
    content: typeof raw.content === 'object' && raw.content !== null
      ? (raw.content.html ?? raw.content.text ?? JSON.stringify(raw.content))
      : (raw.content ?? ''),
    // Normaliser les champs de nom
    authorName:   raw.author_email ?? raw.authorName ?? '',
    categoryName: raw.category_name ?? raw.categoryName ?? '',
    faqs:         raw.faqs     ?? [],
    versions:     raw.versions ?? [],
  };
}

export function useArticle(articleId: string | undefined) {
  const [state, dispatch] = useReducer(reducer, { status: 'idle' });

  const load = useCallback(async (id: string) => {
    dispatch({ type: 'LOADING' });
    try {
      const raw = await apiClient.get<any>(`/articles/${id}`);
      dispatch({ type: 'SUCCESS', data: adaptArticle(raw) });
    } catch (err) {
      dispatch({
        type:    'ERROR',
        message: err instanceof Error ? err.message : 'Article introuvable.',
      });
    }
  }, []);

  useEffect(() => {
    if (articleId) load(articleId);
  }, [articleId, load]);

  return { state, reload: () => articleId && load(articleId) };
}
