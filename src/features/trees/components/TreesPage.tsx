import React, { useState, useCallback } from 'react';
import { useTrees }    from '../hooks/useTrees';
import { Button }      from '../../../shared/components/ui/Button';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';
import { EmptyState }  from '../../../shared/components/ui/EmptyState';
import { Skeleton }    from '../../../shared/components/ui/Skeleton';
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
      <div className="trees-page__header">
        <div>
          <h1 className="trees-page__title">Processus guidés</h1>
          <p className="trees-page__desc">Arbres de décision pour guider vos conseillers.</p>
        </div>
        {isAdmin && (
          <Button variant="primary" size="md" onClick={() => setShowCreate(true)}>
            + Nouveau processus
          </Button>
        )}
      </div>

      {/* Modale de création */}
      {showCreate && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div className="modal">
            <div className="modal__header">
              <h2 className="modal__title">Nouveau processus</h2>
              <button type="button" className="modal__close" onClick={() => setShowCreate(false)}>×</button>
            </div>
            <div className="modal__body">
              <div className="field">
                <label htmlFor="tree-title" className="field-label">Titre du processus</label>
                <input
                  id="tree-title"
                  type="text"
                  className="field-input"
                  placeholder="ex. Processus de remboursement"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
                  autoFocus
                />
              </div>
              <div className="modal__actions">
                <Button variant="ghost"   size="md" onClick={() => setShowCreate(false)}>Annuler</Button>
                <Button variant="primary" size="md" loading={creating} onClick={handleCreate}
                  disabled={!newTitle.trim()}>
                  Créer
                </Button>
              </div>
            </div>
          </div>
        </div>
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
          ctaLabel={isAdmin ? '+ Créer un processus' : undefined}
          onCta={isAdmin ? () => setShowCreate(true) : undefined}
        />
      ) : (
        <ul className="trees-list" role="list">
          {trees.map(tree => (
            <li key={tree.id} className="tree-card">
              <div className="tree-card__main" onClick={() => onOpenTree(tree.id)} role="button" tabIndex={0}>
                <div className="tree-card__header">
                  <StatusBadge status={tree.status} />
                  {tree.category_name && (
                    <span className="tree-card__category">{tree.category_name}</span>
                  )}
                </div>
                <h3 className="tree-card__title">{tree.title}</h3>
                {tree.description && (
                  <p className="tree-card__desc">{tree.description}</p>
                )}
                <time className="tree-card__time">
                  Modifié {formatRelative(tree.updated_at)}
                </time>
              </div>
              {isAdmin && (
                <div className="tree-card__actions">
                  <Button variant="ghost" size="sm" onClick={() => onEditTree(tree.id)}>
                    Modifier
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onPreviewTree(tree.id)}>
                    Aperçu
                  </Button>
                  {tree.status === 'draft' && (
                    <Button variant="ghost" size="sm" onClick={() => publishTree(tree.id)}>
                      Publier
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => deleteTree(tree.id)}>
                    Supprimer
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
