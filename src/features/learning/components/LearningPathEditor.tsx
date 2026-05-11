import React, { useCallback, useEffect, useState } from 'react';
import { learningApi } from '../api/learningApi';
import { apiClient, ApiError } from '../../../shared/lib/apiClient';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Button }     from '../../../shared/components/ui/Button';
import { Input }      from '../../../shared/components/ui/Input';
import { Modal }      from '../../../shared/components/ui/Modal';
import { ConfirmDialog } from '../../../shared/components/ui/ConfirmDialog';
import { Skeleton }   from '../../../shared/components/ui/Skeleton';
import { useToast }   from '../../../shared/lib/useToast';
import type {
  LearningPathDetail, LearningModule, LearningModuleResource,
  LearningQuiz, LearningQuizQuestion, LearningResourceType, LearningPathRenewal,
} from '../types';
import '../learning.css';

interface LearningPathEditorProps {
  pathId: string;
  onBack: () => void;
}

interface ArticleLite { id: string; title: string }
interface FaqLite     { id: string; question: string }
interface TreeLite    { id: string; title: string }

export function LearningPathEditor({ pathId, onBack }: LearningPathEditorProps) {
  const toast = useToast();
  const [path,    setPath]    = useState<LearningPathDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Edition header
  const [headerName, setHeaderName] = useState('');
  const [headerDesc, setHeaderDesc] = useState('');
  const [headerMandatory, setHeaderMandatory] = useState(false);
  const [headerRenewal,   setHeaderRenewal]   = useState<LearningPathRenewal>(null);
  const [savingHeader, setSavingHeader] = useState(false);

  // Module en cours d'édition (modal expanded)
  const [editingModule, setEditingModule] = useState<LearningModule | null>(null);

  // Modale ajout module
  const [showAddModule, setShowAddModule] = useState(false);
  const [newModuleName, setNewModuleName] = useState('');

  // Modale assignations
  const [showAssign, setShowAssign] = useState(false);

  const reload = useCallback(() => {
    setLoading(true);
    learningApi.getPath(pathId)
      .then(p => {
        setPath(p);
        setHeaderName(p.name);
        setHeaderDesc(p.description ?? '');
        setHeaderMandatory(p.mandatory);
        setHeaderRenewal(p.renewal_months);
      })
      .catch((err: unknown) => toast.error(err instanceof ApiError ? err.message : 'Erreur de chargement.'))
      .finally(() => setLoading(false));
  }, [pathId, toast]);

  useEffect(() => { reload(); }, [reload]);

  const saveHeader = useCallback(async () => {
    if (!path) return;
    setSavingHeader(true);
    try {
      const updated = await learningApi.updatePath(path.id, {
        name:           headerName.trim(),
        description:    headerDesc.trim() || null,
        mandatory:      headerMandatory,
        renewal_months: headerRenewal,
      });
      setPath(p => p ? { ...p, ...updated } : p);
      toast.success('Parcours mis à jour.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Sauvegarde impossible.');
    } finally {
      setSavingHeader(false);
    }
  }, [path, headerName, headerDesc, headerMandatory, headerRenewal, toast]);

  const handleAddModule = useCallback(async () => {
    if (!path || !newModuleName.trim()) return;
    try {
      const mod = await learningApi.createModule(path.id, {
        name:     newModuleName.trim(),
        position: path.modules.length,
      });
      setPath(p => p ? { ...p, modules: [...p.modules, mod] } : p);
      setNewModuleName('');
      setShowAddModule(false);
      toast.success('Module ajouté.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Ajout impossible.');
    }
  }, [path, newModuleName, toast]);

  const handleDeleteModule = useCallback(async (moduleId: string) => {
    if (!path) return;
    try {
      await learningApi.deleteModule(moduleId);
      setPath(p => p ? { ...p, modules: p.modules.filter(m => m.id !== moduleId) } : p);
      toast.success('Module supprimé.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Suppression impossible.');
    }
  }, [path, toast]);

  if (loading || !path) {
    return (
      <div className="learning-page">
        <PageHeader title="Chargement…" subtitle="" />
        <Skeleton className="sk-card" />
      </div>
    );
  }

  return (
    <>
      {showAddModule && (
        <Modal
          title="Ajouter un module"
          onClose={() => setShowAddModule(false)}
          asForm
          onSubmit={handleAddModule}
          footer={
            <>
              <Button type="button" variant="ghost" size="md" onClick={() => setShowAddModule(false)}>Annuler</Button>
              <Button type="submit" variant="primary" size="md" disabled={!newModuleName.trim()}>Ajouter</Button>
            </>
          }
        >
          <Input
            id="module-name"
            type="text"
            label="Nom du module"
            placeholder="ex. Module 1 — Présentation de l'entreprise"
            value={newModuleName}
            onChange={e => setNewModuleName(e.target.value)}
            autoFocus
            required
          />
        </Modal>
      )}

      {editingModule && (
        <ModuleEditorModal
          module={editingModule}
          pathId={path.id}
          onClose={() => setEditingModule(null)}
          onRename={(name) => {
            setPath(p => p ? { ...p, modules: p.modules.map(m => m.id === editingModule.id ? { ...m, name } : m) } : p);
          }}
        />
      )}

      {showAssign && (
        <AssignUsersModal
          pathId={path.id}
          onClose={() => setShowAssign(false)}
        />
      )}

      <div className="learning-page">
        <PageHeader
          title={path.name}
          subtitle="Édition d'un parcours de formation"
          actions={(
            <>
              <Button variant="ghost" size="md" onClick={onBack}>← Retour</Button>
              <Button variant="ghost" size="md" onClick={() => setShowAssign(true)}>Assigner</Button>
            </>
          )}
        />

        {/* Header édition */}
        <section className="learning-section">
          <h2 className="learning-section__title">Informations</h2>
          <div className="learning-form">
            <Input
              id="header-name"
              type="text"
              label="Nom"
              value={headerName}
              onChange={e => setHeaderName(e.target.value)}
            />
            <label className="learning-form__field">
              <span className="learning-form__label">Description</span>
              <textarea
                className="learning-form__textarea"
                rows={2}
                value={headerDesc}
                onChange={e => setHeaderDesc(e.target.value)}
              />
            </label>
            <div className="learning-form__row">
              <label className="learning-form__checkbox">
                <input
                  type="checkbox"
                  checked={headerMandatory}
                  onChange={e => setHeaderMandatory(e.target.checked)}
                />
                <span>Obligatoire</span>
              </label>
              <label className="learning-form__field">
                <span className="learning-form__label">Renouvellement</span>
                <select
                  className="learning-form__select"
                  value={headerRenewal === null ? '' : String(headerRenewal)}
                  onChange={e => setHeaderRenewal(e.target.value === '' ? null : Number(e.target.value) as LearningPathRenewal)}
                >
                  <option value="">Jamais</option>
                  <option value="3">Tous les 3 mois</option>
                  <option value="6">Tous les 6 mois</option>
                  <option value="12">Tous les 12 mois</option>
                </select>
              </label>
            </div>
            <Button variant="primary" size="sm" onClick={saveHeader} loading={savingHeader}>
              Sauvegarder
            </Button>
          </div>
        </section>

        {/* Modules */}
        <section className="learning-section">
          <div className="learning-section__header">
            <h2 className="learning-section__title">Modules ({path.modules.length})</h2>
            <Button variant="primary" size="sm" onClick={() => setShowAddModule(true)}>
              + Ajouter un module
            </Button>
          </div>
          {path.modules.length === 0 ? (
            <p className="learning-empty">Aucun module. Ajoutez votre premier module pour commencer.</p>
          ) : (
            <ul className="learning-modules">
              {path.modules.sort((a, b) => a.position - b.position).map((m, idx) => (
                <li key={m.id} className="learning-module">
                  <div className="learning-module__head">
                    <span className="learning-module__num">{idx + 1}.</span>
                    <span className="learning-module__name">{m.name}</span>
                  </div>
                  <div className="learning-module__actions">
                    <Button variant="ghost" size="sm" onClick={() => setEditingModule(m)}>Éditer</Button>
                    <Button variant="danger" size="sm" onClick={() => handleDeleteModule(m.id)}>Supprimer</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

// ── Modal édition d'un module : nom + ressources + quiz ──────

function ModuleEditorModal({ module, pathId, onClose, onRename }: {
  module: LearningModule;
  pathId: string;
  onClose: () => void;
  onRename: (name: string) => void;
}) {
  const toast = useToast();
  const [name, setName] = useState(module.name);
  const [savingName, setSavingName] = useState(false);

  const [resources, setResources] = useState<LearningModuleResource[]>([]);
  const [loadingRes, setLoadingRes] = useState(true);

  const [articles, setArticles] = useState<ArticleLite[]>([]);
  const [faqs,     setFaqs]     = useState<FaqLite[]>([]);
  const [trees,    setTrees]    = useState<TreeLite[]>([]);

  const [quiz, setQuiz] = useState<LearningQuiz | null>(null);
  const [generating, setGenerating] = useState(false);

  // Charge ressources actuelles + listes pour le sélecteur
  useEffect(() => {
    let alive = true;
    setLoadingRes(true);
    Promise.all([
      learningApi.listResources(module.id),
      apiClient.get<any[]>('/articles?perPage=200&status=published'),
      apiClient.get<any[]>('/faqs?perPage=200&status=published'),
      apiClient.get<any[]>('/trees?status=published'),
      learningApi.getQuiz(module.id),
    ])
      .then(([res, arts, fs, ts, q]) => {
        if (!alive) return;
        setResources(res);
        setArticles(arts.map(a => ({ id: a.id, title: a.title })));
        setFaqs(fs.map(f => ({ id: f.id, question: f.question })));
        setTrees(ts.map(t => ({ id: t.id, title: t.title })));
        setQuiz(q);
      })
      .catch((err: unknown) => toast.error(err instanceof ApiError ? err.message : 'Erreur de chargement.'))
      .finally(() => { if (alive) setLoadingRes(false); });
    return () => { alive = false; };
  }, [module.id, toast]);

  const saveName = useCallback(async () => {
    if (!name.trim()) return;
    setSavingName(true);
    try {
      await learningApi.updateModule(module.id, { name: name.trim() });
      onRename(name.trim());
      toast.success('Module renommé.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Erreur.');
    } finally {
      setSavingName(false);
    }
  }, [module.id, name, onRename, toast]);

  const addResource = useCallback((type: LearningResourceType, id: string) => {
    if (resources.some(r => r.resource_type === type && r.resource_id === id)) return;
    const next = [
      ...resources,
      { id: `tmp-${Date.now()}`, module_id: module.id, resource_type: type, resource_id: id, position: resources.length },
    ];
    setResources(next);
    learningApi.setResources(module.id, next.map(r => ({
      resource_type: r.resource_type, resource_id: r.resource_id, position: r.position,
    })))
      .then(setResources)
      .catch((err: unknown) => toast.error(err instanceof ApiError ? err.message : 'Erreur.'));
  }, [resources, module.id, toast]);

  const removeResource = useCallback((id: string) => {
    const next = resources.filter(r => r.id !== id);
    setResources(next);
    learningApi.setResources(module.id, next.map(r => ({
      resource_type: r.resource_type, resource_id: r.resource_id, position: r.position,
    })))
      .then(setResources)
      .catch((err: unknown) => toast.error(err instanceof ApiError ? err.message : 'Erreur.'));
  }, [resources, module.id, toast]);

  const generateQuiz = useCallback(async () => {
    setGenerating(true);
    try {
      const result = await learningApi.generateQuiz(module.id, 5);
      // Sauvegarde directement le quiz généré (l'admin peut le ré-éditer après)
      const saved = await learningApi.saveQuiz(module.id, {
        questions:    result.questions,
        passing_score: 80,
        generated_by: 'ai',
      });
      setQuiz(saved);
      toast.success('Quiz généré par l\'IA.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Génération IA indisponible.');
    } finally {
      setGenerating(false);
    }
  }, [module.id, toast]);

  const deleteQuiz = useCallback(async () => {
    // Pas d'endpoint DELETE explicite : on peut juste laisser le quiz, ou
    // sauver un tableau vide → mais notre validation impose ≥ 1 question.
    // Pour V1 : on garde le quiz, possibilité d'éditer manuellement plus tard.
    toast.error('Pour supprimer un quiz, regénérez-le ou éditez-le manuellement.');
  }, [toast]);

  // Titre lookup helpers
  const resourceTitle = (r: LearningModuleResource): string => {
    if (r.resource_type === 'article') return articles.find(a => a.id === r.resource_id)?.title ?? '(article introuvable)';
    if (r.resource_type === 'faq')     return faqs.find(f => f.id === r.resource_id)?.question ?? '(FAQ introuvable)';
    return trees.find(t => t.id === r.resource_id)?.title ?? '(processus introuvable)';
  };

  return (
    <Modal
      title={`Module : ${module.name}`}
      onClose={onClose}
      size="lg"
      footer={
        <Button type="button" variant="primary" size="md" onClick={onClose}>Fermer</Button>
      }
    >
      <div className="module-editor">
        <label className="learning-form__field">
          <span className="learning-form__label">Nom du module</span>
          <div className="module-editor__name-row">
            <Input
              id="mod-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <Button variant="ghost" size="sm" onClick={saveName} loading={savingName} disabled={name === module.name}>
              Renommer
            </Button>
          </div>
        </label>

        <h3 className="module-editor__heading">Ressources ({resources.length})</h3>
        {loadingRes ? <Skeleton className="sk-card" /> : (
          <>
            {resources.length === 0 && (
              <p className="learning-empty">Aucune ressource. Sélectionnez du contenu ci-dessous.</p>
            )}
            <ul className="module-editor__resources">
              {resources.map(r => (
                <li key={r.id} className="module-editor__resource">
                  <span className={`chip chip--xs module-editor__type module-editor__type--${r.resource_type}`}>
                    {r.resource_type === 'article' ? 'Article' : r.resource_type === 'faq' ? 'FAQ' : 'Processus'}
                  </span>
                  <span className="module-editor__title">{resourceTitle(r)}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeResource(r.id)}>×</Button>
                </li>
              ))}
            </ul>

            <div className="module-editor__add-grid">
              <select
                className="learning-form__select"
                value=""
                onChange={e => { if (e.target.value) addResource('article', e.target.value); e.currentTarget.value = ''; }}
              >
                <option value="">+ Ajouter un article…</option>
                {articles.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
              </select>
              <select
                className="learning-form__select"
                value=""
                onChange={e => { if (e.target.value) addResource('faq', e.target.value); e.currentTarget.value = ''; }}
              >
                <option value="">+ Ajouter une FAQ…</option>
                {faqs.map(f => <option key={f.id} value={f.id}>{f.question}</option>)}
              </select>
              <select
                className="learning-form__select"
                value=""
                onChange={e => { if (e.target.value) addResource('tree', e.target.value); e.currentTarget.value = ''; }}
              >
                <option value="">+ Ajouter un processus…</option>
                {trees.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>
          </>
        )}

        <h3 className="module-editor__heading">Quiz</h3>
        {quiz && quiz.questions.length > 0 ? (
          <>
            <p className="module-editor__quiz-meta">
              {quiz.questions.length} questions · seuil de réussite : {quiz.passing_score}% ·{' '}
              {quiz.generated_by === 'ai' ? 'Généré par IA' : 'Saisi manuellement'}
            </p>
            <ul className="module-editor__quiz-list">
              {quiz.questions.map((q, i) => (
                <li key={i} className="module-editor__quiz-item">
                  <strong>{i + 1}. {q.q}</strong>
                  <ul className="module-editor__quiz-choices">
                    {q.choices.map((c, j) => (
                      <li key={j} className={j === q.correct_idx ? 'module-editor__quiz-correct' : ''}>
                        {j === q.correct_idx ? '✓ ' : ''}{c}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
            <Button variant="ghost" size="sm" onClick={generateQuiz} loading={generating}>
              Régénérer avec l'IA
            </Button>
          </>
        ) : (
          <>
            <p className="learning-empty">
              Aucun quiz. Générez-en un automatiquement depuis le contenu des ressources.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={generateQuiz}
              loading={generating}
              disabled={resources.length === 0}
            >
              ✨ Générer le quiz avec l'IA
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
}

// ── Modal assignations : sélectionne des users de l'org ──────

function AssignUsersModal({ pathId, onClose }: { pathId: string; onClose: () => void }) {
  const toast = useToast();
  const [members,   setMembers]   = useState<Array<{ id: string; email: string; firstName: string | null; lastName: string | null; role: string }>>([]);
  const [assigned,  setAssigned]  = useState<Set<string>>(new Set());
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);

  useEffect(() => {
    let alive = true;
    Promise.all([
      apiClient.get<any[]>('/members'),
      learningApi.listAssignments(pathId),
    ])
      .then(([m, a]) => {
        if (!alive) return;
        setMembers(m.map(x => ({
          id: x.id, email: x.email,
          firstName: x.firstName ?? x.first_name ?? null,
          lastName:  x.lastName  ?? x.last_name  ?? null,
          role: x.role,
        })));
        setAssigned(new Set(a.map(x => x.user_id)));
      })
      .catch((err: unknown) => toast.error(err instanceof ApiError ? err.message : 'Erreur de chargement.'))
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [pathId, toast]);

  const toggleUser = useCallback(async (userId: string) => {
    setSaving(true);
    try {
      if (assigned.has(userId)) {
        await learningApi.unassignUser(pathId, userId);
        setAssigned(prev => { const n = new Set(prev); n.delete(userId); return n; });
      } else {
        await learningApi.assignUsers(pathId, [userId]);
        setAssigned(prev => new Set(prev).add(userId));
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Erreur.');
    } finally {
      setSaving(false);
    }
  }, [assigned, pathId, toast]);

  return (
    <Modal
      title="Assigner ce parcours"
      onClose={onClose}
      size="lg"
      footer={<Button type="button" variant="primary" size="md" onClick={onClose}>Fermer</Button>}
    >
      {loading ? <Skeleton className="sk-card" /> : (
        <ul className="assign-list">
          {members.map(m => (
            <li key={m.id} className="assign-list__item">
              <label>
                <input
                  type="checkbox"
                  checked={assigned.has(m.id)}
                  disabled={saving}
                  onChange={() => toggleUser(m.id)}
                />
                <span className="assign-list__name">
                  {m.firstName || m.lastName ? `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim() : m.email}
                </span>
                <span className="assign-list__email">{m.email}</span>
                <span className="assign-list__role">{m.role}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
