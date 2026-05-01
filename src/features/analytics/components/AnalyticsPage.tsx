import React from 'react';
import { Skeleton } from '../../../shared/components/ui/Skeleton';
import { formatRelative } from '../../../shared/lib/formatDate';
import { useAnalytics } from '../hooks/useAnalytics';
import type {
  AnalyticsOverview, ArticleSummary, TopContributor,
  CategoryCoverage, TopTag, UnusedTag,
} from '../types';

interface AnalyticsPageProps {
  onOpenArticle: (articleId: string) => void;
}

export function AnalyticsPage({ onOpenArticle }: AnalyticsPageProps) {
  const { data, loading, error } = useAnalytics();

  if (loading) {
    return (
      <div className="analytics-page">
        <h1 className="analytics-page__title">Analytics</h1>
        <div className="analytics-grid">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="sk-card" />)}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="analytics-page">
        <h1 className="analytics-page__title">Analytics</h1>
        <p className="field-error" role="alert">{error ?? 'Impossible de charger les analytics.'}</p>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <header className="analytics-page__header">
        <h1 className="analytics-page__title">Analytics</h1>
        <p className="analytics-page__desc">
          Vue d'ensemble de la santé éditoriale de votre base de connaissance.
        </p>
      </header>

      <InventoryRow inventory={data.inventory} />

      <div className="analytics-grid">
        <ArticlesToReviewCard items={data.articlesToReview} onOpen={onOpenArticle} />
        <OrphanDraftsCard       items={data.orphanDrafts}        onOpen={onOpenArticle} />
        <NoTagsCard             items={data.articlesWithoutTags} onOpen={onOpenArticle} />
        <TopContributorsCard    items={data.topContributors}     />
        <CoverageCard           items={data.coverageByCategory}  />
        <TopTagsCard            items={data.topTags}             />
        <UnusedTagsCard         items={data.unusedTags}          />
      </div>
    </div>
  );
}

// ── Inventory : la rangée du haut ──────────────────────────────

function InventoryRow({ inventory }: { inventory: AnalyticsOverview['inventory'] }) {
  const stats = [
    { label: 'Articles publiés', value: inventory.articlesPublished },
    { label: 'Brouillons',       value: inventory.articlesDraft     },
    { label: 'Archivés',         value: inventory.articlesArchived  },
    { label: 'Tags',             value: inventory.tagsCount         },
    { label: 'Processus guidés', value: inventory.treesCount        },
  ];
  return (
    <div className="analytics-stats">
      {stats.map(s => (
        <div key={s.label} className="analytics-stat">
          <span className="analytics-stat__value">{s.value}</span>
          <span className="analytics-stat__label">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Card générique ────────────────────────────────────────────

function AnalyticsCard({
  title, description, count, emptyHint, children,
}: {
  title:        string;
  description?: string;
  count?:       number;
  emptyHint:    string;
  children:     React.ReactNode;
}) {
  const isEmpty = count === 0;
  return (
    <section className="analytics-card">
      <header className="analytics-card__header">
        <h2 className="analytics-card__title">
          {title}
          {count !== undefined && !isEmpty && (
            <span className="analytics-card__badge">{count}</span>
          )}
        </h2>
        {description && <p className="analytics-card__desc">{description}</p>}
      </header>
      <div className="analytics-card__body">
        {isEmpty ? <p className="analytics-card__empty">{emptyHint}</p> : children}
      </div>
    </section>
  );
}

// ── Cards ─────────────────────────────────────────────────────

function ArticleListItem({ a, onOpen }: { a: ArticleSummary; onOpen: (id: string) => void }) {
  return (
    <li className="analytics-list__item">
      <button type="button" className="analytics-list__btn" onClick={() => onOpen(a.id)}>
        <span className="analytics-list__title">{a.title}</span>
        <span className="analytics-list__meta">
          {a.categoryName ?? 'Sans catégorie'} · {formatRelative(a.lastUpdated)}
        </span>
      </button>
    </li>
  );
}

function ArticlesToReviewCard({ items, onOpen }: { items: ArticleSummary[]; onOpen: (id: string) => void }) {
  return (
    <AnalyticsCard
      title="Articles à vérifier"
      description="Publiés, non mis à jour depuis plus de 90 jours."
      count={items.length}
      emptyHint="Tous les articles publiés ont été mis à jour récemment."
    >
      <ul className="analytics-list">
        {items.map(a => <ArticleListItem key={a.id} a={a} onOpen={onOpen} />)}
      </ul>
    </AnalyticsCard>
  );
}

function OrphanDraftsCard({ items, onOpen }: { items: ArticleSummary[]; onOpen: (id: string) => void }) {
  return (
    <AnalyticsCard
      title="Brouillons orphelins"
      description="Brouillons sans modification depuis plus de 30 jours."
      count={items.length}
      emptyHint="Aucun brouillon ne dort dans votre base."
    >
      <ul className="analytics-list">
        {items.map(a => <ArticleListItem key={a.id} a={a} onOpen={onOpen} />)}
      </ul>
    </AnalyticsCard>
  );
}

function NoTagsCard({ items, onOpen }: { items: ArticleSummary[]; onOpen: (id: string) => void }) {
  return (
    <AnalyticsCard
      title="Articles sans tag"
      description="Articles publiés qui ne portent aucun tag."
      count={items.length}
      emptyHint="Tous les articles publiés ont au moins un tag."
    >
      <ul className="analytics-list">
        {items.map(a => <ArticleListItem key={a.id} a={a} onOpen={onOpen} />)}
      </ul>
    </AnalyticsCard>
  );
}

function TopContributorsCard({ items }: { items: TopContributor[] }) {
  return (
    <AnalyticsCard
      title="Top contributeurs"
      description="Auteurs les plus actifs (count = total ; (X) = 30 derniers jours)."
      count={items.length}
      emptyHint="Aucun article publié pour l'instant."
    >
      <ul className="analytics-list">
        {items.map(c => (
          <li key={c.userId} className="analytics-list__item analytics-list__item--row">
            <span className="analytics-list__title">{c.email}</span>
            <span className="analytics-list__counter">
              {c.count}
              {c.recentCount > 0 && <span className="analytics-list__counter-recent"> ({c.recentCount} récents)</span>}
            </span>
          </li>
        ))}
      </ul>
    </AnalyticsCard>
  );
}

function CoverageCard({ items }: { items: CategoryCoverage[] }) {
  const max = Math.max(1, ...items.map(c => c.count));
  return (
    <AnalyticsCard
      title="Couverture par catégorie"
      description="Nombre d'articles publiés par catégorie."
      count={items.length}
      emptyHint="Aucune catégorie pour l'instant."
    >
      <ul className="analytics-bars">
        {items.map(c => (
          <li key={c.categoryId} className="analytics-bar">
            <div className="analytics-bar__label">
              <span>{c.name}</span>
              <span className="analytics-bar__count">{c.count}</span>
            </div>
            <div className="analytics-bar__track">
              <div
                className="analytics-bar__fill"
                style={{ width: `${(c.count / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </AnalyticsCard>
  );
}

function TopTagsCard({ items }: { items: TopTag[] }) {
  return (
    <AnalyticsCard
      title="Tags les plus utilisés"
      description="Top 10 des tags par nombre d'articles."
      count={items.length}
      emptyHint="Aucun tag utilisé pour l'instant."
    >
      <ul className="analytics-chips">
        {items.map(t => (
          <li key={t.id}>
            <span className="chip chip--readonly">
              {t.displayName} <span className="chip__count">{t.count}</span>
            </span>
          </li>
        ))}
      </ul>
    </AnalyticsCard>
  );
}

function UnusedTagsCard({ items }: { items: UnusedTag[] }) {
  return (
    <AnalyticsCard
      title="Tags inutilisés"
      description="Présents en base mais qu'aucun article ne porte."
      count={items.length}
      emptyHint="Tous les tags sont utilisés. Bien joué."
    >
      <ul className="analytics-chips">
        {items.map(t => (
          <li key={t.id}>
            <span className="chip chip--readonly">{t.displayName}</span>
          </li>
        ))}
      </ul>
    </AnalyticsCard>
  );
}
