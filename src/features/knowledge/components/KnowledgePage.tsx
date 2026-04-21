import React, { useState, useEffect, useCallback } from 'react';
import { CategoryTree }     from './CategoryTree';
import { EmptyState }       from '../../../shared/components/ui/EmptyState';
import { StatusBadge }      from '../../../shared/components/ui/StatusBadge';
import { Skeleton }         from '../../../shared/components/ui/Skeleton';
import { knowledgeApi } from '../api/knowledgeApi';
import { apiClient }    from '../../../shared/lib/apiClient';

import { useAuthStore, selectUserRole } from '../../../store/authStore';
import { formatRelative }   from '../../../shared/lib/formatDate';
import type { Category }    from '../types';
import type { ArticleListItem } from '../../articles/types';

interface KnowledgePageProps {
  onOpenArticle:      (articleId: string) => void;
  onOpenTree:         (treeId: string) => void;
  onNewArticle?:      () => void;
}

/**
 * KnowledgePage — the browsable knowledge base.
 * Two-panel layout: category sidebar + article list.
 */
export function KnowledgePage({ onOpenArticle, onOpenTree, onNewArticle }: KnowledgePageProps) {
  const role    = useAuthStore(selectUserRole);
  const isAdmin = role === 'admin' || role === 'manager';

  const [categories,     setCategories]     = useState<Category[]>([]);
  const [articles,       setArticles]       = useState<ArticleListItem[]>([]);
  const [selectedCatId,  setSelectedCatId]  = useState<string | null>(null);
  const [loadingCats,    setLoadingCats]    = useState(true);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCatName,       setNewCatName]       = useState('');
  const [newCatLoading,    setNewCatLoading]    = useState(false);
  const [filter,           setFilter]         = useState<'all' | 'published' | 'draft'>('all');

  // Load categories on mount
  useEffect(() => {
    knowledgeApi.getCategories()
      .then(cats => {
        setCategories(cats);
        setLoadingCats(false);
        // Auto-select first category
        if (cats.length > 0) setSelectedCatId(cats[0].id);
      });
  }, []);

  // Load articles when category changes
  useEffect(() => {
    setLoadingArticles(true);
    const path = selectedCatId
      ? `/articles?categoryId=${selectedCatId}&perPage=50`
      : '/articles?perPage=50';
    apiClient.get<any[]>(path)
      .then(data => {
        setArticles(data.map((a: any) => ({
          id:           a.id,
          title:        a.title,
          status:       a.status,
          categoryId:   a.category_id,
          categoryName: a.category_name ?? '',
          version:      a.version,
          authorName:   a.author_email ?? '',
          updatedAt:    a.updated_at,
        })));
        setLoadingArticles(false);
      })
      .catch(() => setLoadingArticles(false));
  }, [selectedCatId]);

  const handleCategorySelect = useCallback((cat: Category) => {
    setSelectedCatId(cat.id);
  }, []);

  const filteredArticles = articles.filter(a => {
    if (filter === 'all') return true;
    return a.status === filter;
  });

  const selectedCategory = findCategory(categories, selectedCatId);

const handleCreateCategory = useCallback(async () => {
  if (!newCatName.trim()) return;
  setNewCatLoading(true);
  try {
    await apiClient.post('/categories', { name: newCatName.trim() });
    setNewCatName('');
    setShowNewCategory(false);
    // Recharger les catégories
    knowledgeApi.getCategories().then(cats => {
      setCategories(cats);
      if (cats.length > 0 && !selectedCatId) setSelectedCatId(cats[0].id);
    });
  } catch (err) {
    console.error('Erreur création catégorie:', err);
  } finally {
    setNewCatLoading(false);
  }
}, [newCatName, selectedCatId]);


  return (
    <div className="knowledge-page">

      {/* Sidebar */}
      <aside className="knowledge-page__sidebar">
        <div className="knowledge-page__sidebar-header">
          <h1 className="knowledge-page__sidebar-title">Base de connaissance</h1>
          {isAdmin && (
            <button type="button" onClick={() => setShowNewCategory(true)} className="knowledge-page__new-cat" title="Nouvelle catégorie">
              +
            </button>
          )}
        </div>
        <CategoryTree
          categories={categories}
          selectedId={selectedCatId}
          onSelect={handleCategorySelect}
          loading={loadingCats}
        />
      </aside>

      {/* Main panel */}
      <main className="knowledge-page__main">

        {/* Header */}
        {selectedCategory && (
          <div className="knowledge-page__main-header">
            <div>
              <h2 className="knowledge-page__cat-title">{selectedCategory.name}</h2>
              <p className="knowledge-page__cat-count">
                {articles.length} article{articles.length !== 1 ? 's' : ''}
              </p>
            </div>
            {isAdmin && (
              <button type="button" onClick={onNewArticle} className="knowledge-page__new-article">
                + Nouvel article
              </button>
            )}
          </div>
        )}

        {/* Filter tabs */}
        {!loadingArticles && articles.length > 0 && (
          <div className="knowledge-page__filters" role="tablist" aria-label="Filtrer les articles">
            {(['all', 'published', 'draft'] as const).map(f => (
              <button
                key={f}
                role="tab"
                aria-selected={filter === f}
                className={`knowledge-filter ${filter === f ? 'knowledge-filter--active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'Tous' : f === 'published' ? 'Publiés' : 'Brouillons'}
              </button>
            ))}
          </div>
        )}

        {/* Article list */}
        {loadingArticles && (
          <div aria-busy="true" aria-label="Chargement des articles">
            {[1,2,3].map(i => (
              <div key={i} className="knowledge-article-row knowledge-article-row--sk">
                <Skeleton className="kn-sk kn-sk--title" />
                <Skeleton className="kn-sk kn-sk--meta"  />
              </div>
            ))}
          </div>
        )}

        {!loadingArticles && filteredArticles.length === 0 && (
          <EmptyState
            title="Aucun article dans cette catégorie"
            description={isAdmin
              ? 'Créez le premier article pour cette catégorie.'
              : 'Votre équipe n\'a pas encore publié de contenu ici.'}
            ctaLabel={isAdmin ? '+ Créer un article' : undefined}
            ctaHref={undefined}
                onCta={isAdmin ? onNewArticle : undefined}
          />
        )}

        {!loadingArticles && filteredArticles.length > 0 && (
          <ul className="knowledge-article-list" role="list">
            {filteredArticles.map(article => (
              <li key={article.id}>
                <button
                  type="button"
                  className="knowledge-article-row"
                  onClick={() => onOpenArticle(article.id)}
                  aria-label={`${article.title}, ${article.status}, version ${article.version}`}
                >
                  <div className="knowledge-article-row__main">
                    <span className="knowledge-article-row__title">{article.title}</span>
                    <span className="knowledge-article-row__meta">
                      {article.authorName}
                      <span aria-hidden="true"> · </span>
                      v{article.version}
                      <span aria-hidden="true"> · </span>
                      <time dateTime={article.updatedAt}>{formatRelative(article.updatedAt)}</time>
                    </span>
                  </div>
                  <StatusBadge status={article.status} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Question trees section */}
        {!loadingArticles && (
          <div className="knowledge-trees">
            <h3 className="knowledge-trees__title">Processus guidés</h3>
            <button
              type="button"
              className="knowledge-tree-card"
              onClick={() => onOpenTree('tree-1')}
            >
              <div className="knowledge-tree-card__main">
                <span className="knowledge-tree-card__name">
                  Qualifier une demande de remboursement
                </span>
                <span className="knowledge-tree-card__meta">
                  Remboursements · Mis à jour il y a 2 jours
                </span>
              </div>
              <span className="badge badge--info">Processus</span>
            </button>
          </div>
        )}

      </main>
      {/* Modale nouvelle catégorie */}
{showNewCategory && (
  <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowNewCategory(false); }}>
    <div className="modal">
      <div className="modal__header">
        <h2 className="modal__title">Nouvelle catégorie</h2>
        <button type="button" className="modal__close" onClick={() => setShowNewCategory(false)} aria-label="Fermer">×</button>
      </div>
      <div className="modal__body">
        <div className="field">
          <label htmlFor="new-cat-name" className="field-label">Nom de la catégorie</label>
          <input
            id="new-cat-name"
            type="text"
            className="field-input"
            placeholder="ex. Livraisons"
            value={newCatName}
            autoFocus
            onChange={e => setNewCatName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreateCategory(); }}
          />
        </div>
        <div className="modal__actions">
          <button type="button" className="btn btn-ghost btn-md" onClick={() => setShowNewCategory(false)}>
            Annuler
          </button>
          <button
            type="button"
            className="btn btn-primary btn-md"
            onClick={handleCreateCategory}
            disabled={!newCatName.trim() || newCatLoading}
          >
            {newCatLoading ? 'Création...' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────────── */

function findCategory(cats: Category[], id: string | null): Category | null {
  if (!id) return null;
  for (const cat of cats) {
    if (cat.id === id) return cat;
    const found = findCategory(cat.children, id);
    if (found) return found;
  }
  return null;
}
