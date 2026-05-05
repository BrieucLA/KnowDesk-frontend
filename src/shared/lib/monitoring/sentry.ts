import * as Sentry from '@sentry/react';
import { redactPii } from '../redactPii';

/**
 * Initialise Sentry pour le frontend. Pas de DSN configuré → SDK désactivé
 * silencieusement (cas dev local par défaut, et fallback si la var Vercel
 * n'a pas été posée).
 *
 * Choix RGPD/sécurité (alignés sur le backend) :
 * - `sendDefaultPii: false` : pas d'IP, pas de cookies envoyés à Sentry.
 * - `beforeSend` redact : email/téléphone/IBAN/carte dans message + exception.value.
 * - Pas de Replay (pas de session vidéo) : trop de surface RGPD pour MVP.
 * - `tracesSampleRate: 0.1` (10%) en prod, 1.0 en dev pour valider l'instrument.
 * - `ignoreErrors` : bruits frontend connus (ResizeObserver, AbortError…).
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) {
    // Silencieux en dev — pas de log, on ne pollue pas la console.
    return;
  }

  Sentry.init({
    dsn,
    environment:      import.meta.env.MODE,
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
    sendDefaultPii:   false,
    beforeSend(event) {
      // Strip cookies / request headers si Sentry les a posés
      if (event.request?.headers) {
        delete (event.request.headers as Record<string, unknown>).authorization;
        delete (event.request.headers as Record<string, unknown>).cookie;
      }
      if (event.request?.cookies) delete event.request.cookies;
      if (event.request?.data)    delete event.request.data;

      if (event.message) event.message = redactPii(event.message);
      if (event.exception?.values) {
        for (const ex of event.exception.values) {
          if (ex.value) ex.value = redactPii(ex.value);
        }
      }
      if (event.breadcrumbs) {
        for (const bc of event.breadcrumbs) {
          if (bc.message) bc.message = redactPii(bc.message);
        }
      }
      return event;
    },
    ignoreErrors: [
      // Bruits frontend connus, sans valeur diagnostique
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection captured',
      // AbortController triggered (ex: visiteur change de page pendant un fetch)
      'AbortError',
      'The user aborted a request',
      // Extensions Chrome / scripts tiers
      'Script error.',
    ],
  });
}

export { Sentry };
