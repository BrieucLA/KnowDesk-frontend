import { useState, useCallback } from 'react';
import { apiClient } from '../../../shared/lib/apiClient';

export function useForgotPassword() {
  const [email,     setEmail]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [sent,      setSent]      = useState(false);
  const [error,     setError]     = useState('');

  const submit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('L\'email est requis.'); return; }
    setLoading(true);
    setError('');
    try {
      await apiClient.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur. Réessayez.');
    } finally {
      setLoading(false);
    }
  }, [email]);

  return { email, setEmail, loading, sent, error, submit };
}
