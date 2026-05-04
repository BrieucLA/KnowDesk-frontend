import { apiClient } from '../../../shared/lib/apiClient';

export type KbScoreBand = 'critical' | 'warning' | 'good' | 'excellent';

export interface DimensionScore {
  score:  number | null;
  detail: string;
}

export interface KbRecommendation {
  id:        string;
  text:      string;
  link?:     string;
  impactPts: number;
}

export interface KbScoreResult {
  windowDays:  number;
  globalScore: number;
  band:        KbScoreBand;
  dimensions: {
    coverage:     DimensionScore;
    satisfaction: DimensionScore;
    freshness:    DimensionScore;
    activation:   DimensionScore;
    clarity:      DimensionScore;
  };
  recommendations: KbRecommendation[];
}

export const kbscoreApi = {
  get: () => apiClient.get<KbScoreResult>('/kbscore'),
};
