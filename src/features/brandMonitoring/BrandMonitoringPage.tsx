import { useEffect, useState, useCallback } from 'react';
import { brandMonitoringApi } from './api/brandMonitoringApi';
import { useToast } from '../../shared/lib/useToast';
import { Button } from '../../shared/components/ui/Button';
import { Input }  from '../../shared/components/ui/Input';
import { Skeleton } from '../../shared/components/ui/Skeleton';
import { DashboardView } from './components/DashboardView';
import { PromptsView }   from './components/PromptsView';
import { ResponsesView } from './components/ResponsesView';
import { SettingsView }  from './components/SettingsView';
import type { BrandProject } from './types';
import './brandMonitoring.css';

type Tab = 'dashboard' | 'prompts' | 'responses' | 'settings';

export function BrandMonitoringPage() {
  const toast = useToast();
  const [project, setProject] = useState<BrandProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState<Tab>('dashboard');
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  // V1 : on charge le premier projet de l'org (1 seul attendu en pratique).
  // Sprint future : multi-projets avec sélecteur en haut.
  const loadProject = useCallback(async () => {
    setLoading(true);
    try {
      const list = await brandMonitoringApi.listProjects();
      if (list.length === 0) { setProject(null); return; }
      const detail = await brandMonitoringApi.getProject(list[0].id);
      setProject(detail);
    } catch (err) {
      toast.error((err as Error).message ?? 'Impossible de charger le projet brand monitoring.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { void loadProject(); }, [loadProject]);

  const handleCreate = async () => {
    const name = newName.trim();
    if (name.length < 2) { toast.error('Donne un nom de marque (au moins 2 caractères).'); return; }
    setCreating(true);
    try {
      await brandMonitoringApi.createProject(name);
      toast.success(`Projet « ${name} » créé. Configure les marques et les prompts dans l'onglet Paramètres.`);
      setNewName('');
      await loadProject();
      setTab('settings');
    } catch (err) {
      toast.error((err as Error).message ?? 'Création impossible.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="brand-monitoring-page">
        <Skeleton className="bm-skeleton-large" />
        <Skeleton className="bm-skeleton-large" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="brand-monitoring-page brand-monitoring-page--empty">
        <div className="bm-empty">
          <div className="bm-empty__icon" aria-hidden="true">📊</div>
          <h2 className="bm-empty__title">Brand monitoring — créer un projet</h2>
          <p className="bm-empty__desc">
            Suis ta visibilité de marque dans les LLM (Mistral en V1) vs tes concurrents.
            Donne un nom à ton projet (ex : « Auchan »), puis configure les marques
            surveillées et les prompts dans l'onglet Paramètres.
          </p>
          <div className="bm-empty__form">
            <Input
              id="bm-new-project-name"
              label="Nom du projet"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Auchan"
              autoFocus
            />
            <Button variant="primary" size="md" onClick={handleCreate} loading={creating}>
              Créer le projet
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="brand-monitoring-page">
      <header className="bm-header">
        <div>
          <h1 className="bm-header__title">{project.name}</h1>
          <p className="bm-header__meta">
            {project.brandsCount ?? 0} marque{(project.brandsCount ?? 0) > 1 ? 's' : ''} surveillée{(project.brandsCount ?? 0) > 1 ? 's' : ''}
            {' · '}{project.promptsCount ?? 0} prompt{(project.promptsCount ?? 0) > 1 ? 's' : ''}
            {' · '}{project.runsCount ?? 0} run{(project.runsCount ?? 0) > 1 ? 's' : ''}
            {project.quotaRemaining != null && project.monthlyQuota != null && (
              <> · <span className={(project.quotaRemaining / project.monthlyQuota) < 0.1 ? 'bm-quota--low' : ''}>
                quota {project.quotaRemaining}/{project.monthlyQuota} ce mois
              </span></>
            )}
          </p>
        </div>
      </header>

      <nav className="bm-tabs" aria-label="Sections brand monitoring">
        <button onClick={() => setTab('dashboard')}  className={`bm-tabs__tab ${tab === 'dashboard'  ? 'is-active' : ''}`}>Dashboard</button>
        <button onClick={() => setTab('prompts')}    className={`bm-tabs__tab ${tab === 'prompts'    ? 'is-active' : ''}`}>Prompts</button>
        <button onClick={() => setTab('responses')}  className={`bm-tabs__tab ${tab === 'responses'  ? 'is-active' : ''}`}>Réponses</button>
        <button onClick={() => setTab('settings')}   className={`bm-tabs__tab ${tab === 'settings'   ? 'is-active' : ''}`}>Paramètres</button>
      </nav>

      <main className="bm-main">
        {tab === 'dashboard'  && <DashboardView projectId={project.id} onReloadProject={loadProject} />}
        {tab === 'prompts'    && <PromptsView   projectId={project.id} onReloadProject={loadProject} />}
        {tab === 'responses'  && <ResponsesView projectId={project.id} />}
        {tab === 'settings'   && <SettingsView  projectId={project.id} onReloadProject={loadProject} />}
      </main>
    </div>
  );
}
