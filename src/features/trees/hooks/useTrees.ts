import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../../shared/lib/apiClient';
import { bulkDeleteInChunks } from '../../../shared/lib/bulkDelete';
import type { QuestionTreeSummary, QuestionTree } from '../types';

export function useTrees() {
  const [trees,   setTrees]   = useState<QuestionTreeSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<QuestionTreeSummary[]>('/trees');
      setTrees(data);
    } catch { /* silencieux */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createTree = useCallback(async (payload: {
    title: string; description?: string; categoryId?: string;
  }) => {
    const tree = await apiClient.post<QuestionTree>('/trees', payload);
    await load();
    return tree;
  }, [load]);

  const deleteTree = useCallback(async (id: string) => {
    await apiClient.delete(`/trees/${id}`);
    setTrees(prev => prev.filter(t => t.id !== id));
  }, []);

  const bulkDelete = useCallback(async (ids: string[]) => {
    const res = await bulkDeleteInChunks('/trees/bulk-delete', ids);
    const deletedSet = new Set(res.deleted);
    setTrees(prev => prev.filter(t => !deletedSet.has(t.id)));
    // Refetch pour rapporter les processus « page suivante » non chargés.
    if (res.deleted.length > 0) {
      try { await load(); } catch { /* déjà silencieux côté load */ }
    }
    return res;
  }, [load]);

  const publishTree = useCallback(async (id: string) => {
    await apiClient.put(`/trees/${id}/publish`);
    setTrees(prev => prev.map(t => t.id === id ? { ...t, status: 'published' as const } : t));
  }, []);

  return { trees, loading, load, createTree, deleteTree, bulkDelete, publishTree };
}
