import React from 'react';
import { Skeleton } from './Skeleton';
import './DataTable.css';

export type SortDir = 'asc' | 'desc';

export interface DataTableColumn<T> {
  /** Identifiant utilisé pour le tri. Doit être unique. */
  key:        string;
  label:      string;
  /** Si true → header cliquable, page appelante gère le state de tri. */
  sortable?:  boolean;
  /** Largeur CSS (ex: '120px', '20%'). Optionnel. */
  width?:     string;
  /** Alignement (default left, useful pour les colonnes numériques). */
  align?:     'left' | 'center' | 'right';
  /** Rendu de la cellule. Si absent, on affiche `row[key]` brut. */
  render?:    (row: T) => React.ReactNode;
  /** Classe additionnelle appliquée à la `<td>`. */
  cellClassName?: string;
}

interface DataTableProps<T> {
  columns:        ReadonlyArray<DataTableColumn<T>>;
  data:           ReadonlyArray<T>;
  /** Fonction pour extraire la clé React (typiquement row.id). */
  rowKey:         (row: T) => string;
  loading?:       boolean;
  sortBy?:        string;
  sortDir?:       SortDir;
  onSortChange?:  (key: string, dir: SortDir) => void;
  /** Clic sur la ligne entière. */
  onRowClick?:    (row: T) => void;
  /** Cellule "Actions" affichée en dernier (admin only typiquement).
   *  Ne pas inclure cette colonne dans `columns` — gérée séparément. */
  rowActions?:    (row: T) => React.ReactNode;
  /** Rendu custom quand data est vide (après loading=false). */
  emptyState?:    React.ReactNode;
  /** Nombre de lignes squelette pendant le loading (default 5). */
  skeletonRows?:  number;
  /** Optionnel : ajoute une classe par ligne (typiquement pour highlight). */
  rowClassName?:  (row: T) => string | undefined;
  /** Optionnel : pose un ref sur la ligne (typiquement pour scrollIntoView). */
  rowRef?:        (row: T, el: HTMLTableRowElement | null) => void;
}

/**
 * Tableau de données générique avec tri par colonne, skeleton, empty state,
 * a11y (role/scope), hover-row optionnel via `onRowClick`.
 *
 * Pattern unifié pour les pages list : Articles, FAQs, Trees.
 */
export function DataTable<T>({
  columns,
  data,
  rowKey,
  loading,
  sortBy,
  sortDir,
  onSortChange,
  onRowClick,
  rowActions,
  emptyState,
  skeletonRows = 5,
  rowClassName,
  rowRef,
}: DataTableProps<T>) {
  const toggleSort = (key: string) => {
    if (!onSortChange) return;
    if (sortBy === key) {
      onSortChange(key, sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(key, 'asc');
    }
  };

  if (loading) {
    return (
      <div className="data-table" aria-busy="true">
        <div className="data-table__skel">
          {Array.from({ length: skeletonRows }).map((_, i) => (
            <Skeleton key={i} className="data-table__skel-row" />
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <div className="data-table">
      <table className="data-table__table" role="table">
        <thead>
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                scope="col"
                className={`data-table__th data-table__th--${col.align ?? 'left'}`}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.sortable ? (
                  <button
                    type="button"
                    className={`data-table__sort ${sortBy === col.key ? 'data-table__sort--active' : ''}`}
                    onClick={() => toggleSort(col.key)}
                    title={`Trier par ${col.label.toLowerCase()}`}
                    aria-sort={
                      sortBy === col.key
                        ? sortDir === 'asc' ? 'ascending' : 'descending'
                        : 'none'
                    }
                  >
                    {col.label}
                    <span className="data-table__sort-icon" aria-hidden="true">
                      {sortBy === col.key
                        ? (sortDir === 'asc' ? '↑' : '↓')
                        : '↕'}
                    </span>
                  </button>
                ) : (
                  col.label
                )}
              </th>
            ))}
            {rowActions && (
              <th
                scope="col"
                className="data-table__th data-table__th--actions"
                aria-label="Actions"
              />
            )}
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr
              key={rowKey(row)}
              ref={rowRef ? (el) => rowRef(row, el) : undefined}
              className={`data-table__row ${onRowClick ? 'data-table__row--clickable' : ''} ${rowClassName?.(row) ?? ''}`}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map(col => (
                <td
                  key={col.key}
                  className={`data-table__td data-table__td--${col.align ?? 'left'} ${col.cellClassName ?? ''}`}
                >
                  {col.render ? col.render(row) : (row as Record<string, unknown>)[col.key] as React.ReactNode}
                </td>
              ))}
              {rowActions && (
                <td
                  className="data-table__td data-table__td--actions"
                  onClick={e => e.stopPropagation()}
                >
                  {rowActions(row)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
