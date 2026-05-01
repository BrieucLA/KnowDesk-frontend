export type SettingsSection =
  | 'general'
  | 'notifications'
  | 'api'
  | 'search'
  | 'tags'
  | 'billing'
  | 'danger';

export interface Synonym {
  id:         string;
  term:       string;
  synonyms:   string[];
  updated_at: string;
}

export interface OrgSettings {
  name:      string;
  logoUrl?:  string;
  timezone:  string;
}

export interface NotifPreferences {
  articleUpdated:  boolean;
  memberJoined:    boolean;
  weeklyDigest:    boolean;
  channel:         'email' | 'in_app' | 'both';
}

export interface BillingInfo {
  plan:        'free' | 'pro' | 'enterprise';
  renewsAt?:   string;
  cancelAt?:   string;
  seats:       number;
  seatsUsed:   number;
  invoices:    Invoice[];
}

export interface Invoice {
  id:       string;
  date:     string;
  amount:   number;        // in cents
  currency: string;
  pdfUrl:   string;
  status:   'paid' | 'open' | 'void';
}
