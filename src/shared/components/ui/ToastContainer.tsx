import React from 'react';
import { useToastList } from '../../lib/useToast';
import type { Toast }   from '../../lib/useToast';

export function ToastContainer() {
  const { toasts, remove } = useToastList();

  if (toasts.length === 0) return null;

  return (
    <div
      className="toast-container"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={remove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  return (
    <div className={`toast toast--${toast.variant}`} role={toast.variant === 'error' ? 'alert' : 'status'}>
      <ToastIcon variant={toast.variant} />
      <span className="toast__message">{toast.message}</span>
      <button type="button" className="toast__dismiss" onClick={() => onDismiss(toast.id)} aria-label="Fermer">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="11" y1="1" x2="1"  y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}

function ToastIcon({ variant }: { variant: Toast['variant'] }) {
  const paths: Record<Toast['variant'], React.ReactNode> = {
    success: <path d="M3 7l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>,
    error:   <><line x1="4" y1="4" x2="10" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="10" y1="4" x2="4" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>,
    warning: <><line x1="7" y1="4" x2="7" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="7" cy="10" r=".8" fill="currentColor"/></>,
    info:    <><line x1="7" y1="6" x2="7" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="7" cy="4" r=".8" fill="currentColor"/></>,
  };
  return (
    <svg className="toast__icon" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/>
      {paths[variant]}
    </svg>
  );
}
