import { useState, useEffect, useCallback } from 'react';
import { apiClient, ApiError } from '../../../shared/lib/apiClient';
import { useToast }  from '../../../shared/lib/useToast';

export interface ApiKey {
  id:           string;
  name:         string;
  key_prefix:   string;
  created_at:   string;
  last_used_at: string | null;
  revoked_at:   string | null;
}

export function useApiKeys() {
  const [keys,    setKeys]    = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKey,  setNewKey]  = useState<string | null>(null);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<ApiKey[]>('/api-keys');
      setKeys(data);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Impossible de charger les clés API.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const createKey = useCallback(async (name: string): Promise<boolean> => {
    try {
      const data = await apiClient.post<ApiKey & { key: string }>('/api-keys', { name });
      setKeys(prev => [data, ...prev]);
      setNewKey(data.key);
      toast.success('Clé API créée.');
      return true;
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Création impossible.');
      return false;
    }
  }, [toast]);

  const revokeKey = useCallback(async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/api-keys/${id}`);
      setKeys(prev => prev.filter(k => k.id !== id));
      toast.success('Clé révoquée.');
      return true;
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Révocation impossible.');
      return false;
    }
  }, [toast]);

  return { keys, loading, newKey, setNewKey, createKey, revokeKey };
}
