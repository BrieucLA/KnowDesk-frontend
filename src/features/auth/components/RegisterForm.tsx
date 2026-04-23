import React from 'react';
import { Input }  from '../../../shared/components/ui/Input';
import { Button } from '../../../shared/components/ui/Button';

interface RegisterFormProps {
  form: {
    orgName: string; email: string;
    password: string; confirmPassword: string;
  };
  errors: {
    orgName?: string; email?: string;
    password?: string; confirmPassword?: string; general?: string;
  };
  isLoading:      boolean;
  showPassword:   boolean;
  onChange:       (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit:       (e: React.FormEvent) => void;
  onTogglePassword: () => void;
  onSwitchToLogin:  () => void;
}

export function RegisterForm({
  form, errors, isLoading, showPassword,
  onChange, onSubmit, onTogglePassword, onSwitchToLogin,
}: RegisterFormProps) {
  return (
    <form className="login-form" onSubmit={onSubmit} noValidate>
      {errors.general && (
        <div className="login-form__error" role="alert">{errors.general}</div>
      )}

      <Input
        id="orgName"
        name="orgName"
        type="text"
        label="Nom de l'organisation"
        placeholder="Acme Service Client"
        value={form.orgName}
        onChange={onChange}
        error={errors.orgName}
        autoComplete="organization"
        autoFocus
      />

      <Input
        id="email"
        name="email"
        type="email"
        label="Adresse email"
        placeholder="vous@exemple.fr"
        value={form.email}
        onChange={onChange}
        error={errors.email}
        autoComplete="email"
      />

<Input
  id="password"
  name="password"
  type={showPassword ? 'text' : 'password'}
  label="Mot de passe"
  placeholder="8 caractères minimum"
  value={form.password}
  onChange={onChange}
  error={errors.password}
  autoComplete="new-password"
/>
<button
  type="button"
  className="input-toggle-pw"
  onClick={onTogglePassword}
  aria-label={showPassword ? 'Masquer' : 'Afficher'}
  style={{ marginTop: '-32px', float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}
>
  {showPassword ? '🙈' : '👁'}
</button>

      <Input
        id="confirmPassword"
        name="confirmPassword"
        type={showPassword ? 'text' : 'password'}
        label="Confirmer le mot de passe"
        placeholder="Répétez le mot de passe"
        value={form.confirmPassword}
        onChange={onChange}
        error={errors.confirmPassword}
        autoComplete="new-password"
      />

      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={isLoading}
        fullWidth
      >
        {isLoading ? 'Création…' : 'Créer mon espace'}
      </Button>

      <p className="login-form__signup">
        Déjà un compte ?{' '}
        <button
          type="button"
          className="login-form__link"
          onClick={onSwitchToLogin}
        >
          Se connecter
        </button>
      </p>
    </form>
  );
}
