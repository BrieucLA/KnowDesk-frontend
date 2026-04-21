import type { Member } from '../types';
import { simulateDelay } from '../../auth/api/authApi.mock';

export const MOCK_MEMBERS: Member[] = [
  {
    id: 'm-1', firstName: 'Marc',    lastName: 'Duval',
    email: 'marc.duval@acme.fr',     role: 'admin',
    status: 'active',
    joinedAt:  new Date(Date.now() - 90 * 86_400_000).toISOString(),
    invitedAt: new Date(Date.now() - 91 * 86_400_000).toISOString(),
  },
  {
    id: 'm-2', firstName: 'Sophie',  lastName: 'Martin',
    email: 'sophie.martin@acme.fr',  role: 'advisor',
    status: 'active',
    joinedAt:  new Date(Date.now() - 60 * 86_400_000).toISOString(),
    invitedAt: new Date(Date.now() - 61 * 86_400_000).toISOString(),
  },
  {
    id: 'm-3', firstName: 'Lucie',   lastName: 'Benoît',
    email: 'lucie.benoit@acme.fr',   role: 'manager',
    status: 'active',
    joinedAt:  new Date(Date.now() - 45 * 86_400_000).toISOString(),
    invitedAt: new Date(Date.now() - 46 * 86_400_000).toISOString(),
  },
  {
    id: 'm-4', firstName: 'Thomas',  lastName: 'Roux',
    email: 'thomas.roux@acme.fr',    role: 'advisor',
    status: 'invited',
    invitedAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
  },
  {
    id: 'm-5', firstName: 'Camille', lastName: 'Leroy',
    email: 'camille.leroy@acme.fr',  role: 'advisor',
    status: 'expired',
    invitedAt: new Date(Date.now() - 5 * 86_400_000).toISOString(),
  },
  {
    id: 'm-6', firstName: 'Paul',    lastName: 'Girard',
    email: 'paul.girard@acme.fr',    role: 'advisor',
    status: 'disabled',
    joinedAt:  new Date(Date.now() - 30 * 86_400_000).toISOString(),
    invitedAt: new Date(Date.now() - 31 * 86_400_000).toISOString(),
  },
];

export async function mockGetMembers(): Promise<Member[]> {
  await simulateDelay(400);
  return MOCK_MEMBERS;
}

export async function mockInviteMember(email: string, role: string): Promise<Member> {
  await simulateDelay(600);
  return {
    id:        `m-new-${Date.now()}`,
    firstName: email.split('@')[0].split('.')[0],
    lastName:  email.split('@')[0].split('.')[1] ?? '',
    email,
    role:      role as Member['role'],
    status:    'invited',
    invitedAt: new Date().toISOString(),
  };
}

export async function mockUpdateMemberRole(
  memberId: string, role: string,
): Promise<void> {
  await simulateDelay(400);
  console.log('Role updated:', memberId, role);
}

export async function mockDisableMember(memberId: string): Promise<void> {
  await simulateDelay(400);
  console.log('Member disabled:', memberId);
}

export async function mockResendInvite(memberId: string): Promise<void> {
  await simulateDelay(300);
  console.log('Invite resent:', memberId);
}
