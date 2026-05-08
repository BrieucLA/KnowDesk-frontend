import React from 'react';
import './EntityRow.css';

interface EntityRowProps {
  /** Titre principal (h3 ou texte simple — voir `as`). */
  title:      React.ReactNode;
  /** Ligne secondaire grise sous le titre. */
  subtitle?:  React.ReactNode;
  /** Slot droite : badges, statut, métadonnées en cluster. */
  meta?:      React.ReactNode;
  /** Actions optionnelles à droite (ex: « Modifier », « Supprimer ») —
   *  empêche la propagation onClick pour ne pas déclencher l'action principale. */
  actions?:   React.ReactNode;
  /** Clic sur la row (ouverture du détail). */
  onClick?:   () => void;
  ariaLabel?: string;
  className?: string;
}

/**
 * Ligne dense d'une liste d'entités. Utilisée pour Knowledge articles,
 * Knowledge processus inline, Conversations admin.
 *
 * Pour des cards riches (avec description multi-lignes + plusieurs
 * actions), utiliser `<EntityCard>` à la place.
 */
export function EntityRow({
  title, subtitle, meta, actions, onClick, ariaLabel, className,
}: EntityRowProps) {
  const hasOnClick = !!onClick;
  const Wrapper = hasOnClick ? 'button' : 'div';
  return (
    <Wrapper
      type={hasOnClick ? 'button' : undefined}
      className={`entity-row${hasOnClick ? ' entity-row--clickable' : ''}${className ? ' ' + className : ''}`}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <div className="entity-row__main">
        <span className="entity-row__title">{title}</span>
        {subtitle && <span className="entity-row__subtitle">{subtitle}</span>}
      </div>
      {meta && <div className="entity-row__meta">{meta}</div>}
      {actions && (
        <div
          className="entity-row__actions"
          onClick={e => e.stopPropagation()}
        >
          {actions}
        </div>
      )}
    </Wrapper>
  );
}
