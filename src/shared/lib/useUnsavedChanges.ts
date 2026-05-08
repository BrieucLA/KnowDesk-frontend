import { useEffect, useRef } from 'react';

/**
 * Active la confirmation native du navigateur (`beforeunload`) tant que
 * `isDirty=true`. Empêche la fermeture/refresh de l'onglet sans
 * confirmation explicite.
 *
 * Pour la navigation INTERNE (clic sur une autre section settings), on
 * utilise un mécanisme séparé : le composant parent intercepte le clic
 * et ouvre un `<ConfirmDialog>` avant de switcher. Ce hook ne gère que
 * le cas natif (window unload).
 *
 * Le texte du prompt est imposé par le navigateur depuis ~2018 — pas
 * customisable. C'est OK, c'est le standard web.
 */
export function useUnsavedChanges(isDirty: boolean): void {
  // On garde la valeur courante dans un ref pour qu'elle soit lue dans
  // le handler beforeunload sans avoir à re-attacher l'event à chaque
  // changement de `isDirty`.
  const dirtyRef = useRef(isDirty);
  dirtyRef.current = isDirty;

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      e.preventDefault();
      // Le navigateur ignore la valeur retournée — il affiche son
      // propre message générique. On retourne un string non-vide pour
      // satisfaire les anciennes specs (Safari notamment).
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);
}

/**
 * Helper pour calculer un état dirty en comparant 2 objets via
 * JSON.stringify. Suffisant pour les forms < 100 champs ; pour des
 * objets plus profonds avec types non-sérialisables (Map, Set, Date)
 * il faudra une comparaison structurelle dédiée.
 */
export function isFormDirty<T>(current: T, initial: T): boolean {
  return JSON.stringify(current) !== JSON.stringify(initial);
}
