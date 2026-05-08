import React, { useState, useCallback, useEffect, useId } from 'react';
import { apiClient, ApiError } from '../../../shared/lib/apiClient';
import '../settings.css';
import { useToast }     from '../../../shared/lib/useToast';
import { Button }       from '../../../shared/components/ui/Button';
import { Input }        from '../../../shared/components/ui/Input';
import { Switch }       from '../../../shared/components/ui/Switch';
import { MOCK_BILLING, mockDeleteOrg } from '../api/settings.mock';
import { useAuthStore }    from '../../../store/authStore';
import { ApiKeysSection } from './ApiKeysSection';
import { SearchSettingsSection } from './SearchSettingsSection';
import { TagsSettingsSection }   from './TagsSettingsSection';
import { AiSettingsSection }     from './AiSettingsSection';
import { ChatbotSettingsSection } from './ChatbotSettingsSection';
import { ImportsSettingsSection } from './ImportsSettingsSection';
import { AiModelsSection }        from './AiModelsSection';
import type { SettingsSection, NotifPreferences } from '../types';

interface SettingsPageProps {
  initialSection?: SettingsSection;
}

export function SettingsPage({ initialSection = 'general' }: SettingsPageProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection);
  const role = useAuthStore(s => s.session?.user.role ?? null);
  const visibleSections = SECTIONS.filter(s => !s.adminOnly || role === 'admin');

  return (
    <div className="settings-page">
      <div className="settings-page__sidebar">
        <h1 className="settings-page__title">Paramètres</h1>
        <nav aria-label="Sections des paramètres">
          <ul className="settings-nav" role="list">
            {visibleSections.map(s => (
              <li key={s.id}>
                <button
                  type="button"
                  className={`settings-nav__item ${activeSection === s.id ? 'settings-nav__item--active' : ''}`}
                  onClick={() => setActiveSection(s.id as SettingsSection)}
                  aria-current={activeSection === s.id ? 'page' : undefined}
                >
                  {s.label}
                  {s.id === 'danger' && <span className="settings-nav__danger-dot" aria-hidden="true" />}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="settings-page__body">
        {activeSection === 'general'       && <SectionGeneral />}
        {activeSection === 'ai'            && <AiSettingsSection />}
        {activeSection === 'chatbot'       && <ChatbotSettingsSection />}
        {activeSection === 'ai-models'     && <AiModelsSection />}
        {activeSection === 'notifications' && <SectionNotifications />}
        {activeSection === 'api' && <ApiKeysSection />}
        {activeSection === 'search'        && <SearchSettingsSection />}
        {activeSection === 'tags'          && <TagsSettingsSection />}
        {activeSection === 'imports'       && <ImportsSettingsSection />}
        {activeSection === 'billing'       && <SectionBilling />}
        {activeSection === 'danger'        && <SectionDanger />}
      </div>
    </div>
  );
}

const SECTIONS: { id: SettingsSection; label: string; adminOnly?: boolean }[] = [
  { id: 'general',       label: 'Général'             },
  { id: 'ai',            label: '✨ IA recherche',    adminOnly: true },
  { id: 'chatbot',       label: '✨ IA chatbot',      adminOnly: true },
  { id: 'ai-models',     label: '🧠 Modèles IA',     adminOnly: true },
  { id: 'notifications', label: 'Notifications'       },
  { id: 'api',           label: 'API'                 },
  { id: 'search',        label: 'Recherche', adminOnly: true },
  { id: 'tags',          label: 'Tags',      adminOnly: true },
  { id: 'imports',       label: '📥 Imports', adminOnly: true },
  { id: 'billing',       label: 'Facturation'         },
  { id: 'danger',        label: 'Zone de danger'      },
];

/* ── Section: Général ────────────────────────────────────────── */

function SectionGeneral() {
  const session = useAuthStore(s => s.session);
  const toast   = useToast();
  const [form,   setForm]   = useState({ name: '', timezone: 'Europe/Paris' });
  const [saving, setSaving] = useState(false);

  // Charger le vrai nom depuis l'API au montage
  useEffect(() => {
    apiClient.get<{ name: string; slug: string; plan: string }>('/settings/org')
      .then(org => setForm(f => ({ ...f, name: org.name })))
      .catch(err => {
        // Fallback sur le store si l'API échoue + signaler à l'utilisateur
        setForm(f => ({ ...f, name: session?.organization.name ?? '' }));
        toast.error(err instanceof ApiError ? err.message : 'Impossible de charger les paramètres.');
      });
  }, [session, toast]);

  const handleSave = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.put('/settings/org', { name: form.name });
      toast.success('Paramètres enregistrés');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Sauvegarde impossible.');
    } finally {
      setSaving(false);
    }
  }, [form, toast]);

  return (
    <section className="settings-section" aria-labelledby="general-title">
      <div className="settings-section__header">
        <h2 id="general-title" className="settings-section__title">Général</h2>
        <p className="settings-section__desc">Informations de base de votre organisation.</p>
      </div>
      <form className="settings-form" onSubmit={handleSave} noValidate>
        <Input
          id="org-name"
          label="Nom de l'organisation"
          value={form.name}
          required
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          helperText="Affiché dans le header et les emails envoyés à votre équipe."
        />
        <div className="field">
          <label htmlFor="timezone" className="field-label">Fuseau horaire</label>
          <select
            id="timezone"
            className="field-input"
            value={form.timezone}
            onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}
          >
            <option value="Europe/Paris">Europe/Paris (UTC+1 / UTC+2)</option>
            <option value="Europe/London">Europe/London (UTC+0 / UTC+1)</option>
            <option value="America/New_York">America/New_York (UTC-5 / UTC-4)</option>
            <option value="America/Los_Angeles">America/Los_Angeles (UTC-8 / UTC-7)</option>
          </select>
        </div>
        <div className="settings-form__actions">
          <Button type="submit" variant="primary" size="md" loading={saving}>
            Enregistrer
          </Button>
        </div>
      </form>
    </section>
  );
}

/* ── Section: Notifications ──────────────────────────────────── */

// Defaults neutres alignés sur le backend (tous activés sauf weeklyDigest).
// Pas un mock — c'est l'état affiché en attendant le fetch initial.
const DEFAULT_NOTIF_PREFS: NotifPreferences = {
  articleUpdated: true,
  memberJoined:   true,
  weeklyDigest:   false,
  channel:        'email',
};

function SectionNotifications() {
  const [prefs,  setPrefs]  = useState<NotifPreferences>(DEFAULT_NOTIF_PREFS);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  // Charger les préférences réelles
  useEffect(() => {
    apiClient.get<NotifPreferences>('/notifications/preferences')
      .then(setPrefs)
      .catch(() => {/* on conserve les defaults — pas critique */});
  }, []);

  const handleSave = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.put('/notifications/preferences', prefs);
      toast.success('Paramètres enregistrés');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Sauvegarde des préférences impossible.');
    } finally {
      setSaving(false);
    }
  }, [prefs, toast]);

  return (
    <section className="settings-section" aria-labelledby="notif-title">
      <div className="settings-section__header">
        <h2 id="notif-title" className="settings-section__title">Notifications</h2>
        <p className="settings-section__desc">Choisissez quand et comment être notifié.</p>
      </div>
      <form className="settings-form" onSubmit={handleSave}>
        <div className="settings-toggles">
          <Switch
            id="notif-article"
            label="Article mis à jour"
            description="Recevez une notification quand un article de votre base est modifié."
            checked={prefs.articleUpdated}
            onChange={v => setPrefs(p => ({ ...p, articleUpdated: v }))}
          />
          <Switch
            id="notif-member"
            label="Nouveau membre"
            description="Soyez averti quand un collaborateur rejoint votre espace."
            checked={prefs.memberJoined}
            onChange={v => setPrefs(p => ({ ...p, memberJoined: v }))}
          />
          <Switch
            id="notif-digest"
            label="Résumé hebdomadaire"
            description="Un email récapitulatif chaque lundi matin."
            checked={prefs.weeklyDigest}
            onChange={v => setPrefs(p => ({ ...p, weeklyDigest: v }))}
          />
        </div>
        <div className="field field--narrow">
          <label htmlFor="notif-channel" className="field-label">Canal préféré</label>
          <select
            id="notif-channel"
            className="field-input"
            value={prefs.channel}
            onChange={e => setPrefs(p => ({ ...p, channel: e.target.value as NotifPreferences['channel'] }))}
          >
            <option value="email">Email uniquement</option>
            <option value="in_app">Dans l'app uniquement</option>
            <option value="both">Email et dans l'app</option>
          </select>
        </div>
        <div className="settings-form__actions">
          <Button type="submit" variant="primary" size="md" loading={saving}>
            Enregistrer
          </Button>
        </div>
      </form>
    </section>
  );
}

/* ── Section: Billing ────────────────────────────────────────── */

function SectionBilling() {
  const billing = MOCK_BILLING;
  const isPro   = billing.plan === 'pro';

  return (
    <section className="settings-section" aria-labelledby="billing-title">
      <div className="settings-section__header">
        <h2 id="billing-title" className="settings-section__title">Facturation</h2>
        <p className="settings-section__desc">Votre plan et vos factures.</p>
      </div>
      <div className="billing-plan-card">
        <div className="billing-plan-card__header">
          <div>
            <span className="billing-plan-card__plan">
              Plan {billing.plan === 'free' ? 'Gratuit' : billing.plan === 'pro' ? 'Pro' : 'Enterprise'}
            </span>
          </div>
          {!isPro && (
            <a href="#upgrade" className="billing-upgrade-btn">
              Passer au plan Pro — 49 €/mois
            </a>
          )}
        </div>
        <div className="billing-limits">
          <div className="billing-limit-row">
            <span>Membres actifs</span>
            <span className="billing-limit-row__val">{billing.seatsUsed} / {billing.seats}</span>
          </div>
          <div className="billing-limit-row">
            <span>Articles</span>
            <span className="billing-limit-row__val">50 max</span>
          </div>
        </div>
      </div>
      {!isPro && (
        <div className="billing-upgrade-card">
          <h3 className="billing-upgrade-card__title">Plan Pro — 49 € / mois</h3>
          <ul className="billing-upgrade-card__features">
            <li>Membres illimités</li>
            <li>Articles illimités</li>
            <li>Notifications email avancées</li>
            <li>Support prioritaire</li>
          </ul>
          <Button variant="primary" size="md">Passer au plan Pro</Button>
        </div>
      )}
    </section>
  );
}

/* ── Section: Danger ─────────────────────────────────────────── */

function SectionDanger() {
  const orgName      = useAuthStore(s => s.session?.organization.name ?? '');
  const clearSession = useAuthStore(s => s.clearSession);
  const [confirm,    setConfirm]    = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const inputId = useId();

  const canDelete = confirm === orgName;

  const handleDelete = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canDelete) return;
    setIsDeleting(true);
    await mockDeleteOrg(orgName);
    clearSession();
  }, [canDelete, orgName, clearSession]);

  return (
    <section className="settings-section settings-section--danger" aria-labelledby="danger-title">
      <div className="settings-section__header">
        <h2 id="danger-title" className="settings-section__title settings-section__title--danger">
          Zone de danger
        </h2>
        <p className="settings-section__desc">Ces actions sont irréversibles.</p>
      </div>
      <div className="danger-card">
        <div className="danger-card__header">
          <div>
            <h3 className="danger-card__title">Supprimer l'organisation</h3>
            <p className="danger-card__desc">
              Supprime définitivement tous les articles, FAQ et données de l'équipe.
            </p>
          </div>
        </div>
        <form className="danger-card__form" onSubmit={handleDelete} noValidate>
          <Input
            id={inputId}
            type="text"
            label={`Tapez « ${orgName} » pour confirmer`}
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder={orgName}
            autoComplete="off"
            error={confirm && !canDelete ? 'Le nom ne correspond pas.' : undefined}
          />
          <Button type="submit" variant="danger" size="md" disabled={!canDelete} loading={isDeleting}>
            Supprimer définitivement l'organisation
          </Button>
        </form>
      </div>
    </section>
  );
}

