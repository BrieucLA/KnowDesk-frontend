import React, { useState, useCallback, useEffect, useId } from 'react';
import { RichTextEditor } from './RichTextEditor';
import { SaveIndicator }  from './SaveIndicator';
import { useAutoSave }    from '../hooks/useAutoSave';
import { Input }          from '../../../shared/components/ui/Input';
import { Button }         from '../../../shared/components/ui/Button';
import { useToast } from '../../../shared/lib/useToast';
import { apiClient }      from '../../../shared/lib/apiClient';
import type { EditorFormState, EditorErrors } from '../types';
import { useArticleVersions } from '../hooks/useArticleVersions';
import { VersionsPanel }      from './VersionsPanel';

interface ArticleEditorProps {
  articleId?: string;
  onSaved:    (articleId: string) => void;
  onCancel:   () => void;
}

interface Category {
  id:       string;
  name:     string;
  children: Category[];
}

function validateForm(form: EditorFormState): EditorErrors {
  const errors: EditorErrors = {};
  if (!form.title.trim())                        errors.title      = 'Le titre est requis pour publier.';
  if (!form.categoryId)                          errors.categoryId = 'Sélectionnez une catégorie.';
  if (!form.content.trim() || form.content === '<br>') errors.content = 'Le contenu ne peut pas être vide.';
  return errors;
}

function flattenCategories(cats: Category[], depth = 0): { id: string; name: string; depth: number }[] {
  return cats.flatMap(c => [
    { id: c.id, name: c.name, depth },
    ...flattenCategories(c.children, depth + 1),
  ]);
}

export function ArticleEditor({ articleId, onSaved, onCancel }: ArticleEditorProps) {
  const isEdit  = !!articleId;
  const titleId = useId();

  const [form, setForm] = useState<EditorFormState>({
    title: '', categoryId: '', content: '', status: 'draft',
  });
  const [categories,   setCategories]   = useState<Category[]>([]);
  const [errors,       setErrors]       = useState<EditorErrors>({});
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const toast = useToast();
  const versions = articleId ? useArticleVersions(articleId) : null;

  // Charger les catégories
  useEffect(() => {
    apiClient.get<Category[]>('/categories')
      .then(setCategories)
      .catch(console.error);
  }, []);

  // Charger l'article existant en mode édition
  useEffect(() => {
    if (!articleId) return;
    apiClient.get<any>(`/articles/${articleId}`)
      .then(article => {
        setForm({
          title:      article.title ?? '',
          categoryId: article.category_id ?? '',
          content:    typeof article.content === 'string' ? article.content : (article.content?.html ?? article.content?.text ?? ''),
          status:     article.status,
        });
      })
      .catch(console.error);
  }, [articleId]);

  // Autosave — uniquement en mode édition
  const { saveStatus, lastSavedAt, saveNow } = useAutoSave({
    data:    form,
    enabled: isEdit,
    saveFn:  async (data) => {
      if (!articleId) return;
      await apiClient.patch(`/articles/${articleId}`, {
        title:      data.title,
        content:    { html: data.content },
        categoryId: data.categoryId || undefined,
      });
    },
  });

  // Cmd+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveNow();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [saveNow]);

  const updateField = useCallback(<K extends keyof EditorFormState>(
    field: K, value: EditorFormState[K],
  ) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if ((errors as any)[field]) {
      setErrors(prev => { const n = { ...prev }; delete (n as any)[field]; return n; });
    }
  }, [errors]);

  const handleSaveDraft = useCallback(async () => {
    setIsSavingDraft(true);
    try {
      if (isEdit) {
        await apiClient.patch(`/articles/${articleId}`, {
          title:      form.title,
          content:    { html: form.content },
          categoryId: form.categoryId || undefined,
        });
        toast.success("Brouillon sauvegardé."); onSaved(articleId!);
      } else {
        const article = await apiClient.post<any>('/articles', {
          title:      form.title || 'Sans titre',
          content:    { html: form.content },
          categoryId: form.categoryId || undefined,
        });
        toast.success("Brouillon sauvegardé."); onSaved(article.id);
      }
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.' } as any);
    } finally {
      setIsSavingDraft(false);
    }
  }, [form, isEdit, articleId, onSaved]);

  const handlePublish = useCallback(async () => {
    const errs = validateForm(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setIsPublishing(true);
    try {
      let id = articleId;

      // Créer d'abord si nouvel article
if (!isEdit) {
  const article = await apiClient.post<any>('/articles', {
    title:      form.title,
    content:    { html: form.content },
    categoryId: form.categoryId || undefined,
    status:     'published',
  });
  toast.success('Article publié avec succès !');
  onSaved(article.id);
  return;
} else {
        await apiClient.patch(`/articles/${articleId}`, {
          title:      form.title,
          content:    { html: form.content },
          categoryId: form.categoryId || undefined,
        });
      }

      await apiClient.put(`/articles/${id}/publish`, { summary: 'Publication' });
      toast.success("Article publié avec succès !"); onSaved(id!);
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : 'Erreur lors de la publication.' } as any);
    } finally {
      setIsPublishing(false);
    }
  }, [form, isEdit, articleId, onSaved]);

  const flatCats = flattenCategories(categories);

  return (
    <div className="article-editor">
      <div className="article-editor__topbar">
        <button type="button" className="article-editor__back" onClick={onCancel}>
          ← Annuler
        </button>
        <div className="article-editor__topbar-center">
          <SaveIndicator status={saveStatus} lastSavedAt={lastSavedAt} />
        </div>
        {isEdit && versions && (
          <Button variant="ghost" size="sm" onClick={versions.toggle}>
            Historique
          </Button>
        )}
        <div className="article-editor__topbar-actions">
          <Button variant="ghost" size="sm" onClick={handleSaveDraft} loading={isSavingDraft}>
            Garder en brouillon
          </Button>
          <Button variant="primary" size="sm" loading={isPublishing} onClick={handlePublish}>
            {form.status === 'published' ? 'Mettre à jour' : 'Publier'}
          </Button>
        </div>
      </div>

      {(errors as any).general && (
        <div className="article-editor__offline" role="alert" style={{ background: 'var(--color-danger-bg)', borderColor: 'var(--color-danger-border)', color: 'var(--color-danger)' }}>
          {(errors as any).general}
        </div>
      )}

      <div className="article-editor__body">
        <div className="article-editor__meta">
          <div className="field">
            <label htmlFor="cat-select" className="field-label">
              Catégorie <span className="field-required" aria-hidden="true">*</span>
            </label>
            <select
              id="cat-select"
              className={`field-input ${errors.categoryId ? 'field-input--error' : ''}`}
              value={form.categoryId}
              onChange={e => updateField('categoryId', e.target.value)}
            >
              <option value="">Sélectionner une catégorie…</option>
              {flatCats.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {'  '.repeat(cat.depth)}{cat.name}
                </option>
              ))}
            </select>
            {errors.categoryId && <p className="field-error">{errors.categoryId}</p>}
          </div>
        </div>

        <input
          id={titleId}
          type="text"
          className={`article-editor__title-input ${errors.title ? 'article-editor__title-input--error' : ''}`}
          placeholder="Titre de l'article…"
          value={form.title}
          onChange={e => updateField('title', e.target.value)}
          aria-label="Titre de l'article"
        />
        {errors.title && <p className="field-error article-editor__title-error">{errors.title}</p>}

        <RichTextEditor
          value={form.content}
          onChange={v => updateField('content', v)}
          placeholder="Commencez à rédiger…"
          labelledBy={titleId}
        />
        {errors.content && <p className="field-error">{errors.content}</p>}
      </div>
      {isEdit && versions?.open && (
  <VersionsPanel
    versions={versions.versions}
    loading={versions.loading}
    onClose={versions.toggle}
    onRestore={async (version) => {
      const content = await versions.restore(version);
      if (content) updateField('content', content.html ?? '');
    }}
  />
)}
    </div>
  );
}
