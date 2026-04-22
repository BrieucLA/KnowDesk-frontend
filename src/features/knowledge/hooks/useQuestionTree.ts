import { useReducer, useEffect, useCallback, useState } from 'react';
import { apiClient } from '../../../shared/lib/apiClient';

// ── Types locaux ──────────────────────────────────────────────

interface NodeAnswer {
  id:       string;
  node_id:  string;
  label:    string;
  position: number;
}

interface TreeNode {
  id:               string;
  parent_id:        string | null;
  parent_answer_id: string | null;
  type:             'question' | 'conclusion';
  content:          string;
  article_id:       string | null;
  article_title:    string | null;
  position:         number;
  answers:          NodeAnswer[];
}

interface QuestionTree {
  id:          string;
  title:       string;
  description: string | null;
  status:      string;
  nodes:       TreeNode[];
}

type LoadState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: QuestionTree }
  | { status: 'error';   message: string };

type LoadAction =
  | { type: 'LOADING' }
  | { type: 'SUCCESS'; data: QuestionTree }
  | { type: 'ERROR';   message: string };

function loadReducer(_: LoadState, a: LoadAction): LoadState {
  switch (a.type) {
    case 'LOADING': return { status: 'loading' };
    case 'SUCCESS': return { status: 'success', data: a.data };
    case 'ERROR':   return { status: 'error',   message: a.message };
  }
}

// ── Hook ──────────────────────────────────────────────────────

export function useQuestionTree(treeId: string) {
  const [loadState, dispatchLoad] = useReducer(loadReducer, { status: 'idle' });
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [history,       setHistory]       = useState<string[]>([]);

  useEffect(() => {
    dispatchLoad({ type: 'LOADING' });
    apiClient.get<QuestionTree>(`/trees/${treeId}`)
      .then(tree => {
        dispatchLoad({ type: 'SUCCESS', data: tree });
        // Premier nœud racine comme point d'entrée par défaut
        const root = tree.nodes.find(n => n.parent_id === null);
        if (root) setCurrentNodeId(root.id);
      })
      .catch(err => dispatchLoad({
        type: 'ERROR',
        message: err instanceof Error ? err.message : 'Processus introuvable.',
      }));
  }, [treeId]);

  const tree = loadState.status === 'success' ? loadState.data : null;
  const currentNode = tree?.nodes.find(n => n.id === currentNodeId) ?? null;

  const selectAnswer = useCallback((answerId: string) => {
    if (!tree || !currentNodeId) return;
    const nextNode = tree.nodes.find(n => n.parent_answer_id === answerId);
    if (nextNode) {
      setHistory(h => [...h, currentNodeId]);
      setCurrentNodeId(nextNode.id);
    }
  }, [tree, currentNodeId]);

  const goBack = useCallback(() => {
    setHistory(h => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setCurrentNodeId(prev);
      return h.slice(0, -1);
    });
  }, []);

  const restart = useCallback(() => {
    if (!tree) return;
    const root = tree.nodes.find(n => n.parent_id === null);
    if (root) {
      setCurrentNodeId(root.id);
      setHistory([]);
    }
  }, [tree]);

  return {
    loadState,
    tree,
    currentNode,
    history,
    selectAnswer,
    goBack,
    restart,
    canGoBack: history.length > 0,
  };
}
