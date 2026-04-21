import { useAuthStore } from '../../store/authStore';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api/v1';

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
  const token = useAuthStore.getState().session?.accessToken;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };

  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (res.status === 401) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      const newToken = useAuthStore.getState().session?.accessToken;
      const retryRes = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: { ...headers, Authorization: `Bearer ${newToken}` },
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

async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method:      'POST',
      credentials: 'include',
    });
    if (!res.ok) return false;
    const body = await res.json();
    if (!body.data?.accessToken) return false;
    const current = useAuthStore.getState().session;
    if (current) {
      useAuthStore.getState().setSession({ ...current, accessToken: body.data.accessToken });
    }
    return true;
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
