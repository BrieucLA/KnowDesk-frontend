import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../../shared/lib/apiClient';
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
    } catch { /* silencieux */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createKey = useCallback(async (name: string) => {
    const data = await apiClient.post<ApiKey & { key: string }>('/api-keys', { name });
    setKeys(prev => [data, ...prev]);
    setNewKey(data.key);
    toast.success('Clé API créée.');
  }, [toast]);

  const revokeKey = useCallback(async (id: string) => {
    await apiClient.delete(`/api-keys/${id}`);
    setKeys(prev => prev.filter(k => k.id !== id));
    toast.success('Clé révoquée.');
  }, [toast]);

  return { keys, loading, newKey, setNewKey, createKey, revokeKey };
}
