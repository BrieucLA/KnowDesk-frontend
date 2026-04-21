/* ── Category tree ──────────────────────────────────────────── */

export interface Category {
  id:          string;
  name:        string;
  description?: string;
  parentId:    string | null;   // null = top-level
  articleCount: number;
  children:    Category[];
}

/* ── Question tree ──────────────────────────────────────────── */

export interface TreeOption {
  id:         string;
  label:      string;
  /** If set → navigate to this node next */
  nextNodeId?: string;
  /** If set → this option is a terminal: show the linked article */
  articleId?:  string;
  /** Free-text final answer (used when no article exists yet) */
  answer?:     string;
}

export interface TreeNode {
  id:       string;
  question: string;
  hint?:    string;   // optional context for the advisor
  options:  TreeOption[];
}

export interface QuestionTree {
  id:          string;
  title:       string;
  categoryId:  string;
  categoryName: string;
  rootNodeId:  string;
  nodes:       Record<string, TreeNode>;  // keyed by node id
  updatedAt:   string;
}

/* ── Navigator state ────────────────────────────────────────── */

export type TreeResolution =
  | { type: 'article'; articleId: string; articleTitle: string }
  | { type: 'answer';  answer: string };

export interface TreeNavigatorState {
  /** Stack of visited node ids — enables unlimited Back */
  history:     string[];
  currentNodeId: string;
  resolution:  TreeResolution | null;
}

export type TreeNavigatorAction =
  | { type: 'SELECT_OPTION'; option: TreeOption }
  | { type: 'GO_BACK' }
  | { type: 'RESTART' };
