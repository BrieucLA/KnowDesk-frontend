import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { AuthSession } from '../features/auth/types';

// Mock apiClient AVANT d'importer le store — sinon le module est chargé avec
// le vrai apiClient et les calls partent vers une URL Vite. On veut juste
// observer que la méthode est appelée.
vi.mock('../shared/lib/apiClient', () => ({
  apiClient: {
    post:  vi.fn(() => Promise.resolve({})),
    get:   vi.fn(() => Promise.resolve({})),
    patch: vi.fn(() => Promise.resolve({})),
    put:   vi.fn(() => Promise.resolve({})),
    delete:vi.fn(() => Promise.resolve({})),
  },
}));

import { useAuthStore } from './authStore';
import { apiClient } from '../shared/lib/apiClient';

const sampleSession: AuthSession = {
  user: {
    id:    'usr_1',
    email: 'admin@acme.fr',
    role:  'admin',
    onboardingDone: true,
  },
  organization: {
    id:   'org_1',
    name: 'Acme',
    slug: 'acme',
    plan: 'pro',
  },
  accessToken: 'jwt.token.here',
};

describe('authStore', () => {
  beforeEach(() => {
    // Reset le store ET le localStorage entre tests pour éviter la pollution.
    localStorage.removeItem('knowdesk-auth');
    useAuthStore.setState({
      session:        null,
      isLoaded:       false,
      onboardingDone: false,
      impersonating:  null,
    });
    vi.clearAllMocks();
  });

  it('setSession pose la session, isLoaded et onboardingDone', () => {
    useAuthStore.getState().setSession(sampleSession);
    const state = useAuthStore.getState();
    expect(state.session).toEqual(sampleSession);
    expect(state.isLoaded).toBe(true);
    expect(state.onboardingDone).toBe(true);
  });

  it('clearSession remet tout à zéro', () => {
    // Pré-charge un état non-vide
    useAuthStore.setState({
      session:        sampleSession,
      isLoaded:       true,
      onboardingDone: true,
      impersonating:  { orgName: 'X', saToken: 'tok' },
    });
    useAuthStore.getState().clearSession();
    const state = useAuthStore.getState();
    expect(state.session).toBeNull();
    expect(state.onboardingDone).toBe(false);
    expect(state.impersonating).toBeNull();
    expect(state.isLoaded).toBe(true);  // reste true (on a chargé, juste vide)
  });

  it('setOnboardingDone met le flag et appelle l\'API', () => {
    useAuthStore.getState().setOnboardingDone();
    expect(useAuthStore.getState().onboardingDone).toBe(true);
    expect(apiClient.post).toHaveBeenCalledWith('/account/onboarding-done', {});
  });

  it('setImpersonating pose et retire le contexte d\'impersonation', () => {
    const ctx = { orgName: 'Hubicus', saToken: 'sa-tok' };
    useAuthStore.getState().setImpersonating(ctx);
    expect(useAuthStore.getState().impersonating).toEqual(ctx);
    useAuthStore.getState().setImpersonating(null);
    expect(useAuthStore.getState().impersonating).toBeNull();
  });

  it('persiste la session dans localStorage sous la clé knowdesk-auth', () => {
    useAuthStore.getState().setSession(sampleSession);
    const raw = localStorage.getItem('knowdesk-auth');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    // Zustand persist enveloppe : { state: {...}, version: 0 }
    expect(parsed.state.session).toEqual(sampleSession);
  });
});
