import React, { useEffect, useId } from 'react';
import { Button } from './Button';

interface ConfirmDialogProps {
  title:         string;
  description?:  string;
  confirmLabel?: string;
  cancelLabel?:  string;
  variant?:      'danger' | 'primary';
  loading?:      boolean;
  onConfirm:     () => void;
  onCancel:      () => void;
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Confirmer',
  cancelLabel  = 'Annuler',
  variant      = 'danger',
  loading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="modal confirm-dialog">
        <div className="modal__header">
          <h2 id={titleId} className="modal__title">{title}</h2>
        </div>
        <div className="modal__body">
          {description && (
            <p className="confirm-dialog__desc">{description}</p>
          )}
          <div className="modal__actions">
            <Button variant="ghost" size="md" onClick={onCancel} disabled={loading}>
              {cancelLabel}
            </Button>
            <Button variant={variant} size="md" loading={loading} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
