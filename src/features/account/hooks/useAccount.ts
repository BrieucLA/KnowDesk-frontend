import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../../shared/lib/apiClient';
import { useToast }  from '../../../shared/lib/useToast';
import type { AccountProfile } from '../types';

export function useAccount() {
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    apiClient.get<AccountProfile>('/account')
      .then(setProfile)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateProfile = useCallback(async (data: {
    firstName?: string; lastName?: string;
  }) => {
    const updated = await apiClient.patch<AccountProfile>('/account', data);
    setProfile(updated);
    toast.success('Profil mis à jour.');
    return updated;
  }, [toast]);

  const changePassword = useCallback(async (data: {
    currentPassword: string; newPassword: string;
  }) => {
    await apiClient.post('/account/change-password', data);
    toast.success('Mot de passe modifié. Reconnectez-vous.');
  }, [toast]);

  const requestEmailChange = useCallback(async (newEmail: string) => {
    await apiClient.post('/account/request-email-change', { newEmail });
    toast.success('Email de confirmation envoyé.');
  }, [toast]);

  return { profile, loading, updateProfile, changePassword, requestEmailChange };
}
