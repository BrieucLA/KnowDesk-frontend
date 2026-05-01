import { useAuthStore } from '../../store/authStore';

/**
 * Base URL relative : en prod un rewrite Vercel proxy /api → Railway, en dev
 * un proxy Vite fait la même chose vers localhost:3001. L'origine perçue par
 * le navigateur est donc toujours celle du frontend, ce qui permet d'utiliser
 * des cookies HTTP-only sameSite=lax pour transporter l'access token.
 */
const BASE_URL = '/api/v1';

export class ApiError extends Error {
  constructor(
    public readonly code:    string,
    public readonly message: string,
    public readonly status:  number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };

  // L'access token vit dans un cookie HTTP-only — credentials:include le transporte
  // automatiquement, plus besoin d'un header Authorization.
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (res.status === 401) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      const retryRes = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
        credentials: 'include',
      });
      return parseResponse<T>(retryRes);
    } else {
      useAuthStore.getState().clearSession();
      throw new ApiError('TOKEN_EXPIRED', 'Session expirée. Reconnectez-vous.', 401);
    }
  }

  return parseResponse<T>(res);
}

async function parseResponse<T>(res: Response): Promise<T> {
  const body = await res.json();
  if (!res.ok || body.error) {
    throw new ApiError(
      body.error?.code    ?? 'UNKNOWN_ERROR',
      body.error?.message ?? 'Une erreur est survenue.',
      res.status,
    );
  }
  return body.data as T;
}

// Mutex pour le refresh : plusieurs requêtes simultanées qui voient un 401
// partagent la même tentative au lieu de la lancer en parallèle.
let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = doRefresh().finally(() => { refreshPromise = null; });
  return refreshPromise;
}

async function doRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method:      'POST',
      credentials: 'include',
    });
    return res.ok;
    // Le nouveau access token est posé en cookie par le backend ; pas besoin
    // de toucher au store côté frontend.
  } catch {
    return false;
  }
}

export const apiClient = {
  get:    <T>(path: string)                 => request<T>(path),
  post:   <T>(path: string, body: unknown)  => request<T>(path, { method: 'POST',   body: JSON.stringify(body) }),
  patch:  <T>(path: string, body: unknown)  => request<T>(path, { method: 'PATCH',  body: JSON.stringify(body) }),
  put:    <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT',    body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string)                => request<T>(path, { method: 'DELETE' }),
};
