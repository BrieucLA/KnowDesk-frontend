import React, { useRef, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';

interface TopBarProps {
  title?: string;
}

export function TopBar({ title }: TopBarProps) {
  const searchRef  = useRef<HTMLInputElement>(null);
  const clearSession = useAuthStore(s => s.clearSession);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <header className="topbar" role="banner">
      {title && <h1 className="topbar__title sr-only">{title}</h1>}
      <div className="topbar__search-wrap">
        <label htmlFor="global-search" className="sr-only">
          Rechercher dans la base de connaissance
        </label>
        <div className="topbar__search">
          <SearchIconSmall />
          <input
            ref={searchRef}
            id="global-search"
            type="search"
            className="topbar__search-input"
            placeholder="Rechercher un processus, une FAQ… (⌘K)"
            autoComplete="off"
          />
          <kbd className="topbar__kbd" aria-hidden="true">⌘K</kbd>
        </div>
      </div>
      <div className="topbar__actions">
        <button
          type="button"
          className="topbar__logout"
          onClick={clearSession}
          aria-label="Se déconnecter"
        >
          Déconnexion
        </button>
      </div>
    </header>
  );
}

function SearchIconSmall() {
  return (
    <svg className="topbar__search-icon" width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.3" />
      <line x1="10.5" y1="10.5" x2="14" y2="14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
