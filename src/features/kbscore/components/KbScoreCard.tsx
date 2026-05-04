import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '../../../shared/components/ui/Skeleton';
import { useToast } from '../../../shared/lib/useToast';
import { kbscoreApi, type KbScoreResult, type DimensionScore } from '../api/kbscoreApi';

const BAND_LABEL: Record<KbScoreResult['band'], { label: string; tone: string }> = {
  critical:  { label: 'Critique',   tone: 'critical'  },
  warning:   { label: 'À améliorer', tone: 'warning'   },
  good:      { label: 'Bon',        tone: 'good'      },
  excellent: { label: 'Excellent',  tone: 'excellent' },
};

const DIM_META: Array<{
  key:    keyof KbScoreResult['dimensions'];
  label:  string;
  hint:   string;
}> = [
  { key: 'coverage',     label: 'Couverture',   hint: '% recherches qui aboutissent' },
  { key: 'satisfaction', label: 'Satisfaction', hint: 'CSAT chatbot · helpful% FAQs' },
  { key: 'freshness',    label: 'Fraîcheur',    hint: 'Articles modifiés < 6 mois' },
  { key: 'consistency',  label: 'Cohérence',    hint: 'Conversations résolues sans escalade' },
  { key: 'activation',   label: 'Activation',   hint: 'Membres actifs sur 7 jours' },
  { key: 'clarity',      label: 'Clarté',       hint: 'Articles dans la fenêtre 200-2000 mots' },
];

function dimTone(score: number | null): string {
  if (score === null) return 'na';
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 50) return 'warning';
  return 'critical';
}

export function KbScoreCard() {
  const toast = useToast();
  const navigate = useNavigate();
  const [data, setData]       = useState<KbScoreResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    kbscoreApi.get()
      .then(r => { if (alive) setData(r); })
      .catch(err => { if (alive) toast.error((err as Error).message ?? 'Impossible de calculer le score.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [toast]);

  if (loading) {
    return (
      <section className="kbscore">
        <Skeleton className="kbscore__skel-title" />
        <Skeleton className="kbscore__skel-body" />
      </section>
    );
  }
  if (!data) return null;

  const band = BAND_LABEL[data.band];

  return (
    <section className="kbscore" aria-label="KB Health Score">
      <header className="kbscore__header">
        <div className="kbscore__title-block">
          <h2 className="kbscore__title">KB Health Score</h2>
          <p className="kbscore__subtitle">
            Mesure de la santé globale de ta base sur les <strong>{data.windowDays} derniers jours</strong>.
            6 dimensions, score composite pondéré.
          </p>
        </div>
        <div className={`kbscore__hero kbscore__hero--${data.band}`}>
          <div className="kbscore__hero-num">{data.globalScore}</div>
          <div className="kbscore__hero-meta">
            <div className="kbscore__hero-label">/ 100</div>
            <div className={`kbscore__band kbscore__band--${band.tone}`}>{band.label}</div>
          </div>
        </div>
      </header>

      <div className="kbscore__dims" role="list">
        {DIM_META.map(meta => {
          const dim = data.dimensions[meta.key] as DimensionScore;
          const tone = dimTone(dim.score);
          return (
            <div key={meta.key} className={`kbscore__dim kbscore__dim--${tone}`} role="listitem">
              <div className="kbscore__dim-top">
                <span className="kbscore__dim-label">{meta.label}</span>
                <span className="kbscore__dim-score">
                  {dim.score === null ? '—' : `${dim.score}`}
                </span>
              </div>
              <div className="kbscore__dim-bar" aria-hidden="true">
                <div
                  className={`kbscore__dim-bar-fill kbscore__dim-bar-fill--${tone}`}
                  style={{ width: dim.score === null ? '0%' : `${dim.score}%` }}
                />
              </div>
              <div className="kbscore__dim-detail">{dim.detail}</div>
              <div className="kbscore__dim-hint">{meta.hint}</div>
            </div>
          );
        })}
      </div>

      {data.recommendations.length > 0 && (
        <div className="kbscore__recos">
          <h3 className="kbscore__recos-title">Top {data.recommendations.length} action{data.recommendations.length > 1 ? 's' : ''} cette semaine</h3>
          <ul className="kbscore__recos-list" role="list">
            {data.recommendations.map(reco => (
              <li key={reco.id} className="kbscore__reco">
                <button
                  type="button"
                  className="kbscore__reco-btn"
                  onClick={() => reco.link && navigate(reco.link)}
                  disabled={!reco.link}
                >
                  <span className="kbscore__reco-text">{reco.text}</span>
                  <span className="kbscore__reco-impact" title="Impact estimé sur le score global">
                    +{reco.impactPts} pts
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
