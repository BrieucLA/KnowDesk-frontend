import React, { useEffect, useState } from 'react';
import { Skeleton }       from '../../../shared/components/ui/Skeleton';
import { Button }          from '../../../shared/components/ui/Button';
import { formatRelative }  from '../../../shared/lib/formatDate';
import { apiClient }       from '../../../shared/lib/apiClient';
import { useAnalytics }    from '../hooks/useAnalytics';
import { analyticsApi, type FaqSuggestion } from '../api/analyticsApi';
import { KbScoreCard } from '../../kbscore/components/KbScoreCard';
import type {
  AnalyticsOverview, ArticleSummary, TopContributor,
  CategoryCoverage, TopTag, UnusedTag,
  ViewedArticle, LowViewedArticle, SearchQueryStat, Engagement,
} from '../types';

interface AnalyticsPageProps {
  onOpenArticle: (articleId: string) => void;
  /** Optional — appelé quand l'admin clique « Créer une FAQ » sur une suggestion */
  onCreateFaq?: (initialQuestion: string) => void;
}

export function AnalyticsPage({ onOpenArticle, onCreateFaq }: AnalyticsPageProps) {
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

      <KbScoreCard />

      <InventoryRow inventory={data.inventory} />
      <EngagementRow engagement={data.engagement} windowDays={data.windowDays} />

      <AiAnswerStatsBanner onCreateFaq={onCreateFaq} />
      <ChatStatsBanner />

      {onCreateFaq && <FaqsToCreateBanner onCreate={onCreateFaq} />}

      <div className="analytics-grid">
        <TopViewedCard          items={data.topViewedArticles}   windowDays={data.windowDays} onOpen={onOpenArticle} />
        <LowViewedCard          items={data.lowViewedArticles}   windowDays={data.windowDays} onOpen={onOpenArticle} />
        <TopSearchesCard        items={data.topSearchQueries}    windowDays={data.windowDays} />
        <ZeroResultsCard        items={data.zeroResultsSearches} windowDays={data.windowDays} />
        <ArticlesToReviewCard   items={data.articlesToReview}    onOpen={onOpenArticle} />
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

function EngagementRow({ engagement, windowDays }: { engagement: Engagement; windowDays: number }) {
  return (
    <div className="analytics-stats analytics-stats--engagement" aria-label="Activité de l'équipe">
      <div className="analytics-stat">
        <span className="analytics-stat__value">{engagement.dau}</span>
        <span className="analytics-stat__label">Actifs aujourd'hui</span>
      </div>
      <div className="analytics-stat">
        <span className="analytics-stat__value">{engagement.wau}</span>
        <span className="analytics-stat__label">Actifs sur 7 jours</span>
      </div>
      <div className="analytics-stat">
        <span className="analytics-stat__value">{engagement.mau}</span>
        <span className="analytics-stat__label">Actifs sur {windowDays} jours</span>
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

// ── Phase 2 cards (vues + recherches) ─────────────────────────

function TopViewedCard({ items, windowDays, onOpen }: { items: ViewedArticle[]; windowDays: number; onOpen: (id: string) => void }) {
  return (
    <AnalyticsCard
      title="Articles les plus consultés"
      description={`Top 10 sur ${windowDays} jours.`}
      count={items.length}
      emptyHint="Pas encore assez de vues — revenez après quelques jours d'activité."
    >
      <ul className="analytics-list">
        {items.map(a => (
          <li key={a.id} className="analytics-list__item">
            <button type="button" className="analytics-list__btn" onClick={() => onOpen(a.id)}>
              <span className="analytics-list__title">{a.title}</span>
              <span className="analytics-list__meta">
                {a.categoryName ?? 'Sans catégorie'} · {a.views} vue{a.views > 1 ? 's' : ''}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </AnalyticsCard>
  );
}

function LowViewedCard({ items, windowDays, onOpen }: { items: LowViewedArticle[]; windowDays: number; onOpen: (id: string) => void }) {
  return (
    <AnalyticsCard
      title="Articles peu consultés"
      description={`Publiés depuis plus de ${windowDays} jours et lus au plus une fois sur la fenêtre.`}
      count={items.length}
      emptyHint="Tous vos articles publiés trouvent leur lecteur."
    >
      <ul className="analytics-list">
        {items.map(a => (
          <li key={a.id} className="analytics-list__item">
            <button type="button" className="analytics-list__btn" onClick={() => onOpen(a.id)}>
              <span className="analytics-list__title">{a.title}</span>
              <span className="analytics-list__meta">
                {a.categoryName ?? 'Sans catégorie'} · {a.views} vue · MAJ {formatRelative(a.lastUpdated)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </AnalyticsCard>
  );
}

function TopSearchesCard({ items, windowDays }: { items: SearchQueryStat[]; windowDays: number }) {
  return (
    <AnalyticsCard
      title="Top recherches"
      description={`Requêtes les plus fréquentes sur ${windowDays} jours.`}
      count={items.length}
      emptyHint="Pas encore de recherches enregistrées."
    >
      <ul className="analytics-list">
        {items.map(s => (
          <li key={s.query} className="analytics-list__item analytics-list__item--row">
            <span className="analytics-list__title">{s.query}</span>
            <span className="analytics-list__counter">{s.count}</span>
          </li>
        ))}
      </ul>
    </AnalyticsCard>
  );
}

function ZeroResultsCard({ items, windowDays }: { items: SearchQueryStat[]; windowDays: number }) {
  return (
    <AnalyticsCard
      title="Recherches sans résultat"
      description={`Requêtes qui n'ont rien retourné sur ${windowDays} jours — opportunités éditoriales.`}
      count={items.length}
      emptyHint="Aucune recherche infructueuse — votre base couvre bien le besoin."
    >
      <ul className="analytics-list">
        {items.map(s => (
          <li key={s.query} className="analytics-list__item analytics-list__item--row">
            <span className="analytics-list__title">{s.query}</span>
            <span className="analytics-list__counter">{s.count}</span>
          </li>
        ))}
      </ul>
    </AnalyticsCard>
  );
}

// ── Réponse IA — usage + qualité ─────────────────────────────

interface AiAnswerStats {
  windowDays:    number;
  totalShown:    number;
  doneCount:     number;
  unsureCount:   number;
  helpfulYes:    number;
  helpfulNo:     number;
  helpfulRatio:  number | null;
  topQueries:    Array<{ query: string; count: number }>;
  unsureQueries: Array<{ query: string; count: number }>;
}

function AiAnswerStatsBanner({ onCreateFaq }: { onCreateFaq?: (q: string) => void }) {
  const [stats,   setStats]   = useState<AiAnswerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    apiClient.get<AiAnswerStats>('/analytics/ai-answer')
      .then(d => { if (alive) setStats(d); })
      .catch(() => { /* silencieux : pas critique */ })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  if (loading) return null;
  if (!stats || stats.totalShown === 0) return null;

  const helpfulPct = stats.helpfulRatio !== null
    ? Math.round(stats.helpfulRatio * 100)
    : null;

  return (
    <section className="ai-stats" aria-labelledby="ai-stats-title">
      <header className="ai-stats__header">
        <h2 id="ai-stats-title" className="ai-stats__title">✨ Réponse IA — {stats.windowDays} derniers jours</h2>
      </header>
      <div className="ai-stats__row">
        <div className="ai-stats__metric">
          <span className="ai-stats__metric-value">{stats.totalShown}</span>
          <span className="ai-stats__metric-label">Réponses générées</span>
        </div>
        <div className="ai-stats__metric">
          <span className="ai-stats__metric-value">{stats.doneCount}</span>
          <span className="ai-stats__metric-label">Réponses précises</span>
        </div>
        <div className="ai-stats__metric">
          <span className="ai-stats__metric-value">{stats.unsureCount}</span>
          <span className="ai-stats__metric-label">Sans réponse</span>
        </div>
        <div className="ai-stats__metric">
          <span className="ai-stats__metric-value">
            {helpfulPct !== null ? `${helpfulPct}%` : '—'}
          </span>
          <span className="ai-stats__metric-label">
            Utiles ({stats.helpfulYes}👍 / {stats.helpfulNo}👎)
          </span>
        </div>
      </div>

      {(stats.topQueries.length > 0 || stats.unsureQueries.length > 0) && (
        <div className="ai-stats__queries">
          {stats.topQueries.length > 0 && (
            <div className="ai-stats__queries-col">
              <h3 className="ai-stats__queries-title">Top questions</h3>
              <ul className="ai-stats__list" role="list">
                {stats.topQueries.slice(0, 5).map(q => (
                  <li key={q.query} className="ai-stats__item">
                    <span className="ai-stats__item-q">« {q.query} »</span>
                    <span className="ai-stats__item-count">{q.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {stats.unsureQueries.length > 0 && (
            <div className="ai-stats__queries-col">
              <h3 className="ai-stats__queries-title">Questions sans réponse — pistes éditoriales</h3>
              <ul className="ai-stats__list" role="list">
                {stats.unsureQueries.slice(0, 5).map(q => (
                  <li key={q.query} className="ai-stats__item">
                    <span className="ai-stats__item-q">« {q.query} »</span>
                    <span className="ai-stats__item-count">{q.count}</span>
                    {onCreateFaq && (
                      <Button variant="ghost" size="sm" onClick={() => onCreateFaq(q.query)}>
                        Créer FAQ
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ── Chatbot — usage + qualité ────────────────────────────────

interface ChatStats {
  windowDays:         number;
  totalConversations: number;
  active:             number;
  resolved:           number;
  escalated:          number;
  abandoned:          number;
  resolvedRate:       number | null;
  escalationRate:     number | null;
  csatAverage:        number | null;
  csatRated:          number;
  topQuestions:       Array<{ question: string; count: number }>;
}

function ChatStatsBanner() {
  const [stats,   setStats]   = useState<ChatStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    apiClient.get<ChatStats>('/analytics/chat')
      .then(d => { if (alive) setStats(d); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  if (loading) return null;
  if (!stats || stats.totalConversations === 0) return null;

  const resolvedPct = stats.resolvedRate !== null ? Math.round(stats.resolvedRate * 100) : null;

  return (
    <section className="ai-stats" aria-labelledby="chat-stats-title">
      <header className="ai-stats__header">
        <h2 id="chat-stats-title" className="ai-stats__title" style={{ color: 'oklch(0.4 0.16 200)' }}>
          💬 Chatbot — {stats.windowDays} derniers jours
        </h2>
      </header>
      <div className="ai-stats__row">
        <div className="ai-stats__metric">
          <span className="ai-stats__metric-value">{stats.totalConversations}</span>
          <span className="ai-stats__metric-label">Conversations</span>
        </div>
        <div className="ai-stats__metric">
          <span className="ai-stats__metric-value">{resolvedPct !== null ? `${resolvedPct}%` : '—'}</span>
          <span className="ai-stats__metric-label">Résolues ({stats.resolved}/{stats.resolved + stats.escalated + stats.abandoned})</span>
        </div>
        <div className="ai-stats__metric">
          <span className="ai-stats__metric-value">{stats.escalated}</span>
          <span className="ai-stats__metric-label">Escaladées</span>
        </div>
        <div className="ai-stats__metric">
          <span className="ai-stats__metric-value">
            {stats.csatAverage !== null ? `${stats.csatAverage.toFixed(1)} ⭐` : '—'}
          </span>
          <span className="ai-stats__metric-label">CSAT moyen ({stats.csatRated} note{stats.csatRated > 1 ? 's' : ''})</span>
        </div>
      </div>

      {stats.topQuestions.length > 0 && (
        <div className="ai-stats__queries">
          <div className="ai-stats__queries-col">
            <h3 className="ai-stats__queries-title">Top thématiques des conversations</h3>
            <ul className="ai-stats__list" role="list">
              {stats.topQuestions.slice(0, 8).map(q => (
                <li key={q.question} className="ai-stats__item">
                  <span className="ai-stats__item-q">{q.question}</span>
                  <span className="ai-stats__item-count">{q.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}

// ── FAQs à créer (suggesteur P1) ─────────────────────────────

function FaqsToCreateBanner({ onCreate }: { onCreate: (question: string) => void }) {
  const [items,   setItems]   = useState<FaqSuggestion[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    analyticsApi.faqsToCreate()
      .then(data => { if (alive) setItems(data); })
      .catch(() => { if (alive) setItems([]); /* mode dégradé silencieux */ })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  if (loading) return null;
  if (!items || items.length === 0) return null;

  return (
    <section className="faqs-to-create" aria-labelledby="faqs-to-create-title">
      <header className="faqs-to-create__header">
        <h2 id="faqs-to-create-title" className="faqs-to-create__title">
          📝 FAQs à créer
        </h2>
        <p className="faqs-to-create__desc">
          Vos conseillers ou clients ont cherché ces termes sans résultat dans les 7 derniers jours.
          Créez une FAQ pour combler le manque.
        </p>
      </header>
      <ul className="faqs-to-create__list" role="list">
        {items.map(item => (
          <li key={item.query} className="faqs-to-create__item">
            <div className="faqs-to-create__main">
              <span className="faqs-to-create__query">« {item.query} »</span>
              <span className="faqs-to-create__meta">
                {item.searches} recherche{item.searches > 1 ? 's' : ''}
                {' · dernière '}{formatRelative(item.lastSeen)}
              </span>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onCreate(item.query)}
            >
              Créer une FAQ
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
