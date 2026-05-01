import React from 'react';
import { useAuthStore } from '../../../store/authStore';

export function ImpersonateBanner() {
  const impersonating    = useAuthStore(s => s.impersonating);
  const setImpersonating = useAuthStore(s => s.setImpersonating);
  const setSession       = useAuthStore(s => s.setSession);
  const clearSession     = useAuthStore(s => s.clearSession);

  if (!impersonating) return null;

const handleReturn = () => {
  const saToken = impersonating.saToken;
  setImpersonating(null);
  // Efface la session impersonnifiée sans toucher au store superadmin
  clearSession();
  // Stocke le token SA en sessionStorage pour que SuperadminApp le récupère
  sessionStorage.setItem('sa_token', saToken);
  window.location.href = '/?superadmin';
};

  return (
    <div className="impersonate-banner" role="alert">
      <span className="impersonate-banner__icon">👁</span>
      <span className="impersonate-banner__text">
        Mode impersonnification — Espace : <strong>{impersonating.orgName}</strong>
      </span>
      <button
        type="button"
        className="impersonate-banner__quit"
        onClick={handleReturn}
      >
        Quitter
      </button>
    </div>
  );
}
