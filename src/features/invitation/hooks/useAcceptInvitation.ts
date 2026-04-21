import { useState, useCallback } from 'react';
import { apiClient } from '../../../shared/lib/apiClient';
import type { AcceptInvitationForm, AcceptInvitationErrors } from '../types';

function validate(form: AcceptInvitationForm): AcceptInvitationErrors {
  const errors: AcceptInvitationErrors = {};
  if (!form.password || form.password.length < 8)
    errors.password = 'Le mot de passe doit contenir au moins 8 caractères.';
  if (form.password !== form.passwordConfirm)
    errors.passwordConfirm = 'Les mots de passe ne correspondent pas.';
  return errors;
}

export function useAcceptInvitation(token: string) {
  const [form,        setForm]        = useState<AcceptInvitationForm>({ password: '', passwordConfirm: '' });
  const [errors,      setErrors]      = useState<AcceptInvitationErrors>({});
  const [isLoading,   setIsLoading]   = useState(false);
  const [isSuccess,   setIsSuccess]   = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = useCallback((field: keyof AcceptInvitationForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  }, [errors]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setIsLoading(true);
    setErrors({});
    try {
      await apiClient.post(`/members/invitations/${token}/accept`, {
        password: form.password,
      });
      setIsSuccess(true);
    } catch (err) {
      setErrors({
        general: err instanceof Error ? err.message : 'Lien invalide ou expiré.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [form, token]);

  return {
    form, errors, isLoading, isSuccess, showPassword,
    handleChange, handleSubmit,
    togglePassword: () => setShowPassword(p => !p),
  };
}
