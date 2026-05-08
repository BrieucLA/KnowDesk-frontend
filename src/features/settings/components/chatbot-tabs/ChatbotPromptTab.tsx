import React from 'react';
import { Button } from '../../../../shared/components/ui/Button';
import { PromptVariablesPanel } from '../PromptVariablesPanel';
import type { ChatbotTabContext } from './types';

/**
 * Tab "Prompt système" — éditeur du template Mustache + panneau
 * variables cliquables. Lecture seule par défaut, déverrouillable
 * via le bouton « Modifier ».
 */
export function ChatbotPromptTab({ ctx }: { ctx: ChatbotTabContext }) {
  const {
    promptDraft, setPromptDraft, promptTextareaRef,
    hasCustomPrompt, setHasCustomPrompt,
    editPrompt, setEditPrompt,
    promptBackup, setPromptBackup,
    defaultPrompt,
    insertVariableAtCursor, restorePromptDefault,
  } = ctx;

  return (
    <>
      <p className="settings-section__desc">
        Instructions complètes envoyées à Mistral à chaque message du chatbot.
        Le prompt utilise des <strong>variables Mustache</strong> (ex: <code className="km-mono">{`{{industry}}`}</code>)
        qui sont remplacées par leurs valeurs au moment de l'envoi. Tu peux réorganiser
        ou réécrire le prompt en gardant ces variables — elles continueront de refléter
        tes réglages (tonalité, glossaire, etc.) sans devoir tout réécrire à chaque
        changement. Pour repartir du template par défaut, clique sur « Restaurer le défaut ».
        {hasCustomPrompt && (
          <span className="chatbot-settings__prompt-active">
            Prompt personnalisé actif.
          </span>
        )}
      </p>

      <div className="field">
        <label htmlFor="chat-system-prompt" className="field-label">
          Prompt utilisé par le chatbot
          {!editPrompt && (
            <span className="chatbot-settings__prompt-readonly">
              · lecture seule
            </span>
          )}
        </label>

        {editPrompt && !promptDraft.includes('{{response_modes}}') && (
          <div role="alert" className="chatbot-settings__prompt-warning">
            ⚠ La variable <code className="km-mono">{`{{response_modes}}`}</code> n'est pas dans
            ton prompt. Sans elle, les garde-fous anti-jailbreak et le mode "fallback" sont
            désactivés. Pense à la réinsérer si tu l'as supprimée par erreur.
          </div>
        )}

        <div className="prompt-editor-grid">
          <textarea
            id="chat-system-prompt"
            ref={promptTextareaRef}
            className={`field-input prompt-editor-grid__textarea chatbot-settings__prompt-textarea ${editPrompt ? 'chatbot-settings__prompt-textarea--editable' : 'chatbot-settings__prompt-textarea--readonly'}`}
            value={promptDraft}
            onChange={e => { setPromptDraft(e.target.value); setHasCustomPrompt(true); }}
            rows={22}
            readOnly={!editPrompt}
            spellCheck={false}
          />
          {editPrompt && (
            <PromptVariablesPanel onInsert={insertVariableAtCursor} />
          )}
        </div>
        <div className="chatbot-settings__prompt-footer">
          <p className="field-helper chatbot-settings__prompt-footer-helper">
            {editPrompt
              ? <>Min. 50 caractères. {promptDraft.length} / 8000.</>
              : <>Le prompt est verrouillé pour éviter les manipulations erronées. Clique sur « Modifier » pour le débloquer.</>
            }
          </p>
          {!editPrompt ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                setPromptBackup({ draft: promptDraft, hadCustom: hasCustomPrompt });
                setEditPrompt(true);
              }}
            >
              ✎ Modifier
            </Button>
          ) : (
            <div className="chatbot-settings__prompt-actions">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPromptDraft(promptBackup.draft);
                  setHasCustomPrompt(promptBackup.hadCustom);
                  setEditPrompt(false);
                }}
              >
                Annuler
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={restorePromptDefault}
                disabled={promptDraft.trim() === defaultPrompt.trim() && !hasCustomPrompt}
              >
                ↺ Restaurer le défaut
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
