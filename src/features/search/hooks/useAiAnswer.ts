import { useEffect, useRef, useState } from 'react';

export interface AiSource {
  id:    string;
  type:  'article' | 'faq' | 'tree';
  title: string;
}

export type AiStatus = 'idle' | 'streaming' | 'unsure' | 'done' | 'error';

export interface AiState {
  status:  AiStatus;
  sources: AiSource[];
  answer:  string;
  error?:  string;
}

const INITIAL: AiState = { status: 'idle', sources: [], answer: '' };

const DEBOUNCE_MS = 600;     // évite de cramer du LLM à chaque keystroke
const MIN_QUERY   = 3;

/**
 * useAiAnswer — déclenche /api/v1/ai-answer en streaming SSE quand `enabled`.
 *
 * - Debounce 600ms après la dernière frappe avant l'appel.
 * - AbortController : la requête en vol est tuée si la query change.
 * - Pas de tracking ici (Sprint 3 ajoutera l'event ai_answer.shown).
 */
export function useAiAnswer(query: string, enabled: boolean): AiState {
  const [state, setState] = useState<AiState>(INITIAL);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (!enabled || trimmed.length < MIN_QUERY) {
      abortRef.current?.abort();
      setState(INITIAL);
      return;
    }

    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;

    const handle = setTimeout(() => {
      runAiStream(trimmed, controller.signal, setState);
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(handle);
      controller.abort();
    };
  }, [query, enabled]);

  return state;
}

async function runAiStream(
  query: string,
  signal: AbortSignal,
  setState: (updater: (prev: AiState) => AiState) => void,
): Promise<void> {
  setState(() => ({ status: 'streaming', sources: [], answer: '' }));

  try {
    const resp = await fetch('/api/v1/ai-answer', {
      method:      'POST',
      headers:     { 'Content-Type': 'application/json' },
      credentials: 'include',
      body:        JSON.stringify({ q: query }),
      signal,
    });

    if (!resp.ok || !resp.body) {
      throw new Error(`AI HTTP ${resp.status}`);
    }

    const reader  = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() ?? '';

      for (const raw of events) {
        const eventMatch = raw.match(/^event:\s*(\w+)/m);
        const dataMatch  = raw.match(/^data:\s*(.+)$/m);
        if (!eventMatch || !dataMatch) continue;
        const eventName = eventMatch[1];
        let data: any = {};
        try { data = JSON.parse(dataMatch[1]); } catch { continue; }

        if (eventName === 'sources') {
          setState(s => ({ ...s, sources: data.sources ?? [] }));
        } else if (eventName === 'token') {
          setState(s => ({ ...s, answer: s.answer + (data.text ?? '') }));
        } else if (eventName === 'unsure') {
          setState(s => ({ ...s, status: 'unsure' }));
        } else if (eventName === 'error') {
          setState(s => ({ ...s, status: 'error', error: data.message ?? 'Erreur IA' }));
        } else if (eventName === 'done') {
          setState(s => ({
            ...s,
            // Si on est passé en unsure, on garde ce statut, sinon done
            status: s.status === 'unsure' ? 'unsure'
                  : s.status === 'error'  ? 'error'
                  : 'done',
          }));
          return;
        }
      }
    }
  } catch (err) {
    if ((err as { name?: string })?.name === 'AbortError') return;
    setState(() => ({
      status:  'error',
      sources: [],
      answer:  '',
      error:   err instanceof Error ? err.message : 'Erreur IA',
    }));
  }
}
