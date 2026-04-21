import React, { useState, useCallback } from 'react';
import { cn }              from '../../../shared/lib/cn';
import type { Category }   from '../types';

interface CategoryTreeProps {
  categories:       Category[];
  selectedId:       string | null;
  onSelect:         (category: Category) => void;
  loading?:         boolean;
}

/**
 * CategoryTree — collapsible sidebar navigation.
 * Top-level categories are always visible; children expand on click.
 * Keyboard: Arrow keys + Enter for full navigation.
 */
export function CategoryTree({ categories, selectedId, onSelect, loading }: CategoryTreeProps) {
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
            onSelect={onSelect}
            level={0}
          />
        ))}
      </ul>
    </nav>
  );
}

/* ── Category node — recursive ───────────────────────────────── */

interface CategoryNodeProps {
  category:   Category;
  selectedId: string | null;
  onSelect:   (cat: Category) => void;
  level:      number;
}

function CategoryNode({ category, selectedId, onSelect, level }: CategoryNodeProps) {
  const hasChildren = category.children.length > 0;
  const isSelected  = category.id === selectedId;

  // Auto-expand if a child is selected
  const childSelected = category.children.some(c => c.id === selectedId);
  const [isOpen, setIsOpen] = useState(childSelected);

  const handleClick = useCallback(() => {
    onSelect(category);
    if (hasChildren) setIsOpen(o => !o);
  }, [category, hasChildren, onSelect]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); }
    if (e.key === 'ArrowRight' && hasChildren) setIsOpen(true);
    if (e.key === 'ArrowLeft'  && hasChildren) setIsOpen(false);
  }, [handleClick, hasChildren]);

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
          `cat-item--level-${level}`,
          isSelected && 'cat-item--selected',
        )}
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        style={{ paddingLeft: `${12 + level * 16}px` }}
      >
        {hasChildren && (
          <span className={cn('cat-item__chevron', isOpen && 'cat-item__chevron--open')} aria-hidden="true">
            ›
          </span>
        )}
        {!hasChildren && (
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
              onSelect={onSelect}
              level={level + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
