import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { initSentry, Sentry } from './shared/lib/monitoring/sentry';
import { App } from './App';
// Foundation : tokens (variables CSS) + base (reset, root) — d'abord, pour que
// les autres feuilles puissent utiliser les variables sans soucis de cascade.
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/app.css';
import './styles/sprint3.css';
import './styles/sprint4.css';
import './styles/sprint5.css';

// Initialisé avant tout — capture les erreurs de boot React.
initSentry();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={ErrorFallback}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </BrowserRouter>
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);

function ErrorFallback() {
  return (
    <div role="alert" style={{
      maxWidth: 520, margin: '80px auto', padding: '32px 28px',
      fontFamily: 'system-ui, sans-serif', textAlign: 'center',
    }}>
      <h1 style={{ fontSize: 22, marginBottom: 12 }}>Une erreur s'est produite</h1>
      <p style={{ fontSize: 14, color: '#555', lineHeight: 1.5, marginBottom: 20 }}>
        L'équipe technique a été automatiquement notifiée. Recharge la page pour réessayer.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        style={{
          padding: '10px 22px', background: '#5B6CFF', color: 'white',
          border: 0, borderRadius: 8, cursor: 'pointer', fontSize: 14,
        }}
      >
        Recharger la page
      </button>
    </div>
  );
}
