import { useEffect, useState, useCallback } from 'react';
import { brandMonitoringApi } from '../api/brandMonitoringApi';
import { useToast } from '../../../shared/lib/useToast';
import { Button } from '../../../shared/components/ui/Button';
import { Input }  from '../../../shared/components/ui/Input';
import { Skeleton } from '../../../shared/components/ui/Skeleton';
import { ConfirmDialog } from '../../../shared/components/ui/ConfirmDialog';
import type { MonitoredBrand, IndustryMeta, IndustryKey, BrandProject } from '../types';

interface SettingsViewProps {
  projectId:       string;
  onReloadProject: () => void;
}

export function SettingsView({ projectId, onReloadProject }: SettingsViewProps) {
  const toast = useToast();
  const [project, setProject] = useState<BrandProject | null>(null);
  const [brands,  setBrands]  = useState<MonitoredBrand[]>([]);
  const [industries, setIndustries] = useState<IndustryMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingIndustry, setSavingIndustry] = useState(false);

  // formulaire création brand
  const [newName,    setNewName]    = useState('');
  const [newAliases, setNewAliases] = useState('');
  const [newOwner,   setNewOwner]   = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<MonitoredBrand | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [b, p, inds] = await Promise.all([
        brandMonitoringApi.listBrands(projectId),
        brandMonitoringApi.getProject(projectId),
        brandMonitoringApi.listIndustries(),
      ]);
      setBrands(b);
      setProject(p);
      setIndustries(inds);
    } catch (err) {
      toast.error((err as Error).message ?? 'Chargement impossible.');
    } finally {
      setLoading(false);
    }
  }, [projectId, toast]);

  const handleIndustryChange = async (value: string) => {
    const industry = value === '' ? null : value as IndustryKey;
    setSavingIndustry(true);
    try {
      await brandMonitoringApi.updateProject(projectId, { industry });
      setProject(prev => prev ? { ...prev, industry } : prev);
      onReloadProject();
      if (industry) {
        toast.success('Secteur enregistré. Tu peux maintenant utiliser le bouton « ✨ Suggestions de prompts » dans l\'onglet Prompts.');
      }
    } catch (err) {
      toast.error((err as Error).message ?? 'Enregistrement impossible.');
    } finally {
      setSavingIndustry(false);
    }
  };

  useEffect(() => { void reload(); }, [reload]);

  const parseAliases = (raw: string): string[] =>
    raw.split(',').map(a => a.trim()).filter(a => a.length > 0).slice(0, 20);

  const handleCreate = async () => {
    const name = newName.trim();
    const aliases = parseAliases(newAliases);
    if (name.length < 1) { toast.error('Donne un nom de marque.'); return; }
    if (aliases.length === 0) { toast.error('Ajoute au moins un alias (peut être le nom lui-même).'); return; }
    if (newOwner && brands.some(b => b.is_owner)) {
      toast.error('Il existe déjà une marque "owner" pour ce projet. Décoche pour ajouter une marque concurrente.');
      return;
    }
    setSaving(true);
    try {
      await brandMonitoringApi.createBrand(projectId, { name, aliases, isOwner: newOwner });
      setNewName(''); setNewAliases(''); setNewOwner(false);
      await reload();
      onReloadProject();
    } catch (err) {
      toast.error((err as Error).message ?? 'Création impossible.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      await brandMonitoringApi.deleteBrand(pendingDelete.id);
      setPendingDelete(null);
      await reload();
      onReloadProject();
    } catch (err) {
      toast.error((err as Error).message ?? 'Suppression impossible.');
    }
  };

  if (loading) return <Skeleton className="bm-skeleton-card" />;

  return (
    <div className="bm-settings">
      <section className="bm-card">
        <h3 className="bm-card__title">Secteur d'activité du projet</h3>
        <p className="bm-card__sub">
          Définit le secteur pour débloquer la bibliothèque de prompts curated
          (25 questions adaptées à ton marché, disponibles dans l'onglet Prompts).
        </p>
        <div className="bm-form">
          <label className="bm-select-wrap" htmlFor="bm-industry">
            <span className="bm-select-label">Secteur</span>
            <select
              id="bm-industry"
              className="bm-select"
              value={project?.industry ?? ''}
              onChange={e => handleIndustryChange(e.target.value)}
              disabled={savingIndustry}
            >
              <option value="">— Non défini —</option>
              {industries.map(ind => (
                <option key={ind.key} value={ind.key}>{ind.label} ({ind.promptCount} prompts)</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="bm-card">
        <h3 className="bm-card__title">Ajouter une marque surveillée</h3>
        <p className="bm-card__sub">
          La marque <strong>owner</strong> est la tienne (Auchan dans le cas client). Les autres
          sont les concurrents (Carrefour, Leclerc…). Les <strong>alias</strong> sont les variantes
          texte qu'on cherche dans les réponses Mistral (« Auchan », « Auchan Drive », « auchan.fr »…).
        </p>
        <div className="bm-form">
          <Input
            id="bm-new-brand-name"
            label="Nom de la marque"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Auchan"
          />
          <Input
            id="bm-new-brand-aliases"
            label="Aliases (séparés par des virgules, max 20)"
            value={newAliases}
            onChange={e => setNewAliases(e.target.value)}
            placeholder="Auchan, Auchan Drive, auchan.fr"
          />
          <label className="bm-checkbox">
            <input type="checkbox" checked={newOwner} onChange={e => setNewOwner(e.target.checked)} />
            C'est ma marque (owner) — il ne peut y en avoir qu'une par projet.
          </label>
          <div className="bm-form__actions">
            <Button variant="primary" size="md" onClick={handleCreate} loading={saving}>
              Ajouter
            </Button>
          </div>
        </div>
      </section>

      <section className="bm-card">
        <h3 className="bm-card__title">
          Marques surveillées <span className="bm-card__count">({brands.length})</span>
        </h3>
        {brands.length === 0 ? (
          <p className="bm-empty-data">Aucune marque encore. Ajoute au moins ta marque owner.</p>
        ) : (
          <ul className="bm-brands-list">
            {brands.map(b => (
              <li key={b.id} className={`bm-brand-row ${b.is_owner ? 'is-owner' : ''}`}>
                <div className="bm-brand-row__head">
                  {b.is_owner && <span className="bm-brand-row__star" aria-hidden="true">⭐</span>}
                  <strong>{b.name}</strong>
                </div>
                <div className="bm-brand-row__aliases">
                  {b.aliases.map(a => <span key={a} className="bm-chip">{a}</span>)}
                </div>
                <div className="bm-brand-row__actions">
                  <button
                    type="button"
                    className="bm-prompt-row__delete"
                    onClick={() => setPendingDelete(b)}
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
          title="Supprimer cette marque ?"
          description={`« ${pendingDelete.name} » sera retirée du suivi. Les anciennes mentions sont conservées dans l'historique mais ne seront plus comptées dans les nouveaux runs.`}
          confirmLabel="Supprimer"
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
