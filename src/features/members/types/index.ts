import type { UserRole } from '../../../shared/types';

export type MemberStatus = 'active' | 'invited' | 'expired' | 'disabled';

export interface Member {
  id:         string;
  firstName:  string;
  lastName:   string;
  email:      string;
  role:       UserRole;
  status:     MemberStatus;
  joinedAt?:  string;   // ISO — undefined when still invited
  invitedAt:  string;   // ISO
  avatarUrl?: string;
}

export interface InviteFormState {
  email: string;
  role:  UserRole;
}

export interface InviteFormErrors {
  email?: string;
  role?:  string;
}

export type MemberAction =
  | { type: 'change_role';  memberId: string; newRole: UserRole }
  | { type: 'disable';      memberId: string }
  | { type: 'resend';       memberId: string }
  | { type: 'reinstate';    memberId: string };
