import React, { useCallback, useId } from 'react';
import { SearchResultItem } from './SearchResultItem';
import { useSearch }        from '../hooks/useSearch';
import { useAuthStore }     from '../../../store/authStore';
import type { SearchResult } from '../types';

interface SearchBarProps {
  /** Called when user selects a result — caller handles navigation */
  onSelect: (result: SearchResult) => void;
  className?: string;
}

/**
 * SearchBar — the global search widget.
 *
 * Features:
 *  - Cmd+K focuses from anywhere in the app
 *  - Debounced 200ms, results under 500ms
 *  - Arrow key + Enter navigation
 *  - Shows popular articles when focused & empty
 *  - Full ARIA combobox pattern
 */
export function SearchBar({ onSelect, className }: SearchBarProps) {
  const token      = useAuthStore(s => s.session?.accessToken);
  const listboxId  = useId();
  const resultIdPrefix = useId();

  const handleSelect = useCallback((result: SearchResult) => {
    onSelect(result);
  }, [onSelect]);

  const {
    state, activeIndex, isOpen,
    inputRef, listRef,
    handleChange, handleClear, handleKeyDown, handleFocus,
  } = useSearch({ token, onSelect: handleSelect });

  const activeResultId = activeIndex >= 0
    ? `${resultIdPrefix}-${activeIndex}`
    : undefined;

  return (
    <div className={`search-bar ${className ?? ''}`} role="search">
      <div
        className="search-bar__combobox"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-owns={listboxId}
      >
        {/* Search icon */}
        <SearchIcon />

        <input
          ref={inputRef}
          id="global-search"
          type="search"
          className="search-bar__input"
          placeholder="Rechercher… (⌘K)"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          value={state.query}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-activedescendant={activeResultId}
          aria-label="Rechercher dans la base de connaissance"
          onChange={e => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
        />

        {/* Kbd hint — hidden when typing */}
        {!state.query && (
          <kbd className="search-bar__kbd" aria-hidden="true">⌘K</kbd>
        )}

        {/* Clear button — shown when there's a query */}
        {state.query && (
          <button
            type="button"
            className="search-bar__clear"
            onClick={handleClear}
            aria-label="Effacer la recherche"
          >
            <ClearIcon />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && (
        <div className="search-bar__dropdown">
          {/* Section label */}
          <p className="search-bar__dropdown-label" aria-hidden="true">
            {state.query
              ? `${state.results.length} résultat${state.results.length > 1 ? 's' : ''}`
              : 'Articles populaires'}
          </p>

          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-label="Résultats de recherche"
            className="search-bar__results"
          >
            {state.results.map((result, i) => (
              <SearchResultItem
                key={result.id}
                id={`${resultIdPrefix}-${i}`}
                result={result}
                isActive={i === activeIndex}
                onClick={handleSelect}
              />
            ))}
          </ul>

          {/* Footer hint */}
          <div className="search-bar__footer" aria-hidden="true">
            <span><kbd>↑↓</kbd> naviguer</span>
            <span><kbd>↵</kbd> ouvrir</span>
            <span><kbd>Esc</kbd> fermer</span>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {state.status === 'loading' && (
        <div className="search-bar__loading" role="status" aria-label="Recherche en cours…">
          <div className="search-bar__spinner" aria-hidden="true" />
        </div>
      )}

      {/* Error */}
      {state.status === 'error' && state.message && (
        <div className="search-bar__error" role="alert">
          {state.message}
        </div>
      )}

      {/* No results */}
      {state.status === 'success' && state.query && state.results.length === 0 && (
        <div className="search-bar__empty" role="status">
          <p>Aucun résultat pour <strong>"{state.query}"</strong></p>
          <p className="search-bar__empty-hint">Essayez d'autres mots-clés ou consultez les catégories.</p>
        </div>
      )}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg className="search-bar__icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4" />
      <line x1="11" y1="11" x2="15" y2="15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <line x1="2" y1="2" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="2" x2="2"  y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
