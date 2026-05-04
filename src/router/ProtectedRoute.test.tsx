import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useAuthStore } from '../store/authStore';
import type { AuthSession } from '../features/auth/types';

// Mock apiClient car authStore l'importe (et il invoque .post au setOnboardingDone).
vi.mock('../shared/lib/apiClient', () => ({
  apiClient: { post: vi.fn(() => Promise.resolve({})) },
}));

import { ProtectedRoute } from './ProtectedRoute';

const sampleSession: AuthSession = {
  user: {
    id:    'usr_1',
    email: 'admin@acme.fr',
    role:  'admin',
    onboardingDone: true,
  },
  organization: { id: 'org_1', name: 'Acme', slug: 'acme', plan: 'pro' },
  accessToken: 'jwt.token.here',
};

describe('ProtectedRoute', () => {
  let replaceSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    useAuthStore.setState({
      session:        null,
      isLoaded:       false,
      onboardingDone: false,
      impersonating:  null,
    });
    // Mock window.location.replace : ProtectedRoute l'utilise pour rediriger
    // quand l'utilisateur n'est pas authentifié. On observe sans naviguer pour de vrai.
    replaceSpy = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable:     true,
      value: { ...window.location, replace: replaceSpy },
    });
  });

  it('affiche le loader pendant la rehydratation (isLoaded=false)', () => {
    render(
      <ProtectedRoute>
        <p>secret content</p>
      </ProtectedRoute>
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('secret content')).not.toBeInTheDocument();
  });

  it('redirige vers /login si non authentifié et isLoaded=true', () => {
    useAuthStore.setState({ isLoaded: true, session: null });
    render(
      <ProtectedRoute>
        <p>secret content</p>
      </ProtectedRoute>
    );
    expect(replaceSpy).toHaveBeenCalledWith('/login');
    expect(screen.queryByText('secret content')).not.toBeInTheDocument();
  });

  it('rend les enfants si l\'utilisateur est authentifié', () => {
    useAuthStore.setState({ isLoaded: true, session: sampleSession });
    render(
      <ProtectedRoute>
        <p>secret content</p>
      </ProtectedRoute>
    );
    expect(screen.getByText('secret content')).toBeInTheDocument();
    expect(replaceSpy).not.toHaveBeenCalled();
  });
});
