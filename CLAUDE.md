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
- DB Railway (public) : `postgresql://postgres:WoTivcNBsUnOykDqzBwnFqvgzFCAGtoK@shinkansen.proxy.rlwy.net:46631/railway`

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

Après chaque nouvelle migration, lancer :

```bash
cd ~/KDProject/knowdesk-backend
DATABASE_URL="postgresql://postgres:WoTivcNBsUnOykDqzBwnFqvgzFCAGtoK@shinkansen.proxy.rlwy.net:46631/railway" npm run migrate
```

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
- **Refacto UI/UX (axes A→E)** — `<ConfirmDialog>` (4 `confirm()` natifs remplacés), `<Modal>` partagé avec focus trap (8 modales unifiées), 2 `<input>` bruts → `<Input>`, `fetch()` direct → `apiClient`, error handling unifié (toasts partout, plus aucun silent failure côté UI), 16 styles inline → 8 (tous légitimes runtime)
- **React Router v6** côté frontend (Phases G1+G2) — toutes les vues (`/dashboard`, `/knowledge`, `/articles/:id`, `/articles/:id/edit`, `/articles/new`, `/trees`, `/trees/:id`, `/trees/:id/edit`, `/members`, `/analytics`, `/settings`, `/account`) ont une URL canonique : deep-linking, F5 préserve l'écran, bouton Précédent fonctionnel, partage de liens. Bridge URL ↔ `useState<View>` dans `App.tsx` (cleanup vers `<Routes>` direct prévu en G3)
- Pool PG résilient — `pool.on('error')` listener (empêche les crashs silencieux quand un client idle perd sa connexion), `max: 20`, `keepAlive`. Rate limiter skippé en `NODE_ENV=development` pour ne pas gêner le dev local

### Haute priorité
- Toasts sur les erreurs API
- Stripe billing — plans, quotas, page de facturation

### Issu de l'analyse Mayday — Priorité 1 — État
- ~~FAQs éditables~~ ✅ livré P0+P1 (cycle complet conseiller + admin). Reste **P2 export web** (visibility=public déjà préparé en DB) et **P3 chatbot** (semantic match sur les FAQs publiques) — voir backlog ci-dessous.

### Issu de l'analyse Mayday — Priorité 2
- Mode appel en cours — suggestions contextuelles
- Processus guidés enrichis — variables, conditions
- Workflow de validation du contenu
- Centre d'aide V2 (Sprint Help-D) — ouvrir l'article pertinent depuis le contexte (pas la section), footer feedback 👍/👎 sur chaque article (tracké via la table events), parseur markdown standard avec support des images, indexation Meilisearch dédiée si l'aide grossit au-delà de ~50 articles.

### Refacto à venir
- **Phase G3** (~1j) : nettoyer le bridge `useState<View>` ↔ Router dans `App.tsx`, passer en `<Routes><Route ...></Routes>` direct + `useParams`. Convertir `?superadmin` / `?api-docs` / `?token=` en routes propres (`/superadmin`, `/api-docs`, `/invitation/:token`).
- **API publique — OpenAPI source de vérité** (~1 sprint, à challenger) : remplacer la doc custom (`features/apidocs/`) par un schéma OpenAPI 3.x généré depuis le backend via `@asteasolutions/zod-to-openapi` (les schémas Zod existants servent de base), exposé sur `/public/v1/openapi.json`. Côté frontend, intégrer **Scalar API Reference** (ou Redoc / Stoplight Elements) pour consommer le JSON et générer la page automatiquement. Bénéfices : doc qui ne peut plus diverger du code, "Try it" intégré, search bar, multi-langage natif. ROI à challenger : aujourd'hui 5 endpoints GET seulement, l'effort/gain devient évident à partir de 15+ endpoints ou si on commence à avoir des intégrateurs externes.
- **Axe F — CSS par feature** (~2j) : éclater `sprint3.css` (730 lignes) / `sprint4.css` / `sprint5.css` (1300+ lignes) en fichiers co-localisés à chaque feature (ex: `features/articles/articles.css`, `shared/components/ui/modal.css`). Garder `tokens.css` et `base.css` au niveau global.
- **Retirer le fallback Bearer** dans `auth.middleware` une fois que tous les clients utilisent les cookies (~1 sprint après stabilisation). Retirer aussi `accessToken` du retour JSON de `auth.controller` et du type `AuthSession` côté frontend.
- **Hook `useApi` générique** côté frontend (~7 hooks de fetch redupliqués) : pattern uniforme loading/error/data, intégration apiClient, retour typé.
- **Custom domain** (`app.knowdesk.fr` + `api.knowdesk.fr`) : remplacer le proxy Vercel par des sous-domaines de la même TLD+1, pour éviter le hop supplémentaire et avoir des cookies natifs sans rewrite.
- **Tests frontend** : zéro test côté frontend ; vitest installé. Cibler ArticleEditor (sauvegarde + tags), TagsInput (autocomplete), AnalyticsPage, ProtectedRoute, le bridge router. Côté backend, **65 tests passants** (auth + multi-tenancy + permissions + FAQs) couvrent les chemins critiques.
- **FAQs P2 — Export web public** (~1 sprint) : visibility=public déjà en DB. Endpoint `/public/v1/faqs?visibility=public` à exposer, widget JS embed (`<script src="...">`) avec customisation visuelle, page hébergée optionnelle (`faq.knowdesk.fr/{org-slug}`), Schema.org FAQPage JSON-LD pour le SEO. À déclencher une fois l'adoption interne validée (helpful score moyen > 60% sur les FAQs publiques).
- **FAQs P3 — Chatbot** (~2 sprints) : endpoint conversational `/public/v1/chat`, widget chat embarquable, semantic match sur les FAQs publiques (Meilisearch + reranking ou embeddings type OpenAI), fallback escalation vers humain. Boucle d'apprentissage : conversations sans réponse satisfaisante → suggestions de FAQs côté admin. À gater derrière un seuil quantitatif (≥ 50 FAQs publiques helpful > 70%) — un chatbot médiocre est pire que pas de chatbot.

### Import de documents (plan rédigé)
- MVP : import PDF/DOCX → article
- V2 : import PPTX, import en lot

### Infrastructure
- Sentry DSN configuré
- Tests automatisés frontend
- CI/CD GitHub Actions

## Cloudflare R2

- Bucket : `knowdesk-images` (région EU)
- Endpoint S3 : `https://0a0b0f1ca85a134a29898c21334dc996.eu.r2.cloudflarestorage.com`
- URL publique : `https://pub-2e6d152f4911496d8b20b31c2fe6aa28.r2.dev`
- Structure des clés : `orgs/{orgId}/articles/{articleId}/{uuid}.{ext}`
