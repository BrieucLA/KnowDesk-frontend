import { useReducer, useCallback, useEffect, useRef } from 'react';
import { apiClient }          from '../../../shared/lib/apiClient';
import type { SearchState, SearchResult } from '../types';

type Action =
  | { type: 'SET_QUERY';   query: string }
  | { type: 'LOADING' }
  | { type: 'SUCCESS';     results: SearchResult[] }
  | { type: 'ERROR';       message: string }
  | { type: 'CLEAR' };

function reducer(state: SearchState, action: Action): SearchState {
  switch (action.type) {
    case 'SET_QUERY': return { ...state, query: action.query };
    case 'LOADING':   return { ...state, status: 'loading' };
    case 'SUCCESS':   return { ...state, status: 'success', results: action.results };
    case 'ERROR':     return { ...state, status: 'error',   message: action.message, results: [] };
    case 'CLEAR':     return { query: '', results: [], status: 'idle' };
  }
}

const INITIAL: SearchState = { query: '', results: [], status: 'idle' };
const DEBOUNCE_MS = 200;

interface UseSearchOptions {
  token?:   string;
  onSelect: (result: SearchResult) => void;
}

export function useSearch({ onSelect }: UseSearchOptions) {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const [activeIndex, setActiveIndex] = useReducer((_: number, n: number) => n, -1);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef    = useRef<HTMLInputElement>(null);
  const listRef     = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const search = useCallback(async (q: string) => {
    try {
      const path = q.trim()
        ? `/search?q=${encodeURIComponent(q)}`
        : '/search';
      const results = await apiClient.get<SearchResult[]>(path);
      dispatch({ type: 'SUCCESS', results });
    } catch (err) {
      dispatch({
        type:    'ERROR',
        message: err instanceof Error ? err.message : 'Erreur de recherche.',
      });
    }
  }, []);

  const handleChange = useCallback((q: string) => {
    dispatch({ type: 'SET_QUERY', query: q });
    setActiveIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) {
      dispatch({ type: 'CLEAR' });
      return;
    }
    dispatch({ type: 'LOADING' });
    debounceRef.current = setTimeout(() => search(q), DEBOUNCE_MS);
  }, [search]);

  const handleClear = useCallback(() => {
    dispatch({ type: 'CLEAR' });
    setActiveIndex(-1);
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const resultCount = state.results.length;
    if (resultCount === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(Math.min(activeIndex + 1, resultCount - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(Math.max(activeIndex - 1, -1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      onSelect(state.results[activeIndex]);
    } else if (e.key === 'Escape') {
      handleClear();
    }
  }, [state.results, activeIndex, onSelect, handleClear]);

  const handleFocus = useCallback(() => {
    if (!state.query) search('');
  }, [state.query, search]);

  const isOpen = state.status === 'success' && state.results.length > 0;

  return {
    state, activeIndex, isOpen,
    inputRef, listRef,
    handleChange, handleClear, handleKeyDown, handleFocus,
  };
}
