import { useState, useCallback, useEffect } from 'react';
import type { SuperadminSession, OrgRow } from '../types';
import type { OrgPlan } from '../../../shared/types';
import { useAuthStore } from '../../../store/authStore';

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

export interface ReindexResult {
  articles: number;
  trees:    number;
  faqs:     number;
}

export function useSuperadmin() {
  const [session,  setSession]  = useState<SuperadminSession | null>(() => {
    const token = getSavedToken();
    return token ? { accessToken: token, superadmin: { id: '', email: '', firstName: null, lastName: null } } : null;
  });
  const [orgs,     setOrgs]     = useState<OrgRow[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [loginErr, setLoginErr] = useState('');

  const setImpersonating = useAuthStore(s => s.setImpersonating);
  const setSessionStore  = useAuthStore(s => s.setSession);

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

  const impersonate = useCallback(async (orgId: string, orgName: string) => {
    if (!session) return;
    try {
      const data = await saFetch<{
        accessToken: string;
        org:  { id: string; name: string };
        user: { id: string; email: string; role: string };
      }>(`/impersonate/${orgId}`, session.accessToken, { method: 'POST' });

      // Le backend ne renvoie que { id, name } sur impersonate ; on complète slug/plan
      // depuis la liste superadmin déjà chargée pour respecter le type Organization.
      const known = orgs.find(o => o.id === data.org.id);

      setImpersonating({ orgName, saToken: session.accessToken });
      setSessionStore({
        accessToken:  data.accessToken,
        user:         { id: data.user.id, email: data.user.email, role: 'admin', onboardingDone: true },
        organization: {
          id:   data.org.id,
          name: data.org.name,
          slug: known?.slug ?? '',
          plan: (known?.plan as OrgPlan | undefined) ?? 'free',
        },
      });
      window.location.href = '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur.');
    }
  }, [session, orgs, setImpersonating, setSessionStore]);

  // Recharge les orgs quand la session est établie
  useEffect(() => {
    if (session?.accessToken) loadOrgs(session.accessToken);
  }, [session, loadOrgs]);

  /**
   * Réindexe Meilisearch (toutes les orgs ou une seule).
   * Utile après une migration qui ajoute un champ aux documents indexés.
   */
  const reindexSearch = useCallback(async (orgId?: string): Promise<ReindexResult> => {
    if (!session) throw new Error('Non connecté.');
    return saFetch<ReindexResult>('/search/reindex', session.accessToken, {
      method: 'POST',
      body:   JSON.stringify(orgId ? { orgId } : {}),
    });
  }, [session]);

  return {
    session, orgs, loading, error, loginErr,
    login, logout, loadOrgs, disableOrg, enableOrg, impersonate,
    reindexSearch,
  };
}
