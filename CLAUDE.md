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
      ui/                         # Button, Input, Skeleton, EmptyState, Toast, ImpersonateBanner...
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
- Les appels API passent par `apiClient` (gère le token automatiquement)
- Le store Zustand (`authStore`) est persisté en `sessionStorage`
- CSS uniquement via les classes du design system — jamais de style inline sauf exceptions
- Pas de `any` TypeScript sauf cas vraiment nécessaire

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

```
VITE_API_URL=https://knowdesk-production.up.railway.app/api/v1
```

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

### Haute priorité
- Toasts sur les erreurs API
- Stripe billing — plans, quotas, page de facturation

### Issu de l'analyse Mayday — Priorité 1
- FAQs éditables
- Analytics d'utilisation

### Issu de l'analyse Mayday — Priorité 2
- Mode appel en cours — suggestions contextuelles
- Processus guidés enrichis — variables, conditions
- Workflow de validation du contenu

### Import de documents (plan rédigé)
- MVP : import PDF/DOCX → article
- V2 : import PPTX, import en lot

### Infrastructure
- Rate limiting Redis en production
- Sentry DSN configuré
- Tests automatisés
- CI/CD GitHub Actions

## Cloudflare R2

- Bucket : `knowdesk-images` (région EU)
- Endpoint S3 : `https://0a0b0f1ca85a134a29898c21334dc996.eu.r2.cloudflarestorage.com`
- URL publique : `https://pub-2e6d152f4911496d8b20b31c2fe6aa28.r2.dev`
- Structure des clés : `orgs/{orgId}/articles/{articleId}/{uuid}.{ext}`
