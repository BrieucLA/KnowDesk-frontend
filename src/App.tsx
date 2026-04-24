import React, { useCallback, useState } from 'react';
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
import { SuperadminApp }   from './features/superadmin/components/SuperadminApp';
import { HelpPanel }       from './features/help/components/HelpPanel';
import { NotFoundPage } from './shared/components/ui/NotFoundPage';
import { MembersPage }      from './features/members/components/MembersPage';
import { SettingsPage }     from './features/settings/components/SettingsPage';
import { SearchBar }        from './features/search/components/SearchBar';
import { AppLayout }        from './shared/components/layout/AppLayout';
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
  | 'settings'
  | 'trees'
  | 'tree-editor'
  | 'account';

type View =
  | { screen: 'dashboard' }
  | { screen: 'knowledge' }
  | { screen: 'article';  articleId: string; from: Screen }
  | { screen: 'tree';     treeId: string;    from: Screen }
  | { screen: 'editor';   articleId?: string; from: Screen }
  | { screen: 'members'  }
  | { screen: 'settings'; section?: string  }
  | { screen: 'trees' }
  | { screen: 'tree-editor'; treeId: string }
  | { screen: 'account' };

export function App() {
  const isLoggedIn        = useAuthStore(selectIsLoggedIn);
  const setSession        = useAuthStore(s => s.setSession);
  const role              = useAuthStore(selectUserRole);
  const onboardingDone    = useAuthStore(s => s.onboardingDone);
  const setOnboardingDone = useAuthStore(s => s.setOnboardingDone);

  const [view, setView] = useState<View>({ screen: 'dashboard' });
  const [helpOpen, setHelpOpen] = useState(false);
  
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
    view.screen === 'account' ? 'settings' :
    view.screen === 'knowledge' || view.screen === 'article' ||
    view.screen === 'tree'      || view.screen === 'editor'
      ? 'knowledge'
    : view.screen === 'members'  ? 'team'
    : view.screen === 'settings' ? 'settings'
    : 'dashboard'
  ) as 'dashboard' | 'search' | 'knowledge' | 'team' | 'settings';

// Mode superadmin — accessible via ?superadmin dans l'URL
if (window.location.search.includes('superadmin')) {
  return <SuperadminApp />;
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

  if (!isLoggedIn) return <LoginPage onLoginSuccess={setSession} />;
  if (needsOnboarding) return <OnboardingPage onComplete={setOnboardingDone} />;

  return (
    <>
      <ProtectedRoute>
        <AppLayout
          onHelp={() => setHelpOpen(true)}
          activeRoute={activeRoute}
          onNavigate={route => {
            if (route === 'dashboard') go({ screen: 'dashboard' });
            if (route === 'knowledge') go({ screen: 'knowledge' });
            if (route === 'team')      go({ screen: 'members'   });
            if (route === 'settings')  go({ screen: 'settings'  });
          if (route === 'trees')     go({ screen: 'trees'     });
          if (route === 'account')   go({ screen: 'account'   });
            if (route === 'account') go({ screen: 'account' });
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
{!(['dashboard','knowledge','article','tree','editor','members','settings','trees','tree-editor','account'] as string[]).includes(view.screen) && (
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
      <ToastContainer />
    </>
  );
}
