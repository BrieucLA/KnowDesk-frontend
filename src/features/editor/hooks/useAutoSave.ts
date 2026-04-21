import { useState, useEffect, useRef, useCallback } from 'react';
import type { SaveStatus } from '../types';

const AUTOSAVE_DELAY_MS = 3_000;  // 3s debounce after last keystroke

interface UseAutoSaveOptions<T> {
  data:       T;
  saveFn:     (data: T) => Promise<void>;
  /** Disable autosave (e.g. if form has validation errors) */
  enabled?:   boolean;
}

/**
 * Debounced autosave hook.
 *
 * Behaviour:
 *   - Waits AUTOSAVE_DELAY_MS after last data change before saving
 *   - Detects offline state and shows appropriate banner
 *   - Cancels pending save on unmount
 *   - Exposes saveNow() for manual save (on Cmd+S)
 */
export function useAutoSave<T>({
  data, saveFn, enabled = true,
}: UseAutoSaveOptions<T>) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const dataRef    = useRef(data);
  dataRef.current  = data;

  useEffect(() => { return () => { mountedRef.current = false; }; }, []);

  const doSave = useCallback(async (d: T) => {
    if (!navigator.onLine) {
      setSaveStatus('offline');
      return;
    }
    setSaveStatus('saving');
    try {
      await saveFn(d);
      if (mountedRef.current) {
        setSaveStatus('saved');
        setLastSavedAt(new Date());
        // Reset to idle after 3s so the indicator fades
        setTimeout(() => {
          if (mountedRef.current) setSaveStatus('idle');
        }, 3_000);
      }
    } catch {
      if (mountedRef.current) setSaveStatus('error');
    }
  }, [saveFn]);

  // Debounced trigger on data change
  useEffect(() => {
    if (!enabled) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSave(dataRef.current), AUTOSAVE_DELAY_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [data, enabled, doSave]);

  // Cmd+S manual save
  const saveNow = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    doSave(dataRef.current);
  }, [doSave]);

  return { saveStatus, lastSavedAt, saveNow };
}
