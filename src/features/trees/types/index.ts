export type TreeStatus = 'draft' | 'published';
export type NodeType   = 'question' | 'conclusion';

export interface NodeAnswer {
  id:         string;
  node_id:    string;
  label:      string;
  position:   number;
  created_at: string;
}

export interface TreeNode {
  id:               string;
  tree_id:          string;
  parent_id:        string | null;
  parent_answer_id: string | null;
  type:             NodeType;
  content:          string;
  article_id:       string | null;
  article_title:    string | null;
  position:         number;
  answers:          NodeAnswer[];
}

export interface QuestionTree {
  id:            string;
  title:         string;
  description:   string | null;
  status:        TreeStatus;
  category_id:   string | null;
  category_name: string | null;
  author_email:  string | null;
  updated_at:    string;
  nodes:         TreeNode[];
}

export interface QuestionTreeSummary {
  id:            string;
  title:         string;
  description:   string | null;
  status:        TreeStatus;
  category_name: string | null;
  updated_at:    string;
}
