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
  /** Optionnel : counts agrégés (cat + descendants) par categoryId.
   *  Si fourni, "(N)" est affiché à la fin de chaque option. La page
   *  appelante calcule les counts (cf `aggregateCountsWithDescendants`). */
  counts?:    Record<string, number>;
  /** Optionnel : total à afficher dans l'option « toutes ». */
  totalCount?: number;
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
  counts,
  totalCount,
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

  const formatCount = (n: number | undefined): string => (typeof n === 'number' ? ` (${n})` : '');

  return (
    <label className="category-filter">
      <span className="category-filter__label">{label} :</span>
      <select
        className="category-filter__select"
        value={value ?? ''}
        onChange={e => onChange(e.target.value || null)}
      >
        <option value="">{allLabel}{formatCount(totalCount)}</option>
        {flat.map(c => (
          <option key={c.id} value={c.id}>
            {' '.repeat(c.depth)}{c.depth > 0 ? '— ' : ''}{c.name}{formatCount(counts?.[c.id])}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * Helper : à partir d'une liste plate d'items qui ont un `category_id`,
 * et de l'arbre des catégories, retourne un map `categoryId → count`
 * agrégé (cat + descendants). Les items sans category_id ne contribuent
 * à aucune entrée. À utiliser côté page appelante pour alimenter la
 * prop `counts` de `<CategoryFilter>`.
 */
export function aggregateCountsWithDescendants<T extends { category_id: string | null }>(
  categories: ReadonlyArray<CategoryNode>,
  items: ReadonlyArray<T>,
): Record<string, number> {
  // Count direct (par cat_id strict)
  const direct: Record<string, number> = {};
  for (const it of items) {
    if (!it.category_id) continue;
    direct[it.category_id] = (direct[it.category_id] ?? 0) + 1;
  }

  // Agrégation : pour chaque cat, somme = direct + tous descendants
  const agg: Record<string, number> = {};
  const sumNode = (n: CategoryNode): number => {
    const self = direct[n.id] ?? 0;
    const sub  = (n.children ?? []).reduce((acc, c) => acc + sumNode(c), 0);
    const total = self + sub;
    agg[n.id] = total;
    return total;
  };
  categories.forEach(sumNode);
  return agg;
}
