import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthSession } from '../features/auth/types';

interface AuthState {
  session:        AuthSession | null;
  isLoaded:       boolean;
  onboardingDone: boolean;
  setSession:        (session: AuthSession) => void;
  clearSession:      () => void;
  setOnboardingDone: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session:        null,
      isLoaded:       false,
      onboardingDone: false,

      setSession: (session) => set({
        session,
        isLoaded:       true,
        // Lire le flag depuis la session si disponible
        onboardingDone: session.user.onboardingDone ?? get().onboardingDone,
      }),

      clearSession: () => set({ session: null, isLoaded: true, onboardingDone: false }),

      setOnboardingDone: () => {
        set({ onboardingDone: true });
        // Persister côté serveur
        const token = get().session?.accessToken;
        if (token) {
          const base = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api/v1';
          fetch(`${base}/account/onboarding-done`, {
            method:  'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          }).catch(() => {});
        }
      },
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
