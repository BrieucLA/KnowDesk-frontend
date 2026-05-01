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
- Accède à Analytics et à la gestion des tags / synonymes

**Manager**
- Crée et publie des articles et processus guidés
- Invite et gère les conseillers
- Accède à Analytics
- Ne peut pas gérer les paramètres avancés (tags, synonymes, facturation)

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
Depuis l'icône **Mon compte** (initiales en bas du menu), tu peux modifier ton prénom, nom, adresse email et mot de passe.
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

> 💡 **Astuce** : L'éditeur sauvegarde automatiquement ton travail au fil de la frappe. Tu ne perdras jamais une modification, et le statut de sauvegarde est affiché en haut de l'écran.
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

> 💡 **Astuce** : Une catégorie est unique par article. Pour des classements transversaux (saisonnalité, statut éditorial…), utilise plutôt les **tags**.
        `.trim(),
      },
      {
        id:    'add-tags',
        title: 'Ajouter des tags à un article',
        content: `
## Ajouter des tags à un article

Les tags complètent la catégorie en permettant un classement transversal — un article peut porter plusieurs tags.

**Tagger depuis l'éditeur**
1. Ouvre un article (ou crée-en un nouveau)
2. Sous le sélecteur de catégorie, tu trouves le champ **Tags**
3. Tape le début d'un tag — KnowDesk te propose les tags déjà utilisés dans ton organisation
4. Valide avec **Entrée** ou une **virgule**
5. Pour retirer un tag, clique sur le ✕ à côté

**Combien de tags ?**
- 10 tags maximum par article
- 200 tags maximum par organisation

**Bonnes pratiques**
- Évite les doublons de sens (« remboursement » et « refund » → un seul)
- Préfère des tags courts et stables
- Pour des opérations courtes (Black Friday, Soldes 2026), utilise un tag dédié — tu pourras le supprimer une fois l'opération passée

> 💡 **Astuce** : Les tags sont normalisés automatiquement. \`Black Friday\`, \`black friday\` et \`BLACK FRIDAY\` deviennent un seul tag, avec la première casse saisie comme nom affiché.
        `.trim(),
      },
      {
        id:    'filter-by-tag',
        title: 'Filtrer la liste par tag',
        content: `
## Filtrer la liste par tag

Tu peux croiser plusieurs tags pour retrouver rapidement un sous-ensemble d'articles.

**Comment filtrer**
1. Va dans **Base de connaissance**
2. Sous les onglets **Tous / Publiés / Brouillons**, une rangée de chips affiche les tags de l'organisation avec leur nombre d'articles
3. Clique sur un tag pour l'activer (il devient bleu)
4. Clique sur d'autres tags pour combiner — c'est un filtre **ET** : seuls les articles qui portent **tous** les tags sélectionnés apparaissent
5. Clique sur **Effacer** pour retirer le filtre

Le filtre tag se combine avec le filtre catégorie de la sidebar et le filtre statut. Tu peux par exemple voir uniquement les *brouillons* taggés *Black Friday* dans la catégorie *Facturation*.

> 💡 **Astuce** : Pour une recherche par tag depuis n'importe quelle page, utilise plutôt la barre de recherche globale (\`Cmd+K\`) — voir la section **Recherche**.
        `.trim(),
      },
      {
        id:    'insert-image',
        title: 'Insérer une image dans un article',
        content: `
## Insérer une image dans un article

L'éditeur accepte les images directement collées ou glissées-déposées.

**Trois manières d'insérer**
1. **Coller** : copie une image depuis ton presse-papiers et fais \`Cmd+V\` (\`Ctrl+V\`) dans l'éditeur
2. **Glisser-déposer** : fais glisser un fichier image depuis ton bureau directement dans la zone de contenu
3. **Bouton image** : clique sur l'icône image dans la barre d'outils de l'éditeur

L'image est uploadée automatiquement et apparaît à l'endroit du curseur. Tu peux ensuite cliquer dessus pour la redimensionner ou la supprimer.

**Limites**
- Formats acceptés : PNG, JPG, GIF, WebP
- Taille maximale : 5 Mo par image

> ⚠️ **Attention** : Les images sont stockées de façon permanente liée à l'article. Si tu supprimes l'article, ses images ne sont plus accessibles publiquement.

> 💡 **Astuce** : Compresse tes captures d'écran avant import — un article qui charge vite est un article qui sert.
        `.trim(),
      },
      {
        id:    'insert-link',
        title: 'Insérer un lien (interne ou externe)',
        content: `
## Insérer un lien (interne ou externe)

Tu peux pointer vers une URL externe ou vers un autre article de ta base.

**Lien externe**
1. Sélectionne le texte qui doit devenir un lien
2. Clique sur l'icône lien dans la barre d'outils (ou \`Cmd+K\`)
3. Colle l'URL et valide

**Lien vers un autre article (interne)**
1. Sélectionne le texte
2. Clique sur l'icône lien
3. Tape le titre de l'article cible — KnowDesk propose les articles correspondants
4. Clique sur l'article voulu

Quand un conseiller clique sur un lien interne dans la fiche article, il navigue directement vers l'article cible sans quitter KnowDesk.

> 💡 **Astuce** : Les liens internes sont précieux pour relier les articles connexes — un article *Politique de remboursement* peut pointer vers *Procédure de retour*.
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
3. Le contenu de l'éditeur est remplacé par cette version, et l'article repasse en brouillon
4. Vérifie le contenu, puis clique sur **Publier** pour rendre la version restaurée disponible aux conseillers

> 💡 **Astuce** : La restauration ne publie pas automatiquement — tu peux relire et ajuster avant de remettre en ligne.
        `.trim(),
      },
    ],
  },
  {
    id:    'search',
    title: 'Recherche',
    icon:  '🔍',
    articles: [
      {
        id:    'search-basics',
        title: 'Rechercher dans la base',
        content: `
## Rechercher dans la base

KnowDesk dispose d'une recherche **tolérante aux fautes** qui couvre articles, processus guidés et leurs tags.

**Lancer une recherche**
- Clique sur la barre de recherche en haut de l'écran
- **Raccourci clavier** : appuie sur \`Cmd+K\` (Mac) ou \`Ctrl+K\` (Windows / Linux) depuis n'importe quelle page

**Tolérance aux fautes**
Tu n'as pas besoin de taper le mot exact. \`rembousement\` retrouve *remboursement*, \`livrazon\` retrouve *Livraisons*. La recherche corrige automatiquement les fautes courantes.

**Ce qui est cherché**
La recherche couvre, pour chaque article ou processus publié :
- Le titre
- Le contenu textuel (avec extraits surlignés dans les résultats)
- La catégorie
- Les tags

**Comprendre les résultats**
Chaque résultat affiche :
- Un badge **Article** ou **Processus**
- La catégorie
- Un extrait avec les mots cherchés en surbrillance
- La date de mise à jour

**Naviguer au clavier**
Une fois la barre ouverte, utilise \`↑\` et \`↓\` pour parcourir les résultats, \`Entrée\` pour ouvrir, \`Échap\` pour fermer.

> 💡 **Astuce** : Si une recherche fréquente ne ramène rien, signale-le : c'est un signal éditorial. Côté admin/manager, ces requêtes apparaissent dans **Analytics → Recherches sans résultat**.
        `.trim(),
      },
      {
        id:    'synonyms',
        title: 'Définir des synonymes (admin)',
        content: `
## Définir des synonymes propres à votre organisation

Les synonymes permettent à la recherche de comprendre le vocabulaire métier de ton entreprise. Une recherche sur un terme remonte aussi les contenus utilisant ses synonymes — et vice-versa.

**Quand est-ce utile ?**
- Tes conseillers parlent de « résiliation » mais tes articles utilisent « clôture de compte »
- Tes clients disent « remboursement » alors que ton équipe écrit « avoir »
- Ton produit a un nom officiel et un surnom interne

**Créer un synonyme**
1. Va dans **Paramètres → Recherche** (visible uniquement aux admins)
2. Clique sur **+ Ajouter un synonyme**
3. Saisis le **terme** principal (ex. *annulation*)
4. Saisis un ou plusieurs **synonymes** (ex. *résiliation*, *clôture*) — Entrée ou virgule pour valider chaque chip
5. Clique sur **Créer**

**Comportement bidirectionnel**
La relation est automatiquement réciproque. Si tu déclares *annulation* ↔ *résiliation* :
- Une recherche sur *annulation* remonte aussi les articles contenant *résiliation*
- Une recherche sur *résiliation* remonte aussi les articles contenant *annulation*

Tu n'as pas à saisir les deux sens.

**Modifier ou supprimer**
Sur chaque ligne de la liste :
- **Modifier** : ajuste la liste des synonymes (le terme principal n'est pas modifiable — supprime et recrée si besoin)
- **Supprimer** : retire le synonyme. Le cache des recherches est invalidé immédiatement.

> ⚠️ **Attention** : Les synonymes sont **scopés à ton organisation**. Aucune autre organisation KnowDesk ne voit ni n'utilise tes synonymes.

> 💡 **Astuce** : Construis ton dictionnaire au fur et à mesure des cas observés. Inutile de tout définir d'un coup.
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

Une fois publié, le processus apparaît dans l'onglet **Processus** de la Base de connaissance — et il devient cherchable depuis la barre de recherche globale (Cmd+K).

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
- **Manager** : création de contenu + gestion des conseillers + Analytics
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
3. Clique sur le bouton **Désactiver** dans la colonne *Actions*, à droite de la ligne
4. Confirme l'action

Le membre ne peut plus se connecter immédiatement. Tu peux le réactiver à tout moment depuis la même liste — le bouton **Désactiver** est remplacé par **Réactiver** sur les lignes des membres désactivés.

> 💡 **Astuce** : Préfère la désactivation à la suppression — tu conserves ainsi l'historique des contributions du membre.
        `.trim(),
      },
    ],
  },
  {
    id:    'analytics',
    title: 'Analytics',
    icon:  '📊',
    articles: [
      {
        id:    'analytics-overview',
        title: 'Lire le tableau Analytics',
        content: `
## Lire le tableau Analytics

La page **Analytics** te donne une vue d'ensemble de la santé éditoriale de ta base. Elle est visible aux **admins** et **managers**.

**Accéder à Analytics**
Clique sur l'icône Analytics (graphique en barres) dans le menu de gauche.

**Rangée du haut — Inventaire et engagement**
- **Articles publiés / brouillons / archivés** : photographie globale de ton stock
- **Tags** et **Processus guidés** : volumétrie associée
- **Actifs aujourd'hui / 7 jours / 30 jours** : utilisateurs distincts ayant consulté un article ou fait une recherche

**Cartes orientées action**
Toutes les listes sont **cliquables** : un clic ouvre directement l'article concerné, le bouton **← Retour** te ramène sur Analytics.

- **Articles les plus consultés** — Top 10 sur 30 jours
- **Articles peu consultés** — Articles publiés depuis plus de 30 jours et lus au plus une fois sur la fenêtre. Candidats à mise à jour ou retrait
- **Top recherches** — Requêtes les plus fréquentes
- **Recherches sans résultat** — Requêtes qui n'ont rien retourné. **Gold mine éditoriale** : autant de sujets à couvrir
- **Articles à vérifier** — Publiés mais sans mise à jour depuis plus de 90 jours
- **Brouillons orphelins** — Drafts qui dorment depuis plus de 30 jours
- **Articles sans tag** — À tagger pour améliorer leur retrouvabilité
- **Top contributeurs** — Auteurs les plus actifs (total et 30 derniers jours)
- **Couverture par catégorie** — Identifie les catégories sous-documentées
- **Tags utilisés** et **Tags inutilisés** — Hygiène du vocabulaire

**Fenêtre temporelle**
Les indicateurs basés sur l'activité (vues, recherches, engagement) couvrent les **30 derniers jours**. Les indicateurs structurels (articles à vérifier, tags inutilisés…) reflètent l'état actuel.

**Confidentialité**
Aucune donnée individuelle d'utilisation par conseiller n'est exposée. Les statistiques d'engagement sont **agrégées par organisation**. Les événements bruts sont automatiquement purgés après **90 jours**.

> 💡 **Astuce** : La carte **Recherches sans résultat** est probablement la plus actionnable. Chaque requête infructueuse est un sujet que tes conseillers cherchent et que ta base ne couvre pas — c'est le meilleur indicateur pour orienter ta création de contenu.
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

**Notifications**
Configure les événements qui déclenchent une notification dans le panneau **🔔** en bas du menu de gauche :
- **Article publié** : un nouvel article a été mis en ligne par ton équipe
- **Nouveau membre** : quelqu'un vient de rejoindre l'espace

> 💡 **Astuce** : Clique sur l'icône cloche **🔔** dans la barre de gauche pour ouvrir le panneau et marquer les notifications comme lues.
        `.trim(),
      },
      {
        id:    'manage-tags',
        title: 'Gérer les tags (admin)',
        content: `
## Gérer les tags de votre organisation

Les tags se créent automatiquement quand un contributeur en saisit dans l'éditeur. Cette page (visible aux **admins** uniquement) sert à faire le ménage et à uniformiser le vocabulaire.

**Accéder à la gestion**
Va dans **Paramètres → Tags**.

**Lire la liste**
Chaque ligne montre :
- Le **nom** affiché du tag
- Le **nombre d'articles** qui l'utilisent

**Renommer un tag**
1. Clique sur **Renommer** sur la ligne du tag
2. Saisis le nouveau nom dans la modale
3. Clique sur **Enregistrer**

Le nouveau nom se propage immédiatement à tous les articles qui portaient ce tag — y compris dans la fiche article et les filtres.

**Cas particulier — fusion automatique**
Si tu renommes un tag avec un nom déjà utilisé par un autre tag (insensible à la casse), KnowDesk **fusionne** les deux : tous les articles taggés avec l'ancien deviennent taggés avec le tag cible. C'est utile pour nettoyer les doublons (\`remboursement\` et \`Remboursement\`).

**Supprimer un tag**
Clique sur **Supprimer**. Une confirmation rappelle combien d'articles seront impactés. Les articles ne sont **pas** supprimés — ils perdent simplement ce tag.

> 💡 **Astuce** : Utilise la page **Analytics** pour repérer les tags inutilisés et nettoyer.
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

> ⚠️ **Attention** : Pour ta sécurité, **toutes tes sessions actives sont invalidées** après un changement de mot de passe ou la confirmation d'un changement d'email. Tu seras redirigé vers la page de connexion à ta prochaine action.
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
