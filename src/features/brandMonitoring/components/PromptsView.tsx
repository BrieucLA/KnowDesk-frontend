import { useEffect, useState, useCallback } from 'react';
import { brandMonitoringApi } from '../api/brandMonitoringApi';
import { useToast } from '../../../shared/lib/useToast';
import { Button } from '../../../shared/components/ui/Button';
import { Input }  from '../../../shared/components/ui/Input';
import { Skeleton } from '../../../shared/components/ui/Skeleton';
import { ConfirmDialog } from '../../../shared/components/ui/ConfirmDialog';
import type { MonitoringPrompt } from '../types';

interface PromptsViewProps {
  projectId:       string;
  onReloadProject: () => void;
}

export function PromptsView({ projectId, onReloadProject }: PromptsViewProps) {
  const toast = useToast();
  const [prompts, setPrompts] = useState<MonitoringPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [saving, setSaving] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<MonitoringPrompt | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await brandMonitoringApi.listPrompts(projectId);
      setPrompts(data);
    } catch (err) {
      toast.error((err as Error).message ?? 'Chargement impossible.');
    } finally {
      setLoading(false);
    }
  }, [projectId, toast]);

  useEffect(() => { void reload(); }, [reload]);

  const handleCreate = async () => {
    const text = newText.trim();
    if (text.length < 5) { toast.error('Le prompt doit faire au moins 5 caractères.'); return; }
    setSaving(true);
    try {
      await brandMonitoringApi.createPrompt(projectId, {
        text,
        topicHint: newTopic.trim() || undefined,
      });
      setNewText('');
      setNewTopic('');
      await reload();
      onReloadProject();
    } catch (err) {
      toast.error((err as Error).message ?? 'Création impossible.');
    } finally {
      setSaving(false);
    }
  };

  const handleBulk = async () => {
    const lines = bulkText.split('\n').map(l => l.trim()).filter(l => l.length >= 5);
    if (lines.length === 0) { toast.error('Aucune ligne valide (≥ 5 caractères) dans le texte.'); return; }
    if (lines.length > 200) { toast.error('Maximum 200 prompts à la fois.'); return; }
    setBulkSaving(true);
    try {
      const r = await brandMonitoringApi.bulkPrompts(projectId, lines.map(l => ({ text: l })));
      toast.success(`${r.inserted} prompts importés.`);
      setBulkText('');
      setBulkOpen(false);
      await reload();
      onReloadProject();
    } catch (err) {
      toast.error((err as Error).message ?? 'Import impossible.');
    } finally {
      setBulkSaving(false);
    }
  };

  const handleToggle = async (prompt: MonitoringPrompt) => {
    try {
      await brandMonitoringApi.updatePrompt(prompt.id, { active: !prompt.active });
      await reload();
    } catch (err) {
      toast.error((err as Error).message ?? 'Mise à jour impossible.');
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      await brandMonitoringApi.deletePrompt(pendingDelete.id);
      setPendingDelete(null);
      await reload();
      onReloadProject();
    } catch (err) {
      toast.error((err as Error).message ?? 'Suppression impossible.');
    }
  };

  if (loading) return <Skeleton className="bm-skeleton-card" />;

  return (
    <div className="bm-prompts">
      <section className="bm-card">
        <h3 className="bm-card__title">Ajouter un prompt</h3>
        <p className="bm-card__sub">
          Une question d'utilisateur grand public qu'on enverra à Mistral. Préfère une formulation
          naturelle (« Quel hypermarché choisir pour les courses ? ») plutôt qu'une requête de recherche
          (« meilleur hypermarché »).
        </p>
        <div className="bm-form">
          <Input
            id="bm-new-prompt-text"
            label="Prompt"
            value={newText}
            onChange={e => setNewText(e.target.value)}
            placeholder="Quel hypermarché choisir pour les courses ?"
          />
          <Input
            id="bm-new-prompt-topic"
            label="Topic (optionnel, sera regénéré par l'IA)"
            value={newTopic}
            onChange={e => setNewTopic(e.target.value)}
            placeholder="courses-quotidien"
          />
          <div className="bm-form__actions">
            <Button variant="primary" size="md" onClick={handleCreate} loading={saving} disabled={newText.trim().length < 5}>
              Ajouter
            </Button>
            <Button variant="ghost" size="md" onClick={() => setBulkOpen(o => !o)}>
              {bulkOpen ? 'Annuler import bulk' : '+ Import bulk (CSV)'}
            </Button>
          </div>
        </div>
        {bulkOpen && (
          <div className="bm-bulk">
            <p className="bm-bulk__hint">Une ligne = un prompt. Max 200.</p>
            <textarea
              className="bm-bulk__textarea"
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              placeholder={'Quel hypermarché choisir pour les courses ?\nQuelle enseigne propose le plus grand choix de produits bio ?\n…'}
              rows={8}
            />
            <Button variant="primary" size="sm" onClick={handleBulk} loading={bulkSaving}>
              Importer
            </Button>
          </div>
        )}
      </section>

      <section className="bm-card">
        <h3 className="bm-card__title">
          Prompts existants <span className="bm-card__count">({prompts.length})</span>
        </h3>
        {prompts.length === 0 ? (
          <p className="bm-empty-data">Aucun prompt pour l'instant.</p>
        ) : (
          <ul className="bm-prompts-list">
            {prompts.map(p => (
              <li key={p.id} className={`bm-prompt-row ${!p.active ? 'is-inactive' : ''}`}>
                <div className="bm-prompt-row__text">
                  {p.text}
                  {p.topic_cluster && (
                    <span className="bm-prompt-row__topic">· topic : {p.topic_cluster}</span>
                  )}
                </div>
                <div className="bm-prompt-row__actions">
                  <button
                    type="button"
                    className="bm-prompt-row__toggle"
                    onClick={() => handleToggle(p)}
                    aria-label={p.active ? 'Désactiver' : 'Activer'}
                  >
                    {p.active ? 'Actif' : 'Inactif'}
                  </button>
                  <button
                    type="button"
                    className="bm-prompt-row__delete"
                    onClick={() => setPendingDelete(p)}
                    aria-label="Supprimer"
                  >
                    Supprimer
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {pendingDelete && (
        <ConfirmDialog
          title="Supprimer ce prompt ?"
          description={`« ${pendingDelete.text} » ne sera plus envoyé aux LLM lors des prochains runs. Les anciennes réponses restent dans l'historique.`}
          confirmLabel="Supprimer"
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
