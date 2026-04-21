import type { SearchResult } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api/v1';

export const searchApi = {
  query: async (q: string, token: string): Promise<SearchResult[]> => {
    const params = new URLSearchParams({ q, limit: '7' });
    const res = await fetch(`${BASE_URL}/search?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    });
    if (!res.ok) throw new Error('La recherche est temporairement indisponible.');
    const body = await res.json();
    return body.data as SearchResult[];
  },
};
