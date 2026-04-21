import type { OrgSettings, NotifPreferences, BillingInfo } from '../types';
import { simulateDelay } from '../../auth/api/authApi.mock';

export const MOCK_ORG_SETTINGS: OrgSettings = {
  name:     'Acme Service Client',
  timezone: 'Europe/Paris',
};

export const MOCK_NOTIF_PREFS: NotifPreferences = {
  articleUpdated: true,
  memberJoined:   false,
  weeklyDigest:   true,
  channel:        'email',
};

export const MOCK_BILLING: BillingInfo = {
  plan:      'free',
  seats:     3,
  seatsUsed: 3,
  invoices:  [], // free plan has no invoices
};

export const MOCK_BILLING_PRO: BillingInfo = {
  plan:      'pro',
  renewsAt:  new Date(Date.now() + 20 * 86_400_000).toISOString(),
  seats:     -1,  // unlimited
  seatsUsed: 6,
  invoices: [
    { id: 'inv-3', date: new Date(Date.now() - 5 * 86_400_000).toISOString(),   amount: 4900, currency: 'EUR', pdfUrl: '#', status: 'paid' },
    { id: 'inv-2', date: new Date(Date.now() - 35 * 86_400_000).toISOString(),  amount: 4900, currency: 'EUR', pdfUrl: '#', status: 'paid' },
    { id: 'inv-1', date: new Date(Date.now() - 65 * 86_400_000).toISOString(),  amount: 4900, currency: 'EUR', pdfUrl: '#', status: 'paid' },
  ],
};

export async function mockSaveOrgSettings(s: OrgSettings): Promise<void> {
  await simulateDelay(500);
  console.log('Org settings saved:', s);
}

export async function mockSaveNotifPrefs(p: NotifPreferences): Promise<void> {
  await simulateDelay(400);
  console.log('Notif prefs saved:', p);
}

export async function mockDeleteOrg(name: string): Promise<void> {
  await simulateDelay(1000);
  console.log('Org deletion requested:', name);
}
