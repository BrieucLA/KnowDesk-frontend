import type { Article, ArticleListItem } from '../types';
import { simulateDelay } from '../../auth/api/authApi.mock';

export const MOCK_ARTICLE: Article = {
  id:           'art-1',
  title:        'Politique de remboursement express',
  categoryId:   'cat-1',
  categoryName: 'Livraisons',
  status:       'published',
  version:      4,
  authorName:   'Marc Duval',
  updatedAt:    new Date(Date.now() - 3_600_000).toISOString(),
  createdAt:    new Date(Date.now() - 30 * 86_400_000).toISOString(),
  content: `
    <h2>Conditions d'application</h2>
    <p>Le remboursement express s'applique aux commandes livrées avec un retard supérieur à <strong>48 heures</strong> par rapport à la date de livraison garantie.</p>
    <h2>Délai de traitement</h2>
    <p>Le remboursement est effectué sous <strong>5 jours ouvrés</strong> après réception du retour confirmé par notre entrepôt.</p>
    <ul>
      <li>Carte bancaire : 3 à 5 jours ouvrés</li>
      <li>Virement SEPA : 1 à 2 jours ouvrés</li>
    </ul>
    <h2>Cas d'exclusion</h2>
    <p>Les commandes en livraison internationale ne sont pas éligibles au remboursement express.</p>
  `,
  versions: [
    { version: 4, updatedAt: new Date(Date.now() - 3_600_000).toISOString(),    authorName: 'Marc Duval', summary: 'Réduction délai CB : 5j → 3j' },
    { version: 3, updatedAt: new Date(Date.now() - 7 * 86_400_000).toISOString(), authorName: 'Marc Duval', summary: 'Ajout délai virement SEPA' },
    { version: 2, updatedAt: new Date(Date.now() - 30 * 86_400_000).toISOString(), authorName: 'Sophie Martin', summary: 'Clarification conditions' },
    { version: 1, updatedAt: new Date(Date.now() - 90 * 86_400_000).toISOString(), authorName: 'Marc Duval', summary: 'Création initiale' },
  ],
  faqs: [
    {
      id:       'faq-1',
      question: 'Le client peut-il choisir le mode de remboursement ?',
      answer:   'Oui, sous réserve que le mode de paiement initial le permette. La carte bancaire est toujours proposée en premier.',
      followUpQuestions: ['Quel est le mode de paiement initial ?', 'Le client a-t-il un compte actif ?'],
    },
    {
      id:       'faq-2',
      question: 'Que faire si le remboursement n\'est pas reçu après 5 jours ?',
      answer:   'Escalader vers le service finance avec le numéro de dossier. Ne jamais promettre de délai supplémentaire sans validation.',
    },
  ],
};

export const MOCK_ARTICLE_LIST: ArticleListItem[] = [
  { id: 'art-1', title: 'Politique de remboursement express',       status: 'published', categoryId: 'cat-1', categoryName: 'Livraisons',    version: 4, authorName: 'Marc Duval',    updatedAt: new Date(Date.now() - 3_600_000).toISOString() },
  { id: 'art-2', title: 'Traitement des retours après 30 jours',    status: 'published', categoryId: 'cat-2', categoryName: 'Retours',        version: 2, authorName: 'Sophie Martin', updatedAt: new Date(Date.now() - 86_400_000 * 2).toISOString() },
  { id: 'art-3', title: 'Gestion des litiges livraison',            status: 'draft',     categoryId: 'cat-1', categoryName: 'Livraisons',    version: 1, authorName: 'Marc Duval',    updatedAt: new Date(Date.now() - 86_400_000).toISOString() },
  { id: 'art-4', title: 'Procédure résiliation abonnement Premium', status: 'published', categoryId: 'cat-3', categoryName: 'Abonnements',   version: 6, authorName: 'Lucie Benoît',  updatedAt: new Date(Date.now() - 86_400_000 * 3).toISOString() },
  { id: 'art-5', title: 'Offres de rétention client',               status: 'published', categoryId: 'cat-3', categoryName: 'Abonnements',   version: 3, authorName: 'Lucie Benoît',  updatedAt: new Date(Date.now() - 86_400_000 * 5).toISOString() },
];

export async function mockGetArticle(id: string): Promise<Article> {
  await simulateDelay(400);
  if (id === 'art-1') return MOCK_ARTICLE;
  // Return a variant for other IDs
  return { ...MOCK_ARTICLE, id, title: `Article ${id}` };
}

export async function mockGetArticleList(): Promise<ArticleListItem[]> {
  await simulateDelay(400);
  return MOCK_ARTICLE_LIST;
}
