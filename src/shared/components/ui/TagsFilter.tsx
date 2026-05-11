import React, { useState } from 'react';
import './TagsFilter.css';

interface TagOption {
  /** Identifiant transporté côté API — souvent un slug. */
  id:          string;
  /** Libellé affiché à l'utilisateur. */
  displayName: string;
  /** Optionnel : nb d'items qui ont ce tag, affiché en exposant. */
  count?:      number;
}

interface TagsFilterProps {
  available:   ReadonlyArray<TagOption>;
  active:      ReadonlyArray<string>;
  onChange:    (next: string[]) => void;
  /** Combien de tags afficher avant le bouton « + N autres ». */
  initialVisible?: number;
  label?:      string;
}

/**
 * Filtre par tag — chips multi-select avec collapse "+ N autres" quand
 * la liste dépasse `initialVisible`. Les tags actifs sont toujours
 * visibles (en tête), pour que l'utilisateur sache toujours ce qui
 * filtre la vue.
 *
 * Factorisé depuis FaqsPage + KnowledgePage pour réutilisation.
 */
export function TagsFilter({
  available, active, onChange,
  initialVisible = 14,
  label = 'Filtrer par tag :',
}: TagsFilterProps) {
  const [expanded, setExpanded] = useState(false);

  if (available.length === 0) return null;

  const activeSet = new Set(active);
  // Tri : tags les plus utilisés en premier, mais tags actifs forcés en tête
  // (ils doivent rester visibles même si le tri par count les renvoie en queue).
  const sorted = [...available].sort((a, b) => {
    const aActive = activeSet.has(a.id) ? 1 : 0;
    const bActive = activeSet.has(b.id) ? 1 : 0;
    if (aActive !== bActive) return bActive - aActive;
    return (b.count ?? 0) - (a.count ?? 0);
  });

  const visible = expanded ? sorted : sorted.slice(0, initialVisible);
  const hiddenCount = sorted.length - visible.length;

  const toggle = (id: string) => {
    onChange(activeSet.has(id) ? active.filter(t => t !== id) : [...active, id]);
  };

  return (
    <div className="tags-filter">
      <span className="tags-filter__label">{label}</span>
      {visible.map(t => {
        const isActive = activeSet.has(t.id);
        return (
          <button
            key={t.id}
            type="button"
            className={`chip chip--xs ${isActive ? 'chip--active' : 'chip--readonly'}`}
            onClick={() => toggle(t.id)}
            aria-pressed={isActive}
          >
            {t.displayName}
          </button>
        );
      })}
      {hiddenCount > 0 && !expanded && (
        <button
          type="button"
          className="tags-filter__toggle"
          onClick={() => setExpanded(true)}
        >
          + {hiddenCount} autres
        </button>
      )}
      {expanded && sorted.length > initialVisible && (
        <button
          type="button"
          className="tags-filter__toggle"
          onClick={() => setExpanded(false)}
        >
          Réduire
        </button>
      )}
      {active.length > 0 && (
        <button
          type="button"
          className="tags-filter__clear"
          onClick={() => onChange([])}
        >
          Effacer
        </button>
      )}
    </div>
  );
}
