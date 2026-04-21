import React, { useCallback } from 'react';
import { TreeProgressBar }    from './TreeProgressBar';
import { TreeResolutionCard } from './TreeResolutionCard';
import { Skeleton }           from '../../../shared/components/ui/Skeleton';
import { useQuestionTree }    from '../hooks/useQuestionTree';
import type { TreeOption }    from '../types';

interface QuestionTreePageProps {
  treeId:        string;
  onBack:        () => void;
  onViewArticle: (articleId: string) => void;
}

/**
 * QuestionTreePage — the interactive process guide.
 *
 * The advisor works through a decision tree during a client call:
 *   1. Each step shows one question with 2-5 options
 *   2. Selecting an option either goes to the next question
 *      or reveals a final answer / links to an article
 *   3. Back is always available — mistakes are cheap
 *
 * All tree state lives in the pure `navigatorReducer` —
 * this component is just the renderer.
 */
export function QuestionTreePage({ treeId, onBack, onViewArticle }: QuestionTreePageProps) {
  const {
    loadState, navState, currentNode,
    stepCount, totalEstimate,
    selectOption, goBack, restart,
  } = useQuestionTree(treeId);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard?.writeText(text);
  }, []);

  /* ── Loading ─────────────────────────────────────────────── */
  if (loadState.status === 'idle' || loadState.status === 'loading') {
    return (
      <div className="tree-page tree-page--loading" aria-busy="true" aria-label="Chargement du processus">
        <Skeleton className="tree-sk tree-sk--header" />
        <Skeleton className="tree-sk tree-sk--question" />
        <div className="tree-sk-options">
          {[1,2,3].map(i => <Skeleton key={i} className="tree-sk tree-sk--option" />)}
        </div>
      </div>
    );
  }

  /* ── Error ───────────────────────────────────────────────── */
  if (loadState.status === 'error') {
    return (
      <div className="tree-page tree-page--error" role="alert">
        <p className="tree-error__msg">{loadState.message}</p>
        <button className="tree-error__back" onClick={onBack}>← Retour</button>
      </div>
    );
  }

  const tree = loadState.data;

  /* ── Resolution (terminal state) ────────────────────────── */
  if (navState?.resolution) {
    return (
      <div className="tree-page">
        <TreeHeader
          title={tree.title}
          category={tree.categoryName}
          onBack={onBack}
        />
        <TreeProgressBar step={stepCount} estimate={totalEstimate} />
        <TreeResolutionCard
          resolution={navState.resolution}
          onViewArticle={onViewArticle}
          onCopy={handleCopy}
          onRestart={restart}
          onBack={goBack}
        />
      </div>
    );
  }

  /* ── Navigation (active) ─────────────────────────────────── */
  if (!currentNode || !navState) return null;

  const canGoBack = navState.history.length > 0;

  return (
    <div className="tree-page">
      <TreeHeader
        title={tree.title}
        category={tree.categoryName}
        onBack={onBack}
      />

      <TreeProgressBar step={stepCount} estimate={totalEstimate} />

      {/* Breadcrumb path so far */}
      {navState.history.length > 0 && (
        <div className="tree-breadcrumb" aria-label="Chemin parcouru">
          <span className="tree-breadcrumb__label">
            {navState.history.length} question{navState.history.length > 1 ? 's' : ''} précédente{navState.history.length > 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Main question card */}
      <section className="tree-question" aria-labelledby="tree-question-text">
        <h2 id="tree-question-text" className="tree-question__text">
          {currentNode.question}
        </h2>

        {currentNode.hint && (
          <p className="tree-question__hint" role="note">
            <NoteIcon /> {currentNode.hint}
          </p>
        )}

        {/* Options */}
        <div
          role="radiogroup"
          aria-labelledby="tree-question-text"
          className="tree-options"
        >
          {currentNode.options.map((option, index) => (
            <TreeOptionButton
              key={option.id}
              option={option}
              index={index}
              onClick={selectOption}
            />
          ))}

          {/* "None of these" escape hatch — always last */}
          <button
            type="button"
            className="tree-option tree-option--none"
            onClick={onBack}
          >
            Aucune de ces options
          </button>
        </div>
      </section>

      {/* Navigation row */}
      <div className="tree-nav">
        {canGoBack ? (
          <button
            type="button"
            className="tree-nav__back"
            onClick={goBack}
            aria-label="Revenir à la question précédente"
          >
            ← Retour
          </button>
        ) : (
          <div /> /* spacer */
        )}
        <button
          type="button"
          className="tree-nav__restart"
          onClick={restart}
          aria-label="Recommencer depuis la première question"
        >
          Recommencer
        </button>
      </div>

    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────── */

function TreeHeader({
  title, category, onBack,
}: { title: string; category: string; onBack: () => void }) {
  return (
    <div className="tree-header">
      <nav className="tree-header__breadcrumb" aria-label="Fil d'Ariane">
        <button
          type="button"
          className="tree-header__back"
          onClick={onBack}
          aria-label="Retour à la base de connaissance"
        >
          ← Base
        </button>
        <span className="tree-header__sep" aria-hidden="true">/</span>
        <span className="tree-header__category">{category}</span>
        <span className="tree-header__sep" aria-hidden="true">/</span>
        <span className="tree-header__title">{title}</span>
      </nav>
    </div>
  );
}

interface TreeOptionButtonProps {
  option:  TreeOption;
  index:   number;
  onClick: (option: TreeOption) => void;
}

function TreeOptionButton({ option, index, onClick }: TreeOptionButtonProps) {
  const isTerminal = !!(option.articleId || option.answer);

  return (
    <button
      type="button"
      role="radio"
      aria-checked="false"
      className={`tree-option ${isTerminal ? 'tree-option--terminal' : ''}`}
      onClick={() => onClick(option)}
      /* Keyboard: letter shortcuts A, B, C... */
      aria-keyshortcuts={String.fromCharCode(65 + index)}
    >
      <span className="tree-option__letter" aria-hidden="true">
        {String.fromCharCode(65 + index)}
      </span>
      <span className="tree-option__label">{option.label}</span>
      {isTerminal && (
        <span className="tree-option__terminal-badge" aria-label="Cette option mène à une réponse directe">
          Réponse
        </span>
      )}
      <span className="tree-option__arrow" aria-hidden="true">→</span>
    </button>
  );
}

function NoteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{display:'inline',verticalAlign:'middle',marginRight:'4px'}} aria-hidden="true">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M7 5v4M7 4.5v-.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}
