import React from 'react';
import './PageHeader.css';

interface PageHeaderProps {
  /** Titre h1 de la page. Peut être une string ou un noeud (ex. greeting dynamique) */
  title:     React.ReactNode;
  /** Sous-titre — 1 ligne descriptive sous le h1. Optionnel mais fortement recommandé. */
  subtitle?: React.ReactNode;
  /** Slot droite — généralement un CTA primaire (`<Button variant="primary">`). */
  actions?:  React.ReactNode;
  /** Identifiant pour `aria-labelledby` du contenu de la page. */
  titleId?:  string;
  className?: string;
}

/**
 * Header de page standard : H1 + sous-titre + zone CTA à droite.
 * Utilisé sur toutes les pages "liste" (Dashboard, Knowledge, FAQs,
 * Trees, Members, Analytics, Chats, Audit) pour garantir une
 * cohérence visuelle et d'accessibilité.
 */
export function PageHeader({ title, subtitle, actions, titleId, className }: PageHeaderProps) {
  return (
    <header className={`page-header${className ? ' ' + className : ''}`}>
      <div className="page-header__text">
        <h1 id={titleId} className="page-header__title">{title}</h1>
        {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  );
}
