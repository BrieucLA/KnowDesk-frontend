/**
 * Types TypeScript miroir du backend learning (cf modules/learning/learning.types.ts).
 */

export type LearningPathRenewal     = 3 | 6 | 12 | null;
export type LearningResourceType    = 'article' | 'faq' | 'tree';
export type LearningQuizSource      = 'ai' | 'manual';
export type LearningCompletionStatus = 'pending' | 'in_progress' | 'completed' | 'outdated';

export interface LearningQuizQuestion {
  q:           string;
  choices:     string[];
  correct_idx: number;
}

export interface LearningPath {
  id:             string;
  org_id:         string;
  name:           string;
  description:    string | null;
  mandatory:      boolean;
  renewal_months: LearningPathRenewal;
  created_by:     string | null;
  created_at:     string;
  updated_at:     string;
}

export interface LearningModule {
  id:         string;
  path_id:    string;
  name:       string;
  position:   number;
  created_at: string;
}

export interface LearningPathDetail extends LearningPath {
  modules: LearningModule[];
}

export interface LearningModuleResource {
  id:            string;
  module_id:     string;
  resource_type: LearningResourceType;
  resource_id:   string;
  position:      number;
}

export interface LearningQuiz {
  id:            string;
  module_id:     string;
  questions:     LearningQuizQuestion[];
  passing_score: number;
  generated_by:  LearningQuizSource;
  created_at:    string;
  updated_at:    string;
}

export interface LearningAssignment {
  id:          string;
  path_id:     string;
  user_id:     string;
  assigned_at: string;
  assigned_by: string | null;
}

/** Vue conseiller : 1 parcours + ses modules + progression agrégée. */
export interface MyLearningPath {
  path: {
    id:             string;
    name:           string;
    description:    string | null;
    mandatory:      boolean;
    renewal_months: LearningPathRenewal;
  };
  modules: Array<{
    id:            string;
    name:          string;
    position:      number;
    status:        LearningCompletionStatus;
    score:         number | null;
    completed_at:  string | null;
    expires_at:    string | null;
  }>;
  progress: {
    total:       number;
    completed:   number;
    in_progress: number;
    outdated:    number;
  };
}

/** Vue admin dashboard pour un parcours : qui a fait quels modules. */
export interface LearningPathCompletions {
  modules: Array<{ id: string; name: string; position: number }>;
  assignments: Array<{
    user_id:     string;
    user_email:  string | null;
    user_name:   string | null;
    assigned_at: string;
    modules: Array<{
      module_id: string;
      status:    LearningCompletionStatus;
      score:     number | null;
    }>;
  }>;
}
