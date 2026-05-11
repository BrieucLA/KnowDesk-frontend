import React, { useEffect, useMemo, useState } from 'react';
import { useFaqs }        from '../hooks/useFaqs';
import '../faqs.css';
import { Button }         from '../../../shared/components/ui/Button';
import { EmptyState }     from '../../../shared/components/ui/EmptyState';
import { StatusBadge }    from '../../../shared/components/ui/StatusBadge';
import { ConfirmDialog }  from '../../../shared/components/ui/ConfirmDialog';
import { ActionMenu }     from '../../../shared/components/ui/ActionMenu';
import { FilterTabs }     from '../../../shared/components/ui/FilterTabs';
import { TagsFilter }     from '../../../shared/components/ui/TagsFilter';
import { CategoryFilter, aggregateCountsWithDescendants } from '../../../shared/components/ui/CategoryFilter';
import { DataTable, type SortDir } from '../../../shared/components/ui/DataTable';
import { PageHeader }     from '../../../shared/components/layout/PageHeader';
import { PageToolbar, PageToolbarSearch } from '../../../shared/components/layout/PageToolbar';
import { formatRelative } from '../../../shared/lib/formatDate';
import { apiClient }      from '../../../shared/lib/apiClient';
import { useAuthStore, selectUserRole } from '../../../store/authStore';
import { tagsApi, type OrgTag } from '../../articles/api/tagsApi';
import type { FaqListItem, FaqStatus, FaqSortBy, FaqSortDir } from '../types';
import type { Category }  from '../../knowledge/types';

interface FaqsPageProps {
  onNewFaq:  () => void;
  onEditFaq: (id: string) => void;
}

type FilterTab = 'all' | FaqStatus | 'stale';

/** Map clé colonne DataTable → clé sortBy backend FAQ. */
const COL_TO_SORT: Record<string, FaqSortBy> = {
  category:  'category',
  helpful:   'helpful',
  views:     'views',
  updated_at:'updated',
};
const SORT_TO_COL: Record<FaqSortBy, string> = {
  category:  'category',
  helpful:   'helpful',
  views:     'views',
  updated:   'updated_at',
};

export function FaqsPage({ onNewFaq, onEditFaq }: FaqsPageProps) {
  const role    = useAuthStore(selectUserRole);
  const canEdit = role === 'admin' || role === 'manager';

  const [tab,        setTab]        = useState<FilterTab>('all');
  const [search,     setSearch]     = useState('');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [sortBy,     setSortBy]     = useState<FaqSortBy>('updated');
  const [sortDir,    setSortDir]    = useState<FaqSortDir>('desc');
  const [confirmDelete, setConfirmDelete] = useState<FaqListItem | null>(null);
  const [orgTags,    setOrgTags]    = useState<OrgTag[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const filterPayload = useMemo(() => ({
    status:     tab === 'stale' || tab === 'all' ? undefined : tab,
    staleOnly:  tab === 'stale' ? true : undefined,
    q:          search.trim() || undefined,
    tags:       activeTags.length > 0 ? activeTags : undefined,
    categoryId: categoryId ?? undefined,
    sortBy,
    sortDir,
    perPage:    50,
  }), [tab, search, activeTags, categoryId, sortBy, sortDir]);

  const { items, loading, setFilters, remove } = useFaqs(filterPayload);

  useEffect(() => { setFilters(filterPayload); }, [filterPayload, setFilters]);

  // Tags de l'org + catégories — 1× au mount
  useEffect(() => {
    tagsApi.list().then(setOrgTags).catch(() => setOrgTags([]));
    apiClient.get<Category[]>('/categories').then(setCategories).catch(() => setCategories([]));
  }, []);

  const counts = useMemo(() => ({
    all:       items.length,
    published: items.filter(f => f.status === 'published').length,
    draft:     items.filter(f => f.status === 'draft').length,
    stale:     items.filter(f => f.is_stale).length,
  }), [items]);

  // Counts catégorie agrégés (cat + descendants)
  const categoryCounts = useMemo(
    () => aggregateCountsWithDescendants(categories, items),
    [categories, items],
  );

  const handleSortChange = (key: string, dir: SortDir) => {
    const next = COL_TO_SORT[key];
    if (!next) return;
    setSortBy(next);
    setSortDir(dir);
  };

  const renderRowActions = (faq: FaqListItem) => canEdit ? (
    <ActionMenu
      items={[
        { label: 'Éditer',    onClick: () => onEditFaq(faq.id) },
        { type: 'separator' },
        { label: 'Supprimer', onClick: () => setConfirmDelete(faq), variant: 'danger' },
      ]}
    />
  ) : null;

  const emptyState = (
    <EmptyState
      title={search || activeTags.length > 0 || categoryId ? 'Aucune FAQ ne correspond' : 'Aucune FAQ pour l\'instant'}
      description={
        search || activeTags.length > 0 || categoryId
          ? 'Affinez votre recherche ou retirez les filtres.'
          : 'Créez votre première FAQ à partir des questions fréquentes de votre équipe.'
      }
      ctaLabel={canEdit && !search && activeTags.length === 0 && !categoryId ? '+ Nouvelle FAQ' : undefined}
      onCta={canEdit && !search && activeTags.length === 0 && !categoryId ? onNewFaq : undefined}
    />
  );

  return (
    <>
      {confirmDelete && (
        <ConfirmDialog
          title="Supprimer la FAQ ?"
          description={`« ${confirmDelete.question} » sera retirée définitivement.`}
          confirmLabel="Supprimer"
          variant="danger"
          onConfirm={async () => {
            const ok = await remove(confirmDelete.id);
            if (ok) setConfirmDelete(null);
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      <div className="faqs-page">
        <PageHeader
          title="FAQs"
          subtitle="Centralisez les questions fréquentes pour des réponses rapides."
          actions={canEdit && (
            <Button variant="primary" size="md" onClick={onNewFaq}>
              + Nouvelle FAQ
            </Button>
          )}
        />

        <PageToolbar
          left={(
            <FilterTabs<FilterTab>
              options={[
                { id: 'all',       label: 'Toutes',    count: counts.all },
                { id: 'published', label: 'Publiées',  count: counts.published },
                { id: 'draft',     label: 'Brouillons', count: counts.draft },
                { id: 'stale',     label: 'À réviser', count: counts.stale },
              ]}
              value={tab}
              onChange={setTab}
              ariaLabel="Filtrer par statut"
            />
          )}
          right={(
            <PageToolbarSearch
              id="faq-search"
              value={search}
              onChange={setSearch}
              placeholder="Filtrer la page…"
              ariaLabel="Filtrer les FAQs"
            />
          )}
          extra={(
            <>
              <CategoryFilter
                categories={categories}
                value={categoryId}
                onChange={setCategoryId}
                counts={categoryCounts}
                totalCount={items.length}
              />
              <TagsFilter
                available={orgTags.map(t => ({
                  id:          t.name,
                  displayName: t.display_name,
                  count:       t.articles_count,
                }))}
                active={activeTags}
                onChange={setActiveTags}
              />
            </>
          )}
        />

        <DataTable<FaqListItem>
          columns={[
            { key: 'question',   label: 'Question',
              render: faq => (
                <div className="faqs-cell-question">
                  <div className="faqs-cell-question__text">{faq.question}</div>
                  {faq.tags.length > 0 && (
                    <div className="faqs-cell-question__tags">
                      {faq.tags.slice(0, 4).map(t => (
                        <span key={t} className="chip chip--readonly chip--xs">{t}</span>
                      ))}
                      {faq.tags.length > 4 && <span className="faqs-cell-question__tags-more">+{faq.tags.length - 4}</span>}
                    </div>
                  )}
                </div>
              ),
            },
            { key: 'category',   label: 'Catégorie', sortable: true,
              render: faq => faq.category_name ?? <span className="faqs-cell-muted">—</span> },
            { key: 'status',     label: 'Statut',
              render: faq => (
                <div className="faqs-cell-status">
                  <StatusBadge status={faq.status === 'published' ? 'published' : 'draft'} />
                  {faq.visibility === 'public' && (
                    <span className="badge badge--info" title="Visible publiquement">Public</span>
                  )}
                  {faq.is_stale && (
                    <span className="badge badge--warning" title="Dernière révision il y a plus de 6 mois">À réviser</span>
                  )}
                </div>
              ),
            },
            { key: 'helpful',    label: '👍 / 👎', align: 'right', sortable: true,
              render: faq => {
                const totalVotes = faq.helpful_yes + faq.helpful_no;
                return (
                  <span className={totalVotes < 2 ? 'faqs-cell-muted' : ''}>
                    {faq.helpful_yes}👍 / {faq.helpful_no}👎
                  </span>
                );
              },
            },
            { key: 'views',      label: 'Vues', align: 'right', sortable: true,
              render: faq => faq.views },
            { key: 'updated_at', label: 'Mis à jour', sortable: true,
              render: faq => formatRelative(faq.updated_at) },
          ]}
          data={items}
          rowKey={faq => faq.id}
          loading={loading}
          sortBy={SORT_TO_COL[sortBy]}
          sortDir={sortDir}
          onSortChange={handleSortChange}
          onRowClick={canEdit ? faq => onEditFaq(faq.id) : undefined}
          rowActions={renderRowActions}
          emptyState={emptyState}
        />
      </div>
    </>
  );
}
