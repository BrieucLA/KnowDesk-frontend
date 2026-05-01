import React, { useMemo, useState } from 'react';
import { useFaqs }        from '../hooks/useFaqs';
import { Button }         from '../../../shared/components/ui/Button';
import { Input }          from '../../../shared/components/ui/Input';
import { Skeleton }       from '../../../shared/components/ui/Skeleton';
import { EmptyState }     from '../../../shared/components/ui/EmptyState';
import { StatusBadge }    from '../../../shared/components/ui/StatusBadge';
import { ConfirmDialog }  from '../../../shared/components/ui/ConfirmDialog';
import { formatRelative } from '../../../shared/lib/formatDate';
import { useAuthStore, selectUserRole } from '../../../store/authStore';
import type { FaqListItem, FaqStatus } from '../types';

interface FaqsPageProps {
  onNewFaq:  () => void;
  onEditFaq: (id: string) => void;
}

type FilterTab = 'all' | FaqStatus;

export function FaqsPage({ onNewFaq, onEditFaq }: FaqsPageProps) {
  const role          = useAuthStore(selectUserRole);
  const canEdit       = role === 'admin' || role === 'manager';
  const [tab,    setTab]    = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<FaqListItem | null>(null);

  const filterPayload = useMemo(() => ({
    status: tab === 'all' ? undefined : tab,
    q:      search.trim() || undefined,
    perPage: 50,
  }), [tab, search]);

  const { items, loading, setFilters, remove } = useFaqs(filterPayload);

  // Re-trigger fetch on tab/search change
  React.useEffect(() => { setFilters(filterPayload); }, [filterPayload, setFilters]);

  const counts = useMemo(() => ({
    all:       items.length,
    published: items.filter(f => f.status === 'published').length,
    draft:     items.filter(f => f.status === 'draft').length,
  }), [items]);

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

        {loading ? (
          <div className="faqs-list">
            {[1, 2, 3].map(i => <Skeleton key={i} className="sk-card" />)}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title={search ? 'Aucune FAQ ne correspond' : 'Aucune FAQ pour l\'instant'}
            description={
              search
                ? 'Affinez votre recherche ou retirez les filtres.'
                : 'Créez votre première FAQ à partir des questions fréquentes de votre équipe.'
            }
            ctaLabel={canEdit && !search ? '+ Nouvelle FAQ' : undefined}
            onCta={canEdit && !search ? onNewFaq : undefined}
          />
        ) : (
          <ul className="faqs-list" role="list">
            {items.map(faq => (
              <li key={faq.id} className="faq-row">
                <button
                  type="button"
                  className="faq-row__main"
                  onClick={() => canEdit ? onEditFaq(faq.id) : undefined}
                  disabled={!canEdit}
                >
                  <div className="faq-row__header">
                    <StatusBadge status={faq.status === 'published' ? 'published' : 'draft'} />
                    {faq.visibility === 'public' && (
                      <span className="badge badge--info" title="Visible publiquement">Public</span>
                    )}
                    {faq.category_name && (
                      <span className="faq-row__category">{faq.category_name}</span>
                    )}
                  </div>
                  <h3 className="faq-row__question">{faq.question}</h3>
                  <div className="faq-row__meta">
                    <span>{faq.views} vue{faq.views === 1 ? '' : 's'}</span>
                    <span>·</span>
                    <span>Mise à jour {formatRelative(faq.updated_at)}</span>
                    {faq.tags.length > 0 && (
                      <>
                        <span>·</span>
                        <span className="faq-row__tags">
                          {faq.tags.slice(0, 3).map(t => (
                            <span key={t} className="chip chip--readonly chip--xs">{t}</span>
                          ))}
                          {faq.tags.length > 3 && <span className="faq-row__tags-more">+{faq.tags.length - 3}</span>}
                        </span>
                      </>
                    )}
                  </div>
                </button>
                {canEdit && (
                  <div className="faq-row__actions">
                    <Button variant="ghost" size="sm" onClick={() => onEditFaq(faq.id)}>Éditer</Button>
                    <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(faq)}>Supprimer</Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
