import React, { useCallback } from 'react';
import { ArticleVersionHistory } from './ArticleVersionHistory';
import { ArticleFaqSection }    from './ArticleFaqSection';
import { StatusBadge }          from '../../../shared/components/ui/StatusBadge';
import { Skeleton }             from '../../../shared/components/ui/Skeleton';
import { useArticle }           from '../hooks/useArticle';
import { useAuthStore, selectUserRole } from '../../../store/authStore';
import { formatRelative }       from '../../../shared/lib/formatDate';

interface ArticlePageProps {
  articleId: string;
  onBack?:   () => void;
  onEdit?:   (articleId: string) => void;
}

export function ArticlePage({ articleId, onBack, onEdit }: ArticlePageProps) {
  const role    = useAuthStore(selectUserRole);
  const isAdmin = role === 'admin' || role === 'manager';
  const { state, reload } = useArticle(articleId);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard?.writeText(window.location.href);
  }, []);

  if (state.status === 'idle' || state.status === 'loading') {
    return (
      <div className="article-page article-page--loading" aria-busy="true">
        <div className="article-page__back-row">
          <Skeleton className="sk-back" />
        </div>
        <div className="article-page__header">
          <Skeleton className="sk-title" />
          <Skeleton className="sk-meta" />
        </div>
        <div className="article-page__body">
          <Skeleton className="sk-p" />
          <Skeleton className="sk-p sk-p--short" />
          <Skeleton className="sk-p" />
        </div>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="article-page article-page--error" role="alert">
        <p className="article-page__error-msg">{state.message}</p>
        <button className="article-page__retry" onClick={reload}>
          Réessayer
        </button>
        {onBack && (
          <button className="article-page__back-btn" onClick={onBack}>
            ← Retour
          </button>
        )}
      </div>
    );
  }

  const article = state.data;

  return (
    <article className="article-page" aria-labelledby="article-title">

      {/* Breadcrumb + actions */}
      <div className="article-page__topbar">
        <nav className="article-page__breadcrumb" aria-label="Fil d'Ariane">
          {onBack && (
            <button className="article-page__back-btn" onClick={onBack}>
              ← Base de connaissance
            </button>
          )}
          <span className="article-page__breadcrumb-sep" aria-hidden="true">/</span>
          <span className="article-page__breadcrumb-cat">{article.categoryName}</span>
        </nav>

        <div className="article-page__actions">
          <button
            className="article-page__action-btn"
            onClick={handleCopyLink}
            aria-label="Copier le lien"
            title="Copier le lien"
          >
            <CopyIcon />
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => onEdit?.(article.id)}
              className="article-page__edit-btn"
              aria-label="Modifier cet article"
            >
              Modifier
            </button>
          )}
        </div>
      </div>

      {/* Header */}
      <header className="article-page__header">
        <div className="article-page__header-meta">
          <StatusBadge status={article.status} />
          <span className="article-page__version">v{article.version}</span>
        </div>
        <h1 id="article-title" className="article-page__title">
          {article.title}
        </h1>
        <p className="article-page__meta">
          <span>Par {article.authorName}</span>
          <span aria-hidden="true"> · </span>
          <time dateTime={article.updatedAt}>
            Mis à jour {formatRelative(article.updatedAt)}
          </time>
        </p>
        {isOlderThan(article.updatedAt, 90) && (
          <div className="article-page__stale-warning" role="note">
            Cet article n'a pas été vérifié depuis plus de 90 jours.
          </div>
        )}
      </header>

      {/* Article body */}
      <div
        className="article-page__body article-content"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      {/* FAQ section */}
      <ArticleFaqSection faqs={article.faqs ?? []} />

      {/* Version history */}
      <ArticleVersionHistory
        versions={article.versions ?? []}
        currentVersion={article.version}
        canRestore={isAdmin}
        onRestore={isAdmin
          ? (v) => console.log('Restore version', v)
          : undefined
        }
      />

      {/* Report button */}
      {!isAdmin && (
        <div className="article-page__footer">
          <button className="article-page__report">
            Signaler une information incorrecte
          </button>
        </div>
      )}

    </article>
  );
}

function isOlderThan(isoString: string, days: number): boolean {
  if (!isoString) return false;
  const ms = Date.now() - new Date(isoString).getTime();
  return ms > days * 86_400_000;
}

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="5" y="5" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M11 5V3a2 2 0 00-2-2H3a2 2 0 00-2 2v6a2 2 0 002 2h2" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  );
}
