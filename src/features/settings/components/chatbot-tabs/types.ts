import type React from 'react';
import type { useToast } from '../../../../shared/lib/useToast';
import type { ChatOrgSettings } from '../../types';

export type ChatbotTabId =
  | 'messages'
  | 'appearance'
  | 'ai-perso'
  | 'prompt'
  | 'handoff'
  | 'privacy'
  | 'retention'
  | 'integration';

/**
 * Contexte partagé passé à chaque tab. Le state reste dans
 * `ChatbotSettingsSection` (orchestrateur), les tabs sont des
 * presentation components qui appellent les setters reçus.
 *
 * Verbeux mais explicite — pas de Context React nécessaire pour
 * un seul niveau de profondeur.
 */
export interface ChatbotTabContext {
  form:               ChatOrgSettings;
  setForm:            React.Dispatch<React.SetStateAction<ChatOrgSettings>>;
  domainsDraft:       string;
  setDomainsDraft:    (v: string) => void;

  // Prompt système
  promptDraft:        string;
  setPromptDraft:     React.Dispatch<React.SetStateAction<string>>;
  promptTextareaRef:  React.RefObject<HTMLTextAreaElement | null>;
  hasCustomPrompt:    boolean;
  setHasCustomPrompt: React.Dispatch<React.SetStateAction<boolean>>;
  editPrompt:         boolean;
  setEditPrompt:      React.Dispatch<React.SetStateAction<boolean>>;
  promptBackup:       { draft: string; hadCustom: boolean };
  setPromptBackup:    React.Dispatch<React.SetStateAction<{ draft: string; hadCustom: boolean }>>;
  defaultPrompt:      string;
  insertVariableAtCursor: (varName: string) => void;
  restorePromptDefault:   () => void;

  // Glossaire (partagé avec IA recherche)
  addGlossaryRow:    () => void;
  updateGlossaryRow: (i: number, field: 'from' | 'to', value: string) => void;
  removeGlossaryRow: (i: number) => void;

  // Test widget
  widgetMounted:     boolean;
  mountWidget:       () => void;
  unmountWidget:     () => void;

  // Embed snippet (calculé dans le parent)
  embedSnippet:      string;
  toast:             ReturnType<typeof useToast>;
}
