import { useCallback, useEffect, useState } from 'react';
import { ApiError }     from '../../../shared/lib/apiClient';
import { useToast }     from '../../../shared/lib/useToast';
import { faqsApi }      from '../api/faqsApi';
import type { FaqDetail, FaqInput } from '../types';

export function useFaq(faqId?: string) {
  const [faq,     setFaq]     = useState<FaqDetail | null>(null);
  const [loading, setLoading] = useState(!!faqId);
  const [saving,  setSaving]  = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!faqId) {
      setFaq(null);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    // noTrack=1 : pas d'incrément views quand l'admin ouvre l'éditeur
    faqsApi.get(faqId, { noTrack: true })
      .then(data => { if (alive) setFaq(data); })
      .catch(err => {
        if (alive) toast.error(err instanceof ApiError ? err.message : 'Impossible de charger la FAQ.');
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [faqId, toast]);

  const create = useCallback(async (data: FaqInput): Promise<FaqDetail | null> => {
    setSaving(true);
    try {
      const created = await faqsApi.create(data);
      toast.success(data.status === 'published' ? 'FAQ publiée.' : 'FAQ enregistrée en brouillon.');
      return created;
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Création impossible.');
      return null;
    } finally {
      setSaving(false);
    }
  }, [toast]);

  const update = useCallback(async (id: string, data: Partial<FaqInput>): Promise<FaqDetail | null> => {
    setSaving(true);
    try {
      const updated = await faqsApi.update(id, data);
      setFaq(updated);
      toast.success('FAQ mise à jour.');
      return updated;
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Mise à jour impossible.');
      return null;
    } finally {
      setSaving(false);
    }
  }, [toast]);

  const setTags = useCallback(async (id: string, tags: string[]): Promise<boolean> => {
    try {
      const result = await faqsApi.setTags(id, tags);
      setFaq(prev => prev ? { ...prev, tags: result.tags } : prev);
      return true;
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Sauvegarde des tags impossible.');
      return false;
    }
  }, [toast]);

  return { faq, loading, saving, create, update, setTags };
}
