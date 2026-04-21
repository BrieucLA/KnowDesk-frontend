import React from 'react';
import { useAcceptInvitation } from '../hooks/useAcceptInvitation';
import { Button }  from '../../../shared/components/ui/Button';
import { Input }   from '../../../shared/components/ui/Input';

interface AcceptInvitationPageProps {
  token:     string;
  onSuccess: () => void;  // redirige vers le login après acceptation
}

export function AcceptInvitationPage({ token, onSuccess }: AcceptInvitationPageProps) {
  const {
    form, errors, isLoading, isSuccess, showPassword,
    handleChange, handleSubmit, togglePassword,
  } = useAcceptInvitation(token);

  // ── Succès ────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="login-page">
        <aside className="login-page__brand" aria-hidden="true">
          <div className="login-page__brand-inner">
            <div className="login-page__logo">
              <span className="login-page__logo-mark">K</span>
            </div>
            <blockquote className="login-page__quote">
              <p>Bienvenue dans votre base de connaissance.</p>
            </blockquote>
          </div>
        </aside>
        <main className="login-page__form-panel">
          <div className="login-page__form-container">
            <div className="invitation-success">
              <div className="invitation-success__icon" aria-hidden="true">✓</div>
              <h1 className="invitation-success__title">Compte créé !</h1>
              <p className="invitation-success__desc">
                Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter.
              </p>
              <Button variant="primary" size="lg" fullWidth onClick={onSuccess}>
                Se connecter
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Formulaire ────────────────────────────────────────────────
  return (
    <div className="login-page">
      <aside className="login-page__brand" aria-hidden="true">
        <div className="login-page__brand-inner">
          <div className="login-page__logo">
            <span className="login-page__logo-mark">K</span>
          </div>
          <blockquote className="login-page__quote">
            <p>Rejoignez votre équipe sur KnowDesk.</p>
          </blockquote>
          <div className="login-page__brand-dots">
            <span /><span /><span />
          </div>
        </div>
      </aside>

      <main className="login-page__form-panel">
        <div className="login-page__form-container">
          <div className="login-page__header">
            <h1 className="login-page__title">Créer votre mot de passe</h1>
            <p className="login-page__subtitle">
              Choisissez un mot de passe sécurisé pour accéder à votre espace.
            </p>
          </div>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            {errors.general && (
              <div className="login-form__error" role="alert">
                <span className="login-form__error-icon" aria-hidden="true">!</span>
                {errors.general}
              </div>
            )}

            <div className="login-form__password-wrap">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                label="Mot de passe"
                placeholder="Au moins 8 caractères"
                autoFocus
                required
                value={form.password}
                error={errors.password}
                onChange={e => handleChange('password', e.target.value)}
              />
              <button
                type="button"
                className="login-form__toggle-password"
                onClick={togglePassword}
                aria-label={showPassword ? 'Masquer' : 'Afficher'}
              >
                {showPassword ? 'Masquer' : 'Afficher'}
              </button>
            </div>

            <Input
              id="password-confirm"
              type={showPassword ? 'text' : 'password'}
              label="Confirmer le mot de passe"
              placeholder="Répétez votre mot de passe"
              required
              value={form.passwordConfirm}
              error={errors.passwordConfirm}
              onChange={e => handleChange('passwordConfirm', e.target.value)}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isLoading}
            >
              {isLoading ? 'Création du compte…' : 'Créer mon compte'}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
