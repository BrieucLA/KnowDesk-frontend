import React from 'react';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';
import { formatRelative } from '../../../shared/lib/formatDate';
import type { RecentArticle } from '../types';

interface ArticleRowProps {
  article:  RecentArticle;
  onClick:  (id: string) => void;
}

export function ArticleRow({ article, onClick }: ArticleRowProps) {
  return (
    <li
      className="article-row"
      role="button"
      tabIndex={0}
      onClick={() => onClick(article.id)}
      onKeyDown={e => e.key === 'Enter' && onClick(article.id)}
      aria-label={`${article.title}, ${article.status}, version ${article.version}`}
    >
      <div className="article-row__main">
        <span className="article-row__title">{article.title}</span>
        <span className="article-row__meta">
          {article.category} · v{article.version} · {article.authorName}
        </span>
      </div>
      <div className="article-row__right">
        <StatusBadge status={article.status} />
        <time
          className="article-row__time"
          dateTime={article.updatedAt}
          title={new Date(article.updatedAt).toLocaleString('fr-FR')}
        >
          {formatRelative(article.updatedAt)}
        </time>
      </div>
    </li>
  );
}
