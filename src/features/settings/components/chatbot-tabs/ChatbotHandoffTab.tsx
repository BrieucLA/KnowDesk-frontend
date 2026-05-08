import React from 'react';
import { Input } from '../../../../shared/components/ui/Input';
import type { ChatHandoffMode } from '../../types';
import type { ChatbotTabContext } from './types';

/**
 * Tab "Handoff humain" — comment KnowDesk transmet les conversations
 * à votre équipe quand le visiteur demande à parler à un humain.
 */
export function ChatbotHandoffTab({ ctx }: { ctx: ChatbotTabContext }) {
  const { form, setForm } = ctx;
  return (
    <>
      <p className="settings-section__desc">
        Quand un visiteur clique « Parler à un humain » ou indique que le bot ne l'a pas aidé,
        KnowDesk peut transmettre le transcript de la conversation à votre équipe.
      </p>

      <div className="field">
        <label htmlFor="handoff-mode" className="field-label">Mode</label>
        <select
          id="handoff-mode"
          className="field-input"
          value={form.chat_handoff_mode}
          onChange={e => setForm(f => ({ ...f, chat_handoff_mode: e.target.value as ChatHandoffMode }))}
        >
          <option value="none">Aucun — le visiteur voit juste le message de fallback</option>
          <option value="email">Email — envoie le transcript à une adresse</option>
          <option value="webhook">Webhook — POST le transcript JSON à votre URL (CRM, Zendesk, Slack…)</option>
        </select>
        <p className="field-helper">
          « Aucun » garde l'expérience MVP actuelle. « Email » est le plus simple à intégrer. « Webhook »
          permet de créer automatiquement un ticket dans votre helpdesk.
        </p>
      </div>

      {form.chat_handoff_mode === 'email' && (
        <Input
          id="handoff-email"
          label="Email du destinataire"
          type="email"
          value={form.chat_handoff_email ?? ''}
          maxLength={120}
          placeholder="support@votre-entreprise.fr"
          onChange={e => setForm(f => ({ ...f, chat_handoff_email: e.target.value }))}
          helperText="Recevra le transcript HTML de chaque demande de handoff. Utilisez une adresse partagée (support@) plutôt qu'individuelle."
        />
      )}

      {form.chat_handoff_mode === 'webhook' && (
        <Input
          id="handoff-webhook"
          label="URL du webhook"
          type="url"
          value={form.chat_handoff_webhook_url ?? ''}
          maxLength={500}
          placeholder="https://api.votre-crm.fr/webhooks/knowdesk-chat"
          onChange={e => setForm(f => ({ ...f, chat_handoff_webhook_url: e.target.value }))}
          helperText="Recevra un POST JSON { conversationId, transcript, visitorEmail, … }. Timeout 8s. Cf documentation handoff dans le help center pour le format exact."
        />
      )}
    </>
  );
}
