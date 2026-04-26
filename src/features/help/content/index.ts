export interface HelpArticle {
  id:      string;
  title:   string;
  content: string; // Markdown
}

export interface HelpSection {
  id:       string;
  title:    string;
  icon:     string;
  articles: HelpArticle[];
}

export const HELP_CONTENT: HelpSection[] = [
  {
    id:    'getting-started',
    title: 'Premiers pas',
    icon:  '🚀',
    articles: [
      {
        id:    'create-workspace',
        title: 'Créer son espace KnowDesk',
        content: `
## Créer ton espace KnowDesk

Lors de ta première connexion, KnowDesk te guide à travers un processus d'onboarding en 3 étapes :

**1. Nom de ton organisation**
Donne un nom clair à ton espace — c'est ce que verront tes collaborateurs quand ils rejoignent l'équipe.

**2. Première catégorie**
Les catégories organisent ta base de connaissance. Commence avec une catégorie principale, tu pourras en ajouter autant que tu veux ensuite.

**3. Premier article**
Rédige un premier article pour tester l'éditeur. Il peut s'agir d'une procédure simple ou d'une FAQ.

> 💡 **Astuce** : Ne cherche pas la perfection dès le départ. Commence avec quelques articles clés, et enrichis ta base au fil du temps.
        `.trim(),
      },
      {
        id:    'invite-members',
        title: 'Inviter les premiers membres',
        content: `
## Inviter les premiers membres

Pour inviter un collaborateur dans ton espace :

1. Va dans **Équipe** depuis le menu de gauche
2. Clique sur **Inviter un membre**
3. Saisis son adresse email
4. Choisis son rôle : **Manager** ou **Conseiller**
5. Clique sur **Envoyer l'invitation**

Ton collaborateur reçoit un email avec un lien d'activation valable **7 jours**. Il choisit son mot de passe lors de sa première connexion.

> 💡 **Astuce** : Tu peux inviter plusieurs personnes en même temps en répétant l'opération.
        `.trim(),
      },
      {
        id:    'roles',
        title: 'Comprendre les rôles',
        content: `
## Les rôles dans KnowDesk

KnowDesk propose 3 niveaux d'accès :

**Admin**
- Accès complet à toutes les fonctionnalités
- Gère les membres, les paramètres et la facturation
- Crée, modifie et supprime tous les contenus

**Manager**
- Crée et publie des articles et processus guidés
- Invite et gère les conseillers
- Ne peut pas accéder aux paramètres de facturation

**Conseiller**
- Consulte et recherche dans la base de connaissance
- Suit les processus guidés pendant les appels clients
- Ne peut pas créer ni modifier de contenu

> 💡 **Astuce** : Attribue le rôle **Manager** à tes responsables d'équipe pour qu'ils puissent maintenir la base de connaissance de façon autonome.
        `.trim(),
      },
      {
        id:    'settings-basics',
        title: 'Configurer les paramètres de base',
        content: `
## Configurer les paramètres de base

Accède aux paramètres depuis l'icône **Paramètres** en bas du menu.

**Nom de l'organisation**
Modifie le nom affiché dans l'interface et dans les emails envoyés à tes collaborateurs.

**Notifications**
Configure quels événements déclenchent une notification :
- Nouvel article publié
- Nouveau membre rejoint l'équipe
- Résumé hebdomadaire

**Mon compte**
Depuis l'icône **Mon compte**, tu peux modifier ton prénom, nom, adresse email et mot de passe.
        `.trim(),
      },
    ],
  },
  {
    id:    'articles',
    title: 'Articles',
    icon:  '📄',
    articles: [
      {
        id:    'create-article',
        title: 'Créer et structurer un article',
        content: `
## Créer et structurer un article

Pour créer un article :

1. Clique sur **Base de connaissance** dans le menu
2. Clique sur **+ Créer un article**
3. Saisis un titre clair et descriptif
4. Sélectionne une catégorie
5. Rédige ton contenu dans l'éditeur

**Conseils de rédaction**
- Commence par le plus important — tes conseillers lisent souvent en diagonale
- Utilise des listes à puces pour les étapes et procédures
- Sois concis : un article = un sujet
- Ajoute des exemples concrets quand c'est possible

> 💡 **Astuce** : L'éditeur sauvegarde automatiquement ton travail toutes les 30 secondes. Tu ne perdras jamais une modification.
        `.trim(),
      },
      {
        id:    'categories',
        title: 'Organiser par catégories',
        content: `
## Organiser par catégories

Les catégories structurent ta base de connaissance. Tu peux créer une hiérarchie jusqu'à plusieurs niveaux.

**Créer une catégorie**
1. Va dans **Base de connaissance**
2. Clique sur **+ Catégorie** dans le panneau de gauche
3. Donne-lui un nom clair

**Bonne organisation**
Pense à tes catégories comme des dossiers. Quelques exemples :
- Par thématique : *Facturation*, *Livraison*, *Retours*
- Par type de demande : *FAQ*, *Procédures*, *Scripts*
- Par produit : *Produit A*, *Produit B*

> 💡 **Astuce** : Ne crée pas trop de catégories au départ. Commence simple et réorganise au fur et à mesure que ta base grandit.
        `.trim(),
      },
      {
        id:    'publish',
        title: 'Publier vs garder en brouillon',
        content: `
## Publier vs garder en brouillon

Un article peut avoir deux statuts :

**Brouillon**
- Visible uniquement par les admins et managers
- Utile pour préparer un contenu avant de le rendre disponible
- Sauvegardé automatiquement

**Publié**
- Visible par tous les membres de l'équipe
- Apparaît dans les résultats de recherche
- Peut être mis à jour à tout moment

**Comment publier**
Dans l'éditeur, clique sur **Publier** en haut à droite. Si l'article était déjà publié, le bouton affiche **Mettre à jour**.

> 💡 **Astuce** : Publie même si l'article n'est pas parfait. Il vaut mieux avoir un contenu imparfait disponible qu'un contenu parfait en brouillon.
        `.trim(),
      },
      {
        id:    'versions',
        title: 'Historique des versions',
        content: `
## Historique des versions

KnowDesk conserve l'historique de toutes les versions publiées de tes articles.

**Consulter l'historique**
1. Ouvre un article en mode édition
2. Clique sur **Historique** en haut à droite
3. Le panneau affiche toutes les versions avec leur date

**Restaurer une version**
1. Dans le panneau Historique, trouve la version souhaitée
2. Clique sur **Restaurer**
3. Le contenu de l'éditeur est remplacé par cette version
4. Clique sur **Mettre à jour** pour publier la version restaurée

> 💡 **Astuce** : La restauration ne publie pas automatiquement — tu peux vérifier le contenu avant de le remettre en ligne.
        `.trim(),
      },
    ],
  },
  {
    id:    'trees',
    title: 'Processus guidés',
    icon:  '🌳',
    articles: [
      {
        id:    'what-is-tree',
        title: 'Comprendre les processus guidés',
        content: `
## Comprendre les processus guidés

Un processus guidé est un arbre de décision que tes conseillers suivent étape par étape pendant un appel client.

**Comment ça fonctionne**
Le conseiller voit une question et plusieurs réponses possibles. Selon sa réponse, il arrive à la question suivante ou directement à une conclusion — la marche à suivre pour ce cas précis.

**Exemple concret**
> *Le client veut être remboursé*
> → Le produit est-il défectueux ?
>   - Oui → L'achat date de moins de 30 jours ?
>     - Oui → ✅ Remboursement intégral. Demander le numéro de commande.
>     - Non → ✅ Échange standard uniquement.
>   - Non → Le client a-t-il le ticket de caisse ?
>     - Oui → ✅ Remboursement sur justificatif.
>     - Non → ✅ Refus. Proposer un avoir exceptionnel.

**Avantages**
- Réduit les erreurs de traitement
- Homogénéise les réponses de l'équipe
- Accélère la formation des nouveaux conseillers
        `.trim(),
      },
      {
        id:    'create-tree',
        title: 'Créer un processus guidé',
        content: `
## Créer un processus guidé

1. Va dans **Processus** depuis le menu de gauche
2. Clique sur **+ Nouveau processus**
3. Donne-lui un titre clair (ex. *Remboursement produit*)
4. Clique sur **Créer** — l'éditeur s'ouvre automatiquement

**Dans l'éditeur**
- Clique sur **+ Ajouter un point d'entrée** pour créer la première question
- Tu peux avoir plusieurs points d'entrée pour un même processus

> 💡 **Astuce** : Commence par dessiner ton arbre sur papier avant de le saisir dans KnowDesk. C'est plus rapide.
        `.trim(),
      },
      {
        id:    'tree-nodes',
        title: 'Ajouter questions, réponses et conclusions',
        content: `
## Ajouter questions, réponses et conclusions

**Ajouter une question**
1. Clique sur **+ Ajouter un point d'entrée** ou **+ Ajouter un nœud** sous une réponse
2. Sélectionne le type **Question**
3. Saisis le texte de la question
4. Clique sur **Ajouter**

**Ajouter des réponses**
Sous chaque question, clique sur **+ Ajouter une réponse** et saisis le libellé (ex. *Oui*, *Non*, *Je ne sais pas*).

**Ajouter une conclusion**
Sous une réponse, clique sur **+ Ajouter un nœud**, sélectionne **Conclusion** et saisis la marche à suivre pour le conseiller.

**Modifier ou supprimer**
Chaque nœud a des boutons ✏️ (modifier) et 🗑 (supprimer) accessibles au survol.

> ⚠️ **Attention** : Supprimer un nœud supprime aussi tous ses nœuds enfants.
        `.trim(),
      },
      {
        id:    'tree-publish',
        title: 'Publier un processus',
        content: `
## Publier un processus

Un processus en **Brouillon** n'est pas visible par les conseillers. Pour le rendre disponible :

1. Dans l'éditeur, clique sur **Aperçu conseiller** pour vérifier le rendu
2. Navigue dans l'arbre pour t'assurer que tous les chemins mènent à une conclusion
3. Clique sur **Publier** en haut à droite

Une fois publié, le processus apparaît dans l'onglet **Processus** de la Base de connaissance.

> 💡 **Astuce** : Utilise l'aperçu conseiller pour tester tous les chemins possibles avant de publier.
        `.trim(),
      },
    ],
  },
  {
    id:    'team',
    title: 'Équipe',
    icon:  '👥',
    articles: [
      {
        id:    'invite',
        title: 'Inviter un collaborateur',
        content: `
## Inviter un collaborateur

1. Va dans **Équipe** depuis le menu de gauche
2. Clique sur **Inviter un membre**
3. Saisis l'adresse email du collaborateur
4. Sélectionne son rôle (**Manager** ou **Conseiller**)
5. Clique sur **Envoyer l'invitation**

Le collaborateur reçoit un email avec un lien pour créer son compte. Ce lien est valable **7 jours**.

**Si le lien a expiré**
Dans la liste des membres, trouve le collaborateur avec le statut *Invitation envoyée* et clique sur **Renvoyer**.
        `.trim(),
      },
      {
        id:    'manage-roles',
        title: 'Gérer les rôles et permissions',
        content: `
## Gérer les rôles et permissions

**Changer le rôle d'un membre**
1. Va dans **Équipe**
2. Trouve le membre dans la liste
3. Clique sur son rôle actuel
4. Sélectionne le nouveau rôle dans le menu

**Les rôles disponibles**
- **Admin** : accès complet
- **Manager** : création de contenu + gestion des conseillers
- **Conseiller** : consultation uniquement

> ⚠️ **Attention** : Tu ne peux pas rétrograder le dernier admin de l'espace.
        `.trim(),
      },
      {
        id:    'disable-member',
        title: 'Désactiver un membre',
        content: `
## Désactiver un membre

Désactiver un membre lui retire l'accès à KnowDesk sans supprimer son compte ni son historique.

1. Va dans **Équipe**
2. Trouve le membre dans la liste
3. Clique sur le menu **⋯** à droite de son nom
4. Sélectionne **Désactiver**
5. Confirme l'action

Le membre ne peut plus se connecter immédiatement. Tu peux le réactiver à tout moment depuis la même liste.

> 💡 **Astuce** : Préfère la désactivation à la suppression — tu conserves ainsi l'historique des contributions du membre.
        `.trim(),
      },
    ],
  },
  {
    id:    'settings',
    title: 'Paramètres',
    icon:  '⚙️',
    articles: [
      {
        id:    'org-settings',
        title: 'Paramètres de l\'organisation',
        content: `
## Paramètres de l'organisation

Accède aux paramètres depuis l'icône **⚙️** en bas du menu de gauche.

**Nom de l'organisation**
Le nom affiché dans l'interface et dans les emails envoyés à tes collaborateurs. Modifie-le et clique sur **Enregistrer**.

**Notifications email**
Configure les événements qui déclenchent un email :
- **Article mis à jour** : reçois un email quand un article est publié ou modifié
- **Nouveau membre** : reçois un email quand quelqu'un rejoint l'espace
- **Résumé hebdomadaire** : reçois chaque semaine un récapitulatif de l'activité
        `.trim(),
      },
      {
        id:    'account-settings',
        title: 'Modifier son profil',
        content: `
## Modifier son profil

Accède à ton profil depuis l'icône **👤** en bas du menu de gauche.

**Modifier ton prénom et nom**
Saisis tes nouvelles informations et clique sur **Enregistrer**.

**Changer ton adresse email**
1. Saisis ta nouvelle adresse email
2. Clique sur **Changer l'email**
3. Un email de confirmation est envoyé à la nouvelle adresse
4. Clique sur le lien dans l'email pour confirmer le changement

**Changer ton mot de passe**
1. Saisis ton mot de passe actuel
2. Saisis et confirme ton nouveau mot de passe (8 caractères minimum)
3. Clique sur **Changer le mot de passe**

Tu es automatiquement déconnecté après un changement d'email ou de mot de passe.
        `.trim(),
      },
{
  id:    'api-keys',
  title: 'Gérer les clés API',
  content: `
## Gérer les clés API

Les clés API permettent à des applications tierces d'accéder en lecture à ta base de connaissance KnowDesk — sans que les utilisateurs aient besoin de se connecter.

**Accéder à la gestion des clés**
Va dans **Paramètres → API** depuis le menu de gauche.

**Créer une clé**
1. Clique sur **+ Créer une clé**
2. Donne-lui un nom descriptif (ex. *Intégration Hubicus*, *Site web*)
3. Clique sur **Créer**
4. Copie immédiatement la clé affichée — elle ne sera plus visible après fermeture

> ⚠️ **Attention** : La clé complète n'est affichée qu'une seule fois. Si tu la perds, tu devras en créer une nouvelle.

**Ce qu'une clé API permet de faire**
- Lire la liste des catégories
- Lire la liste des articles publiés et leur contenu
- Lire les processus guidés publiés et leur structure

**Ce qu'une clé API ne permet pas**
- Créer ou modifier du contenu
- Accéder aux brouillons
- Gérer les membres ou les paramètres

**Utiliser une clé dans une requête**
Ajoute le header \`X-API-Key\` à chaque requête :
\`\`\`
GET https://knowdesk-production.up.railway.app/public/v1/articles
X-API-Key: kd_live_ta_cle_api
\`\`\`

**Révoquer une clé**
Dans la liste des clés, clique sur **Révoquer** à droite de la clé concernée et confirme. La révocation est immédiate et irréversible — toute application utilisant cette clé perdra l'accès instantanément.

> 💡 **Astuce** : Crée une clé par application ou service qui utilise l'API. Si une clé est compromise, tu peux la révoquer sans impacter les autres intégrations.

**Consulter la documentation API complète**
La documentation détaillée avec tous les endpoints et exemples de code est disponible sur :
\`https://know-desk-frontend.vercel.app/?api-docs\`
  `.trim(),
},

    ],
  },
];

// Index pour la recherche
export const HELP_INDEX = HELP_CONTENT.flatMap(section =>
  section.articles.map(article => ({
    sectionId:    section.id,
    sectionTitle: section.title,
    articleId:    article.id,
    title:        article.title,
    content:      article.content,
  }))
);
