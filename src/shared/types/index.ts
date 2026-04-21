/** Global shared types. Feature-specific types live in features/*/types.ts */
export type UserRole = 'admin' | 'manager' | 'advisor';
export type OrgPlan  = 'free'  | 'pro'     | 'enterprise';

export interface User {
  id:         string;
  email:      string;
  firstName?: string;
  lastName?:  string;
  role:       UserRole;
}

export interface Organization {
  id:   string;
  name: string;
  slug: string;
  plan: OrgPlan;
}

export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error';   message: string };
