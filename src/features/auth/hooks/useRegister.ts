import { useState, useCallback } from 'react';
import { apiClient } from '../../../shared/lib/apiClient';
import type { AuthSession } from '../types';

interface RegisterForm {
  orgName:         string;
  email:           string;
  password:        string;
  confirmPassword: string;
}

interface RegisterErrors {
  orgName?:         string;
  email?:           string;
  password?:        string;
  confirmPassword?: string;
  general?:         string;
}

function validate(form: RegisterForm): RegisterErrors {
  const errors: RegisterErrors = {};
  if (!form.orgName.trim())          errors.orgName  = 'Le nom de l\'organisation est requis.';
  if (!form.email.trim())            errors.email    = 'L\'email est requis.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                                     errors.email    = 'Email invalide.';
  if (form.password.length < 8)      errors.password = 'Le mot de passe doit contenir au moins 8 caractères.';
  if (form.password !== form.confirmPassword)
                                     errors.confirmPassword = 'Les mots de passe ne correspondent pas.';
  return errors;
}

export function useRegister(onSuccess: (session: AuthSession) => void) {
  const [form, setForm] = useState<RegisterForm>({
    orgName: '', email: '', password: '', confirmPassword: '',
  });
  const [errors,      setErrors]      = useState<RegisterErrors>({});
  const [isLoading,   setIsLoading]   = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof RegisterErrors]) {
      setErrors(prev => { const n = { ...prev }; delete n[name as keyof RegisterErrors]; return n; });
    }
  }, [errors]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setIsLoading(true);
    try {
      const data = await apiClient.post<any>('/auth/register', {
        email:   form.email.toLowerCase().trim(),
        password: form.password,
        orgName:  form.orgName.trim(),
      });

      onSuccess({
        accessToken: data.accessToken,
        user:        data.user,
        organization: data.organization,
      });
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : 'Erreur lors de la création du compte.' });
    } finally {
      setIsLoading(false);
    }
  }, [form, onSuccess]);

  return {
    form, errors, isLoading, showPassword,
    handleChange, handleSubmit,
    togglePassword: () => setShowPassword(p => !p),
  };
}
