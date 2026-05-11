import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useTrees }    from '../hooks/useTrees';
import '../trees.css';
import { Button }      from '../../../shared/components/ui/Button';
import { Input }       from '../../../shared/components/ui/Input';
import { Modal }       from '../../../shared/components/ui/Modal';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';
import { EmptyState }  from '../../../shared/components/ui/EmptyState';
import { Skeleton }    from '../../../shared/components/ui/Skeleton';
import { EntityCard }  from '../../../shared/components/ui/EntityCard';
import { ConfirmDialog } from '../../../shared/components/ui/ConfirmDialog';
import { ActionMenu }        from '../../../shared/components/ui/ActionMenu';
import { FilterTabs }       from '../../../shared/components/ui/FilterTabs';
import { CategoryFilter, aggregateCountsWithDescendants } from '../../../shared/components/ui/CategoryFilter';
import { DataTable, type SortDir } from '../../../shared/components/ui/DataTable';
import { ListViewToggle, useListViewPref } from '../../../shared/components/ui/ListViewToggle';
import { PageHeader }       from '../../../shared/components/layout/PageHeader';
import { PageToolbar, PageToolbarSearch } from '../../../shared/components/layout/PageToolbar';
import { formatRelative }   from '../../../shared/lib/formatDate';
import { apiClient }        from '../../../shared/lib/apiClient';
import { useAuthStore, selectUserRole } from '../../../store/authStore';
import type { QuestionTreeSummary }  from '../types';
import type { Category }             from '../../knowledge/types';

interface TreesPageProps {
  onOpenTree:    (treeId: string) => void;
  onEditTree:    (treeId: string) => void;
  onPreviewTree: (treeId: string) => void;
}

type StatusTab = 'all' | 'published' | 'draft';
type SortKey   = 'title' | 'category' | 'updated_at';

export function TreesPage({ onOpenTree, onEditTree, onPreviewTree }: TreesPageProps) {
  const role    = useAuthStore(selectUserRole);
  const isAdmin = role === 'admin' || role === 'manager';
  const { trees, loading, createTree, deleteTree, publishTree } = useTrees();

  const [tab,        setTab]        = useState<StatusTab>('all');
  const [search,     setSearch]     = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sortBy,     setSortBy]     = useState<SortKey>('updated_at');
  const [sortDir,    setSortDir]    = useState<SortDir>('desc');
  const [view,       setView]       = useListViewPref('kd-trees-view', 'table');

  const [showCreate,        setShowCreate]        = useState(false);
  const [newTitle,          setNewTitle]          = useState('');
  const [creating,          setCreating]          = useState(false);
  const [confirmDeleteId,   setConfirmDeleteId]   = useState<string | null>(null);

  // Catégories chargées 1× au mount (pour le dropdown filtre)
  useEffect(() => {
    apiClient.get<Category[]>('/categories')
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const handleCreate = useCallback(async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const tree = await createTree({ title: newTitle.trim() });
      setNewTitle('');
      setShowCreate(false);
      onEditTree(tree.id);
    } catch { /* silencieux */ } finally {
      setCreating(false);
    }
  }, [newTitle, createTree, onEditTree]);

  // Compteurs par statut (sur l'ensemble, avant filtres recherche/catégorie)
  const counts = useMemo(() => ({
    all:       trees.length,
    published: trees.filter(t => t.status === 'published').length,
    draft:     trees.filter(t => t.status === 'draft').length,
  }), [trees]);

  // Pipeline filtres → tri
  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = trees.filter(t => {
      if (tab !== 'all'    && t.status !== tab)             return false;
      if (categoryId       && t.category_id !== categoryId) return false;
      if (q) {
        const hay = `${t.title} ${t.description ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const sign = sortDir === 'asc' ? 1 : -1;
    const compare = (a: QuestionTreeSummary, b: QuestionTreeSummary) => {
      if (sortBy === 'title')    return sign * a.title.localeCompare(b.title, 'fr');
      if (sortBy === 'category') return sign * (a.category_name ?? '').localeCompare(b.category_name ?? '', 'fr');
      // updated_at desc/asc
      return sign * (new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
    };
    return [...filtered].sort(compare);
  }, [trees, tab, search, categoryId, sortBy, sortDir]);

  const handleSortChange = (key: string, dir: SortDir) => {
    setSortBy(key as SortKey);
    setSortDir(dir);
  };

  const handleDeleteRequest = (id: string) => setConfirmDeleteId(id);
  const handleDeleteConfirm = useCallback(async () => {
    if (!confirmDeleteId) return;
    await deleteTree(confirmDeleteId);
    setConfirmDeleteId(null);
  }, [confirmDeleteId, deleteTree]);

  const renderRowActions = (tree: QuestionTreeSummary) => isAdmin ? (
    <ActionMenu
      items={[
        { label: 'Modifier', onClick: () => onEditTree(tree.id) },
        { label: 'Aperçu',   onClick: () => onPreviewTree(tree.id) },
        { label: 'Publier',  onClick: () => publishTree(tree.id), hidden: tree.status === 'published' },
        { type: 'separator' },
        { label: 'Supprimer', onClick: () => handleDeleteRequest(tree.id), variant: 'danger' },
      ]}
    />
  ) : null;

  // Counts par catégorie pour le dropdown filtre (cat + descendants agrégés)
  const categoryCounts = useMemo(
    () => aggregateCountsWithDescendants(categories, trees),
    [categories, trees],
  );

  const emptyState = (
    <EmptyState
      title={search || categoryId || tab !== 'all' ? 'Aucun processus ne correspond' : 'Aucun processus guidé'}
      description={
        search || categoryId || tab !== 'all'
          ? 'Affinez votre recherche ou retirez les filtres.'
          : 'Créez votre premier arbre de décision pour guider vos conseillers.'
      }
      ctaLabel={isAdmin && !search && !categoryId && tab === 'all' ? '+ Nouveau processus' : undefined}
      onCta={isAdmin && !search && !categoryId && tab === 'all' ? () => setShowCreate(true) : undefined}
    />
  );

  return (
    <>
      {confirmDeleteId && (
        <ConfirmDialog
          title="Supprimer ce processus ?"
          description="Cette action est définitive. Le processus et tous ses nœuds seront supprimés."
          confirmLabel="Supprimer"
          variant="danger"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}

      <div className="trees-page">
        <PageHeader
          title="Processus guidés"
          subtitle="Arbres de décision pour guider vos conseillers."
          actions={isAdmin && (
            <Button variant="primary" size="md" onClick={() => setShowCreate(true)}>
              + Nouveau processus
            </Button>
          )}
        />

        {showCreate && (
          <Modal
            title="Nouveau processus"
            onClose={() => setShowCreate(false)}
            asForm
            onSubmit={handleCreate}
            footer={
              <>
                <Button type="button" variant="ghost" size="md" onClick={() => setShowCreate(false)}>
                  Annuler
                </Button>
                <Button type="submit" variant="primary" size="md" loading={creating} disabled={!newTitle.trim()}>
                  Créer
                </Button>
              </>
            }
          >
            <Input
              id="tree-title"
              type="text"
              label="Titre du processus"
              placeholder="ex. Processus de remboursement"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              autoFocus
            />
          </Modal>
        )}

        <PageToolbar
          left={(
            <FilterTabs<StatusTab>
              options={[
                { id: 'all',       label: 'Tous',      count: counts.all },
                { id: 'published', label: 'Publiés',   count: counts.published },
                { id: 'draft',     label: 'Brouillons', count: counts.draft },
              ]}
              value={tab}
              onChange={setTab}
              ariaLabel="Filtrer par statut"
            />
          )}
          right={(
            <div className="trees-page__toolbar-right">
              <PageToolbarSearch
                id="trees-search"
                value={search}
                onChange={setSearch}
                placeholder="Filtrer la page…"
                ariaLabel="Filtrer les processus"
              />
              <ListViewToggle value={view} onChange={setView} />
            </div>
          )}
          extra={(
            <CategoryFilter
              categories={categories}
              value={categoryId}
              onChange={setCategoryId}
              counts={categoryCounts}
              totalCount={trees.length}
            />
          )}
        />

        {loading ? (
          view === 'table' ? (
            <DataTable
              columns={[
                { key: 'title',      label: 'Titre',     sortable: true },
                { key: 'category',   label: 'Catégorie', sortable: true },
                { key: 'status',     label: 'Statut' },
                { key: 'updated_at', label: 'Mis à jour', sortable: true },
              ]}
              data={[]}
              rowKey={(_) => ''}
              loading
            />
          ) : (
            <div className="trees-list">
              {[1,2,3].map(i => <Skeleton key={i} className="sk-card" />)}
            </div>
          )
        ) : filteredSorted.length === 0 ? (
          emptyState
        ) : view === 'table' ? (
          <DataTable<QuestionTreeSummary>
            columns={[
              { key: 'title',      label: 'Titre',     sortable: true,
                render: t => <span className="trees-page__title">{t.title}</span> },
              { key: 'category',   label: 'Catégorie', sortable: true,
                render: t => t.category_name ?? <span className="trees-page__muted">—</span> },
              { key: 'status',     label: 'Statut',
                render: t => <StatusBadge status={t.status} /> },
              { key: 'updated_at', label: 'Mis à jour', sortable: true,
                render: t => formatRelative(t.updated_at) },
            ]}
            data={filteredSorted}
            rowKey={t => t.id}
            sortBy={sortBy}
            sortDir={sortDir}
            onSortChange={handleSortChange}
            onRowClick={t => onOpenTree(t.id)}
            rowActions={renderRowActions}
          />
        ) : (
          <ul className="trees-list" role="list">
            {filteredSorted.map(tree => (
              <li key={tree.id}>
                <EntityCard
                  badges={(
                    <>
                      <StatusBadge status={tree.status} />
                      {tree.category_name && (
                        <span className="tree-card__category">{tree.category_name}</span>
                      )}
                    </>
                  )}
                  title={tree.title}
                  description={tree.description || undefined}
                  meta={<>Modifié <time dateTime={tree.updated_at}>{formatRelative(tree.updated_at)}</time></>}
                  onClick={() => onOpenTree(tree.id)}
                  ariaLabel={`Ouvrir le processus ${tree.title}`}
                  actions={isAdmin && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => onEditTree(tree.id)}>Modifier</Button>
                      <Button variant="ghost" size="sm" onClick={() => onPreviewTree(tree.id)}>Aperçu</Button>
                      {tree.status === 'draft' && (
                        <Button variant="ghost" size="sm" onClick={() => publishTree(tree.id)}>Publier</Button>
                      )}
                      <Button variant="danger" size="sm" onClick={() => handleDeleteRequest(tree.id)}>Supprimer</Button>
                    </>
                  )}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
