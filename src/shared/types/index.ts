/** Global shared types. Feature-specific types live in features/*/types.ts */

export type UserRole = 'admin' | 'manager' | 'advisor';

export type OrgPlan = 'free' | 'pro' | 'enterprise';

export interface User {
  id:        string;
  email:     string;
  firstName?: string;
  lastName?:  string;
  role:      UserRole;
  avatarUrl?: string;
}

export interface Organization {
  id:       string;
  name:     string;
  slug:     string;
  plan:     OrgPlan;
  logoUrl?: string;
}

/** Standard API response envelope */
export interface ApiResponse<T> {
  data:  T;
  meta?: Record<string, unknown>;
  error: null;
}

export interface ApiError {
  data:  null;
  error: { code: string; message: string };
}

/** Async state — used with useReducer for any loading operation */
export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string };
