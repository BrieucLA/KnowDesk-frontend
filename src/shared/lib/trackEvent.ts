import { apiClient } from './apiClient';

/**
 * Envoie un événement d'analytics au backend en mode fire-and-forget.
 * N'attend pas la réponse, ignore silencieusement les erreurs — un
 * échec de tracking ne doit jamais casser l'UX.
 */
export function trackEvent(
  type: string,
  opts?: { targetType?: string; targetId?: string; payload?: Record<string, unknown> },
): void {
  apiClient.post('/events', { type, ...opts }).catch(() => { /* ignore */ });
}
