import React, { useCallback, useEffect, useState } from 'react';
import { Button }            from '../../../shared/components/ui/Button';
import { Input }             from '../../../shared/components/ui/Input';
import { Skeleton }          from '../../../shared/components/ui/Skeleton';
import { ConfirmDialog }     from '../../../shared/components/ui/ConfirmDialog';
import { apiClient, ApiError } from '../../../shared/lib/apiClient';
import { useToast }          from '../../../shared/lib/useToast';
import { useAuthStore }      from '../../../store/authStore';
import { PromptVariablesPanel } from './PromptVariablesPanel';
import '../chatbot-settings.css';
import type {
  ChatOrgSettings, ChatHandoffMode, ChatRetentionDays,
  AiTone, AiAddressForm, AiGlossaryEntry,
} from '../types';

const DEFAULT_WELCOME  = 'Bonjour 👋 Comment puis-je vous aider ?';
const DEFAULT_FALLBACK = 'Désolé, je n\'ai pas la réponse précise à cette question. Vous pouvez nous joindre par email à contact@example.com ou par téléphone au 09 99 99 99 99.';

const TONE_OPTIONS: Array<{ value: AiTone; label: string; hint: string }> = [
  { value: 'professional', label: 'Professionnelle', hint: 'Neutre, factuelle' },
  { value: 'warm',         label: 'Chaleureuse',     hint: 'Accueillante, humaine' },
  { value: 'direct',       label: 'Directe',         hint: 'Droit au but' },
  { value: 'empathetic',   label: 'Empathique',      hint: 'Sensible aux situations délicates' },
  { value: 'casual',       label: 'Décontractée',    hint: 'Accessible, moderne' },
];
const MAX_GLOSSARY = 30;

export function ChatbotSettingsSection() {
  const toast = useToast();
  const orgSlug = useAuthStore(s => s.session?.organization.slug ?? '');

  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [form,    setForm]    = useState<ChatOrgSettings>({
    chat_enabled:             false,
    chat_welcome_message:     '',
    chat_fallback_message:    '',
    chat_primary_color:       '',
    chat_logo_url:             '',
    chat_allowed_domains:     [],
    chat_handoff_mode:        'none',
    chat_handoff_webhook_url: '',
    chat_handoff_email:       '',
    chat_system_prompt:        null,
    chat_privacy_notice:       null,
    chat_privacy_policy_url:   null,
    chat_retention_days:       90,
    industry:                  '',
    ai_tone:                   null,
    ai_address_form:           null,
    ai_glossary:               [],
  });
  /** Valeur de rétention au chargement — sert de référence pour détecter
   *  une baisse et déclencher la confirmation avec preview du count. */
  const [initialRetention, setInitialRetention] = useState<ChatRetentionDays>(90);
  /** Snapshot des champs IA au chargement — permet de skipper le PATCH /ai
   *  quand rien n'a changé côté perso (évite un audit log parasite à chaque
   *  save où seul le bloc chatbot a été touché). */
  const [initialAi, setInitialAi] = useState<{
    industry: string;
    ai_tone: AiTone | null;
    ai_address_form: AiAddressForm | null;
    ai_glossary: AiGlossaryEntry[];
  }>({ industry: '', ai_tone: null, ai_address_form: null, ai_glossary: [] });
  /** Données du ConfirmDialog quand l'admin baisse la rétention.
   *  null = pas de dialog ouvert. */
  const [retentionConfirm, setRetentionConfirm] = useState<{
    days:    ChatRetentionDays;
    count:   number;
    loading: boolean;
  } | null>(null);
  const [domainsDraft, setDomainsDraft] = useState('');
  const [widgetMounted, setWidgetMounted] = useState(false);
  /** Prompt généré par défaut côté backend — sert au pré-remplissage et au reset. */
  const [defaultPrompt, setDefaultPrompt] = useState<string>('');
  const promptTextareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  // Insertion au curseur : utilise le setter functional pour lire la
  // valeur courante de promptDraft sans dépendance dans une closure.
  const insertVariableAtCursor = (varName: string): void => {
    const el = promptTextareaRef.current;
    if (!el) return;
    const placeholder = `{{${varName}}}`;
    const start = el.selectionStart ?? 0;
    const end   = el.selectionEnd   ?? 0;
    setPromptDraft(prev => prev.slice(0, start) + placeholder + prev.slice(end));
    setHasCustomPrompt(true);
    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + placeholder.length;
      el.setSelectionRange(cursor, cursor);
    });
  };

  /** Texte courant du textarea prompt. Distinct de form.chat_system_prompt
      pour gérer proprement « valeur custom » vs « valeur affichée pour info ». */
  const [promptDraft, setPromptDraft]     = useState<string>('');
  /** True si l'admin a un prompt custom en DB (non-null). */
  const [hasCustomPrompt, setHasCustomPrompt] = useState<boolean>(false);
  /** Le prompt est en lecture seule par défaut — un clic « Modifier » le déverrouille.
      Évite les manipulations erronées (effacer le prompt ou le casser involontairement). */
  const [editPrompt,   setEditPrompt]   = useState<boolean>(false);
  /** Backup pour permettre l'annulation de l'édition. Restauré sur Annuler. */
  const [promptBackup, setPromptBackup] = useState<{ draft: string; hadCustom: boolean }>({ draft: '', hadCustom: false });

  // Injection live du widget pour test : on ne l'active qu'à la demande
  // explicite (clic sur le bouton "Tester sur cette page") et on le retire
  // au démontage du composant pour éviter qu'il persiste sur les autres pages.
  const mountWidget = useCallback(() => {
    if (widgetMounted) return;
    if (!orgSlug) {
      toast.error('Slug d\'organisation introuvable. Reconnecte-toi et réessaye.');
      return;
    }
    const script = document.createElement('script');
    script.src = '/chat.js';
    script.setAttribute('data-org', orgSlug);
    script.setAttribute('data-knowdesk-chat-test', '1');  // marqueur pour le cleanup
    document.body.appendChild(script);
    setWidgetMounted(true);

    // Le widget émet `knowdesk-chat:ready` ou `knowdesk-chat:error` après init.
    // Si on ne reçoit rien sous 5s, c'est que le script ne s'est pas exécuté.
    const onReady = () => {
      cleanup();
      toast.success('Widget chargé — il est en bas à droite.');
    };
    const onError = (e: Event) => {
      cleanup();
      const reason = (e as CustomEvent).detail?.reason ?? 'unknown';
      const status = (e as CustomEvent).detail?.status;
      const messages: Record<string, string> = {
        'domain-not-allowed': `Ce domaine (${window.location.host}) n'est pas dans la liste blanche. Ajoutez-le et enregistrez avant de retester.`,
        'org-not-found':      'Organisation introuvable côté serveur (incohérence ?).',
        'network':            'Impossible de joindre le serveur. Vérifie que tu as bien enregistré la config et que le backend est en ligne.',
        'server-error':       'Erreur serveur. Vérifiez les logs Railway.',
        'already-loaded':     'Le widget est déjà chargé sur cette page.',
        'unknown':            `Erreur ${status ?? '?'} — vérifie la console navigateur pour les détails.`,
      };
      toast.error(messages[reason] ?? messages.unknown);
      // En cas d'erreur, retire les éléments injectés pour permettre un nouveau test
      document.querySelectorAll('[data-knowdesk-chat], script[data-knowdesk-chat-test]').forEach(el => el.remove());
      delete (window as { __knowdeskChatLoaded?: boolean }).__knowdeskChatLoaded;
      setWidgetMounted(false);
    };
    const timer = window.setTimeout(() => {
      cleanup();
      toast.error('Le widget n\'a pas répondu sous 5s — vérifie la console navigateur (F12 → Console / Network).');
    }, 5000);
    function cleanup() {
      window.removeEventListener('knowdesk-chat:ready', onReady);
      window.removeEventListener('knowdesk-chat:error', onError as EventListener);
      window.clearTimeout(timer);
    }
    window.addEventListener('knowdesk-chat:ready', onReady, { once: true });
    window.addEventListener('knowdesk-chat:error', onError as EventListener, { once: true });
  }, [widgetMounted, orgSlug, toast]);

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
          chat_enabled:             o.chat_enabled ?? false,
          chat_welcome_message:     o.chat_welcome_message ?? '',
          chat_fallback_message:    o.chat_fallback_message ?? '',
          chat_primary_color:       o.chat_primary_color ?? '',
          chat_logo_url:            o.chat_logo_url ?? '',
          chat_allowed_domains:     Array.isArray(o.chat_allowed_domains) ? o.chat_allowed_domains : [],
          chat_handoff_mode:        (o.chat_handoff_mode as ChatHandoffMode) ?? 'none',
          chat_handoff_webhook_url: o.chat_handoff_webhook_url ?? '',
          chat_handoff_email:       o.chat_handoff_email ?? '',
          chat_system_prompt:        o.chat_system_prompt ?? null,
          chat_privacy_notice:       o.chat_privacy_notice ?? null,
          chat_privacy_policy_url:   o.chat_privacy_policy_url ?? null,
          chat_retention_days:       (o.chat_retention_days as ChatRetentionDays) ?? 90,
          industry:                  o.industry ?? '',
          ai_tone:                   o.ai_tone ?? null,
          ai_address_form:           o.ai_address_form ?? null,
          ai_glossary:               Array.isArray(o.ai_glossary) ? o.ai_glossary : [],
        });
        setDomainsDraft((o.chat_allowed_domains ?? []).join('\n'));
        setInitialRetention((o.chat_retention_days as ChatRetentionDays) ?? 90);
        setInitialAi({
          industry:        o.industry ?? '',
          ai_tone:         o.ai_tone ?? null,
          ai_address_form: o.ai_address_form ?? null,
          ai_glossary:     Array.isArray(o.ai_glossary) ? o.ai_glossary : [],
        });
        setDefaultPrompt(o.chat_system_prompt_default ?? '');
        // Si custom prompt en DB → on l'affiche, sinon on pré-remplit avec le défaut
        // pour transparence (l'admin VOIT ce qui est utilisé). Le flag hasCustomPrompt
        // distingue les deux cas pour le « Restaurer le défaut ».
        const hasCustom = Boolean(o.chat_system_prompt && o.chat_system_prompt.trim().length > 0);
        setHasCustomPrompt(hasCustom);
        setPromptDraft(hasCustom ? o.chat_system_prompt! : (o.chat_system_prompt_default ?? ''));
      })
      .catch(() => { /* defaults conservés */ })
      .finally(() => setLoading(false));
  }, []);

  // Save réel — appelé soit directement (cas standard), soit après
  // confirmation de l'admin (baisse de rétention).
  const doSave = useCallback(async () => {
    setSaving(true);
    try {
      const allowedDomains = domainsDraft
        .split(/[\s,]+/)
        .map(d => d.trim())
        .filter(Boolean);

      // systemPrompt à transmettre :
      //   - si l'utilisateur a un prompt custom (hasCustomPrompt), on transmet le draft
      //   - sinon on transmet null pour assurer le repassage au prompt généré
      // Cas particulier : si l'admin a édité le draft alors que ça correspondait
      // au défaut, on considère ça comme un override (hasCustomPrompt devient true au save).
      const trimmedDraft = promptDraft.trim();
      const isStillDefault = !hasCustomPrompt && trimmedDraft === defaultPrompt.trim();
      const systemPromptToSave = isStillDefault ? null : (trimmedDraft.length >= 50 ? trimmedDraft : null);

      // Détecte si la perso IA a changé depuis le chargement. Si non, on
      // skip le PATCH /ai pour éviter un appel réseau ET une ligne audit log
      // inutile (le PATCH /ai aurait sinon créé un audit log "IA modifiée"
      // alors que rien n'a vraiment changé).
      const currentGlossary = (form.ai_glossary ?? []).filter(g => g.from.trim() && g.to.trim());
      const aiChanged =
        (form.industry ?? '').trim()  !== (initialAi.industry ?? '').trim() ||
        (form.ai_tone ?? null)         !== (initialAi.ai_tone ?? null) ||
        (form.ai_address_form ?? null) !== (initialAi.ai_address_form ?? null) ||
        JSON.stringify(currentGlossary) !== JSON.stringify(initialAi.ai_glossary);

      const calls: Promise<unknown>[] = [
        apiClient.patch('/settings/org/chat', {
          enabled:           form.chat_enabled,
          welcomeMessage:    (form.chat_welcome_message  ?? '').trim() || null,
          fallbackMessage:   (form.chat_fallback_message ?? '').trim() || null,
          primaryColor:      (form.chat_primary_color    ?? '').trim() || null,
          logoUrl:           (form.chat_logo_url         ?? '').trim() || null,
          allowedDomains,
          handoffMode:       form.chat_handoff_mode,
          handoffWebhookUrl: (form.chat_handoff_webhook_url ?? '').trim() || null,
          handoffEmail:      (form.chat_handoff_email ?? '').trim() || null,
          systemPrompt:      systemPromptToSave,
          privacyNotice:     (form.chat_privacy_notice ?? '').trim() || null,
          privacyPolicyUrl:  (form.chat_privacy_policy_url ?? '').trim() || null,
          retentionDays:     form.chat_retention_days ?? 90,
        }),
      ];
      if (aiChanged) {
        calls.push(apiClient.patch('/settings/org/ai', {
          industry:    (form.industry ?? '').trim() || null,
          tone:        form.ai_tone ?? null,
          addressForm: form.ai_address_form ?? null,
          glossary:    currentGlossary,
        }));
      }
      await Promise.all(calls);

      // Recharge le prompt par défaut (les champs perso ont peut-être changé)
      const refreshed = await apiClient.get<ChatOrgSettings>('/settings/org');
      setDefaultPrompt(refreshed.chat_system_prompt_default ?? '');
      const refreshedHasCustom = Boolean(refreshed.chat_system_prompt && refreshed.chat_system_prompt.trim().length > 0);
      setHasCustomPrompt(refreshedHasCustom);
      // Si l'admin n'a pas de custom, on synchronise le textarea avec le nouveau défaut
      if (!refreshedHasCustom) {
        setPromptDraft(refreshed.chat_system_prompt_default ?? '');
      }

      setForm(f => ({
        ...f,
        chat_allowed_domains: allowedDomains,
        chat_system_prompt:   systemPromptToSave,
      }));
      // Mémorise la nouvelle rétention comme baseline — un save ultérieur
      // qui la rebaisse re-déclenchera la confirmation, sinon non.
      setInitialRetention((form.chat_retention_days ?? 90) as ChatRetentionDays);
      // Met à jour la baseline IA pour que le prochain save ne re-PATCH /ai
      // que si l'admin re-modifie effectivement la perso.
      setInitialAi({
        industry:        (form.industry ?? '').trim(),
        ai_tone:         form.ai_tone ?? null,
        ai_address_form: form.ai_address_form ?? null,
        ai_glossary:     currentGlossary,
      });
      // Re-verrouille automatiquement le prompt après une sauvegarde
      // réussie : l'admin doit cliquer "Modifier" à nouveau pour repasser
      // en édition (cohérent avec le défaut "lecture seule").
      setEditPrompt(false);
      toast.success('Paramètres enregistrés');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Sauvegarde impossible.');
    } finally {
      setSaving(false);
    }
  }, [form, domainsDraft, promptDraft, hasCustomPrompt, defaultPrompt, toast]);

  // Submit handler du formulaire — détecte la baisse de rétention et
  // déclenche la confirmation avant l'appel save réel.
  const handleSave = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const newRetention = (form.chat_retention_days ?? 90) as ChatRetentionDays;
    if (newRetention < initialRetention) {
      try {
        const preview = await apiClient.get<{ days: number; count: number; cutoff: string }>(
          `/settings/org/chat/retention-preview?days=${newRetention}`,
        );
        // 0 conv concernée → on saute la confirmation, c'est juste un changement de réglage
        if (preview.count === 0) {
          await doSave();
          return;
        }
        setRetentionConfirm({ days: newRetention, count: preview.count, loading: false });
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : 'Impossible d\'estimer le nombre de conversations à supprimer.');
      }
      return;
    }
    await doSave();
  }, [form.chat_retention_days, initialRetention, doSave, toast]);

  const confirmRetentionChange = useCallback(async () => {
    if (!retentionConfirm) return;
    setRetentionConfirm(c => c ? { ...c, loading: true } : c);
    try {
      await doSave();
      setRetentionConfirm(null);
    } catch {
      setRetentionConfirm(c => c ? { ...c, loading: false } : c);
    }
  }, [retentionConfirm, doSave]);

  const restorePromptDefault = useCallback(() => {
    setPromptDraft(defaultPrompt);
    setHasCustomPrompt(false);
  }, [defaultPrompt]);

  const addGlossaryRow = useCallback(() => {
    setForm(f => (f.ai_glossary?.length ?? 0) >= MAX_GLOSSARY
      ? f
      : { ...f, ai_glossary: [...(f.ai_glossary ?? []), { from: '', to: '' }] });
  }, []);
  const updateGlossaryRow = useCallback((index: number, field: 'from' | 'to', value: string) => {
    setForm(f => ({
      ...f,
      ai_glossary: (f.ai_glossary ?? []).map((row, i) => i === index ? { ...row, [field]: value } : row),
    }));
  }, []);
  const removeGlossaryRow = useCallback((index: number) => {
    setForm(f => ({ ...f, ai_glossary: (f.ai_glossary ?? []).filter((_, i) => i !== index) }));
  }, []);

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
          className="chatbot-settings__fieldset-reset"
          style={{ opacity: form.chat_enabled ? 1 : 0.5 }}
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
            <div className="chatbot-settings__color-row">
              <input
                id="chat-color"
                type="color"
                value={form.chat_primary_color || '#5B6CFF'}
                onChange={e => setForm(f => ({ ...f, chat_primary_color: e.target.value }))}
                className="chatbot-settings__color-preview"
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

          {/* ─── Personnalisation IA (partagée avec Réponse IA) ─── */}
          <div className="settings-section__header chatbot-settings__subsection">
            <div>
              <h3 className="settings-section__title chatbot-settings__subsection-title">Personnalisation</h3>
              <p className="settings-section__desc">
                Réglages utilisés par le prompt généré du chatbot. <strong>Ces valeurs sont partagées
                avec la section ✨ IA recherche</strong> — les modifier ici les met aussi à jour pour
                la Réponse IA conseiller.
              </p>
            </div>
          </div>

          <Input
            id="chat-industry"
            label="Secteur d'activité"
            value={form.industry ?? ''}
            maxLength={80}
            placeholder="ex. Telecom, Banque, Retail, Santé…"
            onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
            helperText="Personnalise l'identité de l'assistant. Vide → formulation générique."
          />

          <div className="field">
            <label htmlFor="chat-tone" className="field-label">Tonalité</label>
            <select
              id="chat-tone"
              className="field-input"
              value={form.ai_tone ?? ''}
              onChange={e => setForm(f => ({
                ...f,
                ai_tone: (e.target.value || null) as AiTone | null,
              }))}
            >
              <option value="">— Aucune préférence —</option>
              {TONE_OPTIONS.map(t => (
                <option key={t.value} value={t.value}>{t.label} — {t.hint}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="field-label">Forme d'adresse</label>
            <div className="ai-radio-group">
              {([
                { value: null,   label: 'Aucune préférence' },
                { value: 'vous', label: 'Vouvoiement' },
                { value: 'tu',   label: 'Tutoiement' },
              ] as Array<{ value: AiAddressForm | null; label: string }>).map(opt => (
                <label key={String(opt.value)} className="ai-radio">
                  <input
                    type="radio"
                    name="chat-address-form"
                    checked={form.ai_address_form === opt.value}
                    onChange={() => setForm(f => ({ ...f, ai_address_form: opt.value }))}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="field">
            <label className="field-label">Glossaire</label>
            <p className="field-helper chatbot-settings__field-helper-tight">
              Liste de termes que l'IA doit utiliser à la place du vocabulaire générique.
              Ex. « abonné » à la place de « client ».
            </p>
            <div className="ai-glossary">
              {(form.ai_glossary?.length ?? 0) === 0 && (
                <p className="ai-glossary__empty">
                  Aucune correspondance pour l'instant.
                </p>
              )}
              {(form.ai_glossary ?? []).map((row: AiGlossaryEntry, i: number) => (
                <div key={i} className="ai-glossary__row">
                  <input
                    type="text"
                    className="field-input ai-glossary__input"
                    value={row.from}
                    placeholder="Terme générique (ex. client)"
                    maxLength={50}
                    onChange={e => updateGlossaryRow(i, 'from', e.target.value)}
                  />
                  <span className="ai-glossary__arrow" aria-hidden="true">→</span>
                  <input
                    type="text"
                    className="field-input ai-glossary__input"
                    value={row.to}
                    placeholder="Terme préféré (ex. abonné)"
                    maxLength={50}
                    onChange={e => updateGlossaryRow(i, 'to', e.target.value)}
                  />
                  <button
                    type="button"
                    className="ai-glossary__remove"
                    onClick={() => removeGlossaryRow(i)}
                    aria-label="Supprimer"
                    title="Supprimer"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {(form.ai_glossary?.length ?? 0) < MAX_GLOSSARY && (
                <Button type="button" variant="ghost" size="sm" onClick={addGlossaryRow}>
                  + Ajouter un terme
                </Button>
              )}
            </div>
          </div>

          {/* ─── Prompt système ─── */}
          <div className="settings-section__header chatbot-settings__subsection">
            <div>
              <h3 className="settings-section__title chatbot-settings__subsection-title">Prompt système</h3>
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
            </div>
          </div>

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

          {/* Handoff humain — Sprint 5 */}
          <div className="settings-section__header chatbot-settings__subsection">
            <div>
              <h3 className="settings-section__title chatbot-settings__subsection-title">Passage à un humain (handoff)</h3>
              <p className="settings-section__desc">
                Quand un visiteur clique « Parler à un humain » ou indique que le bot ne l'a pas aidé,
                KnowDesk peut transmettre le transcript de la conversation à votre équipe.
              </p>
            </div>
          </div>

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

          {/* ─── Confidentialité (RGPD) ─── */}
          <div className="settings-section__header chatbot-settings__subsection">
            <div>
              <h3 className="settings-section__title chatbot-settings__subsection-title">Confidentialité (RGPD)</h3>
              <p className="settings-section__desc">
                Au tout premier ouverture du widget chez un visiteur, KnowDesk affiche un écran d'information
                rappelant que la conversation est enregistrée. Le visiteur clique « J'ai compris » avant
                que le chat démarre. <strong>Cet écran est toujours actif</strong> — c'est une obligation
                de transparence RGPD que tu ne peux pas désactiver.
              </p>
            </div>
          </div>

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

          <div className="field">
            <label htmlFor="chat-retention-days" className="field-label">
              Durée de conservation des conversations
            </label>
            <select
              id="chat-retention-days"
              className="field-input"
              value={form.chat_retention_days ?? 90}
              onChange={e => setForm(f => ({
                ...f,
                chat_retention_days: Number(e.target.value) as ChatRetentionDays,
              }))}
            >
              <option value={30}>30 jours</option>
              <option value={60}>60 jours</option>
              <option value={90}>90 jours (par défaut)</option>
              <option value={180}>180 jours</option>
            </select>
            <p className="field-helper">
              Au-delà de cette durée, les conversations sont définitivement supprimées
              de notre base (purge quotidienne RGPD).
            </p>
          </div>
        </fieldset>

        <div className="settings-form__actions">
          <Button type="submit" variant="primary" size="md" loading={saving}>
            Enregistrer
          </Button>
        </div>

        {/* Test live sur cette page */}
        <div className="settings-section__header chatbot-settings__subsection chatbot-settings__subsection--first">
          <div>
            <h3 className="settings-section__title chatbot-settings__subsection-title">Tester le chatbot sur cette page</h3>
            <p className="settings-section__desc">
              Charge le widget directement dans cette page d'administration pour valider l'apparence et
              les réponses, sans avoir à intégrer le snippet sur ton site web.
            </p>
          </div>
        </div>
        <div className="chatbot-settings__test-prerequisite">
          <strong>⚠ Pré-requis :</strong> ajoute le domaine <code>{typeof window !== 'undefined' ? window.location.host : 'know-desk-frontend.vercel.app'}</code> dans la liste des domaines autorisés ci-dessus, sinon le widget ne s'affichera pas (CORS bloqué côté serveur).
        </div>
        <div className="chatbot-settings__test-actions">
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
        <div className="settings-section__header chatbot-settings__subsection">
          <div>
            <h3 className="settings-section__title chatbot-settings__subsection-title">Intégrer le widget sur votre site</h3>
            <p className="settings-section__desc">
              Copiez le snippet ci-dessous et collez-le juste avant la fermeture de la balise <code>&lt;/body&gt;</code>
              de votre site. Le widget se charge automatiquement et tient compte de tous les paramètres définis ici.
            </p>
          </div>
        </div>
        <pre className="chatbot-settings__embed-snippet">
          <code>{embedSnippet}</code>
        </pre>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="chatbot-settings__embed-copy"
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

      {retentionConfirm && (
        <ConfirmDialog
          title="Réduire la durée de conservation"
          description={
            `${retentionConfirm.count} conversation${retentionConfirm.count > 1 ? 's' : ''} `
          + `de plus de ${retentionConfirm.days} jours `
          + `${retentionConfirm.count > 1 ? 'seront supprimées' : 'sera supprimée'} définitivement `
          + `lors de la prochaine purge quotidienne. Cette action est irréversible.`
          }
          confirmLabel="Confirmer"
          variant="danger"
          loading={retentionConfirm.loading}
          onConfirm={confirmRetentionChange}
          onCancel={() => {
            // Restaure la valeur initiale dans le form
            setForm(f => ({ ...f, chat_retention_days: initialRetention }));
            setRetentionConfirm(null);
          }}
        />
      )}
    </section>
  );
}
