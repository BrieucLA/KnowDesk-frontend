import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * useLocalStorageState — `useState` qui persiste dans localStorage.
 * - Valeur sérialisée en JSON.
 * - Si la lecture initiale échoue (storage indisponible, JSON invalide),
 *   retombe sur `initial` sans crasher.
 * - L'écriture est bufferisée : on n'écrit qu'après le premier render
 *   pour éviter une écriture redondante au mount.
 */
export function useLocalStorageState<T>(
  key: string,
  initial: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? initial : (JSON.parse(raw) as T);
    } catch {
      return initial;
    }
  });

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage plein, mode privé, etc. — silencieux */
    }
  }, [key, value]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => setValue(next),
    [],
  );

  return [value, set];
}
