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

interface TreeListItem {
  id:           string;
  title:        string;
  status:       string;
  category_id:  string | null;
  category_name?: string | null;
  updated_at:   string;
}

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
  const [newCatParentId,   setNewCatParentId]   = useState<string | null>(null);
  const [newCatLoading,    setNewCatLoading]    = useState(false);
  const [filter,           setFilter]         = useState<'all' | 'published' | 'draft'>('all');
  const [orgTags,        setOrgTags]        = useState<OrgTag[]>([]);
  const [activeTags,     setActiveTags]     = useState<string[]>([]);
  const [tagsExpanded,   setTagsExpanded]   = useState(false);
  const [sort,           setSort]           = useState<SortKey>('updated');
  const [searchQuery,    setSearchQuery]    = useState('');
  const [trees,          setTrees]          = useState<TreeListItem[]>([]);

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

  // Charger les processus guidés publiés (≤ qq dizaines max — fetch unique au mount)
  useEffect(() => {
    apiClient.get<TreeListItem[]>('/trees?status=published')
      .then(setTrees)
      .catch(() => setTrees([]));
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

  // Load articles when category or sort changes.
  // Le filtre par tag est appliqué côté client (cf. filteredArticles ci-dessous)
  // pour permettre le calcul des compteurs locaux par tag dans la sélection.
  useEffect(() => {
    setLoadingArticles(true);
    const params = new URLSearchParams();
    params.set('perPage', '200');
    if (selectedCatId) {
      params.set('categoryId', selectedCatId);
      params.set('includeSubcategories', 'true');
    }
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
  }, [selectedCatId, sort, toast]);

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
      // Filtre tag (AND) : l'article doit porter chacun des tags actifs
      if (activeTags.length > 0 && !activeTags.every(t => a.tags?.includes(t))) return false;
      return true;
    });
  }, [articles, filter, searchQuery, activeTags]);

  // Compteurs scopés à la cat sélectionnée (et ses descendants) : nombre
  // d'articles taggés ce label dans la liste actuellement chargée. Ignore
  // status / search / activeTags pour rester un indicateur utilisable.
  const tagLocalCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of articles) {
      if (!Array.isArray(a.tags)) continue;
      for (const tag of a.tags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    return counts;
  }, [articles]);

  const breadcrumb = useMemo(
    () => findCategoryPath(categories, selectedCatId),
    [categories, selectedCatId],
  );
  const selectedCategory = breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1] : null;

  // Trees affichés : ceux attachés à la cat sélectionnée OU à un de ses descendants.
  // Réplique côté client la logique du backend `findDescendantIds` (cat racine + descendants).
  const visibleTrees = useMemo(() => {
    if (!selectedCatId) return trees;
    const allowed = collectDescendantIds(categories, selectedCatId);
    return trees.filter(t => t.category_id && allowed.has(t.category_id));
  }, [trees, categories, selectedCatId]);

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
      const body: { name: string; parentId?: string } = { name: newCatName.trim() };
      if (newCatParentId) body.parentId = newCatParentId;
      await apiClient.post('/categories', body);
      setNewCatName('');
      setNewCatParentId(null);
      setShowNewCategory(false);
      toast.success(newCatParentId ? 'Sous-catégorie créée.' : 'Catégorie créée.');
      // Si on a créé une sous-cat, on déplie son parent automatiquement
      if (newCatParentId) {
        setExpandedIdsArr(prev => prev.includes(newCatParentId) ? prev : [...prev, newCatParentId]);
      }
      knowledgeApi.getCategories().then(cats => {
        setCategories(cats);
        if (cats.length > 0 && !selectedCatId) setSelectedCatId(cats[0].id);
      });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Création de la catégorie impossible.');
    } finally {
      setNewCatLoading(false);
    }
  }, [newCatName, newCatParentId, selectedCatId, toast, setExpandedIdsArr]);


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
              onClick={() => {
                // Pré-remplit le parent avec la cat actuellement sélectionnée — l'admin
                // navigue le plus souvent dans une cat avant de vouloir y ajouter une sous-cat.
                setNewCatParentId(selectedCatId);
                setShowNewCategory(true);
              }}
              className="knowledge-page__icon-btn"
              title="Nouvelle catégorie ou sous-catégorie"
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

        {/* Tag filter chips — counts scopés à la cat sélectionnée + descendants.
            Tri par count local desc, tags vides masqués (sauf si actifs). */}
        {orgTags.length > 0 && (() => {
          const INITIAL_VISIBLE = 14;
          const activeSet = new Set(activeTags);
          // Enrichi avec localCount, filtré (count > 0 ou actif), trié desc
          const enriched = orgTags
            .map(t => ({ ...t, localCount: tagLocalCounts.get(t.display_name) ?? 0 }))
            .filter(t => t.localCount > 0 || activeSet.has(t.display_name))
            .sort((a, b) => b.localCount - a.localCount);

          if (enriched.length === 0) return null;

          const visible = tagsExpanded
            ? enriched
            : (() => {
                const head = enriched.slice(0, INITIAL_VISIBLE);
                const headSet = new Set(head.map(t => t.id));
                const extraActives = enriched.filter(t => activeSet.has(t.display_name) && !headSet.has(t.id));
                return [...head, ...extraActives];
              })();
          const remaining = enriched.length - visible.length;
          return (
            <div className="knowledge-page__tag-filter" aria-label="Filtrer par tag">
              {visible.map(t => {
                const active = activeSet.has(t.display_name);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTag(t.display_name)}
                    className={`chip chip--toggle ${active ? 'chip--toggle-on' : ''}`}
                    aria-pressed={active}
                  >
                    {t.display_name}
                    <span className="chip__count" aria-hidden="true">{t.localCount}</span>
                  </button>
                );
              })}
              {!tagsExpanded && remaining > 0 && (
                <button
                  type="button"
                  onClick={() => setTagsExpanded(true)}
                  className="knowledge-page__tag-filter-toggle"
                >
                  + {remaining} autre{remaining > 1 ? 's' : ''}
                </button>
              )}
              {tagsExpanded && (
                <button
                  type="button"
                  onClick={() => setTagsExpanded(false)}
                  className="knowledge-page__tag-filter-toggle"
                >
                  Réduire
                </button>
              )}
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
          );
        })()}

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

        {/* Processus guidés — masqué si aucun tree pour la cat sélectionnée */}
        {!loadingArticles && visibleTrees.length > 0 && (
          <div className="knowledge-trees">
            <h3 className="knowledge-trees__title">Processus guidés</h3>
            {visibleTrees.map(tree => (
              <button
                key={tree.id}
                type="button"
                className="knowledge-tree-card"
                onClick={() => onOpenTree(tree.id)}
              >
                <div className="knowledge-tree-card__main">
                  <span className="knowledge-tree-card__name">{tree.title}</span>
                  <span className="knowledge-tree-card__meta">
                    {tree.category_name ?? 'Sans catégorie'}
                    <span aria-hidden="true"> · </span>
                    Mis à jour <time dateTime={tree.updated_at}>{formatRelative(tree.updated_at)}</time>
                  </span>
                </div>
                <span className="badge badge--info">Processus</span>
              </button>
            ))}
          </div>
        )}

      </main>
      {/* Modale nouvelle catégorie ou sous-catégorie */}
      {showNewCategory && (
        <Modal
          title={newCatParentId ? 'Nouvelle sous-catégorie' : 'Nouvelle catégorie'}
          onClose={() => { setShowNewCategory(false); setNewCatParentId(null); }}
          asForm
          onSubmit={handleCreateCategory}
          footer={
            <>
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => { setShowNewCategory(false); setNewCatParentId(null); }}
              >
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
          <div className="field">
            <label htmlFor="new-cat-parent" className="field-label">Catégorie parente</label>
            <select
              id="new-cat-parent"
              className="field-input"
              value={newCatParentId ?? ''}
              onChange={e => setNewCatParentId(e.target.value || null)}
            >
              <option value="">— Aucune (catégorie racine) —</option>
              {flattenForSelect(categories).map(({ id, indentedName }) => (
                <option key={id} value={id}>{indentedName}</option>
              ))}
            </select>
            <p className="field-helper">
              Laissez vide pour créer une catégorie de premier niveau, ou choisissez un parent pour créer une sous-catégorie.
            </p>
          </div>
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

/**
 * Retourne l'id de la catégorie + tous ses descendants. Réplique côté client
 * le CTE récursif backend (`categoriesRepository.findDescendantIds`) — utilisé
 * pour filtrer les processus guidés visibles depuis la sélection.
 */
function collectDescendantIds(cats: Category[], rootId: string): Set<string> {
  const out = new Set<string>();
  function walk(node: Category, inside: boolean) {
    const here = inside || node.id === rootId;
    if (here) out.add(node.id);
    for (const child of node.children) walk(child, here);
  }
  for (const cat of cats) walk(cat, false);
  return out;
}

/**
 * Aplatit l'arbre de catégories en liste indentée pour un <select>.
 * Profondeur 0 : "Mobile" / 1 : "  Activation" / 2 : "    Réseau"…
 */
function flattenForSelect(cats: Category[], depth = 0): Array<{ id: string; indentedName: string }> {
  const out: Array<{ id: string; indentedName: string }> = [];
  for (const cat of cats) {
    out.push({ id: cat.id, indentedName: `${'  '.repeat(depth)}${cat.name}` });
    if (cat.children.length > 0) out.push(...flattenForSelect(cat.children, depth + 1));
  }
  return out;
}
