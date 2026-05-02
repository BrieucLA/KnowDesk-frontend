import { useMemo } from 'react';

const INTERROGATIVES = [
  'comment', 'pourquoi', 'qui', 'que', 'qu', 'où', 'ou',
  'quand', 'combien', 'quel', 'quelle', 'quels', 'quelles',
];

const MIN_LENGTH_FOR_AI = 15;

/**
 * Décide si la query courante doit déclencher la réponse IA.
 *
 * Règles (validées avec PO) :
 *   - longueur ≥ 15 chars → trigger
 *   - OU contient `?`
 *   - OU contient un mot interrogatif (`comment`, `pourquoi`, …)
 */
export function useAiTrigger(query: string): boolean {
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 3) return false;
    if (q.length >= MIN_LENGTH_FOR_AI) return true;
    if (q.includes('?')) return true;
    const words = q.split(/\s+/).map(w => w.replace(/[^a-zàéèêëïîôùû']/gi, ''));
    return words.some(w => INTERROGATIVES.includes(w));
  }, [query]);
}
