import type { User, Organization } from '../../../shared/types';

export interface LoginCredentials {
  email:    string;
  password: string;
}

export interface AuthSession {
  user:         User;
  organization: Organization;
  accessToken:  string;
}

export interface LoginFormState {
  email:    string;
  password: string;
}

export interface LoginFormErrors {
  email?:    string;
  password?: string;
  general?:  string;
}
