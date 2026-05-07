# KnowDesk — Guide Claude Code

## Vue d'ensemble

KnowDesk est un SaaS de base de connaissance pour les équipes service client. Il permet aux conseillers de créer, organiser et consulter des articles et processus guidés (arbres de décision).

## Stack technique

| Composant | Technologie |
|---|---|
| Frontend | React 18 + TypeScript + Vite — déployé sur Vercel |
| Backend | Node.js + Express + TypeScript — déployé sur Railway |
| ORM | Kysely (query builder typé) |
| Base de données | PostgreSQL (Railway) |
| Cache / Queue | Redis + BullMQ (Railway) |
| Stockage fichiers | Cloudflare R2 (compatible S3) |
| Email | Resend SDK |
| Auth | JWT (access token 15min + refresh token) |

## Repos GitHub

- Backend : `BrieucLA/KnowDesk`
- Frontend : `BrieucLA/KnowDesk-frontend`

## URLs

- Production backend : `https://knowdesk-production.up.railway.app`
- Production frontend : `https://know-desk-frontend.vercel.app`
- DB Railway (public) : voir variable `DATABASE_URL` dans Railway → service Postgres → onglet Variables. **Ne JAMAIS commit le mot de passe en clair** (cf incident sécurité — rotation effectuée).

## Structure des projets

### Backend (`~/KDProject/knowdesk-backend/`)

```
src/
  app.ts                          # Point d'entrée Express
  modules/
    auth/                         # Login, register, forgot/reset password
    articles/                     # CRUD articles + versioning
    categories/                   # CRUD catégories
    members/                      # Gestion membres + invitations
    notifications/                # Notifications in-app
    settings/                     # Paramètres org + danger zone
    account/                      # Profil utilisateur + onboarding
    trees/                        # Processus guidés (arbres de décision)
    superadmin/                   # Interface superadmin + impersonnification
    apikeys/                      # Génération/révocation clés API
    public/                       # Endpoints publics (X-API-Key)
    images/                       # Upload images vers R2
  middleware/
    auth.middleware.ts             # authenticate + requireRole
    apiKey.middleware.ts           # authenticateApiKey
  infrastructure/
    database/index.ts             # Kysely + types de toutes les tables
    email/index.ts                # Templates email Resend
    storage/r2.ts                 # Upload/delete Cloudflare R2
  shared/
    errors.ts                     # AppError, NotFoundError, ValidationError...
migrations/                       # node-pg-migrate (1_initial → 9_images)
```

### Frontend (`~/KDProject/knowdesk/`)

```
src/
  App.tsx                         # Router principal + guards
  store/
    authStore.ts                  # Zustand — session, onboardingDone, impersonating
  features/
    auth/                         # Login, register, forgot/reset password
    articles/                     # Liste + éditeur articles
    editor/                       # RichTextEditor custom (contenteditable)
    categories/                   # Gestion catégories
    members/                      # Équipe + invitations
    notifications/                # Panel notifications
    settings/                     # Paramètres (général, notifs, billing, API, danger)
    account/                      # Page Mon compte
    trees/                        # Processus guidés
    search/                       # Recherche globale
    help/                         # Centre d'aide contextuelle
    superadmin/                   # Interface superadmin (login, dashboard, impersonnification)
    apidocs/                      # Documentation API publique (?api-docs)
    invitation/                   # Acceptation d'invitation
  shared/
    components/
      layout/                     # AppLayout, SideNav, TopBar
      ui/                         # Button, Input, Skeleton, EmptyState, Toast, Modal, ConfirmDialog, ChipsInput, StatusBadge, ImpersonateBanner...
    lib/
      apiClient.ts                # Wrapper fetch avec auth automatique
      useToast.ts                 # Hook toasts
      formatDate.ts               # formatRelative
    types/index.ts                # User, Organization, UserRole
  styles/
    app.css                       # Design system tokens + composants de base
    sprint3.css                   # AppLayout, SideNav, TopBar, Dashboard...
    sprint4.css                   # Articles, éditeur, processus guidés...
    sprint5.css                   # Membres, settings, notifications, API keys, impersonnification...
```

## Comptes de test (local)

| Email | Mot de passe | Rôle |
|---|---|---|
| admin@acme.fr | CqKnowdesk1! | Admin org Hubicus |
| brieuc@knowdesk.fr | SuperAdmin2025! | Superadmin |

## Commandes courantes

```bash
# Démarrer l'environnement local
cd ~/KDProject/knowdesk-backend && docker compose up -d   # PostgreSQL + Redis
cd ~/KDProject/knowdesk-backend && npm run dev             # Backend :3001
cd ~/KDProject/knowdesk && npm run dev                     # Frontend :5173

# Migrations
cd ~/KDProject/knowdesk-backend && npm run migrate         # Local
DATABASE_URL="postgresql://..." npm run migrate            # Production Railway

# Build
cd ~/KDProject/knowdesk && npm run build
cd ~/KDProject/knowdesk-backend && npm run build

# Tests frontend (vitest + jsdom)
cd ~/KDProject/knowdesk && npm test                        # run unique, exit propre
cd ~/KDProject/knowdesk && npm run test:watch              # mode watch (re-run sur save)

# Tests backend (vitest + supertest)
cd ~/KDProject/knowdesk-backend && npm test                # run unique
cd ~/KDProject/knowdesk-backend && npm run test:watch      # mode watch
```

## Conventions de code

### Backend

- Chaque module a son propre `router.ts` — jamais de logique métier dans `app.ts`
- Toutes les réponses API suivent le format `{ data: T | null, error: string | null }`
- Les erreurs passent par `next(err)` et sont gérées par le middleware global dans `app.ts`
- Kysely pour toutes les requêtes DB — jamais de SQL brut
- Les migrations sont dans `migrations/` avec le pattern `N_nom.js`
- Toujours ajouter les nouveaux types dans `src/infrastructure/database/index.ts`
- Variables d'environnement validées au démarrage via Zod dans `app.ts`

### Frontend

- Feature-based architecture — chaque feature dans `src/features/`
- Les composants partagés vont dans `src/shared/components/`
- Les appels API passent par `apiClient` (jamais `fetch()` direct dans un composant — gère cookie + refresh automatique)
- Le store Zustand (`authStore`) est persisté en `sessionStorage`
- CSS uniquement via les classes du design system — pas de `style={{}}` sauf valeurs runtime (% de barre de progression, CSS custom property dynamique pour indentation, couleur dérivée d'un map)
- Pas de `any` TypeScript sauf cas vraiment nécessaire
- **Routing** : React Router v6 wrappé via `<BrowserRouter>` dans `main.tsx`. `App.tsx` maintient un `useState<View>` + un bridge `pathToView`/`viewToPath` qui synchronise URL ↔ view dans les deux sens. Toutes les vues (sauf `?superadmin`/`?api-docs`/`?token=` legacy) ont une URL canonique deep-linkable
- **Modales** : composant `<Modal>` partagé dans `shared/components/ui/Modal.tsx` (focus trap, Escape, fermeture backdrop, `aria-modal`). Pour les confirmations destructives, utiliser `<ConfirmDialog>` qui s'appuie dessus — **jamais `window.confirm()`** (cassé visuellement, non localisable)
- **Inputs** : toujours `<Input>` (jamais `<input>` brut) pour cohérence d'accessibilité (aria-invalid, aria-describedby)
- **Error handling** : règle stricte
  - Action utilisateur échoue → `toast.error()`
  - Chargement initial échoue → `toast.error()` (l'écran reste, l'utilisateur sait)
  - Sync background non critique (analytics, autocomplete suggestions, onboarding-done) → `.catch()` silencieux légitime
  - Jamais `console.error` ou `errors.general` orphelin
- **`useToast()`** retourne une référence STABLE (instance créée au module level). Tu peux la mettre en deps de `useEffect` sans déclencher de boucle

## Design system

Voir `KNOWDESK_DESIGN_SYSTEM.docx` pour la référence complète.

Règles essentielles :
- Font : DM Sans (UI), DM Serif Display (brand only)
- Couleurs : variables CSS `--brand-*`, `--neutral-*`, `--color-danger/success`
- Border-radius : `--radius-sm/md/lg/xl/full`
- Transitions : `--t-fast` (120ms) ou `--t-normal` (200ms)
- Boutons : toujours le composant `<Button variant="..." size="...">`
- Inputs : toujours le composant `<Input>` avec label
- Loading : `<Skeleton>`, jamais de spinner global
- Toasts : `useToast()` hook

## Migrations en production

```bash
cd ~/KDProject/knowdesk-backend
# Étape 1 : déplacer le .env local pour qu'il n'écrase pas DATABASE_URL_PROD.
# node-pg-migrate (et son wrapper "npm run migrate") chargent automatiquement
# le .env présent dans le cwd et la valeur du .env local prend le dessus.
mv .env .env.bak

# Étape 2 : appliquer la migration sur prod (DATABASE_URL_PROD doit être
# exporté dans ton shell, par ex. via ~/.zshrc — ne JAMAIS commit la valeur).
DATABASE_URL="$DATABASE_URL_PROD" npm run migrate

# Étape 3 : restaurer le .env (à faire même si la migration échoue).
mv .env.bak .env
```

> ⚠️ **Sécurité** : ne JAMAIS commit la valeur réelle de `DATABASE_URL` dans le repo, ni dans aucun fichier markdown (CLAUDE.md, README, docs). Variables d'env uniquement, ou bien export shell local ignoré par git.

> ⚠️ **Ordre push/migrate** : appliquer la migration AVANT de push le code qui en dépend. Sinon Railway redéploye, le service crashe au premier appel sur les colonnes manquantes (`SELECT new_col` sur table sans la colonne) et la prod est down jusqu'à la migration. Pattern safe : `migrate prod` → `git push` → Railway redéploye sur DB déjà schemée.

> 🔄 **Rotation password Postgres** : utiliser le bouton **Regenerate** sur la variable `POSTGRES_PASSWORD` du service Postgres dans Railway (pas l'éditer manuellement). Ça déclenche un `ALTER USER` côté DB + propagation aux services qui référencent `${{ Postgres.DATABASE_URL }}`. Mettre à jour `DATABASE_URL_PROD` dans `~/.zshrc` puis `source ~/.zshrc`.

## Variables d'environnement Railway (backend)

```
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
FRONTEND_URL=https://know-desk-frontend.vercel.app
RESEND_API_KEY=...
FROM_EMAIL=onboarding@resend.dev
R2_ACCOUNT_ID=0a0b0f1ca85a134a29898c21334dc996
R2_ACCESS_KEY_ID=5ac079e6cbcd2955db8ae446ce1cc1e3
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=knowdesk-images
R2_PUBLIC_URL=https://pub-2e6d152f4911496d8b20b31c2fe6aa28.r2.dev
```

## Variables d'environnement Vercel (frontend)

Aucune variable d'env requise côté Vercel. Le frontend appelle l'API en chemin relatif (`/api/v1`, `/public/v1`) ; un rewrite Vercel défini dans `vercel.json` proxie ces chemins vers Railway. En dev, Vite (`vite.config.ts`) proxie vers `http://localhost:3001`.

Conséquence : **le navigateur voit toutes les requêtes comme same-origin**, ce qui permet l'usage de cookies HTTP-only `sameSite=lax` pour transporter l'access token (cf. backend `auth.controller.ts`).

## Monitoring (Sentry)

Backend et frontend sont équipés du SDK Sentry (`@sentry/node`, `@sentry/react`).
Init conditionnelle : si `SENTRY_DSN` (backend) ou `VITE_SENTRY_DSN` (frontend)
n'est pas posée, le SDK n'est pas initialisé (cas dev local par défaut).

**2 projets Sentry séparés** : `knowdesk-backend` (Node) + `knowdesk-frontend` (React Vite).

Choix RGPD/sécurité durcis :
- `sendDefaultPii: false` — pas d'IP, pas de cookies, pas de headers PII
- `beforeSend` redact via `redactPii.ts` (email, téléphone, IBAN, carte, sécu)
- Strip systématique de `request.headers.authorization`, `cookie`, `x-api-key`, `request.data`
- Pas de Sentry Replay (trop de surface RGPD pour du contenu chat/auth)
- Pas d'upload source maps frontend (à activer ad hoc si besoin debug prod)

Sample rates :
- `tracesSampleRate: 0.1` (10%) en prod, `1.0` en dev
- Événements 401/403/422 ignorés (déjà filtrés au errorHandler côté back, 2ᵉ ligne ici)

Configuration prod :
- Railway → KnowDesk → variable `SENTRY_DSN=https://xxx@oXXX.ingest.sentry.io/YYY`
- Vercel → KnowDesk-frontend → variable `VITE_SENTRY_DSN=...`

Frontend : `<Sentry.ErrorBoundary>` enveloppe l'app, fallback "Une erreur s'est produite".

## Tests

Stack : **vitest + jsdom + @testing-library/react + @testing-library/jest-dom**.

```bash
npm test            # run unique, exit propre (CI ready)
npm run test:watch  # mode watch (re-run à chaque save)
```

Organisation :
- Tests **co-localisés** : `authStore.test.ts` à côté de `authStore.ts`. Pas de dossier `__tests__/` séparé.
- `vitest.config.ts` configure jsdom + setupFiles.
- `src/test-setup.ts` : import des matchers jest-dom + cleanup auto entre tests (DOM + sessionStorage).

Pattern de mock pour `apiClient` (essentiel pour tester les composants qui font des appels API) :

```ts
vi.mock('../shared/lib/apiClient', () => ({
  apiClient: { post: vi.fn(() => Promise.resolve({})), /* etc. */ },
}));
```

Pattern reset Zustand entre tests :

```ts
beforeEach(() => {
  useAuthStore.setState({ session: null, isLoaded: false, /* ... */ });
});
```

État au 2026-05-04 : **8 tests passants** (~1s).
- `src/store/authStore.test.ts` (5) : setSession, clearSession, setOnboardingDone (+ side-effect API), setImpersonating, persistence sessionStorage
- `src/router/ProtectedRoute.test.tsx` (3) : loader rehydration, redirect non-loggé (mock `window.location.replace`), rend children si loggé

Cibles à étendre (par valeur, dans cet ordre) : `apiClient` refresh + retry, `TagsInput`, `AnalyticsPage`, `ConfirmDialog`, autres composants critiques.

## Roadmap — État actuel (mai 2026)

### En production ✅
- Auth complète (login, register, forgot/reset password)
- Articles (CRUD, versioning, restauration, publication)
- Catégories arborescentes
- Membres + invitations par email
- Notifications in-app
- Paramètres (général, notifications, billing placeholder, danger zone)
- Processus guidés (arbres de décision question/réponse)
- Gestion du compte utilisateur
- Superadmin (liste orgs, disable/enable, impersonnification)
- Clés API + endpoints publics (/public/v1/categories, /articles, /trees)
- Documentation API publique (?api-docs)
- Aide contextuelle (centre d'aide avec recherche)
- Upload d'images dans les articles (Cloudflare R2)
- Liens dans les articles (externes + internes)
- Onboarding flag côté serveur
- SideNav avec initiales, bouton déconnexion dans TopBar
- Recherche intelligente (Meilisearch) — tolérance aux fautes, indexation articles + processus guidés, synonymes par organisation gérables dans Settings
- Tags libres sur les articles — chips avec auto-complétion dans l'éditeur, filtre multi-tag dans la liste, affichage sur la fiche article et le dashboard, gestion admin (rename, suppression) dans Settings
- Analytics d'utilisation — page admin/manager avec inventaire, articles à vérifier, brouillons orphelins, articles sans tag, top contributeurs, couverture par catégorie, top tags, tags inutilisés, top articles consultés, articles peu consultés, top recherches, recherches sans résultat, engagement DAU/WAU/MAU. Tracking d'événements (table events), purge cron 90 jours.
- **FAQs éditables (P0+P1)** — entité distincte des articles, accessible via `/faqs`. CRUD admin/manager (Question 200 chars / Réponse 2000 chars), catégorisation, tags réutilisés, visibilité interne/public (préparation export web P2), lien optionnel vers un article. Indexation Meilisearch (boost « FAQ » en haut du dropdown), dans la SearchBar : clic → expansion in-line de la réponse complète + bouton **Copier la réponse** (1-clic UX conseiller). **Vote 👍/👎** par tous les rôles avec compteurs et score helpful (anti-spam localStorage). **Suggesteur** sur Analytics : bannière ambre listant les recherches sans résultat (≥ 3 occurrences sur 7j) avec bouton « Créer une FAQ » qui ouvre l'éditeur avec la question pré-remplie. **Fraîcheur** : badge `À réviser` sur les FAQs publiées > 6 mois sans modification, bannière éditeur + bouton « C'est à jour ». **Historique** : panneau collapsible dans l'éditeur (audit_logs filtrés). Cycle de vie complet : zéro-result → suggestion → création → indexation → recherche → expansion + copy → vote → fraîcheur → historique.
- **SearchBar — sections par type + click outside** — les résultats sont regroupés par type (❓ FAQs / 📄 Articles / 🌳 Processus) avec headers dédiés (icône + label + compteur), sections vides masquées, l'index actif au clavier saute les headers (`role="presentation"`). Click hors de la barre ferme le dropdown sans vider la query (focus de l'input ré-ouvre).
- **KnowledgePage UX P1+P2+P3** — sidebar redimensionnable (drag handle 180-360px) + état d'expansion persisté localStorage ; séparation chevron (déplie) / nom (navigue) ; breadcrumb cliquable ; toolbar tri (Alpha / Mis à jour / Plus consultés via events `article.view` 30j) + recherche locale ; filtre articles inclut sous-cats (`includeSubcategories=true`) ; tags scopés à la sélection (counts locaux dérivés des articles chargés, masqués si zéro). **Sidebar interactive admin** : au hover ligne → bouton ··· avec menu Renommer (inline), + Sous-catégorie (modale pré-remplie), Déplacer (modale + anti-cycle backend), Supprimer (ConfirmDialog).
- **Quick switcher Cmd+J** — palette flottante en complément de la SearchBar (Cmd+K reste sur recherche). Sections : Actions / Catégories / Articles / FAQs / Processus. Fuzzy local sur catégories, Meilisearch debounced 200ms pour le contenu. Navigation clavier complète, click outside.
- **AI Search (Réponse IA)** — carte streaming Mistral au-dessus des résultats SearchBar quand la query déclenche le trigger (≥ 15 chars OU mot interrogatif). Sparkle ✨ animé pendant le streaming. Fallback "Je n'ai pas la réponse précise dans la base." si extraits insuffisants. Sources `[1] [2]…` cliquables, bouton Copier, 👍/👎 trackés (events `ai_answer.shown` + `ai_answer.feedback`). Section **✨ IA** dédiée dans Settings (admin only) : toggle on/off, secteur d'activité (texte libre), tonalité (5 enums), forme d'adresse (tu/vous/aucune), glossaire `from→to` (max 30 paires) — tout injecté dans le prompt système Mistral. Section "Réponse IA" dans Analytics avec metrics + top 5 questions/questions-sans-réponse.
- **Chatbot embeddable (FAQs P3)** — widget JS public servi à `/chat.js` (Vercel static), à intégrer sur le site client via `<script data-org="<slug>" defer>`. Vanilla JS + Web Component + Shadow DOM = isolation CSS totale du site hôte. Pipeline RAG public : Meilisearch filtré sur `visibility=public + status=published` + Mistral Small en multi-tour (history 10 derniers tours). Garde-fous : CORS dynamique vs liste blanche org, rate-limit 30 req/min/IP, prompt anti-jailbreak + hors-scope, fallback admin-configuré. Section **💬 Chatbot** dédiée dans Settings (admin) : toggle, message d'accueil, fallback (avec canaux contact), couleur primaire (input color + hex), logo URL, domaines autorisés (textarea liste blanche). Snippet d'intégration affiché avec bouton Copier. Sélecteur Visibility dans ArticleEditor + TreeEditor pour piloter ce qui est exposé.
- **Conversation Engine — chatbot avancé (Sprints 1-6, 10)** — Le widget est passé d'un endpoint stateless à un moteur conversationnel persistant côté serveur. Tables `conversations` / `conversation_turns` / `conversation_state` (migration 18). Le client ne stocke plus que `conversationId` en localStorage ; le serveur est source de vérité (audit, RGPD, multi-channel ready). **Slot filling** : quand une question est trop vague (`shouldClarify` heuristique : ≤ 5 mots porteurs + topScore < 0.45), 1× max par conversation, le bot pose une question de clarification générée par Mistral et merge la réponse avec la query initiale au tour suivant. **Quick replies déterministes** : chips sous chaque réponse bot proposant les 2 premières sources distinctes (zéro coût LLM). **Handoff structuré** (migration 19, 3 nouveaux champs `chat_handoff_*`) : `webhook` POST le transcript JSON / `email` envoie par Resend / `none` (UX pure fallback message). **UX polishing** : bouton 🙋 dans le header du widget remplace le chip « Parler à un humain » (n'apparaît que ≥ 1 turn visiteur, sinon flash visuel). Pouces 👍/👎 inline sous chaque réponse bot non-welcome (opacity 0.45, hover full) — 👍 marque `resolved`, 👎 (Sprint 10) pousse une bulle d'empathie DANS le canal qui demande l'email pour contact ultérieur ; le prochain message est intercepté côté widget : email valide → POST `/handoff(visitorEmail)` + bulle confirmation, sinon flag retombe et le RAG reprend. **Topic clustering** (migration 20, `conversations.topic`) : Mistral résume chaque conversation à la clôture en 3-6 mots (groupe nominal court) — alimente le top thématiques Analytics (groupBy topic au lieu de message brut, agrège « résiliation forfait » = « comment résilier mon forfait »). **Cron auto-abandon** : worker BullMQ `chat-cleanup` toutes les 10 min — `status='active'` inactives > 30 min → `'abandoned'` (avec topic généré en bonus). Donne enfin un `resolvedRate` significatif dans Analytics.
- **Page admin Chats** (`/chats`, admin only) — nouvelle entrée sidebar entre Analytics et Settings. Liste paginée 20/page triée date desc, filtre statut (all / active / resolved / escalated / abandoned), recherche full-text dans les transcripts (Postgres ILIKE sur `conversation_turns.content`). Chaque ligne affiche thématique + 1ʳᵉ question italique + badge statut + nb messages + CSAT/👍👎 si voté + date relative. Modale plein écran (`<Modal size="lg">`) avec bandeau métadonnées + bulles chat (visiteur droite/brand, bot gauche/blanc) scrollables max 60vh. URL deep-linkable.
- **Prompt système chatbot personnalisable (Sprint 9, migration 21 `chat_system_prompt`)** — Settings → ✨ IA chatbot enrichi de 2 nouveaux blocs : **Personnalisation** (les 4 champs `industry` / `tone` / `addressForm` / `glossary` apparaissent ici aussi, partagés avec Réponse IA — note explicite affichée, 2 PATCHs en parallèle au save) et **Prompt système** (textarea pré-rempli avec le prompt actuellement utilisé : custom s'il existe, sinon le défaut généré par `buildSystemPrompt(perso, fallback)`). Édition libre = override total. Bouton **↺ Restaurer le défaut** repose `null` en DB. Min 50 chars, max 8000. Le défaut est recalculé à chaque GET `/settings/org` pour rester en phase avec les valeurs perso courantes.
- **Analytics — dédup préfixes Réponse IA (Sprint 8)** — la section "Top questions" et "Questions sans réponse" filtre désormais les events `ai_answer.shown` "intermédiaires" : pour chaque user, un event dont la `query` est strictement préfixe d'un autre event du même user dans une fenêtre 60s est considéré comme keystroke en cours et écarté. Implémenté en post-processing JS sur ≤ 5000 events (lisible vs NOT EXISTS imbriqué). Rétro-actif. Côté frontend, debounce `useAiAnswer` monté 600 → 1200ms pour limiter à la source.
- **Disclaimer RGPD chatbot (mai 2026)** — au 1ᵉʳ ouverture du widget chez un visiteur, écran dédié « Avant de commencer » avec icône, texte de transparence (configurable depuis Settings → Chatbot → Confidentialité RGPD, sinon défaut), lien optionnel vers la politique de confidentialité, bouton « J'ai compris ». Acquittement persisté localStorage par orgSlug + version (`PRIVACY_VERSION='v1'`). Migration `25_chat_privacy.js` ajoute `chat_privacy_notice` + `chat_privacy_policy_url` sur organizations.
- **Modèles IA configurables (mai 2026)** — Settings → 🧠 Modèles IA (admin only) liste les 4 services IA de la plateforme (Génération chatbot / SearchBar / Slot-filling / Topic clustering) avec leur modèle actuel et drapeau région 🇫🇷. Seul "Génération chatbot" est modifiable en V1 — radio cards parmi 4 modèles Mistral (Small / Ministral 8B / Medium / Large) avec badge latence (Rapide/Équilibré/Précis) et coût relatif (×1 → ×10). Les autres services restent verrouillés sur `config.AI_MODEL` global avec cadenas + tooltip. Effet immédiat sur le prochain turn bot, y compris dans les conversations actives. Composant `AiModelsSection.tsx` + API `aiModelsApi` (`GET /settings/org/ai-services`, `PATCH /settings/org/chat/model`). Pas de fallback : erreur Mistral → erreur dure côté widget. Migrations backend `26_chat_model.js` et `27_conversation_turn_model.js`.
- **Rétention conversations chat + purge RGPD (mai 2026)** — Settings → Chatbot expose un sélecteur **30 / 60 / 90 / 180 jours** (default 90, CHECK SQL). Au save d'une valeur plus basse, `GET /settings/org/chat/retention-preview?days=N` renvoie le compte de conversations qui seront purgées et un ConfirmDialog en avertit l'admin. Worker BullMQ `chat-purge` quotidien à 3h hard-delete les conversations dont `started_at < NOW() - retention_days` (CASCADE FK supprime turns + state). Migration `24_chat_retention_days.js`.
- **PII redaction admin chats (mai 2026)** — `shared/redactPii.ts` (côté backend) applique 5 regex (sécu, IBAN, carte, téléphone, email) sur les content du transcript admin Chats. Email et téléphone reçoivent un masque partiel (`j****@e****.com`, `06 ** ** ** 78`), IBAN/carte/sécu un token générique. Badge « 🔒 Coordonnées masquées » en tête de modale transcript. **Pas appliqué** : pipeline RAG (besoin du contexte brut), widget public, stockage DB.
- **Audit log admin (mai 2026)** — page `/audit` (admin only, pas managers — `adminStrict` dans NavItem) avec tableau filtrable (action, dates), modal détail metadata JSON. Couverture étendue : 29 actions tracées (articles, members, account, apikeys, tags, synonyms, faqs, trees, categories, settings org chat/ai/general, superadmin.impersonate.start/stop). Endpoint `GET /api/v1/audit-logs` avec hydratation user + emails superadmins. Worker `audit-purge` quotidien retient 1 an. **Immuable côté admin** (aucun POST/DELETE exposé). Voir CLAUDE.md backend pour le pattern d'écriture (`auditLog` middleware factory + `writeAuditLog` helper).
- **Impersonation superadmin tracée (mai 2026)** — JWT d'impersonation porte `impersonated_by` + `impersonated_by_email` + `impersonated:true`. Backend `/superadmin/impersonate/:orgId` pose le cookie HTTP-only `access_token` (sinon le navigateur garde l'ancien cookie admin et toutes les actions sont mal attribuées). Endpoint `/superadmin/impersonate/stop` clear le cookie côté serveur (appelé par `ImpersonateBanner.handleReturn`). Toute action effectuée en impersonation est marquée dans audit log avec `metadata.impersonatedBy/Email`. Cookies same-site lax via Vercel rewrite — `saFetch` côté frontend utilise `/api/v1/superadmin` relatif + `credentials:include` (cohérent avec apiClient).
- **Refacto UI/UX (axes A→E)** — `<ConfirmDialog>` (4 `confirm()` natifs remplacés), `<Modal>` partagé avec focus trap (8 modales unifiées), 2 `<input>` bruts → `<Input>`, `fetch()` direct → `apiClient`, error handling unifié (toasts partout, plus aucun silent failure côté UI), 16 styles inline → 8 (tous légitimes runtime)
- **React Router v6** côté frontend (Phases G1+G2) — toutes les vues (`/dashboard`, `/knowledge`, `/articles/:id`, `/articles/:id/edit`, `/articles/new`, `/trees`, `/trees/:id`, `/trees/:id/edit`, `/members`, `/analytics`, `/settings`, `/account`) ont une URL canonique : deep-linking, F5 préserve l'écran, bouton Précédent fonctionnel, partage de liens. Bridge URL ↔ `useState<View>` dans `App.tsx` (cleanup vers `<Routes>` direct prévu en G3)
- Pool PG résilient — `pool.on('error')` listener (empêche les crashs silencieux quand un client idle perd sa connexion), `max: 20`, `keepAlive`. Rate limiter skippé en `NODE_ENV=development` pour ne pas gêner le dev local

### Haute priorité
- Toasts sur les erreurs API
- Stripe billing — plans, quotas, page de facturation

### Issu de l'analyse Mayday — Priorité 1 — État
- ~~FAQs éditables~~ ✅ livré P0+P1 (cycle complet conseiller + admin). Reste **P2 export web** (visibility=public déjà préparé en DB).
- ~~Chatbot~~ ✅ livré (couvre articles + processus + FAQs publics, pas seulement FAQs). Avec moteur conversationnel complet (Sprints 1-10) : persistence serveur, slot filling, quick replies, handoff structuré, pouces inline, topic clustering, page admin Chats.

### Issu de l'analyse Mayday — Priorité 2
- Mode appel en cours — suggestions contextuelles
- Processus guidés enrichis — variables, conditions
- Workflow de validation du contenu
- Centre d'aide V2 (Sprint Help-D) — ouvrir l'article pertinent depuis le contexte (pas la section), footer feedback 👍/👎 sur chaque article (tracké via la table events), parseur markdown standard avec support des images, indexation Meilisearch dédiée si l'aide grossit au-delà de ~50 articles.

### Refacto à venir
- **Phase G3** (~1j) : nettoyer le bridge `useState<View>` ↔ Router dans `App.tsx`, passer en `<Routes><Route ...></Routes>` direct + `useParams`. Convertir `?superadmin` / `?api-docs` / `?token=` en routes propres (`/superadmin`, `/api-docs`, `/invitation/:token`).
- **API publique — OpenAPI source de vérité** (~1 sprint, à challenger) : remplacer la doc custom (`features/apidocs/`) par un schéma OpenAPI 3.x généré depuis le backend via `@asteasolutions/zod-to-openapi` (les schémas Zod existants servent de base), exposé sur `/public/v1/openapi.json`. Côté frontend, intégrer **Scalar API Reference** (ou Redoc / Stoplight Elements) pour consommer le JSON et générer la page automatiquement. Bénéfices : doc qui ne peut plus diverger du code, "Try it" intégré, search bar, multi-langage natif. ROI à challenger : aujourd'hui 5 endpoints GET seulement, l'effort/gain devient évident à partir de 15+ endpoints ou si on commence à avoir des intégrateurs externes.
- ~~**Axe F — CSS par feature**~~ ✅ livré mai 2026 (~4 800 lignes migrées). Architecture : `src/styles/{tokens,base,layout}.css` global + chaque composant UI partagé et chaque feature ont leur propre `.css` co-localisé importé via leur `.tsx`. Stylelint configuré (`npm run lint:css`) avec `stylelint-config-standard` ; règles cosmétiques (1 décl/ligne, lightness-notation, etc.) désactivées pour respecter le mix existant.
- **Axe F+ — finitions CSS (à challenger plus tard)** :
  - **Reformatage uniforme 1-décl-par-ligne** : ~556 violations désactivées dans la config. Réactiver `declaration-block-single-line-max-declarations` puis `npm run lint:css -- --fix` (~30 min). Risque visuel faible mais à valider.
  - **Renaming BEM strict** : mix actuel `.btn-primary` (legacy) vs `.btn--primary` (BEM). Sprint dédié si gêne lisibilité. Breaking pour le LSP, à coordonner.
  - **Critical CSS extraction** : Vite plugin pour inline le CSS critique au first paint (LCP). Pas urgent tant qu'on ne mesure pas un souci de perf.
  - **CSS Modules / Tailwind** : isolation auto vs convention BEM globale. Gros chantier (~3 sprints), à déclencher seulement si conflits de classes deviennent un problème récurrent.
- **Retirer le fallback Bearer** dans `auth.middleware` une fois que tous les clients utilisent les cookies (~1 sprint après stabilisation). Retirer aussi `accessToken` du retour JSON de `auth.controller` et du type `AuthSession` côté frontend.
- **Hook `useApi` générique** côté frontend (~7 hooks de fetch redupliqués) : pattern uniforme loading/error/data, intégration apiClient, retour typé.
- **Custom domain** (`app.knowdesk.fr` + `api.knowdesk.fr`) : remplacer le proxy Vercel par des sous-domaines de la même TLD+1, pour éviter le hop supplémentaire et avoir des cookies natifs sans rewrite.
- **Tests frontend** : socle posé (8 tests sur authStore + ProtectedRoute, vitest + jsdom + Testing Library — voir section « Tests » ci-dessus). Cibles à étendre : `apiClient` refresh+retry, `TagsInput` autocomplete, `ArticleEditor`, `AnalyticsPage`, le bridge router. Côté backend, **65 tests passants** (auth + multi-tenancy + permissions + FAQs).
- **Multilingue FR + EN** (~5-7 sprints au total, à challenger) — projet ambitieux mis en backlog. Découpé en 4 phases :
  - **Phase 1 — i18n UI** (~2-3 sprints) : `react-i18next` ou équivalent, extraction des ~600-800 strings hardcodées, 2 fichiers `fr.json`/`en.json`, setting `language` user (default depuis `navigator.language`), templates emails Resend par langue, aide en ligne (53 articles markdown) traduite **manuellement** par humain (qualité prime).
  - **Phase 2 — Articles avec langue déclarée** (~1 sprint) : champ `language` sur `articles` et `faqs` (default `fr` pour l'existant), détection auto au save (LLM court) avec override, filtre dans liste/search, bandeau « Cet article est en anglais » sans traduction encore.
  - **Phase 3 — Traduction à la volée** (~1-2 sprints) : moteur DeepL recommandé (qualité industrielle FR↔EN, ~20€/mois pour 500k chars) ou OpenAI/Anthropic avec prompt dédié. **LibreTranslate à éviter** sauf budget zéro (qualité insuffisante pour du contenu support client = risque légal). Cache DB obligatoire (table `article_translations` avec invalidation au `version` de l'article). Bandeau « Traduit automatiquement • Voir l'original ».
  - **Phase 4 — Recherche multilingue** (~1-2 sprints, à challenger) : 3 options — traduire la query au runtime, indexer les traductions Meilisearch, ou embeddings multilingues. Choix selon volume d'articles cross-lang à ce moment.
  
  **Questions structurantes à trancher avant de démarrer** :
  - Persona n°1 : org FR avec clients EN ? Équipes internationales bilingues ? Belges/Suisses multi-officielles ?
  - Article = 1 langue ou plusieurs versions par langue (modèle data radicalement différent) ?
  - L'admin org peut-il imposer la langue par défaut ?
  - Qualité ou vitesse pour la trad UI (humaine vs auto-LLM) ?
  - Moteur de traduction : qui choisit, qui paie ?
  - Latence acceptable à la volée (DeepL ~200ms vs OpenAI 1-3s — change l'UX) ?
  - FAQs P2 (export web) et P3 (chatbot) : traduction dans le scope ?
  
  **Risques identifiés** :
  - Traduction fautive sur de la « politique de remboursement » = litige client / risque légal — qui assume ?
  - Recherche multilingue mal foutue = frustration immédiate du conseiller bilingue
  - Coût LLM non maîtrisé sans cache DB (× N consultations)
  - I18n UI sous-estimée : ~600-800 strings dispersées, ~3-5j de mécanique + 1 sprint trad

- **SearchBar — Tags as results** (~3h, à challenger) : nouvelle section *« 🏷 Tags »* dans le dropdown (entre Articles et Processus). Endpoint `/api/v1/search/tags?q=...` qui matche sur les tags de l'org, retour `{ id, displayName, articlesCount, faqsCount }`. UI : chips compactes (pas des items pleine largeur), clic → `navigate('/knowledge?tags=<name>')` + ferme le dropdown. Valeur attendue : raccourci puissant pour les conseillers qui pensent en thématiques plutôt qu'en titres. Pas urgent — à valider après quelques semaines d'usage des sections.
- **FAQs P2 — Export web public** (~1 sprint) : visibility=public déjà en DB. Endpoint `/public/v1/faqs?visibility=public` à exposer, widget JS embed (`<script src="...">`) avec customisation visuelle, page hébergée optionnelle (`faq.knowdesk.fr/{org-slug}`), Schema.org FAQPage JSON-LD pour le SEO. À déclencher une fois l'adoption interne validée (helpful score moyen > 60% sur les FAQs publiques).
- **FAQs P3 — Chatbot** (~2 sprints) : endpoint conversational `/public/v1/chat`, widget chat embarquable, semantic match sur les FAQs publiques (Meilisearch + reranking ou embeddings type OpenAI), fallback escalation vers humain. Boucle d'apprentissage : conversations sans réponse satisfaisante → suggestions de FAQs côté admin. À gater derrière un seuil quantitatif (≥ 50 FAQs publiques helpful > 70%) — un chatbot médiocre est pire que pas de chatbot.

### Import de documents (plan rédigé)
- MVP : import PDF/DOCX → article
- V2 : import PPTX, import en lot

### Infrastructure
- ~~Sentry DSN configuré~~ ✅ activé mai 2026 (2 projets : `knowdesk-backend`, `knowdesk-frontend`, voir section Monitoring)
- ~~Tests frontend~~ socle posé mai 2026 (8 tests authStore + ProtectedRoute, voir section Tests)
- CI/CD GitHub Actions (gratuit jusqu'à 2000 min/mois sur compte free, voir https://github.com/BrieucLA pour activation)
- CI/CD GitHub Actions

## Cloudflare R2

- Bucket : `knowdesk-images` (région EU)
- Endpoint S3 : `https://0a0b0f1ca85a134a29898c21334dc996.eu.r2.cloudflarestorage.com`
- URL publique : `https://pub-2e6d152f4911496d8b20b31c2fe6aa28.r2.dev`
- Structure des clés : `orgs/{orgId}/articles/{articleId}/{uuid}.{ext}`
