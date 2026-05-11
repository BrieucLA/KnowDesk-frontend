export type SettingsSection =
  | 'general'
  | 'ai'
  | 'chatbot'
  | 'ai-quality'
  | 'ai-models'
  | 'notifications'
  | 'api'
  | 'search'
  | 'tags'
  | 'imports'
  | 'audit'
  | 'billing'
  | 'danger';

export type ChatModelId =
  | 'mistral-small-latest'
  | 'mistral-medium-latest'
  | 'mistral-large-latest'
  | 'ministral-8b-latest';

export interface ChatModelMeta {
  id:           ChatModelId;
  label:        string;
  provider:     'mistral';
  region:       'FR';
  latencyClass: 'fast' | 'medium' | 'slow';
  costRelative: number;
  description:  string;
}

export type AiServiceKey = 'chat-response' | 'search-ai' | 'slot-filling' | 'topic-clustering' | 'article-quality' | 'learning-quiz' | 'chat-query-rewrite';

export interface AiServiceItem {
  key:         AiServiceKey;
  label:       string;
  description: string;
  modifiable:  boolean;
  model:       ChatModelId;
}

export interface AiServicesPayload {
  services:        AiServiceItem[];
  availableModels: ChatModelMeta[];
}

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

export type ChatRetentionDays = 30 | 60 | 90 | 180;

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
  /** Prompt système custom du chatbot. null = utiliser le prompt généré. */
  chat_system_prompt?:        string | null;
  /** Calculé côté backend à chaque GET — preview du prompt qui SERAIT généré. */
  chat_system_prompt_default?: string | null;
  /** Disclaimer RGPD du widget. null = texte par défaut côté widget. */
  chat_privacy_notice?:        string | null;
  /** URL externe politique de confidentialité (lien optionnel). null = pas de lien. */
  chat_privacy_policy_url?:    string | null;
  /** Durée de conservation des conversations chat avant hard-delete (RGPD).
   *  Valeurs autorisées : 30 / 60 / 90 / 180. Default 90. */
  chat_retention_days?:        ChatRetentionDays;
  // Personnalisation IA partagée avec la Réponse IA (table organizations)
  industry?:        string | null;
  ai_tone?:         AiTone | null;
  ai_address_form?: AiAddressForm | null;
  ai_glossary?:     AiGlossaryEntry[];
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
