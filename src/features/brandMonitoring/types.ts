/**
 * Types Brand Monitoring — miroir du backend (cf src/modules/brandMonitoring).
 * Pas généré auto en V1 — synchroniser à la main si on ajoute des champs.
 */

export type IndustryKey = 'energy' | 'insurance' | 'grocery' | 'mobile_telecom' | 'luxury';

export interface IndustryMeta {
  key:         IndustryKey;
  label:       string;
  promptCount: number;
}

export type Sentiment = 'positive' | 'neutral' | 'negative';
export type LlmMode   = 'memory' | 'search' | 'both';

export interface ResponseSource {
  response_id: string;
  url:         string;
  title:       string | null;
  snippet:     string | null;
  position:    number;
}

export interface BrandProject {
  id:                 string;
  org_id:             string;
  name:               string;
  market_country:     string;
  industry:           IndustryKey | null;
  sentiment_enabled:  boolean;
  llm_mode:           LlmMode;
  created_at:         string;
  updated_at:         string;
  deleted_at:         string | null;
  // Champs supplémentaires renvoyés par GET /projects/:id
  brandsCount?:    number;
  promptsCount?:   number;
  runsCount?:      number;
  monthlyQuota?:   number;
  quotaRemaining?: number;
}

export interface SuggestPromptsPayload {
  industry:      IndustryKey;
  industryLabel: string;
  prompts:       Array<{ text: string; topicHint: string }>;
}

export interface MonitoredBrand {
  id:         string;
  project_id: string;
  name:       string;
  aliases:    string[];
  is_owner:   boolean;
  created_at: string;
}

export interface MonitoringPrompt {
  id:            string;
  project_id:    string;
  text:          string;
  topic_hint:    string | null;
  topic_cluster: string | null;
  active:        boolean;
  created_at:    string;
  updated_at:    string;
  deleted_at:    string | null;
}

export interface PromptRun {
  id:           string;
  prompt_id:    string;
  llm_provider: string;
  llm_model:    string;
  status:       'pending' | 'running' | 'completed' | 'failed';
  started_at:   string;
  completed_at: string | null;
  cost_eur:     string;
  error_msg:    string | null;
  promptText:   string | null;
}

export interface ShareOfVoiceBrand {
  brandId:       string;
  brandName:     string;
  isOwner:       boolean;
  totalMentions: number;
  pct:           number;
}

export interface ShareOfVoice {
  byBrand:       ShareOfVoiceBrand[];
  totalMentions: number;
  responseCount: number;
}

export interface TopicSov {
  topic:         string | null;
  promptCount:   number;
  responseCount: number;
  totalMentions: number;
  byBrand: Array<{
    brandId: string;
    brandName: string;
    isOwner: boolean;
    mentions: number;
    pct: number;
  }>;
}

export interface TimelinePoint {
  bucket:        string;
  totalMentions: number;
  byBrand: Array<{
    brandId: string;
    brandName: string;
    isOwner: boolean;
    mentions: number;
    pct: number;
  }>;
}

export interface Timeline {
  bucket: 'day' | 'week';
  series: TimelinePoint[];
}

export interface ResponseWithMentions {
  id:            string;
  content:       string;
  input_tokens:  number;
  output_tokens: number;
  latency_ms:    number;
  created_at:    string;
  llm_model:     string;
  cost_eur:      string;
  promptText:    string | null;
  mentions: Array<{
    brand_id:       string;
    brandName:      string;
    isOwner:        boolean;
    count:          number;
    first_position: number;
    sentiment:      Sentiment | null;
  }>;
  sources: ResponseSource[];
}
