export type EditorMode = 'create' | 'edit';

export interface EditorFormState {
  title:       string;
  categoryId:  string;
  content:     string;   // HTML from the rich editor
  status:      'draft' | 'published';
}

export interface EditorErrors {
  title?:      string;
  categoryId?: string;
  content?:    string;
}

export type SaveStatus =
  | 'idle'
  | 'saving'
  | 'saved'
  | 'error'
  | 'offline';
