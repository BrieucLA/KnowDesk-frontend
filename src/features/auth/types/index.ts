import type { User, Organization } from '../../../shared/types';

export interface LoginCredentials {
  email:    string;
  password: string;
}

export interface AuthSession {
  user:         User;
  organization: Organization;
  /** Reliquat de l'époque Bearer ; aujourd'hui le token est dans le cookie
   *  httpOnly, donc optionnel. À retirer quand le fallback Bearer aura
   *  disparu du backend (voir CLAUDE.md → Refacto à venir). */
  accessToken?: string;
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
