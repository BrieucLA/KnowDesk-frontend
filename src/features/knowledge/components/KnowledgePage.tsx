import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CategoryTree }     from './CategoryTree';
import { EmptyState }       from '../../../shared/components/ui/EmptyState';
import { StatusBadge }      from '../../../shared/components/ui/StatusBadge';
import { Skeleton }         from '../../../shared/components/ui/Skeleton';
import { Modal }            from '../../../shared/components/ui/Modal';
import { Button }           from '../../../shared/components/ui/Button';
import { Input }            from '../../../shared/components/ui/Input';
import { knowledgeApi } from '../api/knowledgeApi';
import { apiClient, ApiError } from '../../../shared/lib/apiClient';
import { useToast }     from '../../../shared/lib/useToast';
import { useLocalStorageState } from '../../../shared/lib/useLocalStorageState';
import { tagsApi, type OrgTag } from '../../articles/api/tagsApi';

import { useAuthStore, selectUserRole } from '../../../store/authStore';
import { formatRelative }   from '../../../shared/lib/formatDate';
import type { Category }    from '../types';
import type { ArticleListItem } from '../../articles/types';

interface KnowledgePageProps {
  onOpenArticle:      (articleId: string) => void;
  onOpenTree:         (treeId: string) => void;
  onNewArticle?:      () => void;
}

type SortKey = 'updated' | 'alpha' | 'popular';

const SIDEBAR_MIN     = 180;
const SIDEBAR_MAX     = 360;
const SIDEBAR_DEFAULT = 220;

/**
 * KnowledgePage — the browsable knowledge base.
 * Two-panel layout: collapsible/resizable category sidebar + article list.
 */
export function KnowledgePage({ onOpenArticle, onOpenTree, onNewArticle }: KnowledgePageProps) {
  const role    = useAuthStore(selectUserRole);
  const isAdmin = role === 'admin' || role === 'manager';
  const toast   = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [categories,     setCategories]     = useState<Category[]>([]);
  const [articles,       setArticles]       = useState<ArticleListItem[]>([]);
  const [selectedCatId,  setSelectedCatId]  = useState<string | null>(null);
  const [loadingCats,    setLoadingCats]    = useState(true);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCatName,       setNewCatName]       = useState('');
  const [newCatLoading,    setNewCatLoading]    = useState(false);
  const [filter,           setFilter]         = useState<'all' | 'published' | 'draft'>('all');
  const [orgTags,        setOrgTags]        = useState<OrgTag[]>([]);
  const [activeTags,     setActiveTags]     = useState<string[]>([]);
  const [sort,           setSort]           = useState<SortKey>('updated');
  const [searchQuery,    setSearchQuery]    = useState('');

  // Sidebar persistance
  const [sidebarWidth,     setSidebarWidth]     = useLocalStorageState('knowledge.sidebar.width', SIDEBAR_DEFAULT);
  const [expandedIdsArr,   setExpandedIdsArr]   = useLocalStorageState<string[]>('knowledge.sidebar.expanded', []);
  const expandedIds = useMemo(() => new Set(expandedIdsArr), [expandedIdsArr]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIdsArr(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, [setExpandedIdsArr]);

  // Drag handle resize
  const sidebarRef = useRef<HTMLElement>(null);
  const dragStateRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const onResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragStateRef.current = { startX: e.clientX, startWidth: sidebarWidth };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [sidebarWidth]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const drag = dragStateRef.current;
      if (!drag) return;
      const next = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, drag.startWidth + (e.clientX - drag.startX)));
      setSidebarWidth(next);
    };
    const onUp = () => {
      if (!dragStateRef.current) return;
      dragStateRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [setSidebarWidth]);

  // Charger les tags de l'org pour les chips de filtre
  useEffect(() => {
    tagsApi.list().then(setOrgTags).catch(() => setOrgTags([]));
  }, []);

  // Load categories on mount
  useEffect(() => {
    knowledgeApi.getCategories()
      .then(cats => {
        setCategories(cats);
        setLoadingCats(false);
        // Auto-select first category seulement si aucune sélection persistée valide
        if (cats.length > 0 && !selectedCatId) setSelectedCatId(cats[0].id);
      });
    // selectedCatId omis volontairement — exécution unique au mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Query params depuis la palette : `?cat=<id>` sélectionne, `?action=new-category` ouvre la modale.
  // On consomme le param puis on nettoie l'URL pour qu'un F5 ne réapplique pas l'effet.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const catParam    = params.get('cat');
    const actionParam = params.get('action');
    let consumed = false;
    if (catParam) {
      setSelectedCatId(catParam);
      consumed = true;
    }
    if (actionParam === 'new-category' && isAdmin) {
      setShowNewCategory(true);
      consumed = true;
    }
    if (consumed) {
      navigate('/knowledge', { replace: true });
    }
  }, [location.search, isAdmin, navigate]);

  // Load articles when category, tag filter, or sort changes
  useEffect(() => {
    setLoadingArticles(true);
    const params = new URLSearchParams();
    params.set('perPage', '50');
    if (selectedCatId)        params.set('categoryId', selectedCatId);
    if (activeTags.length > 0) params.set('tags', activeTags.join(','));
    params.set('sort', sort);
    apiClient.get<ArticleListItem[]>(`/articles?${params.toString()}`)
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
          tags:         Array.isArray(a.tags) ? a.tags : [],
        })));
        setLoadingArticles(false);
      })
      .catch(err => {
        toast.error(err instanceof ApiError ? err.message : 'Impossible de charger les articles.');
        setLoadingArticles(false);
      });
  }, [selectedCatId, activeTags, sort, toast]);

  const toggleTag = useCallback((tag: string) => {
    setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }, []);

  const handleCategorySelect = useCallback((cat: Category) => {
    setSelectedCatId(cat.id);
  }, []);

  const filteredArticles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return articles.filter(a => {
      if (filter !== 'all' && a.status !== filter) return false;
      if (q && !a.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [articles, filter, searchQuery]);

  const breadcrumb = useMemo(
    () => findCategoryPath(categories, selectedCatId),
    [categories, selectedCatId],
  );
  const selectedCategory = breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1] : null;

  // Auto-déplie les ancêtres quand une cat enfant est sélectionnée — sans
  // refermer ce que l'utilisateur a déjà ouvert manuellement.
  useEffect(() => {
    if (breadcrumb.length <= 1) return;
    const ancestorsToOpen = breadcrumb.slice(0, -1).map(c => c.id);
    setExpandedIdsArr(prev => {
      const set = new Set(prev);
      let changed = false;
      for (const id of ancestorsToOpen) {
        if (!set.has(id)) { set.add(id); changed = true; }
      }
      return changed ? Array.from(set) : prev;
    });
  }, [breadcrumb, setExpandedIdsArr]);

  const handleCreateCategory = useCallback(async () => {
    if (!newCatName.trim()) return;
    setNewCatLoading(true);
    try {
      await apiClient.post('/categories', { name: newCatName.trim() });
      setNewCatName('');
      setShowNewCategory(false);
      toast.success('Catégorie créée.');
      knowledgeApi.getCategories().then(cats => {
        setCategories(cats);
        if (cats.length > 0 && !selectedCatId) setSelectedCatId(cats[0].id);
      });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Création de la catégorie impossible.');
    } finally {
      setNewCatLoading(false);
    }
  }, [newCatName, selectedCatId, toast]);


  return (
    <div
      className="knowledge-page"
      style={{ '--sidebar-width': `${sidebarWidth}px` } as React.CSSProperties}
    >

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className="knowledge-page__sidebar"
      >
        <div className="knowledge-page__sidebar-header">
          <h1 className="knowledge-page__sidebar-title">Base de connaissance</h1>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowNewCategory(true)}
              className="knowledge-page__icon-btn"
              title="Nouvelle catégorie"
              aria-label="Nouvelle catégorie"
            >
              +
            </button>
          )}
        </div>
        <CategoryTree
          categories={categories}
          selectedId={selectedCatId}
          expandedIds={expandedIds}
          onSelect={handleCategorySelect}
          onToggleExpand={toggleExpand}
          loading={loadingCats}
        />
        {/* Resize handle */}
        <div
          className="knowledge-page__resize-handle"
          onMouseDown={onResizeStart}
          role="separator"
          aria-orientation="vertical"
          aria-label="Redimensionner la sidebar"
          title="Glisser pour redimensionner"
        />
      </aside>

      {/* Main panel */}
      <main className="knowledge-page__main">

        {/* Breadcrumb + header */}
        {selectedCategory && (
          <div className="knowledge-page__main-header">
            <div className="knowledge-page__main-header-left">
              {breadcrumb.length > 1 && (
                <nav className="knowledge-page__breadcrumb" aria-label="Fil d'ariane">
                  {breadcrumb.slice(0, -1).map((c, idx) => (
                    <React.Fragment key={c.id}>
                      <button
                        type="button"
                        className="knowledge-page__breadcrumb-link"
                        onClick={() => setSelectedCatId(c.id)}
                      >
                        {c.name}
                      </button>
                      <span className="knowledge-page__breadcrumb-sep" aria-hidden="true">›</span>
                    </React.Fragment>
                  ))}
                  <span className="knowledge-page__breadcrumb-current">{selectedCategory.name}</span>
                </nav>
              )}
              <h2 className="knowledge-page__cat-title">{selectedCategory.name}</h2>
              <p className="knowledge-page__cat-count">
                {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''}
                {filteredArticles.length !== articles.length && ` sur ${articles.length}`}
              </p>
            </div>
            {isAdmin && (
              <button type="button" onClick={onNewArticle} className="knowledge-page__new-article">
                + Nouvel article
              </button>
            )}
          </div>
        )}

        {/* Toolbar — search-in-list + sort + filter tabs */}
        {!loadingArticles && articles.length > 0 && (
          <div className="knowledge-page__toolbar">
            <div className="knowledge-page__toolbar-search">
              <input
                type="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Rechercher dans cette liste…"
                className="knowledge-page__toolbar-search-input"
                aria-label="Rechercher dans la liste"
              />
            </div>
            <div className="knowledge-page__toolbar-right">
              <label className="knowledge-page__toolbar-sort">
                <span className="knowledge-page__toolbar-sort-label">Tri</span>
                <select
                  value={sort}
                  onChange={e => setSort(e.target.value as SortKey)}
                  className="knowledge-page__toolbar-sort-select"
                  aria-label="Trier les articles"
                >
                  <option value="updated">Mis à jour</option>
                  <option value="alpha">A → Z</option>
                  <option value="popular">Plus consultés</option>
                </select>
              </label>
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
            </div>
          </div>
        )}

        {/* Tag filter chips */}
        {orgTags.length > 0 && (
          <div className="knowledge-page__tag-filter" aria-label="Filtrer par tag">
            {orgTags.map(t => {
              const active = activeTags.includes(t.display_name);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTag(t.display_name)}
                  className={`chip chip--toggle ${active ? 'chip--toggle-on' : ''}`}
                  aria-pressed={active}
                >
                  {t.display_name}
                  <span className="chip__count" aria-hidden="true">{t.articles_count}</span>
                </button>
              );
            })}
            {activeTags.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTags([])}
                className="knowledge-page__tag-filter-clear"
              >
                Effacer
              </button>
            )}
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

        {!loadingArticles && filteredArticles.length === 0 && articles.length === 0 && (
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

        {!loadingArticles && filteredArticles.length === 0 && articles.length > 0 && (
          <p className="knowledge-page__no-match">
            Aucun article ne correspond à « {searchQuery} »{filter !== 'all' && ` dans les ${filter === 'published' ? 'publiés' : 'brouillons'}`}.
          </p>
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
        <Modal
          title="Nouvelle catégorie"
          onClose={() => setShowNewCategory(false)}
          asForm
          onSubmit={handleCreateCategory}
          footer={
            <>
              <Button type="button" variant="ghost" size="md" onClick={() => setShowNewCategory(false)}>
                Annuler
              </Button>
              <Button type="submit" variant="primary" size="md" loading={newCatLoading} disabled={!newCatName.trim()}>
                Créer
              </Button>
            </>
          }
        >
          <Input
            id="new-cat-name"
            type="text"
            label="Nom de la catégorie"
            placeholder="ex. Livraisons"
            value={newCatName}
            autoFocus
            onChange={e => setNewCatName(e.target.value)}
          />
        </Modal>
      )}
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────────── */

/**
 * Retourne le chemin parent → enfant menant à la catégorie sélectionnée.
 * Tableau vide si non trouvée.
 */
function findCategoryPath(cats: Category[], id: string | null): Category[] {
  if (!id) return [];
  for (const cat of cats) {
    if (cat.id === id) return [cat];
    const sub = findCategoryPath(cat.children, id);
    if (sub.length > 0) return [cat, ...sub];
  }
  return [];
}
