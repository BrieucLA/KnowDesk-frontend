import React, { useRef, useEffect } from 'react';

interface TopBarProps {
  /** Page title shown in the topbar */
  title?: string;
}

/**
 * TopBar — contains the global search bar.
 * Cmd+K anywhere in the app focuses the search input.
 */
export function TopBar({ title }: TopBarProps) {
  const searchRef = useRef<HTMLInputElement>(null);

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
