import { createContext, useContext, useEffect } from 'react';
import { isFormDirty } from '../../../shared/lib/useUnsavedChanges';

/**
 * Context partagé pour que chaque sous-section settings puisse
 * remonter son état "dirty" au SettingsPage parent. Ce dernier
 * l'utilise pour :
 *  - activer beforeunload (via useUnsavedChanges)
 *  - intercepter les clics sur la sidebar et ouvrir un ConfirmDialog
 *    avant de switcher de section
 */
export interface DirtyContextValue {
  setDirty: (v: boolean) => void;
}

export const DirtyContext = createContext<DirtyContextValue>({
  setDirty: () => {},
});

/**
 * Hook utilitaire que les sections appellent pour déclarer leur
 * état dirty. Compare `current` vs `initial` en JSON.stringify et
 * remonte la valeur au parent. Au démontage, reset à false (au cas
 * où l'utilisateur quitte la section sans save).
 */
export function useTrackDirty<T>(current: T, initial: T): void {
  const { setDirty } = useContext(DirtyContext);
  useEffect(() => {
    setDirty(isFormDirty(current, initial));
    return () => setDirty(false);
    // current change à chaque key, JSON.stringify dans isFormDirty
    // est suffisant pour la perf (forms < 100 champs)
  }, [current, initial, setDirty]);
}
