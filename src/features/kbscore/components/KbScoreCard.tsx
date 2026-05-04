import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '../../../shared/components/ui/Skeleton';
import { InfoTooltip, type InfoTooltipRow } from '../../../shared/components/ui/Tooltip';
import { useToast } from '../../../shared/lib/useToast';
import { kbscoreApi, type KbScoreResult, type DimensionScore } from '../api/kbscoreApi';

const BAND_LABEL: Record<KbScoreResult['band'], { label: string; tone: string }> = {
  critical:  { label: 'Critique',   tone: 'critical'  },
  warning:   { label: 'À améliorer', tone: 'warning'   },
  good:      { label: 'Bon',        tone: 'good'      },
  excellent: { label: 'Excellent',  tone: 'excellent' },
};

const DIM_META: Array<{
  key:     keyof KbScoreResult['dimensions'];
  label:   string;
  hint:    string;
  /** Lignes de l'info-bulle (Phase « clarté KPI »). null = tooltip pas encore rédigée. */
  tooltip: InfoTooltipRow[] | null;
}> = [
  {
    key:   'coverage',
    label: 'Couverture',
    hint:  '% recherches qui aboutissent',
    tooltip: [
      { label: 'Quoi',   text: '% des recherches mots-clés faites par les conseillers dans la barre Cmd+K (base interne) qui retournent au moins 1 résultat.' },
      { label: 'Calcul', text: 'recherches avec ≥ 1 résultat ÷ total recherches sur 30 jours, dans la barre Cmd+K uniquement.' },
      { label: 'Action', text: 'si < 80%, va dans « Recherches sans résultat » et crée une FAQ pour combler — c\'est le levier le plus rapide.' },
    ],
  },
  {
    key:   'satisfaction',
    label: 'Satisfaction',
    hint:  'helpful% FAQs publiées',
    tooltip: [
      { label: 'Quoi',   text: '% de votes « 👍 utile » sur les FAQs publiées de ta base.' },
      { label: 'Calcul', text: 'votes utiles ÷ (utiles + non utiles) sur toutes les FAQs publiées. Affiché « Pas assez de votes » sous 2 votes au total.' },
      { label: 'Action', text: 'si < 70%, ouvre FAQs, trie par helpful% croissant et réécris les FAQs mal notées (mauvaise réponse, vocabulaire flou, manque de contexte).' },
    ],
  },
  {
    key:   'freshness',
    label: 'Fraîcheur',
    hint:  'Articles modifiés < 6 mois',
    tooltip: [
      { label: 'Quoi',   text: '% des articles publiés actifs mis à jour dans les 6 derniers mois, pondéré par leur nombre de vues. Concerne uniquement les articles (pas les FAQs ni les processus).' },
      { label: 'Calcul', text: 'pour chaque article publié actif, poids = 1 + nombre de vues sur 30 jours (un article populaire compte plus). Score = poids des articles « frais » (modifiés il y a < 6 mois) ÷ poids total.' },
      { label: 'Action', text: 'si bas, ouvre Analytics → « Articles à vérifier » et révise en priorité ceux avec beaucoup de vues qui n\'ont pas été mis à jour récemment.' },
    ],
  },
  {
    key:   'activation',
    label: 'Utilisation',
    hint:  'Membres actifs sur 7 jours',
    tooltip: [
      { label: 'Quoi',   text: '% des membres internes (conseillers, managers, admins) qui ont utilisé KnowDesk dans les 7 derniers jours.' },
      { label: 'Calcul', text: 'membres ayant consulté ≥ 1 article OU lancé ≥ 1 recherche dans la barre Cmd+K, sur 7 jours, ÷ total des membres actifs de l\'organisation. Fenêtre courte (7 jours, pas 30) pour refléter l\'usage récent.' },
      { label: 'Action', text: 'si bas, fais une démo Cmd+K en réunion d\'équipe et identifie les sujets manquants — les conseillers reviennent quand ils trouvent leurs réponses.' },
    ],
  },
  {
    key:   'clarity',
    label: 'Clarté',
    hint:  'Articles dans la fenêtre 200-2000 mots',
    tooltip: [
      { label: 'Quoi',   text: '% des articles publiés actifs dont la longueur est dans la fenêtre lisible (200 à 2000 mots). Concerne uniquement les articles.' },
      { label: 'Calcul', text: 'pour chaque article publié actif, on compte les mots du contenu (HTML retiré). Les articles trop courts (< 200 mots, stubs probables) ou trop longs (> 2000 mots, rarement lus jusqu\'au bout) sortent du score.' },
      { label: 'Action', text: 'si bas, ouvre la liste des articles, identifie les très courts (à enrichir avec un exemple ou une procédure complète) et les très longs (à scinder en plusieurs articles plus ciblés).' },
    ],
  },
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
                <span className="kbscore__dim-label">
                  {meta.label}
                  {meta.tooltip && <InfoTooltip title={meta.label} rows={meta.tooltip} />}
                </span>
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
