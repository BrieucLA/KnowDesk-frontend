import React from 'react';
import './PageToolbar.css';

interface PageToolbarProps {
  /** Slot gauche — généralement les onglets de filtre (statut). */
  left?:    React.ReactNode;
  /** Slot droite — recherche locale, dropdowns, boutons reset. */
  right?:   React.ReactNode;
  /** Slot bas (deuxième ligne) — chips de filtres tag, hints, etc. */
  extra?:   React.ReactNode;
  className?: string;
}

/**
 * Toolbar de page standard : zone gauche (tabs) + zone droite (search/filters)
 * + zone optionnelle extra (chips filtres tags). Prend en charge le wrap
 * responsive automatiquement.
 *
 * Pages utilisatrices : FAQs, Members, Chats, Audit. Knowledge a un layout
 * sidebar+main spécifique avec sa propre toolbar — il ne migre pas vers ce
 * pattern (pour l'instant).
 */
export function PageToolbar({ left, right, extra, className }: PageToolbarProps) {
  if (!left && !right && !extra) return null;
  return (
    <div className={`page-toolbar${className ? ' ' + className : ''}`}>
      {(left || right) && (
        <div className="page-toolbar__row">
          {left  && <div className="page-toolbar__left">{left}</div>}
          {right && <div className="page-toolbar__right">{right}</div>}
        </div>
      )}
      {extra && <div className="page-toolbar__extra">{extra}</div>}
    </div>
  );
}

interface PageToolbarSearchProps {
  value:        string;
  onChange:     (v: string) => void;
  placeholder?: string;
  ariaLabel?:   string;
  /** Optionnel — si présent, l'input est dans un form qui submit `value` */
  onSubmit?:    () => void;
  id?:          string;
}

/**
 * Input de recherche standard, à utiliser dans le slot `right` de
 * `<PageToolbar>`. Placeholder par défaut « Rechercher… ».
 */
export function PageToolbarSearch({
  value, onChange, placeholder = 'Rechercher…', ariaLabel, onSubmit, id,
}: PageToolbarSearchProps) {
  const inner = (
    <input
      id={id}
      type="search"
      className="page-toolbar__search-input"
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      aria-label={ariaLabel ?? placeholder}
    />
  );
  if (onSubmit) {
    return (
      <form
        className="page-toolbar__search"
        onSubmit={e => { e.preventDefault(); onSubmit(); }}
      >
        {inner}
      </form>
    );
  }
  return <div className="page-toolbar__search">{inner}</div>;
}
