import React, { useState, useCallback, useId } from 'react';
import { Button } from '../../../shared/components/ui/Button';
import { Input }  from '../../../shared/components/ui/Input';
import type { InviteFormState, InviteFormErrors } from '../types';

interface InviteModalProps {
  onInvite: (form: InviteFormState) => Promise<void>;
  onClose:  () => void;
  isLoading: boolean;
}

function validate(form: InviteFormState): InviteFormErrors {
  const errors: InviteFormErrors = {};
  if (!form.email.trim())
    errors.email = 'L\'adresse email est requise.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errors.email = 'Adresse email invalide.';
  return errors;
}

/**
 * InviteModal — slide-in panel for inviting a new team member.
 * Presented as a non-blocking dialog rather than a full-page form.
 */
export function InviteModal({ onInvite, onClose, isLoading }: InviteModalProps) {
  const [form,   setForm]   = useState<InviteFormState>({ email: '', role: 'advisor' });
  const [errors, setErrors] = useState<InviteFormErrors>({});
  const dialogId = useId();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    await onInvite(form);
    onClose();
  }, [form, onInvite, onClose]);

  return (
    /* Faux-modal overlay — using static positioning for iframe compat */
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${dialogId}-title`}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal">
        <div className="modal__header">
          <h2 id={`${dialogId}-title`} className="modal__title">Inviter un membre</h2>
          <button
            type="button"
            className="modal__close"
            onClick={onClose}
            aria-label="Fermer"
          >
            <CloseIcon />
          </button>
        </div>

        <form className="modal__body" onSubmit={handleSubmit} noValidate>
          <Input
            id="invite-email"
            type="email"
            label="Adresse email"
            placeholder="prenom.nom@entreprise.fr"
            autoFocus
            required
            value={form.email}
            error={errors.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            onBlur={() => {
              const errs = validate(form);
              if (errs.email) setErrors(prev => ({ ...prev, email: errs.email }));
            }}
          />

          <div className="field">
            <label htmlFor="invite-role" className="field-label">Rôle</label>
            <select
              id="invite-role"
              className="field-input"
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value as InviteFormState['role'] }))}
            >
              <option value="advisor">Conseiller — lecture seule</option>
              <option value="manager">Manager — peut modifier les articles</option>
              <option value="admin">Admin — accès complet</option>
            </select>
            <p className="field-helper">
              {form.role === 'advisor'
                ? 'Peut rechercher et lire tous les articles publiés.'
                : form.role === 'manager'
                ? 'Peut créer et modifier des articles, mais pas gérer l\'équipe.'
                : 'Accès complet : contenu, équipe et facturation.'}
            </p>
          </div>

          <div className="modal__actions">
            <Button type="button" variant="ghost" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" loading={isLoading}>
              Envoyer l'invitation
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <line x1="2" y1="2"  x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="14" y1="2" x2="2"  y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
