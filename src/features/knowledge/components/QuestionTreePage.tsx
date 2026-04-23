import React, { useCallback } from 'react';
import { useQuestionTree }    from '../hooks/useQuestionTree';
import { Skeleton }       from '../../../shared/components/ui/Skeleton';
import { NotFoundPage } from '../../../shared/components/ui/NotFoundPage';
import { Button }             from '../../../shared/components/ui/Button';

interface QuestionTreePageProps {
  treeId:        string;
  onBack:        () => void;
  onViewArticle: (articleId: string) => void;
}

export function QuestionTreePage({ treeId, onBack, onViewArticle }: QuestionTreePageProps) {
  const {
    loadState, currentNode, history,
    selectAnswer, goBack, restart, canGoBack,
  } = useQuestionTree(treeId);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard?.writeText(text);
  }, []);

  if (loadState.status === 'idle' || loadState.status === 'loading') {
    return (
      <div className="tree-page tree-page--loading" aria-busy="true">
        <Skeleton className="tree-sk tree-sk--header" />
        <Skeleton className="tree-sk tree-sk--question" />
        <div className="tree-sk-options">
          {[1,2,3].map(i => <Skeleton key={i} className="tree-sk tree-sk--option" />)}
        </div>
      </div>
    );
  }

  if (loadState.status === 'error') {
    return (
      <div className="tree-page tree-page--error">
        <p className="tree-error">{loadState.message}</p>
        <Button variant="ghost" size="sm" onClick={onBack}>← Retour</Button>
      </div>
    );
  }

  if (!currentNode) {
    return (
      <div className="tree-page tree-page--error">
        <p className="tree-error">Aucun nœud trouvé dans ce processus.</p>
        <Button variant="ghost" size="sm" onClick={onBack}>← Retour</Button>
      </div>
    );
  }

  const tree = loadState.status === 'success' ? loadState.data : null;

  return (
    <div className="tree-page">
      {/* Header */}
      <div className="tree-page__header">
        <button type="button" className="tree-page__back" onClick={onBack}>← Retour</button>
        <div className="tree-page__meta">
          <h1 className="tree-page__title">{tree?.title}</h1>
          {history.length > 0 && (
            <span className="tree-page__steps">Étape {history.length + 1}</span>
          )}
        </div>
        <button type="button" className="tree-page__restart" onClick={restart} title="Recommencer">
          ↺ Recommencer
        </button>
      </div>

      {/* Nœud courant */}
      <div className="tree-page__content">
        {currentNode.type === 'question' ? (
          <div className="tree-question">
            <p className="tree-question__text">{currentNode.content}</p>
            <ul className="tree-options" role="list">
              {currentNode.answers.map(answer => (
                <li key={answer.id}>
                  <button
                    type="button"
                    className="tree-option"
                    onClick={() => selectAnswer(answer.id)}
                  >
                    {answer.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="tree-conclusion">
            <div className="tree-conclusion__icon">✅</div>
            <p className="tree-conclusion__text">{currentNode.content}</p>
            {currentNode.article_id && (
              <button
                type="button"
                className="tree-conclusion__article"
                onClick={() => onViewArticle(currentNode.article_id!)}
              >
                📄 Voir l'article : {currentNode.article_title}
              </button>
            )}
            <button
              type="button"
              className="tree-conclusion__copy"
              onClick={() => handleCopy(currentNode.content)}
            >
              Copier la conclusion
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      {canGoBack && (
        <div className="tree-page__nav">
          <Button variant="ghost" size="sm" onClick={goBack}>← Question précédente</Button>
        </div>
      )}
    </div>
  );
}
