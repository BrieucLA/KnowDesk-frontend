import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LoginPage }        from './features/auth/components/LoginPage';
import { OnboardingPage }   from './features/onboarding/components/OnboardingPage';
import { DashboardPage }    from './features/dashboard/components/DashboardPage';
import { ArticlePage }      from './features/articles/components/ArticlePage';
import { KnowledgePage }    from './features/knowledge/components/KnowledgePage';
import { QuestionTreePage } from './features/knowledge/components/QuestionTreePage';
import { ArticleEditor }    from './features/editor/components/ArticleEditor';
import { AcceptInvitationPage } from './features/invitation/components/AcceptInvitationPage';
import { TreesPage }    from './features/trees/components/TreesPage';
import { TreeEditor }  from './features/trees/components/TreeEditor';
import { AccountPage }      from './features/account/components/AccountPage';
import { FaqsPage }         from './features/faqs/components/FaqsPage';
import { FaqEditor }        from './features/faqs/components/FaqEditor';
import { SuperadminApp }   from './features/superadmin/components/SuperadminApp';
import { HelpPanel }       from './features/help/components/HelpPanel';
import { ApiDocsApp }     from './features/apidocs/components/ApiDocsApp';
import { NotFoundPage } from './shared/components/ui/NotFoundPage';
import { MembersPage }      from './features/members/components/MembersPage';
import { SettingsPage }     from './features/settings/components/SettingsPage';
import { AnalyticsPage }    from './features/analytics/components/AnalyticsPage';
import { SearchBar }        from './features/search/components/SearchBar';
import { CommandPalette }   from './features/search/components/CommandPalette';
import { AppLayout }        from './shared/components/layout/AppLayout';
import { ImpersonateBanner } from './shared/components/ui/ImpersonateBanner';
import { NetworkErrorBanner } from './shared/components/ui/NetworkErrorBanner';
import { ToastContainer }   from './shared/components/ui/ToastContainer';
import { ProtectedRoute }   from './router/ProtectedRoute';
import {
  useAuthStore, selectIsLoggedIn, selectUserRole,
} from './store/authStore';
import type { AuthSession }  from './features/auth/types';
import type { SearchResult } from './features/search/types';



type Screen =
  | 'dashboard'
  | 'knowledge'
  | 'article'
  | 'tree'
  | 'editor'
  | 'members'
  | 'analytics'
  | 'settings'
  | 'trees'
  | 'tree-editor'
  | 'account'
  | 'faqs'
  | 'faq-editor';

type View =
  | { screen: 'dashboard' }
  | { screen: 'knowledge' }
  | { screen: 'article';  articleId: string; from: Screen }
  | { screen: 'tree';     treeId: string;    from: Screen }
  | { screen: 'editor';   articleId?: string; from: Screen }
  | { screen: 'members'  }
  | { screen: 'analytics' }
  | { screen: 'settings'; section?: string  }
  | { screen: 'trees' }
  | { screen: 'tree-editor'; treeId: string }
  | { screen: 'account' }
  | { screen: 'faqs' }
  | { screen: 'faq-editor'; faqId?: string };

/** Maps URL pathname to a View. Returns null for unmapped paths. */
function pathToView(pathname: string, fallbackFrom: Screen): View | null {
  if (pathname === '/' || pathname === '')        return { screen: 'dashboard' };
  if (pathname === '/knowledge')                  return { screen: 'knowledge' };
  if (pathname === '/articles/new')               return { screen: 'editor', from: fallbackFrom };
  if (pathname === '/members')                    return { screen: 'members' };
  if (pathname === '/analytics')                  return { screen: 'analytics' };
  if (pathname === '/settings')                   return { screen: 'settings' };
  if (pathname === '/account')                    return { screen: 'account' };
  if (pathname === '/trees')                      return { screen: 'trees' };
  if (pathname === '/faqs')                       return { screen: 'faqs' };
  if (pathname === '/faqs/new')                   return { screen: 'faq-editor' };

  const faqEditMatch = pathname.match(/^\/faqs\/([^/]+)\/edit$/);
  if (faqEditMatch) return { screen: 'faq-editor', faqId: faqEditMatch[1] };

  const editMatch = pathname.match(/^\/articles\/([^/]+)\/edit$/);
  if (editMatch) return { screen: 'editor', articleId: editMatch[1], from: 'article' };

  const articleMatch = pathname.match(/^\/articles\/([^/]+)$/);
  if (articleMatch) return { screen: 'article', articleId: articleMatch[1], from: fallbackFrom };

  // /trees/:id/edit AVANT /trees/:id (sinon le second matche aussi)
  const treeEditMatch = pathname.match(/^\/trees\/([^/]+)\/edit$/);
  if (treeEditMatch) return { screen: 'tree-editor', treeId: treeEditMatch[1] };

  const treeMatch = pathname.match(/^\/trees\/([^/]+)$/);
  if (treeMatch) return { screen: 'tree', treeId: treeMatch[1], from: fallbackFrom };

  return null;
}

/** Maps a View back to the canonical URL pathname. */
function viewToPath(view: View): string | null {
  switch (view.screen) {
    case 'dashboard':   return '/';
    case 'knowledge':   return '/knowledge';
    case 'article':     return `/articles/${view.articleId}`;
    case 'editor':      return view.articleId ? `/articles/${view.articleId}/edit` : '/articles/new';
    case 'tree':        return `/trees/${view.treeId}`;
    case 'tree-editor': return `/trees/${view.treeId}/edit`;
    case 'trees':       return '/trees';
    case 'members':     return '/members';
    case 'analytics':   return '/analytics';
    case 'settings':    return '/settings';
    case 'account':     return '/account';
    case 'faqs':        return '/faqs';
    case 'faq-editor':  return view.faqId ? `/faqs/${view.faqId}/edit` : '/faqs/new';
    default:            return null;
  }
}

export function App() {


  const isLoggedIn        = useAuthStore(selectIsLoggedIn);
  const setSession        = useAuthStore(s => s.setSession);
  const role              = useAuthStore(selectUserRole);
  const onboardingDone    = useAuthStore(s => s.onboardingDone);
  const setOnboardingDone = useAuthStore(s => s.setOnboardingDone);

  const location = useLocation();
  const navigate = useNavigate();

  // Initial view derived from URL — supports deep-linking on G1 routes.
  const [view, setView] = useState<View>(() => {
    return pathToView(location.pathname, 'dashboard') ?? { screen: 'dashboard' };
  });
  const [helpOpen, setHelpOpen] = useState(false);

  // URL → View : back/forward du navigateur, deep-link, paste d'URL
  useEffect(() => {
    const next = pathToView(location.pathname, view.screen as Screen);
    if (!next) return;
    // Si on cible déjà la même ressource (même screen + même id), on ne touche pas
    // au view actuel pour préserver le `from` posé par la nav interne.
    const sameTarget =
      next.screen === view.screen &&
      (next as { articleId?: string }).articleId === (view as { articleId?: string }).articleId &&
      (next as { treeId?: string }).treeId       === (view as { treeId?: string }).treeId &&
      (next as { faqId?: string }).faqId         === (view as { faqId?: string }).faqId;
    if (sameTarget) return;
    setView(next);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // View → URL : synchronise l'URL quand la navigation est faite via setView
  useEffect(() => {
    const expected = viewToPath(view);
    if (expected && expected !== location.pathname) {
      navigate(expected);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);
  
  // Détection du token d'invitation dans l'URL
  const urlParams = new URLSearchParams(window.location.search);
  const invitationToken = urlParams.get('token');
  const isAcceptInvitation = !!invitationToken;

  const needsOnboarding = isLoggedIn && role === 'admin' && !onboardingDone;

  const go = useCallback((v: View) => setView(v), []);

  // Retourne à l'écran précédent selon le contexte
  const goBack = useCallback(() => {
    if (
      view.screen === 'article' ||
      view.screen === 'tree'    ||
      view.screen === 'editor'
    ) {
      const from = view.from ?? 'dashboard';
      if (from === 'knowledge') go({ screen: 'knowledge' });
      else if (from === 'editor') go({ screen: 'knowledge' });
      else go({ screen: 'dashboard' });
    } else {
      go({ screen: 'dashboard' });
    }
  }, [view, go]);

  const handleSearchSelect = useCallback((result: SearchResult) => {
    if (result.type === 'tree') {
      go({ screen: 'tree', treeId: result.id, from: view.screen as Screen });
    } else {
      go({ screen: 'article', articleId: result.id, from: view.screen as Screen });
    }
  }, [go, view.screen]);

  const activeRoute = (
    view.screen === 'trees' || view.screen === 'tree-editor' ? 'knowledge' :
    view.screen === 'faqs'  || view.screen === 'faq-editor'  ? 'faqs' :
    view.screen === 'account' ? 'settings' :
    view.screen === 'knowledge' || view.screen === 'article' ||
    view.screen === 'tree'      || view.screen === 'editor'
      ? 'knowledge'
    : view.screen === 'members'   ? 'team'
    : view.screen === 'analytics' ? 'analytics'
    : view.screen === 'settings'  ? 'settings'
    : 'dashboard'
  ) as 'dashboard' | 'search' | 'knowledge' | 'faqs' | 'team' | 'analytics' | 'settings';

// Mode superadmin — accessible via ?superadmin dans l'URL
if (window.location.search.includes('superadmin')) {
  return <SuperadminApp />;
}
  if (window.location.search.includes('api-docs')) {
return <ApiDocsApp />;

}

// Page d'acceptation d'invitation — accessible sans être connecté
if (isAcceptInvitation && invitationToken) {
  return (
    <AcceptInvitationPage
      token={invitationToken}
      onSuccess={() => {
        // Nettoie l'URL et redirige vers le login
        window.history.replaceState({}, '', '/');
        window.location.reload();
      }}
    />
  );
}


if (!isLoggedIn) {
  return (
    <>
      <ImpersonateBanner />
      <LoginPage onLoginSuccess={setSession} />
    </>
  );
}
  if (needsOnboarding) return <OnboardingPage onComplete={setOnboardingDone} />;

  return (
    <>
      <ImpersonateBanner />
      <ProtectedRoute>
        <AppLayout
          onHelp={() => setHelpOpen(true)}
          activeRoute={activeRoute}
          onNavigate={route => {
            if (route === 'dashboard') go({ screen: 'dashboard' });
            if (route === 'knowledge') go({ screen: 'knowledge' });
            if (route === 'team')      go({ screen: 'members'   });
            if (route === 'analytics') go({ screen: 'analytics' });
            if (route === 'settings')  go({ screen: 'settings'  });
            if (route === 'trees')     go({ screen: 'trees'     });
            if (route === 'faqs')      go({ screen: 'faqs'      });
            if (route === 'account')   go({ screen: 'account'   });
          }}
          searchSlot={<SearchBar onSelect={handleSearchSelect} />}
        >
          {view.screen === 'dashboard' && (
            <DashboardPage
              onArticleClick={id => go({ screen: 'article', articleId: id, from: 'dashboard' })}
              onNewArticle={() => go({ screen: 'editor', from: 'dashboard' })}
            />
          )}
          {view.screen === 'knowledge' && (
            <KnowledgePage
              onOpenArticle={id  => go({ screen: 'article', articleId: id, from: 'knowledge' })}
              onOpenTree={treeId => go({ screen: 'tree',    treeId,         from: 'knowledge' })}
              onNewArticle={() => go({ screen: 'editor', from: 'knowledge' })}
            />
          )}
          {view.screen === 'article' && (
            <ArticlePage
              articleId={view.articleId}
              onBack={goBack}
              onEdit={id => go({ screen: 'editor', articleId: id, from: 'article' })}
            />
          )}
          {view.screen === 'tree' && (
            <QuestionTreePage
              treeId={view.treeId}
              onBack={goBack}
              onViewArticle={id => go({ screen: 'article', articleId: id, from: 'tree' })}
            />
          )}
          {view.screen === 'editor' && (
            <ArticleEditor
              articleId={view.articleId}
              onSaved={id => go({ screen: 'article', articleId: id, from: 'editor' })}
              onCancel={goBack}
            />
          )}
          {view.screen === 'members'  && <MembersPage />}
          {view.screen === 'faqs' && (
            <FaqsPage
              onNewFaq={() => go({ screen: 'faq-editor' })}
              onEditFaq={id => go({ screen: 'faq-editor', faqId: id })}
            />
          )}
          {view.screen === 'faq-editor' && (
            <FaqEditor
              faqId={view.faqId}
              onSaved={() => go({ screen: 'faqs' })}
              onCancel={() => go({ screen: 'faqs' })}
            />
          )}
          {view.screen === 'analytics' && (
            <AnalyticsPage
              onOpenArticle={id => go({ screen: 'article', articleId: id, from: 'analytics' })}
              onCreateFaq={question => {
                // Navigate vers /faqs/new?question=... — le bridge URL→View va
                // pousser screen='faq-editor', et FaqEditor lit le query param
                navigate(`/faqs/new?question=${encodeURIComponent(question)}`);
              }}
            />
          )}
          {view.screen === 'settings' && <SettingsPage />}
          {view.screen === 'trees' && (
  <TreesPage
    onOpenTree={id    => go({ screen: 'tree-editor', treeId: id })}
    onEditTree={id    => go({ screen: 'tree-editor', treeId: id })}
    onPreviewTree={id => go({ screen: 'tree',        treeId: id, from: 'trees' })}
  />
)}
{view.screen === 'tree-editor' && (
  <TreeEditor
    treeId={view.treeId}
    onBack={() => go({ screen: 'trees' })}
    onPreview={id => go({ screen: 'tree', treeId: id, from: 'tree-editor' })}
  />
)}
{view.screen === 'account' && <AccountPage />}
{!(['dashboard','knowledge','article','tree','editor','members','analytics','settings','trees','tree-editor','account','faqs','faq-editor'] as string[]).includes(view.screen) && (
  <NotFoundPage onBack={() => go({ screen: 'dashboard' })} />
)}
        </AppLayout>
      </ProtectedRoute>
      {helpOpen && (
  <HelpPanel
    onClose={() => setHelpOpen(false)}
    currentScreen={view.screen}
  />
)}

      <NetworkErrorBanner />
      <CommandPalette />
      <ToastContainer />
    </>
  );
}
