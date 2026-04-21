import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthSession } from '../features/auth/types';

interface AuthState {
  session:        AuthSession | null;
  isLoaded:       boolean;
  onboardingDone: boolean;

  setSession:          (session: AuthSession) => void;
  clearSession:        () => void;
  setOnboardingDone:   () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session:        null,
      isLoaded:       false,
      onboardingDone: false,

      setSession: (session) => set({ session, isLoaded: true }),

      clearSession: () => set({ session: null, isLoaded: true }),

      setOnboardingDone: () => set({ onboardingDone: true }),
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
