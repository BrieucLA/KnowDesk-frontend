import React, { useState, useCallback, useEffect, useId } from 'react';
import { apiClient }    from '../../../shared/lib/apiClient';
import { Button }       from '../../../shared/components/ui/Button';
import { Input }        from '../../../shared/components/ui/Input';
import {
  MOCK_NOTIF_PREFS, MOCK_BILLING,
  mockSaveNotifPrefs, mockDeleteOrg,
} from '../api/settings.mock';
import { useAuthStore } from '../../../store/authStore';
import type { SettingsSection, NotifPreferences } from '../types';

interface SettingsPageProps {
  initialSection?: SettingsSection;
}

export function SettingsPage({ initialSection = 'general' }: SettingsPageProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection);

  return (
    <div className="settings-page">
      <div className="settings-page__sidebar">
        <h1 className="settings-page__title">Paramètres</h1>
        <nav aria-label="Sections des paramètres">
          <ul className="settings-nav" role="list">
            {SECTIONS.map(s => (
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
        {activeSection === 'notifications' && <SectionNotifications />}
        {activeSection === 'billing'       && <SectionBilling />}
        {activeSection === 'danger'        && <SectionDanger />}
      </div>
    </div>
  );
}

const SECTIONS = [
  { id: 'general',       label: 'Général'        },
  { id: 'notifications', label: 'Notifications'  },
  { id: 'billing',       label: 'Facturation'    },
  { id: 'danger',        label: 'Zone de danger' },
];

/* ── Section: Général ────────────────────────────────────────── */

function SectionGeneral() {
  const session = useAuthStore(s => s.session);
  const [form,   setForm]   = useState({ name: '', timezone: 'Europe/Paris' });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState('');

  // Charger le vrai nom depuis l'API au montage
  useEffect(() => {
    apiClient.get<{ name: string; slug: string; plan: string }>('/settings/org')
      .then(org => setForm(f => ({ ...f, name: org.name })))
      .catch(() => {
        // Fallback sur le store si l'API échoue
        setForm(f => ({ ...f, name: session?.organization.name ?? '' }));
      });
  }, [session]);

  const handleSave = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await apiClient.put('/settings/org', { name: form.name });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  }, [form]);

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
        {error && <p className="field-error" role="alert">{error}</p>}
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
      </form>
    </section>
  );
}

/* ── Section: Notifications ──────────────────────────────────── */

function SectionNotifications() {
  const [prefs,  setPrefs]  = useState<NotifPreferences>(MOCK_NOTIF_PREFS);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  // Charger les préférences réelles
  useEffect(() => {
    apiClient.get<NotifPreferences>('/notifications/preferences')
      .then(setPrefs)
      .catch(() => {/* utilise les defaults */});
  }, []);

  const toggle = useCallback((key: keyof NotifPreferences) => {
    setPrefs(p => ({ ...p, [key]: !p[key] }));
  }, []);

  const handleSave = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.put('/notifications/preferences', prefs);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Notif prefs error:', err);
    } finally {
      setSaving(false);
    }
  }, [prefs]);

  return (
    <section className="settings-section" aria-labelledby="notif-title">
      <div className="settings-section__header">
        <h2 id="notif-title" className="settings-section__title">Notifications</h2>
        <p className="settings-section__desc">Choisissez quand et comment être notifié.</p>
      </div>
      <form className="settings-form" onSubmit={handleSave}>
        <div className="settings-toggles">
          <ToggleRow
            id="notif-article"
            label="Article mis à jour"
            description="Recevez une notification quand un article de votre base est modifié."
            checked={prefs.articleUpdated}
            onChange={() => toggle('articleUpdated')}
          />
          <ToggleRow
            id="notif-member"
            label="Nouveau membre"
            description="Soyez averti quand un collaborateur rejoint votre espace."
            checked={prefs.memberJoined}
            onChange={() => toggle('memberJoined')}
          />
          <ToggleRow
            id="notif-digest"
            label="Résumé hebdomadaire"
            description="Un email récapitulatif chaque lundi matin."
            checked={prefs.weeklyDigest}
            onChange={() => toggle('weeklyDigest')}
          />
        </div>
        <div className="field" style={{ maxWidth: '280px' }}>
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
            Enregistrer les préférences
          </Button>
          {saved && (
            <span className="settings-form__saved" role="status" aria-live="polite">
              ✓ Préférences enregistrées
            </span>
          )}
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
          <div className="field">
            <label htmlFor={inputId} className="field-label">
              Tapez <strong>{orgName}</strong> pour confirmer
            </label>
            <input
              id={inputId}
              type="text"
              className={`field-input ${confirm && !canDelete ? 'field-input--error' : ''}`}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder={orgName}
              autoComplete="off"
            />
          </div>
          <Button type="submit" variant="danger" size="md" disabled={!canDelete} loading={isDeleting}>
            Supprimer définitivement l'organisation
          </Button>
        </form>
      </div>
    </section>
  );
}

/* ── ToggleRow ───────────────────────────────────────────────── */

function ToggleRow({
  id, label, description, checked, onChange,
}: {
  id: string; label: string; description: string;
  checked: boolean; onChange: () => void;
}) {
  return (
    <div className="toggle-row">
      <div className="toggle-row__text">
        <label htmlFor={id} className="toggle-row__label">{label}</label>
        <p className="toggle-row__desc">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={checked}
        className={`toggle ${checked ? 'toggle--on' : ''}`}
        onClick={onChange}
        aria-label={label}
      >
        <span className="toggle__thumb" />
      </button>
    </div>
  );
}
