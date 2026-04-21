import { useReducer, useCallback, useEffect } from 'react';
import { mockGetQuestionTree }    from '../api/knowledge.mock';
import type {
  QuestionTree, TreeNavigatorState, TreeNavigatorAction, TreeOption,
} from '../types';
import type { AsyncState } from '../../../shared/types';

/* ── Load state ─────────────────────────────────────────────── */

type LoadState = AsyncState<QuestionTree>;
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

/* ── Navigator reducer — pure, zero side effects ────────────── */
/**
 * This reducer is intentionally exported so it can be unit-tested
 * without mounting React:
 *
 *   const s0 = { history: [], currentNodeId: 'node-1', resolution: null };
 *   const s1 = navigatorReducer(s0, { type: 'SELECT_OPTION', option: opt });
 *   expect(s1.currentNodeId).toBe('node-2');
 */
export function navigatorReducer(
  state: TreeNavigatorState,
  action: TreeNavigatorAction,
  tree: QuestionTree,
): TreeNavigatorState {
  switch (action.type) {

    case 'SELECT_OPTION': {
      const opt = action.option;

      // Terminal — option carries a final answer or an article link
      if (opt.articleId || opt.answer) {
        return {
          ...state,
          resolution: opt.articleId
            ? { type: 'article', articleId: opt.articleId, articleTitle: opt.label }
            : { type: 'answer',  answer: opt.answer! },
        };
      }

      // Navigate to next node
      if (opt.nextNodeId && tree.nodes[opt.nextNodeId]) {
        return {
          history:       [...state.history, state.currentNodeId],
          currentNodeId: opt.nextNodeId,
          resolution:    null,
        };
      }

      // Fallback — dead-end option (shouldn't happen in clean data)
      return { ...state, resolution: { type: 'answer', answer: 'Aucune information disponible pour cette option.' } };
    }

    case 'GO_BACK': {
      if (state.resolution) {
        // First Back press clears the resolution, stays on same node
        return { ...state, resolution: null };
      }
      if (state.history.length === 0) return state;
      const history       = state.history.slice(0, -1);
      const currentNodeId = state.history[state.history.length - 1];
      return { history, currentNodeId, resolution: null };
    }

    case 'RESTART':
      return { history: [], currentNodeId: tree.rootNodeId, resolution: null };
  }
}

/* ── Hook ───────────────────────────────────────────────────── */

interface UseQuestionTreeReturn {
  loadState:      LoadState;
  navState:       TreeNavigatorState | null;
  currentNode:    ReturnType<typeof getCurrentNode>;
  stepCount:      number;     // 1-based, for the progress bar
  totalEstimate:  number;     // rough depth estimate
  selectOption:   (option: TreeOption) => void;
  goBack:         () => void;
  restart:        () => void;
}

export function useQuestionTree(treeId: string): UseQuestionTreeReturn {
  const [loadState, dispatchLoad] = useReducer(loadReducer, { status: 'idle' });

  // navState is derived from the loaded tree — can't init until tree loads
  const [navState, setNavState] = useReducer(
    (state: TreeNavigatorState | null, action: TreeNavigatorAction | { type: 'INIT'; tree: QuestionTree }) => {
      if (action.type === 'INIT') {
        return { history: [], currentNodeId: action.tree.rootNodeId, resolution: null };
      }
      if (!state) return state;
      const tree = (loadState as { status: 'success'; data: QuestionTree }).data;
      return navigatorReducer(state, action as TreeNavigatorAction, tree);
    },
    null,
  );

  useEffect(() => {
    dispatchLoad({ type: 'LOADING' });
    mockGetQuestionTree(treeId)
      .then(tree => {
        dispatchLoad({ type: 'SUCCESS', data: tree });
        setNavState({ type: 'INIT', tree });
      })
      .catch(err => dispatchLoad({
        type: 'ERROR',
        message: err instanceof Error ? err.message : 'Impossible de charger l\'arbre.',
      }));
  }, [treeId]);

  const selectOption = useCallback((option: TreeOption) => {
    setNavState({ type: 'SELECT_OPTION', option });
  }, []);

  const goBack    = useCallback(() => setNavState({ type: 'GO_BACK' }),   []);
  const restart   = useCallback(() => setNavState({ type: 'RESTART' }),   []);

  const tree = loadState.status === 'success' ? loadState.data : null;

  return {
    loadState,
    navState,
    currentNode:   getCurrentNode(tree, navState),
    stepCount:     (navState?.history.length ?? 0) + 1,
    totalEstimate: 4,  // shown in the progress bar; refine with tree depth analysis
    selectOption,
    goBack,
    restart,
  };
}

/* ── Helpers ────────────────────────────────────────────────── */

function getCurrentNode(
  tree: QuestionTree | null,
  nav:  TreeNavigatorState | null,
) {
  if (!tree || !nav) return null;
  return tree.nodes[nav.currentNodeId] ?? null;
}
