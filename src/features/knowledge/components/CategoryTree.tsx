import React, { useCallback } from 'react';
import { cn }              from '../../../shared/lib/cn';
import type { Category }   from '../types';

interface CategoryTreeProps {
  categories:       Category[];
  selectedId:       string | null;
  expandedIds:      Set<string>;
  onSelect:         (category: Category) => void;
  onToggleExpand:   (categoryId: string) => void;
  loading?:         boolean;
}

/**
 * CategoryTree — collapsible sidebar navigation.
 * Chevron click = expand/collapse only. Name click = navigate.
 * Expansion state lifted to parent (KnowledgePage) for persistence.
 */
export function CategoryTree({
  categories,
  selectedId,
  expandedIds,
  onSelect,
  onToggleExpand,
  loading,
}: CategoryTreeProps) {
  if (loading) {
    return (
      <nav className="category-tree" aria-label="Catégories">
        {[1,2,3,4].map(i => (
          <div key={i} className="category-tree__skeleton" aria-hidden="true">
            <div className="cat-sk cat-sk--item" />
          </div>
        ))}
      </nav>
    );
  }

  return (
    <nav className="category-tree" aria-label="Catégories de la base de connaissance">
      <ul role="tree" className="category-tree__list">
        {categories.map(cat => (
          <CategoryNode
            key={cat.id}
            category={cat}
            selectedId={selectedId}
            expandedIds={expandedIds}
            onSelect={onSelect}
            onToggleExpand={onToggleExpand}
            level={0}
          />
        ))}
      </ul>
    </nav>
  );
}

/* ── Category node — recursive ───────────────────────────────── */

interface CategoryNodeProps {
  category:       Category;
  selectedId:     string | null;
  expandedIds:    Set<string>;
  onSelect:       (cat: Category) => void;
  onToggleExpand: (categoryId: string) => void;
  level:          number;
}

function CategoryNode({
  category,
  selectedId,
  expandedIds,
  onSelect,
  onToggleExpand,
  level,
}: CategoryNodeProps) {
  const hasChildren = category.children.length > 0;
  const isSelected  = category.id === selectedId;
  const isOpen      = expandedIds.has(category.id);

  const handleSelect = useCallback(() => {
    onSelect(category);
  }, [category, onSelect]);

  const handleChevron = useCallback((e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    onToggleExpand(category.id);
  }, [category.id, onToggleExpand]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelect(); }
    if (e.key === 'ArrowRight' && hasChildren && !isOpen) { e.preventDefault(); onToggleExpand(category.id); }
    if (e.key === 'ArrowLeft'  && hasChildren && isOpen)  { e.preventDefault(); onToggleExpand(category.id); }
  }, [handleSelect, hasChildren, isOpen, category.id, onToggleExpand]);

  return (
    <li
      role="treeitem"
      aria-selected={isSelected}
      aria-expanded={hasChildren ? isOpen : undefined}
      aria-level={level + 1}
    >
      <div
        className={cn(
          'cat-item',
          isSelected && 'cat-item--selected',
        )}
        tabIndex={0}
        onClick={handleSelect}
        onKeyDown={handleKeyDown}
        style={{ '--cat-level': level } as React.CSSProperties}
      >
        {hasChildren ? (
          <button
            type="button"
            className={cn('cat-item__chevron', isOpen && 'cat-item__chevron--open')}
            onClick={handleChevron}
            aria-label={isOpen ? 'Replier' : 'Déplier'}
            tabIndex={-1}
          >
            ›
          </button>
        ) : (
          <span className="cat-item__dot" aria-hidden="true" />
        )}

        <span className="cat-item__name">{category.name}</span>

        <span className="cat-item__count" aria-label={`${category.articleCount} articles`}>
          {category.articleCount}
        </span>
      </div>

      {hasChildren && isOpen && (
        <ul role="group" className="cat-item__children">
          {category.children.map(child => (
            <CategoryNode
              key={child.id}
              category={child}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
              level={level + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
