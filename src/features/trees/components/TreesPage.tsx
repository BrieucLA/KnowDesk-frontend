import React, { useState, useCallback } from 'react';
import { useTrees }    from '../hooks/useTrees';
import '../trees.css';
import { Button }      from '../../../shared/components/ui/Button';
import { Input }       from '../../../shared/components/ui/Input';
import { Modal }       from '../../../shared/components/ui/Modal';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';
import { EmptyState }  from '../../../shared/components/ui/EmptyState';
import { Skeleton }    from '../../../shared/components/ui/Skeleton';
import { EntityCard }  from '../../../shared/components/ui/EntityCard';
import { PageHeader }  from '../../../shared/components/layout/PageHeader';
import { formatRelative } from '../../../shared/lib/formatDate';
import { useAuthStore, selectUserRole } from '../../../store/authStore';

interface TreesPageProps {
  onOpenTree:   (treeId: string) => void;
  onEditTree:   (treeId: string) => void;
  onPreviewTree: (treeId: string) => void;
}

export function TreesPage({ onOpenTree, onEditTree, onPreviewTree }: TreesPageProps) {
  const role    = useAuthStore(selectUserRole);
  const isAdmin = role === 'admin' || role === 'manager';
  const { trees, loading, createTree, deleteTree, publishTree } = useTrees();

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle,   setNewTitle]   = useState('');
  const [creating,   setCreating]   = useState(false);

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

  return (
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

      {/* Modale de création */}
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

      {/* Liste */}
      {loading ? (
        <div className="trees-list">
          {[1,2,3].map(i => <Skeleton key={i} className="sk-card" />)}
        </div>
      ) : trees.length === 0 ? (
        <EmptyState
          title="Aucun processus guidé"
          description="Créez votre premier arbre de décision pour guider vos conseillers."
          ctaLabel={isAdmin ? '+ Nouveau processus' : undefined}
          onCta={isAdmin ? () => setShowCreate(true) : undefined}
        />
      ) : (
        <ul className="trees-list" role="list">
          {trees.map(tree => (
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
                    <Button variant="ghost" size="sm" onClick={() => deleteTree(tree.id)}>Supprimer</Button>
                  </>
                )}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
