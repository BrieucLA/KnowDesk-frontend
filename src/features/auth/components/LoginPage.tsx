import React, { useCallback } from 'react';
import { LoginForm } from '../components/LoginForm';
import { useLogin  } from '../hooks/useLogin';
import type { AuthSession } from '../types';

interface LoginPageProps {
  /** Called after successful login — caller decides where to redirect */
  onLoginSuccess: (session: AuthSession) => void;
}

/**
 * LoginPage — composes the layout + hook + form.
 *
 * Responsibilities:
 *   - Provides page-level layout (two-column on desktop, single on mobile)
 *   - Wires the useLogin hook to the LoginForm
 *   - Handles post-login navigation via onLoginSuccess prop
 *
 * NOT responsible for:
 *   - Routing (handled by the Router)
 *   - Storing the session (handled by the auth store)
 */
export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const handleSuccess = useCallback((session: AuthSession) => {
    onLoginSuccess(session);
  }, [onLoginSuccess]);

  const {
    values, errors, isLoading, showPassword,
    handleChange, handleBlur, handleSubmit, togglePassword,
  } = useLogin(handleSuccess);

  return (
    <div className="login-page">

      {/* Left panel — branding */}
      <aside className="login-page__brand" aria-hidden="true">
        <div className="login-page__brand-inner">
          <div className="login-page__logo">
            <span className="login-page__logo-mark">K</span>
          </div>
          <blockquote className="login-page__quote">
            <p>"La bonne réponse, au bon moment, pour chaque client."</p>
          </blockquote>
          <div className="login-page__brand-dots">
            <span /><span /><span />
          </div>
        </div>
      </aside>

      {/* Right panel — form */}
      <main className="login-page__form-panel">
        <div className="login-page__form-container">

          {/* Mobile logo — visible only on small screens */}
          <div className="login-page__mobile-logo" aria-label="KnowDesk">
            <span className="login-page__logo-mark login-page__logo-mark--sm">K</span>
            <span className="login-page__app-name">KnowDesk</span>
          </div>

          <div className="login-page__header">
            <h1 className="login-page__title">Connexion</h1>
            <p className="login-page__subtitle">
              Accédez à la base de connaissance de votre équipe.
            </p>
          </div>

          <LoginForm
            values={values}
            errors={errors}
            isLoading={isLoading}
            showPassword={showPassword}
            onChange={handleChange}
            onBlur={handleBlur}
            onSubmit={handleSubmit}
            onTogglePassword={togglePassword}
          />

        </div>

        <footer className="login-page__footer">
          <a href="/terms"   className="login-page__footer-link">CGU</a>
          <a href="/privacy" className="login-page__footer-link">Confidentialité</a>
          <span className="login-page__footer-copy">© 2025 KnowDesk</span>
        </footer>
      </main>

    </div>
  );
}
