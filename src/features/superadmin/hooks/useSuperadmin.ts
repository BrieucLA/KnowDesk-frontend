import { useState, useCallback, useEffect } from 'react';
import type { SuperadminSession, OrgRow } from '../types';

const SA_TOKEN_KEY = 'sa_token';

function getSavedToken(): string | null {
  try { return sessionStorage.getItem(SA_TOKEN_KEY); } catch { return null; }
}

async function saFetch<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  const base = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api/v1';
  const res  = await fetch(`${base}/superadmin${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options?.headers,
    },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error?.message ?? body.error ?? 'Erreur serveur.');
  return body.data as T;
}

export function useSuperadmin() {
  const [session,  setSession]  = useState<SuperadminSession | null>(null);
  const [orgs,     setOrgs]     = useState<OrgRow[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [loginErr, setLoginErr] = useState('');

  const login = useCallback(async (email: string, password: string) => {
    setLoginErr('');
    setLoading(true);
    try {
      const base = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api/v1';
      const res  = await fetch(`${base}/superadmin/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message ?? body.error ?? 'Identifiants invalides.');
      const s: SuperadminSession = body.data;
      sessionStorage.setItem(SA_TOKEN_KEY, s.accessToken);
      setSession(s);
    } catch (err) {
      setLoginErr(err instanceof Error ? err.message : 'Erreur de connexion.');
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SA_TOKEN_KEY);
    setSession(null);
    setOrgs([]);
  }, []);

  const loadOrgs = useCallback(async (token: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await saFetch<OrgRow[]>('/organizations', token);
      setOrgs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur.');
    } finally {
      setLoading(false);
    }
  }, []);

  const disableOrg = useCallback(async (orgId: string) => {
    if (!session) return;
    await saFetch(`/organizations/${orgId}/disable`, session.accessToken, { method: 'PATCH' });
    setOrgs(prev => prev.map(o => o.id === orgId ? { ...o, disabled_at: new Date().toISOString() } : o));
  }, [session]);

  const enableOrg = useCallback(async (orgId: string) => {
    if (!session) return;
    await saFetch(`/organizations/${orgId}/enable`, session.accessToken, { method: 'PATCH' });
    setOrgs(prev => prev.map(o => o.id === orgId ? { ...o, disabled_at: null } : o));
  }, [session]);

  // Recharge les orgs quand la session est établie
  useEffect(() => {
    if (session?.accessToken) loadOrgs(session.accessToken);
  }, [session, loadOrgs]);

  return {
    session, orgs, loading, error, loginErr,
    login, logout, loadOrgs, disableOrg, enableOrg,
  };
}
