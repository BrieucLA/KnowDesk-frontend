import React, { useState } from 'react';
import { SideNav, type NavRoute } from './SideNav';

interface AppLayoutProps {
  children:    React.ReactNode;
  pageTitle?:  string;
  activeRoute?: NavRoute;
  onNavigate?: (route: NavRoute) => void;
  searchSlot?: React.ReactNode;
}

export function AppLayout({
  children, pageTitle, activeRoute = 'dashboard', onNavigate, searchSlot,
}: AppLayoutProps) {
  const handleNavigate = (route: NavRoute) => {
    onNavigate?.(route);
  };

  return (
    <div className="app-layout">
      <SideNav active={activeRoute} onNavigate={handleNavigate} />
      <div className="app-layout__body">
        <header className="topbar" role="banner">
          {pageTitle && <h1 className="topbar__title sr-only">{pageTitle}</h1>}
          <div className="topbar__search-wrap">
            {searchSlot ?? (
              <div className="topbar__search">
                <span className="topbar__search-icon">
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                    <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
                    <line x1="10.5" y1="10.5" x2="14" y2="14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                </span>
                <input
                  type="search" className="topbar__search-input"
                  placeholder="Rechercher… (⌘K)" aria-label="Recherche globale"
                />
              </div>
            )}
          </div>
        </header>
        <main className="app-layout__content" id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
