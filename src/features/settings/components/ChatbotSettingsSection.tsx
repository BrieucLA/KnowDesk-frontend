import React, { useCallback, useEffect, useState } from 'react';
import { Button }            from '../../../shared/components/ui/Button';
import { Input }             from '../../../shared/components/ui/Input';
import { Skeleton }          from '../../../shared/components/ui/Skeleton';
import { apiClient, ApiError } from '../../../shared/lib/apiClient';
import { useToast }          from '../../../shared/lib/useToast';
import { useAuthStore }      from '../../../store/authStore';
import type { ChatOrgSettings } from '../types';

const DEFAULT_WELCOME  = 'Bonjour 👋 Comment puis-je vous aider ?';
const DEFAULT_FALLBACK = 'Désolé, je n\'ai pas la réponse précise à cette question. Vous pouvez nous joindre par email à contact@example.com ou par téléphone au 09 99 99 99 99.';

export function ChatbotSettingsSection() {
  const toast = useToast();
  const orgSlug = useAuthStore(s => s.session?.organization.slug ?? '');

  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [form,    setForm]    = useState<ChatOrgSettings>({
    chat_enabled:           false,
    chat_welcome_message:   '',
    chat_fallback_message:  '',
    chat_primary_color:     '',
    chat_logo_url:          '',
    chat_allowed_domains:   [],
  });
  const [domainsDraft, setDomainsDraft] = useState('');
  const [widgetMounted, setWidgetMounted] = useState(false);

  // Injection live du widget pour test : on ne l'active qu'à la demande
  // explicite (clic sur le bouton "Tester sur cette page") et on le retire
  // au démontage du composant pour éviter qu'il persiste sur les autres pages.
  const mountWidget = useCallback(() => {
    if (widgetMounted || !orgSlug) return;
    const script = document.createElement('script');
    script.src = '/chat.js';
    script.setAttribute('data-org', orgSlug);
    script.setAttribute('data-knowdesk-chat-test', '1');  // marqueur pour le cleanup
    script.defer = true;
    document.body.appendChild(script);
    setWidgetMounted(true);
  }, [widgetMounted, orgSlug]);

  const unmountWidget = useCallback(() => {
    document.querySelectorAll('[data-knowdesk-chat], script[data-knowdesk-chat-test]').forEach(el => el.remove());
    delete (window as { __knowdeskChatLoaded?: boolean }).__knowdeskChatLoaded;
    setWidgetMounted(false);
  }, []);

  // Cleanup au démontage de la section
  useEffect(() => () => unmountWidget(), [unmountWidget]);

  useEffect(() => {
    apiClient.get<ChatOrgSettings>('/settings/org')
      .then(o => {
        setForm({
          chat_enabled:           o.chat_enabled ?? false,
          chat_welcome_message:   o.chat_welcome_message ?? '',
          chat_fallback_message:  o.chat_fallback_message ?? '',
          chat_primary_color:     o.chat_primary_color ?? '',
          chat_logo_url:          o.chat_logo_url ?? '',
          chat_allowed_domains:   Array.isArray(o.chat_allowed_domains) ? o.chat_allowed_domains : [],
        });
        setDomainsDraft((o.chat_allowed_domains ?? []).join('\n'));
      })
      .catch(() => { /* defaults conservés */ })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const allowedDomains = domainsDraft
        .split(/[\s,]+/)
        .map(d => d.trim())
        .filter(Boolean);

      await apiClient.patch('/settings/org/chat', {
        enabled:         form.chat_enabled,
        welcomeMessage:  (form.chat_welcome_message  ?? '').trim() || null,
        fallbackMessage: (form.chat_fallback_message ?? '').trim() || null,
        primaryColor:    (form.chat_primary_color    ?? '').trim() || null,
        logoUrl:         (form.chat_logo_url         ?? '').trim() || null,
        allowedDomains,
      });
      setForm(f => ({ ...f, chat_allowed_domains: allowedDomains }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast.success('Paramètres chatbot enregistrés');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Sauvegarde impossible.');
    } finally {
      setSaving(false);
    }
  }, [form, domainsDraft, toast]);

  if (loading) {
    return <section className="settings-section"><Skeleton className="sk-title" /><Skeleton className="sk-p" /></section>;
  }

  // Snippet d'intégration que l'admin colle sur son site
  const embedSnippet = `<script
  src="https://know-desk-frontend.vercel.app/chat.js"
  data-org="${orgSlug}"
  defer
></script>`;

  return (
    <section className="settings-section" aria-labelledby="chatbot-title">
      <div className="settings-section__header">
        <h2 id="chatbot-title" className="settings-section__title">✨ IA chatbot</h2>
        <p className="settings-section__desc">
          Activez et personnalisez le chatbot embarquable que vos clients peuvent utiliser depuis votre site web.
          Il répond <strong>uniquement</strong> à partir des FAQs, articles et processus marqués comme « Public ».
        </p>
      </div>

      <form className="settings-form" onSubmit={handleSave} noValidate>
        {/* Toggle principal */}
        <div className="settings-toggles">
          <div className="toggle-row">
            <div className="toggle-row__text">
              <label htmlFor="chat-enabled-toggle" className="toggle-row__label">
                Chatbot activé
              </label>
              <p className="toggle-row__desc">
                Quand activé, le widget peut être chargé sur les domaines listés dans la liste blanche
                ci-dessous. Désactivé, l'endpoint répond une erreur — le widget reste invisible.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              id="chat-enabled-toggle"
              aria-checked={form.chat_enabled}
              className={`toggle ${form.chat_enabled ? 'toggle--on' : ''}`}
              onClick={() => setForm(f => ({ ...f, chat_enabled: !f.chat_enabled }))}
            >
              <span className="toggle__thumb" />
            </button>
          </div>
        </div>

        <fieldset
          disabled={!form.chat_enabled}
          style={{ border: 'none', padding: 0, margin: 0, opacity: form.chat_enabled ? 1 : 0.5 }}
        >
          {/* Messages */}
          <Input
            id="chat-welcome"
            label="Message d'accueil"
            value={form.chat_welcome_message ?? ''}
            maxLength={200}
            placeholder={DEFAULT_WELCOME}
            onChange={e => setForm(f => ({ ...f, chat_welcome_message: e.target.value }))}
            helperText="Premier message que le visiteur voit quand il ouvre le widget. Vide → message générique."
          />

          <div className="field">
            <label htmlFor="chat-fallback" className="field-label">Message de fallback</label>
            <textarea
              id="chat-fallback"
              className="field-input"
              value={form.chat_fallback_message ?? ''}
              maxLength={500}
              rows={3}
              placeholder={DEFAULT_FALLBACK}
              onChange={e => setForm(f => ({ ...f, chat_fallback_message: e.target.value }))}
            />
            <p className="field-helper">
              Affiché quand le bot ne sait pas répondre. Personnalisez avec vos canaux de contact (email, téléphone, formulaire).
            </p>
          </div>

          {/* Apparence */}
          <div className="field">
            <label htmlFor="chat-color" className="field-label">Couleur primaire</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                id="chat-color"
                type="color"
                value={form.chat_primary_color || '#5B6CFF'}
                onChange={e => setForm(f => ({ ...f, chat_primary_color: e.target.value }))}
                style={{ width: 48, height: 36, border: '1px solid var(--neutral-200)', borderRadius: 6, background: 'transparent', cursor: 'pointer', padding: 2 }}
              />
              <Input
                id="chat-color-hex"
                value={form.chat_primary_color ?? ''}
                placeholder="#5B6CFF"
                onChange={e => setForm(f => ({ ...f, chat_primary_color: e.target.value }))}
                helperText=""
              />
            </div>
            <p className="field-helper">Couleur du bouton flottant et des bulles de message côté visiteur.</p>
          </div>

          <Input
            id="chat-logo"
            label="Logo (URL)"
            value={form.chat_logo_url ?? ''}
            maxLength={500}
            placeholder="https://votre-site.fr/logo.png"
            onChange={e => setForm(f => ({ ...f, chat_logo_url: e.target.value }))}
            helperText="Image carrée ≤ 64×64 px recommandée. Affichée dans le header du widget."
          />

          {/* Domaines autorisés */}
          <div className="field">
            <label htmlFor="chat-domains" className="field-label">Domaines autorisés ⚠</label>
            <textarea
              id="chat-domains"
              className="field-input"
              value={domainsDraft}
              onChange={e => setDomainsDraft(e.target.value)}
              rows={4}
              placeholder={'acme.fr\nstaging.acme.fr\nlocalhost'}
            />
            <p className="field-helper">
              Un domaine par ligne (ou séparés par virgule). Le widget ne se charge <strong>que</strong> depuis ces
              domaines — sinon le serveur refuse la requête. Indispensable pour éviter qu'un site tiers détourne votre chatbot.
            </p>
          </div>
        </fieldset>

        <div className="settings-form__actions">
          <Button type="submit" variant="primary" size="md" loading={saving}>
            Enregistrer les modifications
          </Button>
          {saved && (
            <span className="settings-form__saved" role="status" aria-live="polite">
              ✓ Modifications enregistrées
            </span>
          )}
        </div>

        {/* Test live sur cette page */}
        <div className="settings-section__header" style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid var(--neutral-100)' }}>
          <div>
            <h3 className="settings-section__title" style={{ fontSize: 16 }}>Tester le chatbot sur cette page</h3>
            <p className="settings-section__desc">
              Charge le widget directement dans cette page d'administration pour valider l'apparence et
              les réponses, sans avoir à intégrer le snippet sur ton site web.
            </p>
          </div>
        </div>
        <div style={{
          background: 'oklch(0.97 0.04 250)',
          border: '1px solid oklch(0.85 0.06 250)',
          borderRadius: 'var(--radius-md)',
          padding: 14,
          fontSize: 13,
          color: 'var(--neutral-700)',
          marginBottom: 12,
        }}>
          <strong>⚠ Pré-requis :</strong> ajoute le domaine <code>{typeof window !== 'undefined' ? window.location.host : 'know-desk-frontend.vercel.app'}</code> dans la liste des domaines autorisés ci-dessus, sinon le widget ne s'affichera pas (CORS bloqué côté serveur).
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <Button
            type="button"
            variant={widgetMounted ? 'ghost' : 'primary'}
            size="sm"
            onClick={widgetMounted ? unmountWidget : mountWidget}
            disabled={!form.chat_enabled}
            title={form.chat_enabled ? '' : 'Activez le chatbot d\'abord'}
          >
            {widgetMounted ? '✕ Retirer le widget' : '💬 Tester sur cette page'}
          </Button>
        </div>

        {/* Snippet d'intégration */}
        <div className="settings-section__header" style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--neutral-100)' }}>
          <div>
            <h3 className="settings-section__title" style={{ fontSize: 16 }}>Intégrer le widget sur votre site</h3>
            <p className="settings-section__desc">
              Copiez le snippet ci-dessous et collez-le juste avant la fermeture de la balise <code>&lt;/body&gt;</code>
              de votre site. Le widget se charge automatiquement et tient compte de tous les paramètres définis ici.
            </p>
          </div>
        </div>
        <pre style={{
          background: 'var(--neutral-50)',
          border: '1px solid var(--neutral-200)',
          borderRadius: 'var(--radius-md)',
          padding: 14,
          fontSize: 12,
          overflowX: 'auto',
          fontFamily: 'var(--font-ui)',
          margin: 0,
        }}>
          <code>{embedSnippet}</code>
        </pre>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          style={{ marginTop: 8 }}
          onClick={() => {
            navigator.clipboard?.writeText(embedSnippet).then(
              () => toast.success('Snippet copié'),
              () => toast.error('Impossible de copier le snippet'),
            );
          }}
        >
          Copier le snippet
        </Button>
      </form>
    </section>
  );
}
