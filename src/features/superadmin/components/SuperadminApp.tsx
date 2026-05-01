import React, { useState } from 'react';
import { useSuperadmin }   from '../hooks/useSuperadmin';
import { Button }          from '../../../shared/components/ui/Button';
import { ConfirmDialog }   from '../../../shared/components/ui/ConfirmDialog';
import { formatRelative }  from '../../../shared/lib/formatDate';

export function SuperadminApp() {
  const {
    session, orgs, loading, error, loginErr,
    login, logout, disableOrg, enableOrg, impersonate,
  } = useSuperadmin();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState<{ orgId: string; action: 'disable' | 'enable' } | null>(null);

  // ── Login ─────────────────────────────────────────────────

  if (!session) {
    return (
      <div className="sa-login">
        <div className="sa-login__box">
          <div className="sa-login__logo">
            <span className="login-page__logo-mark">K</span>
          </div>
          <h1 className="sa-login__title">Super Admin</h1>
          <p className="sa-login__subtitle">Accès réservé à l'équipe KnowDesk.</p>
          {loginErr && <div className="sa-login__error" role="alert">{loginErr}</div>}
          <form className="sa-login__form" onSubmit={e => { e.preventDefault(); login(email, password); }}>
            <div className="field">
              <label htmlFor="sa-email" className="field-label">Email</label>
              <input
                id="sa-email" type="email" className="field-input"
                value={email} onChange={e => setEmail(e.target.value)}
                autoComplete="email" autoFocus
              />
            </div>
            <div className="field">
              <label htmlFor="sa-password" className="field-label">Mot de passe</label>
              <input
                id="sa-password" type="password" className="field-input"
                value={password} onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
              Se connecter
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // ── Dashboard ─────────────────────────────────────────────

  const totalOrgs     = orgs.length;
  const activeOrgs    = orgs.filter(o => !o.disabled_at).length;
  const totalMembers  = orgs.reduce((sum, o) => sum + o.stats.membersActive, 0);
  const totalArticles = orgs.reduce((sum, o) => sum + o.stats.articlesCount, 0);

  return (
    <div className="sa-app">
      {/* Header */}
      <header className="sa-header">
        <div className="sa-header__brand">
          <span className="login-page__logo-mark sa-header__logo">K</span>
          <span className="sa-header__title">KnowDesk Admin</span>
        </div>
        <div className="sa-header__user">
          <span className="sa-header__email">{session.superadmin.email}</span>
          <Button variant="ghost" size="sm" onClick={logout}>Déconnexion</Button>
        </div>
      </header>

      <main className="sa-main">
        {/* Métriques globales */}
        <div className="sa-metrics">
          {[
            { label: 'Espaces actifs',   value: activeOrgs },
            { label: 'Espaces total',    value: totalOrgs },
            { label: 'Membres actifs',   value: totalMembers },
            { label: 'Articles publiés', value: totalArticles },
          ].map(m => (
            <div key={m.label} className="sa-metric">
              <span className="sa-metric__value">{m.value}</span>
              <span className="sa-metric__label">{m.label}</span>
            </div>
          ))}
        </div>

        {/* Table des organisations */}
        <div className="sa-section">
          <div className="sa-section__header">
            <h2 className="sa-section__title">Organisations</h2>
          </div>

          {error && <div className="sa-error" role="alert">{error}</div>}

          {loading ? (
            <p className="sa-loading">Chargement…</p>
          ) : (
            <div className="sa-table-wrap">
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>Organisation</th>
                    <th>Plan</th>
                    <th>Membres actifs</th>
                    <th>Membres désactivés</th>
                    <th>Articles</th>
                    <th>Créé</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orgs.map(org => (
                    <tr key={org.id} className={org.disabled_at ? 'sa-table__row--disabled' : ''}>
                      <td>
                        <div className="sa-org-name">{org.name}</div>
                        <div className="sa-org-slug">{org.slug}</div>
                      </td>
                      <td><span className={`sa-plan sa-plan--${org.plan}`}>{org.plan}</span></td>
                      <td>{org.stats.membersActive}</td>
                      <td>{org.stats.membersDisabled}</td>
                      <td>{org.stats.articlesCount}</td>
                      <td>{formatRelative(org.created_at)}</td>
                      <td>
                        {org.disabled_at
                          ? <span className="sa-status sa-status--disabled">Désactivé</span>
                          : <span className="sa-status sa-status--active">Actif</span>
                        }
                      </td>
                      <td>
  <div style={{ display: 'flex', gap: 4 }}>
    {org.disabled_at ? (
      <Button variant="ghost" size="sm"
        onClick={() => setConfirm({ orgId: org.id, action: 'enable' })}>
        Réactiver
      </Button>
    ) : (
      <>
        <Button variant="ghost" size="sm"
          onClick={() => setConfirm({ orgId: org.id, action: 'disable' })}>
          Désactiver
        </Button>
        <Button variant="primary" size="sm"
          onClick={() => impersonate(org.id, org.name)}>
          Accéder
        </Button>
      </>
    )}
  </div>
</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal de confirmation */}
      {confirm && (
        <ConfirmDialog
          title={confirm.action === 'disable' ? 'Désactiver l\'espace' : 'Réactiver l\'espace'}
          description={
            confirm.action === 'disable'
              ? 'Les utilisateurs de cet espace ne pourront plus se connecter.'
              : 'Les utilisateurs de cet espace pourront à nouveau se connecter.'
          }
          confirmLabel={confirm.action === 'disable' ? 'Désactiver' : 'Réactiver'}
          variant={confirm.action === 'disable' ? 'danger' : 'primary'}
          onConfirm={async () => {
            if (confirm.action === 'disable') await disableOrg(confirm.orgId);
            else await enableOrg(confirm.orgId);
            setConfirm(null);
          }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
