import React, { useCallback, useEffect, useState } from 'react';
import { learningApi } from '../api/learningApi';
import { PageHeader }  from '../../../shared/components/layout/PageHeader';
import { Button }      from '../../../shared/components/ui/Button';
import { Input }       from '../../../shared/components/ui/Input';
import { Modal }       from '../../../shared/components/ui/Modal';
import { ConfirmDialog } from '../../../shared/components/ui/ConfirmDialog';
import { ActionMenu }  from '../../../shared/components/ui/ActionMenu';
import { EmptyState }  from '../../../shared/components/ui/EmptyState';
import { Skeleton }    from '../../../shared/components/ui/Skeleton';
import { DataTable, type SortDir } from '../../../shared/components/ui/DataTable';
import { useToast }    from '../../../shared/lib/useToast';
import { ApiError }    from '../../../shared/lib/apiClient';
import { formatRelative } from '../../../shared/lib/formatDate';
import type { LearningPath, LearningPathRenewal } from '../types';
import './learning.css';

interface LearningAdminPageProps {
  onEditPath: (id: string) => void;
}

/**
 * Vue admin : liste des parcours de l'org + création rapide + suppression.
 * Édition fine (modules, ressources, quiz, assignations) déléguée à
 * `LearningPathEditor` (route /learning/:id/edit, commit ultérieur).
 */
export function LearningAdminPage({ onEditPath }: LearningAdminPageProps) {
  const toast = useToast();
  const [paths,   setPaths]   = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy,  setSortBy]  = useState<'name' | 'updated_at'>('updated_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const [showCreate, setShowCreate] = useState(false);
  const [newName,    setNewName]    = useState('');
  const [newDesc,    setNewDesc]    = useState('');
  const [newMandatory, setNewMandatory] = useState(false);
  const [newRenewal,   setNewRenewal]   = useState<LearningPathRenewal>(null);
  const [creating,     setCreating]     = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<LearningPath | null>(null);
  const [deleting,      setDeleting]      = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    learningApi.listPaths()
      .then(setPaths)
      .catch((err: unknown) => toast.error(err instanceof ApiError ? err.message : 'Impossible de charger les parcours.'))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = useCallback(async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const path = await learningApi.createPath({
        name:           newName.trim(),
        description:    newDesc.trim() || null,
        mandatory:      newMandatory,
        renewal_months: newRenewal,
      });
      setPaths(prev => [path, ...prev]);
      setShowCreate(false);
      setNewName(''); setNewDesc(''); setNewMandatory(false); setNewRenewal(null);
      toast.success('Parcours créé.');
      onEditPath(path.id);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Création impossible.');
    } finally {
      setCreating(false);
    }
  }, [newName, newDesc, newMandatory, newRenewal, toast, onEditPath]);

  const handleDelete = useCallback(async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await learningApi.deletePath(confirmDelete.id);
      setPaths(prev => prev.filter(p => p.id !== confirmDelete.id));
      setConfirmDelete(null);
      toast.success('Parcours supprimé.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Suppression impossible.');
    } finally {
      setDeleting(false);
    }
  }, [confirmDelete, toast]);

  const sorted = [...paths].sort((a, b) => {
    const sign = sortDir === 'asc' ? 1 : -1;
    if (sortBy === 'name') return sign * a.name.localeCompare(b.name, 'fr');
    return sign * (new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
  });

  const renderRowActions = (p: LearningPath) => (
    <ActionMenu items={[
      { label: 'Éditer',    onClick: () => onEditPath(p.id) },
      { type: 'separator' },
      { label: 'Supprimer', onClick: () => setConfirmDelete(p), variant: 'danger' },
    ]} />
  );

  const renewalLabel = (n: LearningPathRenewal): string =>
    n === null ? '—' : `${n} mois`;

  const emptyState = (
    <EmptyState
      title="Aucun parcours pour l'instant"
      description="Créez votre premier parcours en sélectionnant des articles, FAQs ou processus de votre base."
      ctaLabel="+ Nouveau parcours"
      onCta={() => setShowCreate(true)}
    />
  );

  return (
    <>
      {confirmDelete && (
        <ConfirmDialog
          title="Supprimer ce parcours ?"
          description={`« ${confirmDelete.name} » sera définitivement supprimé. Les assignations et complétions associées resteront en historique côté audit log.`}
          confirmLabel="Supprimer"
          variant="danger"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {showCreate && (
        <Modal
          title="Nouveau parcours de formation"
          onClose={() => setShowCreate(false)}
          asForm
          onSubmit={handleCreate}
          footer={
            <>
              <Button type="button" variant="ghost" size="md" onClick={() => setShowCreate(false)}>Annuler</Button>
              <Button type="submit" variant="primary" size="md" loading={creating} disabled={!newName.trim()}>
                Créer et éditer
              </Button>
            </>
          }
        >
          <Input
            id="path-name"
            type="text"
            label="Nom du parcours"
            placeholder="ex. Onboarding conseiller niveau 1"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            autoFocus
            required
          />
          <label className="learning-form__field">
            <span className="learning-form__label">Description (optionnel)</span>
            <textarea
              className="learning-form__textarea"
              placeholder="À quoi sert ce parcours ?"
              rows={3}
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
            />
          </label>
          <label className="learning-form__checkbox">
            <input
              type="checkbox"
              checked={newMandatory}
              onChange={e => setNewMandatory(e.target.checked)}
            />
            <span>Formation obligatoire pour les conseillers assignés</span>
          </label>
          <label className="learning-form__field">
            <span className="learning-form__label">Renouvellement périodique</span>
            <select
              className="learning-form__select"
              value={newRenewal === null ? '' : String(newRenewal)}
              onChange={e => setNewRenewal(e.target.value === '' ? null : Number(e.target.value) as LearningPathRenewal)}
            >
              <option value="">Jamais</option>
              <option value="3">Tous les 3 mois</option>
              <option value="6">Tous les 6 mois</option>
              <option value="12">Tous les 12 mois</option>
            </select>
          </label>
        </Modal>
      )}

      <div className="learning-page">
        <PageHeader
          title="Formations"
          subtitle="Parcours de formation pour vos conseillers, basés sur votre base de connaissance."
          actions={(
            <Button variant="primary" size="md" onClick={() => setShowCreate(true)}>
              + Nouveau parcours
            </Button>
          )}
        />

        {loading && paths.length === 0 ? (
          <div className="learning-page__skel">
            {[1,2,3].map(i => <Skeleton key={i} className="sk-card" />)}
          </div>
        ) : (
          <DataTable<LearningPath>
            columns={[
              { key: 'name', label: 'Parcours', sortable: true,
                render: p => (
                  <div className="learning-cell-name">
                    <div className="learning-cell-name__text">{p.name}</div>
                    {p.description && <div className="learning-cell-name__desc">{p.description}</div>}
                  </div>
                ),
              },
              { key: 'mandatory', label: 'Type',
                render: p => p.mandatory
                  ? <span className="badge badge--warning">Obligatoire</span>
                  : <span className="badge badge--secondary">Optionnel</span>,
              },
              { key: 'renewal', label: 'Renouvellement',
                render: p => renewalLabel(p.renewal_months),
              },
              { key: 'updated_at', label: 'Mis à jour', sortable: true, width: '140px',
                render: p => formatRelative(p.updated_at),
              },
            ]}
            data={sorted}
            rowKey={p => p.id}
            loading={loading}
            sortBy={sortBy}
            sortDir={sortDir}
            onSortChange={(k, d) => { setSortBy(k as 'name' | 'updated_at'); setSortDir(d); }}
            onRowClick={p => onEditPath(p.id)}
            rowActions={renderRowActions}
            emptyState={emptyState}
          />
        )}
      </div>
    </>
  );
}
