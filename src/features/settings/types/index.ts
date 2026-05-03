export type SettingsSection =
  | 'general'
  | 'ai'
  | 'chatbot'
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

export type ChatHandoffMode = 'none' | 'webhook' | 'email';

export interface ChatOrgSettings {
  chat_enabled:             boolean;
  chat_welcome_message:     string | null;
  chat_fallback_message:    string | null;
  chat_primary_color:       string | null;
  chat_logo_url:            string | null;
  chat_allowed_domains:     string[];
  chat_handoff_mode:        ChatHandoffMode;
  chat_handoff_webhook_url: string | null;
  chat_handoff_email:       string | null;
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
