import React from 'react';
import './CategoryFilter.css';

interface CategoryNode {
  id:       string;
  name:     string;
  parentId: string | null;
  children: CategoryNode[];
}

interface CategoryFilterProps {
  categories: ReadonlyArray<CategoryNode>;
  value:      string | null;
  onChange:   (id: string | null) => void;
  /** Label affiché à côté du `<select>` (a11y + UX). */
  label?:     string;
  /** Label de l'option « tout » (par défaut : "Toutes les catégories"). */
  allLabel?:  string;
}

/**
 * Filtre catégorie — dropdown qui aplatit la hiérarchie avec indentation
 * visuelle ("— Sous-cat" par niveau). Convient quand la taxonomie est plate
 * ou modérée (≤ ~50 catégories). Pour des arbres plus profonds, préférer
 * une sidebar dédiée (cf KnowledgePage avec `?sidebar=true`).
 */
export function CategoryFilter({
  categories, value, onChange,
  label = 'Catégorie',
  allLabel = 'Toutes les catégories',
}: CategoryFilterProps) {
  // Aplatit l'arbre en pre-order, avec un niveau pour indentation.
  const flat: Array<{ id: string; name: string; depth: number }> = [];
  const walk = (nodes: ReadonlyArray<CategoryNode>, depth: number) => {
    for (const n of nodes) {
      flat.push({ id: n.id, name: n.name, depth });
      if (n.children?.length) walk(n.children, depth + 1);
    }
  };
  walk(categories, 0);

  if (flat.length === 0) return null;

  return (
    <label className="category-filter">
      <span className="category-filter__label">{label} :</span>
      <select
        className="category-filter__select"
        value={value ?? ''}
        onChange={e => onChange(e.target.value || null)}
      >
        <option value="">{allLabel}</option>
        {flat.map(c => (
          <option key={c.id} value={c.id}>
            {' '.repeat(c.depth)}{c.depth > 0 ? '— ' : ''}{c.name}
          </option>
        ))}
      </select>
    </label>
  );
}
