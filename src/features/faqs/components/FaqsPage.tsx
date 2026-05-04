import React, { useEffect, useMemo, useState } from 'react';
import { useFaqs }        from '../hooks/useFaqs';
import { Button }         from '../../../shared/components/ui/Button';
import { Input }          from '../../../shared/components/ui/Input';
import { Skeleton }       from '../../../shared/components/ui/Skeleton';
import { EmptyState }     from '../../../shared/components/ui/EmptyState';
import { StatusBadge }    from '../../../shared/components/ui/StatusBadge';
import { ConfirmDialog }  from '../../../shared/components/ui/ConfirmDialog';
import { formatRelative } from '../../../shared/lib/formatDate';
import { useAuthStore, selectUserRole } from '../../../store/authStore';
import { tagsApi, type OrgTag } from '../../articles/api/tagsApi';
import type { FaqListItem, FaqStatus, FaqSortBy, FaqSortDir } from '../types';

interface FaqsPageProps {
  onNewFaq:  () => void;
  onEditFaq: (id: string) => void;
}

type FilterTab = 'all' | FaqStatus | 'stale';

export function FaqsPage({ onNewFaq, onEditFaq }: FaqsPageProps) {
  const role          = useAuthStore(selectUserRole);
  const canEdit       = role === 'admin' || role === 'manager';
  const [tab,    setTab]    = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [sortBy,  setSortBy]  = useState<FaqSortBy>('updated');
  const [sortDir, setSortDir] = useState<FaqSortDir>('desc');
  const [confirmDelete, setConfirmDelete] = useState<FaqListItem | null>(null);
  const [orgTags, setOrgTags] = useState<OrgTag[]>([]);

  const filterPayload = useMemo(() => ({
    status:    tab === 'stale' || tab === 'all' ? undefined : tab,
    staleOnly: tab === 'stale' ? true : undefined,
    q:         search.trim() || undefined,
    tags:      activeTags.length > 0 ? activeTags : undefined,
    sortBy,
    sortDir,
    perPage:   50,
  }), [tab, search, activeTags, sortBy, sortDir]);

  const { items, loading, setFilters, remove } = useFaqs(filterPayload);

  useEffect(() => { setFilters(filterPayload); }, [filterPayload, setFilters]);

  // Charge les tags de l'org pour l'UI filtre (1 fois au mount)
  useEffect(() => {
    tagsApi.list().then(setOrgTags).catch(() => {});
  }, []);

  const counts = useMemo(() => ({
    all:       items.length,
    published: items.filter(f => f.status === 'published').length,
    draft:     items.filter(f => f.status === 'draft').length,
    stale:     items.filter(f => f.is_stale).length,
  }), [items]);

  const toggleSort = (col: FaqSortBy) => {
    if (sortBy === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortDir(col === 'updated' ? 'desc' : 'desc');
    }
  };

  const sortIndicator = (col: FaqSortBy) => {
    if (sortBy !== col) return '';
    return sortDir === 'asc' ? ' ↑' : ' ↓';
  };

  const toggleTag = (slug: string) => {
    setActiveTags(prev => prev.includes(slug) ? prev.filter(t => t !== slug) : [...prev, slug]);
  };

  return (
    <>
      {confirmDelete && (
        <ConfirmDialog
          title={`Supprimer la FAQ ?`}
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
        <header className="faqs-page__header">
          <div>
            <h1 className="faqs-page__title">FAQs</h1>
            <p className="faqs-page__desc">
              Centralisez les questions fréquentes pour des réponses rapides.
            </p>
          </div>
          {canEdit && (
            <Button variant="primary" size="md" onClick={onNewFaq}>
              + Nouvelle FAQ
            </Button>
          )}
        </header>

        <div className="faqs-page__toolbar">
          <div className="faqs-page__tabs" role="tablist" aria-label="Filtrer par statut">
            {([
              { id: 'all',       label: 'Toutes',     count: counts.all },
              { id: 'published', label: 'Publiées',   count: counts.published },
              { id: 'draft',     label: 'Brouillons', count: counts.draft },
              { id: 'stale',     label: 'À réviser',  count: counts.stale },
            ] as const).map(t => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                className={`faqs-page__tab ${tab === t.id ? 'faqs-page__tab--active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="faqs-page__search">
            <Input
              id="faq-search"
              type="search"
              placeholder="Rechercher dans les FAQs…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Filtre multi-tag */}
        {orgTags.length > 0 && (
          <div className="faqs-page__tag-filter">
            <span className="faqs-page__tag-filter-label">Filtrer par tag :</span>
            {orgTags.slice(0, 30).map(t => {
              const active = activeTags.includes(t.name);
              return (
                <button
                  key={t.name}
                  type="button"
                  className={`chip chip--xs ${active ? 'chip--active' : 'chip--readonly'}`}
                  onClick={() => toggleTag(t.name)}
                  aria-pressed={active}
                >
                  {t.display_name}
                </button>
              );
            })}
            {activeTags.length > 0 && (
              <button
                type="button"
                className="faqs-page__tag-clear"
                onClick={() => setActiveTags([])}
              >
                Effacer
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div className="faqs-table">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="faqs-table__row-skel" />)}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title={search || activeTags.length > 0 ? 'Aucune FAQ ne correspond' : 'Aucune FAQ pour l\'instant'}
            description={
              search || activeTags.length > 0
                ? 'Affinez votre recherche ou retirez les filtres.'
                : 'Créez votre première FAQ à partir des questions fréquentes de votre équipe.'
            }
            ctaLabel={canEdit && !search && activeTags.length === 0 ? '+ Nouvelle FAQ' : undefined}
            onCta={canEdit && !search && activeTags.length === 0 ? onNewFaq : undefined}
          />
        ) : (
          <table className="faqs-table" role="table">
            <thead>
              <tr>
                <th scope="col" className="faqs-table__th faqs-table__th--question">Question</th>
                <th scope="col" className="faqs-table__th">Catégorie</th>
                <th scope="col" className="faqs-table__th">Statut</th>
                <th scope="col" className="faqs-table__th faqs-table__th--num">
                  <button type="button" onClick={() => toggleSort('helpful')} className="faqs-table__sort">
                    👍 / 👎{sortIndicator('helpful')}
                  </button>
                </th>
                <th scope="col" className="faqs-table__th faqs-table__th--num">
                  <button type="button" onClick={() => toggleSort('views')} className="faqs-table__sort">
                    Vues{sortIndicator('views')}
                  </button>
                </th>
                <th scope="col" className="faqs-table__th">
                  <button type="button" onClick={() => toggleSort('updated')} className="faqs-table__sort">
                    Mise à jour{sortIndicator('updated')}
                  </button>
                </th>
                {canEdit && <th scope="col" className="faqs-table__th faqs-table__th--actions" aria-label="Actions" />}
              </tr>
            </thead>
            <tbody>
              {items.map(faq => {
                const totalVotes = faq.helpful_yes + faq.helpful_no;
                return (
                  <tr
                    key={faq.id}
                    className={`faqs-table__row ${canEdit ? 'faqs-table__row--clickable' : ''}`}
                    onClick={canEdit ? () => onEditFaq(faq.id) : undefined}
                  >
                    <td className="faqs-table__td faqs-table__td--question">
                      <div className="faqs-table__question">{faq.question}</div>
                      {faq.tags.length > 0 && (
                        <div className="faqs-table__tags">
                          {faq.tags.slice(0, 4).map(t => (
                            <span key={t} className="chip chip--readonly chip--xs">{t}</span>
                          ))}
                          {faq.tags.length > 4 && <span className="faqs-table__tags-more">+{faq.tags.length - 4}</span>}
                        </div>
                      )}
                    </td>
                    <td className="faqs-table__td faqs-table__td--cat">
                      {faq.category_name ?? <span className="faqs-table__muted">—</span>}
                    </td>
                    <td className="faqs-table__td">
                      <div className="faqs-table__status-cell">
                        <StatusBadge status={faq.status === 'published' ? 'published' : 'draft'} />
                        {faq.visibility === 'public' && (
                          <span className="badge badge--info" title="Visible publiquement">Public</span>
                        )}
                        {faq.is_stale && (
                          <span className="badge badge--warning" title="Dernière révision il y a plus de 6 mois">À réviser</span>
                        )}
                      </div>
                    </td>
                    <td className="faqs-table__td faqs-table__td--num">
                      <span className={totalVotes < 2 ? 'faqs-table__muted' : ''}>
                        {faq.helpful_yes}👍 / {faq.helpful_no}👎
                      </span>
                    </td>
                    <td className="faqs-table__td faqs-table__td--num">{faq.views}</td>
                    <td className="faqs-table__td faqs-table__td--date">{formatRelative(faq.updated_at)}</td>
                    {canEdit && (
                      <td className="faqs-table__td faqs-table__td--actions" onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" onClick={() => onEditFaq(faq.id)}>Éditer</Button>
                        <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(faq)}>Supprimer</Button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
