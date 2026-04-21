import type { SearchResult } from '../types';
import { simulateDelay }    from '../../auth/api/authApi.mock';

const ALL_RESULTS: SearchResult[] = [
  {
    id: 'art-1', type: 'article',
    title:    'Politique de remboursement express',
    excerpt:  'Le <mark>remboursement</mark> est effectué sous 5 jours ouvrés après réception du retour confirmé.',
    category: 'Livraisons', score: 0.97, updatedAt: new Date(Date.now() - 3_600_000).toISOString(),
  },
  {
    id: 'faq-1', type: 'faq',
    title:    'Comment initier un remboursement ?',
    excerpt:  'Pour déclencher un <mark>remboursement</mark>, le conseiller doit vérifier le statut de la commande dans le CRM.',
    category: 'Livraisons', score: 0.91, updatedAt: new Date(Date.now() - 86_400_000).toISOString(),
  },
  {
    id: 'tree-1', type: 'tree',
    title:    'Qualifier une demande de remboursement',
    excerpt:  'Arbre de décision pour identifier le type de <mark>remboursement</mark> applicable selon la situation.',
    category: 'Livraisons', score: 0.88, updatedAt: new Date(Date.now() - 172_800_000).toISOString(),
  },
  {
    id: 'art-2', type: 'article',
    title:    'Traitement des retours après 30 jours',
    excerpt:  'Procédure pour les demandes de retour hors délai standard. Nécessite validation manager.',
    category: 'Retours', score: 0.72, updatedAt: new Date(Date.now() - 259_200_000).toISOString(),
  },
  {
    id: 'art-3', type: 'article',
    title:    'Procédure résiliation abonnement Premium',
    excerpt:  'Étapes pour traiter une résiliation en conservant le client (offre de rétention).',
    category: 'Abonnements', score: 0.65, updatedAt: new Date(Date.now() - 345_600_000).toISOString(),
  },
  {
    id: 'faq-2', type: 'faq',
    title:    'Délai de remboursement carte bancaire vs virement ?',
    excerpt:  'Carte bancaire : 3-5 jours. Virement SEPA : 1-2 jours. Chèque : 10-15 jours.',
    category: 'Livraisons', score: 0.60, updatedAt: new Date(Date.now() - 432_000_000).toISOString(),
  },
];

/**
 * Simulates full-text search with typo tolerance.
 * Filters by title/excerpt match, returns max 7 results sorted by score.
 */
export async function mockSearch(query: string): Promise<SearchResult[]> {
  await simulateDelay(250); // fast — search should feel instant

  if (!query.trim()) return [];

  const q = query.toLowerCase().trim();

  return ALL_RESULTS
    .filter(r =>
      r.title.toLowerCase().includes(q)    ||
      r.excerpt.toLowerCase().includes(q)  ||
      r.category.toLowerCase().includes(q)
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, 7);
}

/** Most-consulted articles — shown when search query is empty */
export const POPULAR_RESULTS: SearchResult[] = ALL_RESULTS.slice(0, 3);
