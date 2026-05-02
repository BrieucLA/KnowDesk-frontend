import React, { useCallback } from 'react';
import { sanitizeArticleHtml } from '../../../shared/lib/sanitize';
import { useToast }            from '../../../shared/lib/useToast';
import type { AiState, AiSource }   from '../hooks/useAiAnswer';

const TYPE_ICONS: Record<AiSource['type'], string> = {
  article: '📄',
  faq:     '❓',
  tree:    '🌳',
};

interface AiAnswerCardProps {
  state:        AiState;
  onSelectSource: (source: AiSource) => void;
}

/**
 * AiAnswerCard — la carte « réponse IA » au-dessus des résultats Meilisearch.
 *
 * États :
 *  - streaming : sparkle anim + texte qui se construit + cursor
 *  - unsure    : "Je n'ai pas la réponse précise…" + sources
 *  - done      : réponse finale + bouton Copier
 *  - error     : message d'erreur + sources si dispo
 */
export function AiAnswerCard({ state, onSelectSource }: AiAnswerCardProps) {
  const toast = useToast();

  const handleCopy = useCallback(async () => {
    // Strip HTML/markdown au cas où le LLM en a glissé, garde les références [n]
    const plain = state.answer.replace(/<[^>]*>/g, '').trim();
    try {
      await navigator.clipboard.writeText(plain);
      toast.success('Réponse copiée');
    } catch {
      toast.error('Impossible d\'accéder au presse-papier');
    }
  }, [state.answer, toast]);

  const isStreaming = state.status === 'streaming';
  const isUnsure    = state.status === 'unsure';
  const isError     = state.status === 'error';
  const isDone      = state.status === 'done';

  return (
    <div className={`ai-answer ai-answer--${state.status}`} role="region" aria-label="Réponse IA">
      <div className="ai-answer__header">
        <span className={`ai-answer__sparkle ${isStreaming ? 'ai-answer__sparkle--anim' : ''}`} aria-hidden="true">
          ✨
        </span>
        <span className="ai-answer__title">
          {isUnsure
            ? 'Je n\'ai pas la réponse précise dans la base.'
            : isError
              ? 'Génération indisponible'
              : 'Réponse IA'}
        </span>
        {isStreaming && <span className="ai-answer__streaming-dots" aria-hidden="true">…</span>}
      </div>

      {/* Body : texte streamé. En unsure on ne montre pas de body. */}
      {!isUnsure && state.answer && (
        <div
          className="ai-answer__body"
          dangerouslySetInnerHTML={{ __html: linkifySources(sanitizeArticleHtml(state.answer)) }}
        />
      )}

      {/* Cursor clignotant pendant le stream */}
      {isStreaming && <span className="ai-answer__cursor" aria-hidden="true" />}

      {/* Sources */}
      {state.sources.length > 0 && (
        <div className="ai-answer__sources" aria-label="Sources">
          <span className="ai-answer__sources-label">
            {isUnsure ? 'Articles les plus proches :' : 'Sources :'}
          </span>
          {state.sources.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className="ai-answer__source-chip"
              onClick={() => onSelectSource(s)}
            >
              <span className="ai-answer__source-num">[{i + 1}]</span>
              <span className="ai-answer__source-icon" aria-hidden="true">{TYPE_ICONS[s.type]}</span>
              <span className="ai-answer__source-title">{s.title}</span>
            </button>
          ))}
        </div>
      )}

      {isError && state.error && (
        <p className="ai-answer__error">{state.error}</p>
      )}

      <div className="ai-answer__footer">
        {isDone && state.answer && (
          <button type="button" className="ai-answer__copy" onClick={handleCopy}>
            Copier
          </button>
        )}
        <span className="ai-answer__disclaimer">Réponse générée par IA — vérifiez les sources</span>
      </div>
    </div>
  );
}

/** Transforme [1], [2]… en `<sup class="ai-answer__cite">[1]</sup>` cliquables. */
function linkifySources(html: string): string {
  return html.replace(/\[(\d+)\]/g, '<sup class="ai-answer__cite">[$1]</sup>');
}
