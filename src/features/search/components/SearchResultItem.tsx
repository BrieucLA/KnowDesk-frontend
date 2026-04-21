import React from 'react';
import { cn }             from '../../../shared/lib/cn';
import { formatRelative } from '../../../shared/lib/formatDate';
import type { SearchResult } from '../types';

const TYPE_CONFIG = {
  article: { label: 'Article',  className: 'badge badge--success'   },
  faq:     { label: 'FAQ',      className: 'badge badge--secondary'  },
  tree:    { label: 'Processus', className: 'badge badge--info'      },
} as const;

interface SearchResultItemProps {
  result:    SearchResult;
  isActive:  boolean;
  onClick:   (result: SearchResult) => void;
  id:        string;  // for aria-activedescendant
}

export function SearchResultItem({ result, isActive, onClick, id }: SearchResultItemProps) {
  const { label, className } = TYPE_CONFIG[result.type];

  return (
    <li
      id={id}
      role="option"
      aria-selected={isActive}
      className={cn('search-result', isActive && 'search-result--active')}
      onClick={() => onClick(result)}
      // Mouse enter syncs keyboard-active index visually
      onMouseEnter={e => (e.currentTarget as HTMLElement).closest('ul')?.setAttribute('data-mouse', 'true')}
    >
      <div className="search-result__main">
        <span className="search-result__title">
          {result.title}
        </span>
        {/* excerpt may contain <mark> tags — safe, server-controlled */}
        <p
          className="search-result__excerpt"
          dangerouslySetInnerHTML={{ __html: result.excerpt }}
        />
      </div>
      <div className="search-result__meta">
        <span className={className}>{label}</span>
        <span className="search-result__category">{result.category}</span>
        <time className="search-result__time" dateTime={result.updatedAt}>
          {formatRelative(result.updatedAt)}
        </time>
      </div>
    </li>
  );
}
