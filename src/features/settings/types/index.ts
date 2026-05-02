export type SettingsSection =
  | 'general'
  | 'ai'
  | 'notifications'
  | 'api'
  | 'search'
  | 'tags'
  | 'billing'
  | 'danger';

export type AiTone        = 'professional' | 'warm' | 'direct' | 'empathetic' | 'casual';
export type AiAddressForm = 'tu' | 'vous';

export interface AiGlossaryEntry { from: string; to: string; }

export interface AiOrgSettings {
  ai_answer_enabled: boolean;
  industry:          string | null;
  ai_tone:           AiTone | null;
  ai_address_form:   AiAddressForm | null;
  ai_glossary:       AiGlossaryEntry[];
}

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
