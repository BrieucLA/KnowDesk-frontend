import React from 'react';
import { Input } from '../../../../shared/components/ui/Input';
import type { ChatbotTabContext } from './types';

/**
 * Tab "Confidentialité (RGPD)" — disclaimer affiché au 1ᵉʳ ouverture
 * du widget + lien optionnel vers la politique de confidentialité.
 */
export function ChatbotPrivacyTab({ ctx }: { ctx: ChatbotTabContext }) {
  const { form, setForm } = ctx;
  return (
    <>
      <p className="settings-section__desc">
        Au tout premier ouverture du widget chez un visiteur, KnowDesk affiche un écran d'information
        rappelant que la conversation est enregistrée. Le visiteur clique « J'ai compris » avant
        que le chat démarre. <strong>Cet écran est toujours actif</strong> — c'est une obligation
        de transparence RGPD que tu ne peux pas désactiver.
      </p>

      <div className="field">
        <label htmlFor="privacy-notice" className="field-label">Texte du disclaimer (optionnel)</label>
        <textarea
          id="privacy-notice"
          className="field-input chatbot-settings__privacy-textarea"
          value={form.chat_privacy_notice ?? ''}
          maxLength={500}
          rows={3}
          placeholder={
            'Pour améliorer notre service, votre conversation est enregistrée et peut être consultée par notre équipe. '
          + 'Vous pouvez supprimer la conversation à tout moment via le bouton ↺.'
          }
          onChange={e => setForm(f => ({ ...f, chat_privacy_notice: e.target.value }))}
        />
        <p className="field-helper">
          Vide → on utilise le texte standard (visible en placeholder ci-dessus). 500 caractères max.
        </p>
      </div>

      <Input
        id="privacy-policy-url"
        label="Lien vers ta politique de confidentialité (optionnel)"
        type="url"
        value={form.chat_privacy_policy_url ?? ''}
        maxLength={500}
        placeholder="https://ton-entreprise.fr/confidentialite"
        onChange={e => setForm(f => ({ ...f, chat_privacy_policy_url: e.target.value }))}
        helperText="Si fourni, un lien « ▸ En savoir plus » apparaît sous le disclaimer (s'ouvre dans un nouvel onglet). Vide → pas de lien."
      />
    </>
  );
}
