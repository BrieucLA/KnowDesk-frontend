import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthSession } from '../features/auth/types';
import { apiClient } from '../shared/lib/apiClient';

interface AuthState {
  session:        AuthSession | null;
  isLoaded:       boolean;
  onboardingDone: boolean;
  impersonating:  { orgName: string; saToken: string } | null;
  setSession:        (session: AuthSession) => void;
  clearSession:      () => void;
  setOnboardingDone: () => void;
  resetOnboarding:   () => Promise<void>;
  setImpersonating:  (data: { orgName: string; saToken: string } | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session:        null,
      isLoaded:       false,
      onboardingDone: false,
      impersonating:  null,

      setSession: (session) => set({
        session,
        isLoaded:       true,
        onboardingDone: session.user.onboardingDone ?? get().onboardingDone,
      }),

      clearSession: () => set({ session: null, isLoaded: true, onboardingDone: false, impersonating: null }),

      setOnboardingDone: () => {
        set({ onboardingDone: true });
        // Cookie HTTP-only envoyé automatiquement par apiClient — credentials:include.
        apiClient
          .post('/account/onboarding-done', {})
          .catch(err => console.warn('[authStore] onboarding-done failed:', (err as Error)?.message ?? err));
      },

      resetOnboarding: async () => {
        await apiClient.post('/account/onboarding-reset', {});
        set({ onboardingDone: false });
      },

      setImpersonating: (data) => set({ impersonating: data }),
    }),
    {
      name:    'knowdesk-auth',
      storage: createJSONStorage(() => sessionStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state.isLoaded = true;
      },
    }
  )
);

export const selectUser         = (s: AuthState) => s.session?.user         ?? null;
export const selectOrganization = (s: AuthState) => s.session?.organization ?? null;
export const selectIsLoggedIn   = (s: AuthState) => s.session !== null;
export const selectUserRole     = (s: AuthState) => s.session?.user.role    ?? null;
