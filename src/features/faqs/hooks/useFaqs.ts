import { useCallback, useEffect, useState } from 'react';
import { ApiError }     from '../../../shared/lib/apiClient';
import { useToast }     from '../../../shared/lib/useToast';
import { faqsApi }      from '../api/faqsApi';
import type { FaqListItem, FaqListFilters } from '../types';

export function useFaqs(initialFilters: FaqListFilters = {}) {
  const [items,   setItems]   = useState<FaqListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FaqListFilters>(initialFilters);
  const toast = useToast();

  const reload = useCallback(async (next?: FaqListFilters) => {
    const f = next ?? filters;
    setLoading(true);
    try {
      const data = await faqsApi.list(f);
      setItems(data);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Impossible de charger les FAQs.');
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    let alive = true;
    faqsApi.list(filters)
      .then(data => { if (alive) setItems(data); })
      .catch(err => {
        if (alive) toast.error(err instanceof ApiError ? err.message : 'Impossible de charger les FAQs.');
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [filters, toast]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      await faqsApi.delete(id);
      setItems(prev => prev.filter(f => f.id !== id));
      toast.success('FAQ supprimée.');
      return true;
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Suppression impossible.');
      return false;
    }
  }, [toast]);

  return { items, loading, filters, setFilters, reload, remove };
}
