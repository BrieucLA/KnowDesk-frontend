import { useState, useEffect } from 'react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id:       string;
  message:  string;
  variant:  ToastVariant;
  duration: number;
}

// ── Event bus simple ──────────────────────────────────────────
type Listener = (toasts: Toast[]) => void;

class ToastBus {
  private toasts:    Toast[]    = [];
  private listeners: Listener[] = [];
  private counter = 0;

  subscribe(fn: Listener) {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  }

  private notify() {
    this.listeners.forEach(l => l([...this.toasts]));
  }

  add(message: string, variant: ToastVariant = 'info', duration = 4000) {
    const id = `toast-${++this.counter}`;
    this.toasts = [...this.toasts.slice(-2), { id, message, variant, duration }];
    this.notify();
    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }
  }

  remove(id: string) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.notify();
  }
}

// Singleton global
declare global { interface Window { __toastBus?: ToastBus; } }
if (!window.__toastBus) window.__toastBus = new ToastBus();
const bus = window.__toastBus;

// ── Hook pour les composants qui affichent les toasts ─────────
export function useToastList() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => bus.subscribe(setToasts), []);
  return { toasts, remove: (id: string) => bus.remove(id) };
}

// ── Hook pour les composants qui envoient des toasts ──────────
export function useToast() {
  return {
    success: (msg: string) => bus.add(msg, 'success', 4000),
    error:   (msg: string) => bus.add(msg, 'error',   6000),
    warning: (msg: string) => bus.add(msg, 'warning', 5000),
    info:    (msg: string) => bus.add(msg, 'info',    4000),
  };
}
