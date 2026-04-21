import React from 'react';

interface NotFoundPageProps {
  onGoHome: () => void;
}

export function NotFoundPage({ onGoHome }: NotFoundPageProps) {
  return (
    <div className="not-found">
      <div className="not-found__content">
        <span className="not-found__code" aria-hidden="true">404</span>
        <h1 className="not-found__title">Page introuvable</h1>
        <p className="not-found__desc">
          La page que vous cherchez n'existe pas ou a été déplacée.
        </p>
        <button
          type="button"
          className="not-found__btn"
          onClick={onGoHome}
        >
          ← Retour au dashboard
        </button>
      </div>
    </div>
  );
}
