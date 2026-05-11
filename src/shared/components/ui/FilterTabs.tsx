import React from 'react';
import './FilterTabs.css';

interface FilterTabOption<T extends string> {
  id:     T;
  label:  string;
  count?: number;
}

interface FilterTabsProps<T extends string> {
  options:   ReadonlyArray<FilterTabOption<T>>;
  value:     T;
  onChange:  (id: T) => void;
  ariaLabel: string;
}

/**
 * Onglets de filtre (typiquement « statut » : Tous / Publiés / Brouillons…).
 *
 * Factorisé depuis FaqsPage pour réutilisation sur Articles + Trees.
 * Le composant ne gère ni les compteurs (calculés par la page appelante)
 * ni la persistance — uniquement le rendu + l'a11y (role=tablist).
 */
export function FilterTabs<T extends string>({
  options, value, onChange, ariaLabel,
}: FilterTabsProps<T>) {
  return (
    <div className="filter-tabs" role="tablist" aria-label={ariaLabel}>
      {options.map(t => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={value === t.id}
          className={`filter-tabs__tab ${value === t.id ? 'filter-tabs__tab--active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
          {typeof t.count === 'number' && (
            <span className="filter-tabs__count">{t.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
