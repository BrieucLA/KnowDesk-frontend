import React from 'react';
import { Button }              from '../../../shared/components/ui/Button';
import { sanitizeHighlight }   from '../../../shared/lib/sanitize';
import { FaqHelpfulButtons }   from '../../faqs/components/FaqHelpfulButtons';
import type { SearchResult } from '../types';

interface FaqResultExpansionProps {
  result: SearchResult;
  onCopy: (text: string) => void;
}

/**
 * Panneau d'expansion d'une FAQ dans la SearchBar.
 *
 * Pourquoi c'est différent d'un article : pour une FAQ, le conseiller
 * cherche une réponse à coller dans son chat / email. On affiche donc
 * la réponse complète in-line + un bouton de copie en 1 clic, plutôt
 * que naviguer vers une page dédiée.
 *
 * Note : les compteurs helpful sont initialisés à 0 ici parce que le
 * payload SearchResult ne les transporte pas (gain de bande passante).
 * Le composant FaqHelpfulButtons sync les vrais compteurs après le 1er vote.
 */
export function FaqResultExpansion({ result, onCopy }: FaqResultExpansionProps) {
  return (
    <li role="presentation" className="faq-result-expansion">
      <div className="faq-result-expansion__answer">
        <p
          className="faq-result-expansion__text"
          dangerouslySetInnerHTML={{ __html: sanitizeHighlight(result.excerpt) }}
        />
      </div>
      <div className="faq-result-expansion__actions">
        <FaqHelpfulButtons
          faqId={result.id}
          helpfulYes={0}
          helpfulNo={0}
          size="compact"
        />
        <div className="faq-result-expansion__actions-spacer" />
        <Button
          variant="primary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onCopy(result.excerpt);
          }}
        >
          Copier la réponse
        </Button>
      </div>
    </li>
  );
}
