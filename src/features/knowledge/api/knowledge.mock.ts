import type { Category, QuestionTree } from '../types';
import { simulateDelay } from '../../auth/api/authApi.mock';

/* ── Categories ─────────────────────────────────────────────── */

export const MOCK_CATEGORIES: Category[] = [
  {
    id: 'cat-1', name: 'Livraisons', parentId: null, articleCount: 8, children: [
      { id: 'cat-1a', name: 'Remboursements', parentId: 'cat-1', articleCount: 4, children: [] },
      { id: 'cat-1b', name: 'Retours produit', parentId: 'cat-1', articleCount: 3, children: [] },
    ],
  },
  {
    id: 'cat-2', name: 'Abonnements', parentId: null, articleCount: 6, children: [
      { id: 'cat-2a', name: 'Résiliations',    parentId: 'cat-2', articleCount: 3, children: [] },
      { id: 'cat-2b', name: 'Changements plan', parentId: 'cat-2', articleCount: 2, children: [] },
    ],
  },
  {
    id: 'cat-3', name: 'Facturation', parentId: null, articleCount: 5, children: [],
  },
  {
    id: 'cat-4', name: 'Litiges', parentId: null, articleCount: 4, children: [],
  },
];

/* ── Question tree: qualify a refund request ────────────────── */

export const MOCK_QUESTION_TREE: QuestionTree = {
  id:          'tree-1',
  title:       'Qualifier une demande de remboursement',
  categoryId:  'cat-1a',
  categoryName: 'Remboursements',
  rootNodeId:  'node-1',
  updatedAt:   new Date(Date.now() - 86_400_000 * 2).toISOString(),

  nodes: {
    'node-1': {
      id: 'node-1',
      question: 'Quel est le motif de la demande ?',
      hint: 'Demandez au client de décrire brièvement le problème.',
      options: [
        { id: 'opt-1a', label: 'Colis non reçu',          nextNodeId: 'node-2'  },
        { id: 'opt-1b', label: 'Produit endommagé',        nextNodeId: 'node-3'  },
        { id: 'opt-1c', label: 'Mauvais produit reçu',     nextNodeId: 'node-4'  },
        { id: 'opt-1d', label: 'Retard de livraison',      articleId: 'art-1', answer: 'Appliquer la politique de remboursement express : délai garanti sous 5 jours ouvrés.' },
        { id: 'opt-1e', label: 'Autre motif',              nextNodeId: 'node-5'  },
      ],
    },

    'node-2': {
      id: 'node-2',
      question: 'Le suivi colis indique-t-il "livré" ?',
      hint: 'Vérifiez le tracking dans le CRM avant de répondre.',
      options: [
        { id: 'opt-2a', label: 'Oui — marqué livré',       nextNodeId: 'node-2b' },
        { id: 'opt-2b', label: 'Non — en transit',         articleId: 'art-2', answer: 'Ouvrir un dossier litige transporteur. Délai de traitement : 5 à 10 jours.' },
        { id: 'opt-2c', label: 'Suivi indisponible',       articleId: 'art-2', answer: 'Contacter le transporteur en interne. Ne pas promettre de délai au client.' },
      ],
    },

    'node-2b': {
      id: 'node-2b',
      question: 'Le client a-t-il vérifié auprès des voisins et de sa boîte aux lettres ?',
      options: [
        { id: 'opt-2b1', label: 'Oui — introuvable',       articleId: 'art-1', answer: 'Déclencher remboursement intégral + signalement transporteur. Délai : 3 à 5 jours.' },
        { id: 'opt-2b2', label: 'Non — pas encore vérifié', answer: 'Demander au client de vérifier et rappeler. Ne pas créer de dossier pour l\'instant.' },
      ],
    },

    'node-3': {
      id: 'node-3',
      question: 'Le client a-t-il des photos du dommage ?',
      hint: 'Les photos sont requises pour les dossiers > 50 €.',
      options: [
        { id: 'opt-3a', label: 'Oui — photos disponibles', articleId: 'art-1', answer: 'Accepter le remboursement. Demander les photos par email et créer le dossier.' },
        { id: 'opt-3b', label: 'Non — pas de photos',       nextNodeId: 'node-3b' },
      ],
    },

    'node-3b': {
      id: 'node-3b',
      question: 'Quelle est la valeur de la commande ?',
      options: [
        { id: 'opt-3b1', label: 'Moins de 50 €',  articleId: 'art-1', answer: 'Remboursement accordé sans photos pour les montants < 50 €. Traitement sous 48h.' },
        { id: 'opt-3b2', label: 'Plus de 50 €',   answer: 'Photos obligatoires. Inviter le client à en envoyer dans les 7 jours ouvrés pour ouvrir le dossier.' },
      ],
    },

    'node-4': {
      id: 'node-4',
      question: 'Le bon produit est-il encore disponible en stock ?',
      options: [
        { id: 'opt-4a', label: 'Oui — en stock',  answer: 'Proposer renvoi du bon produit en livraison express (J+1). Retour du mauvais produit pris en charge.' },
        { id: 'opt-4b', label: 'Non — rupture',   articleId: 'art-1', answer: 'Remboursement intégral proposé. Retour du mauvais produit pris en charge.' },
      ],
    },

    'node-5': {
      id: 'node-5',
      question: 'Le client souhaite-t-il un remboursement ou un avoir ?',
      options: [
        { id: 'opt-5a', label: 'Remboursement', articleId: 'art-1', answer: 'Traiter selon la politique standard de remboursement.' },
        { id: 'opt-5b', label: 'Avoir',          answer: 'Émettre un avoir valable 12 mois. Confirmer le montant par email.' },
        { id: 'opt-5c', label: 'Pas décidé',     answer: 'Laisser 48h de réflexion au client. Recontacter si pas de retour.' },
      ],
    },
  },
};

/* ── API simulators ─────────────────────────────────────────── */

export async function mockGetCategories(): Promise<Category[]> {
  await simulateDelay(300);
  return MOCK_CATEGORIES;
}

export async function mockGetQuestionTree(treeId: string): Promise<QuestionTree> {
  await simulateDelay(400);
  return { ...MOCK_QUESTION_TREE, id: treeId };
}
