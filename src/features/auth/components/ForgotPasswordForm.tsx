import React from 'react';
import { useForgotPassword } from '../hooks/useForgotPassword';
import { Button }            from '../../../shared/components/ui/Button';
import { Input }             from '../../../shared/components/ui/Input';

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const { email, setEmail, loading, sent, error, submit } = useForgotPassword();

  if (sent) {
    return (
      <div className="forgot-success">
        <div className="forgot-success__icon">✉️</div>
        <h2 className="forgot-success__title">Email envoyé</h2>
        <p className="forgot-success__desc">
          Si un compte existe pour <strong>{email}</strong>, tu recevras un lien de réinitialisation dans quelques minutes.
        </p>
        <p className="forgot-success__desc">Vérifie aussi ton dossier spam.</p>
        <Button variant="ghost" size="md" onClick={onBack}>← Retour à la connexion</Button>
      </div>
    );
  }

  return (
    <form className="login-form" onSubmit={submit} noValidate>
      {error && <div className="login-form__error" role="alert">{error}</div>}
      <Input
        id="forgot-email"
        type="email"
        label="Adresse email"
        placeholder="vous@exemple.fr"
        value={email}
        onChange={e => setEmail(e.target.value)}
        autoComplete="email"
        autoFocus
      />
      <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
        {loading ? 'Envoi…' : 'Envoyer le lien'}
      </Button>
      <p className="login-form__signup">
        <button type="button" className="login-form__link" onClick={onBack}>
          ← Retour à la connexion
        </button>
      </p>
    </form>
  );
}
