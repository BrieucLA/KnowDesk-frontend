# Référence KnowDesk pour migration design Helix

Document de référence à fournir à Claude Design pour qu'il évite les pièges et produise un livrable directement intégrable.

Source canonique : `CLAUDE.md` (frontend) — ce document est un extrait centré sur les besoins migration design.

Date : 2026-05-06.

---

## 1. Stack technique

| Couche | Choix |
|---|---|
| Framework | React **18** + TypeScript |
| Bundler | Vite **5** (pas CRA) |
| CSS | Vanilla CSS, convention BEM globale, fichiers `<feature>.css` co-localisés |
| Routing | React Router v6 (avec future flags v7 activés) |
| State | Zustand (auth) + state local React |
| Tests | Vitest + jsdom + @testing-library/react |
| Monitoring | Sentry React (init dans `src/shared/lib/monitoring/sentry.ts`) |
| Déploiement | Vercel (rewrite `/api`, `/public` → Railway backend) |

**Interdits** :
- Tailwind / styled-components / CSS-in-JS (équipe a fait le choix CSS classique)
- `style={{}}` inline sauf valeurs runtime (% barre, custom property dynamique)
- `<input>`, `<div onClick>`, `window.confirm()` natifs — utiliser nos composants partagés

**Rappel architecture CSS** (vient d'être livré, sprint Axe F mai 2026) :

```
src/styles/
  ├── tokens.css      # variables CSS — importé en PREMIER
  ├── base.css        # reset, body, a11y
  └── layout.css      # AppLayout, SideNav, TopBar

src/shared/components/ui/
  ├── Button.tsx + Button.css
  ├── Modal.tsx  + Modal.css
  └── ... (chaque composant son CSS co-localisé)

src/features/<nom>/
  ├── components/<X>.tsx   ← importe '../<feature>.css'
  └── <feature>.css
```

---

## 2. Tokens — variables CSS actuelles

Localisation : `src/styles/tokens.css`. **Helix doit conserver les noms de variables** et juste mapper ses nouvelles couleurs vers les variables existantes.

### Couleurs

```css
/* Brand */
--brand-50:  #F0F4FF;   /* surfaces tertiaires */
--brand-100: #D6E0FF;   /* fonds clairs (chips actifs) */
--brand-200: #A8BCFF;   /* hover sur surfaces brand */
--brand-500: #3D5FD9;   /* focus rings */
--brand-600: #2D4BB8;   /* boutons primaires */
--brand-700: #1E3490;   /* hover boutons primaires */
--brand-900: #0D1B5A;   /* textes brand emphasés */

/* Neutrals — warm gray (subtil chaud, pas du gris neutre froid) */
--neutral-0:   #FFFFFF;  /* surfaces principales */
--neutral-50:  #F8F7F5;  /* page background */
--neutral-100: #F0EEE9;  /* hover surfaces neutres, séparateurs subtils */
--neutral-200: #E3E0D9;  /* borders inputs, cards */
--neutral-300: #C8C5BC;  /* borders forts (hover) */
--neutral-400: #9E9B93;  /* placeholders, icônes désactivées */
--neutral-500: #6B6862;  /* texte secondaire */
--neutral-700: #3A3834;  /* texte standard */
--neutral-900: #1A1917;  /* titres, texte emphasé */

/* Semantic */
--color-danger:        #C0392B;
--color-danger-bg:     #FEF2F0;
--color-danger-border: #FAC5BF;
--color-success:       #1A6B3C;
--color-success-bg:    #EDFAF3;
```

### Typographie

```css
--font-ui:    'DM Sans', sans-serif;       /* tout le UI */
--font-brand: 'DM Serif Display', serif;   /* uniquement le brand quote / hero */
```

Si Helix propose Inter à la place de DM Sans : changer la valeur de `--font-ui`. Vérifier que la métrique reste cohérente (DM Sans ≈ Inter, peu de bouge attendu).

### Sizing

```css
--radius-sm:  4px;
--radius-md:  8px;     /* boutons, inputs, modales internes */
--radius-lg:  12px;    /* cards */
--radius-xl:  16px;    /* modales */
--radius-full: 9999px; /* chips, pills, avatars (utilisé sans variable nommée) */

--input-h:    42px;    /* hauteur unifiée des inputs (non-nudity sur les forms) */
--sidebar-w:  420px;   /* sidebar latérale (Settings, Knowledge)  */
```

### Transitions

```css
--t-fast:   120ms ease;   /* hover, focus, color shifts */
--t-normal: 200ms ease;   /* slide, fade, transform */
```

**Helix doit annoncer s'il introduit de nouvelles transitions et leurs durées.**

### Mapping demandé pour la migration

Pour chaque token Helix :
- nom proposé Helix
- variable KnowDesk équivalente (à mettre à jour) OU nouvelle variable (à ajouter)
- valeur hex
- exemples d'usage

---

## 3. Composants partagés à respecter

Localisation : `src/shared/components/ui/`. **Helix doit conserver les APIs ou fournir un mapping clair**. Sinon on refait le travail Sprint Axe F UI shared.

### Button

```ts
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize    = 'sm' | 'md' | 'lg';

interface ButtonProps extends HTMLButtonAttributes {
  variant?:   ButtonVariant;     // default 'secondary'
  size?:      ButtonSize;        // default 'md'
  loading?:   boolean;           // affiche un spinner, désactive le bouton, aria-busy
  fullWidth?: boolean;
  leftIcon?:  ReactNode;
}
```

Comportement loading : spinner + `disabled` + `aria-busy="true"`. Pas de label changé.

### Input

```ts
interface InputProps extends HTMLInputAttributes {
  label?:      string;
  error?:      string;       // affiche field-error + aria-invalid
  helperText?: string;       // affiche field-helper, masqué si error présent
  leftIcon?:   ReactNode;
  id:          string;       // OBLIGATOIRE, pour htmlFor + aria-describedby
}
```

Wrap dans `<div class="field">` avec label/input/error/helper. Pattern d'accessibilité strict (aria-invalid, aria-describedby, role="alert" sur l'erreur).

### Modal

```ts
interface ModalProps {
  title:            string;
  onClose:          () => void;
  size?:            'sm' | 'md' | 'lg';   // default 'md'
  className?:       string;
  footer?:          ReactNode;
  children:         ReactNode;
  closeOnEscape?:   boolean;              // default true
  closeOnBackdrop?: boolean;              // default true
  showCloseButton?: boolean;              // default true
  asForm?:          boolean;              // wrap body dans <form>, Enter submit naturellement
  onSubmit?:        (e: FormEvent) => void;
}
```

Focus trap automatique + ESC pour fermer + click sur backdrop. **Important pour l'a11y**.

### ConfirmDialog

```ts
interface ConfirmDialogProps {
  title:         string;
  description?:  string;
  confirmLabel?: string;                // default 'Confirmer'
  cancelLabel?:  string;                // default 'Annuler'
  variant?:      'danger' | 'primary';  // default 'danger'
  loading?:      boolean;
  onConfirm:     () => void;
  onCancel:      () => void;
}
```

**Jamais `window.confirm()` natif**. Utilisé pour les destructions et les baisses de paramètres critiques (rétention, etc.).

### Toast (`useToast()` hook + `<ToastContainer />` dans App)

```ts
const toast = useToast();
toast.success('Sauvegardé');
toast.error('Erreur', 'Détail optionnel');
toast.warning(...);
toast.info(...);
```

Position fixe top-right, animation slide-in-right.

### Skeleton

```ts
<Skeleton className="custom-classes-de-dimension" />
```

Composant minimaliste, taille définie par les classes CSS (ex `.member-sk-name` qui pose `height: 13px; width: 120px`).

### EmptyState

```ts
interface EmptyStateProps {
  title:        string;
  description:  string;
  ctaLabel?:    string;
  ctaHref?:     string;     // soit ça
  onCta?:       () => void; // soit ça
}
```

Icône SVG par défaut (un + carré). Si Helix change l'icône par défaut, le changer ici.

### StatusBadge

```ts
type Status = 'draft' | 'published' | 'archived';
<StatusBadge status="published" />
```

Toujours TEXTE + couleur (jamais juste couleur — règle a11y stricte).

### ChipsInput

```ts
interface ChipsInputProps {
  value:        string[];
  onChange:     (next: string[]) => void;
  placeholder?: string;
  suggestions?: string[];   // active autocomplete dropdown
  max?:         number;
  disabled?:    boolean;
}
```

Enter ou virgule → valide chip. Backspace sur input vide → supprime dernier chip.

### Tooltip (InfoTooltip)

```ts
<InfoTooltip placement="top|bottom" rows={[{...}]} />
```

Bulle d'aide avec ⓘ icône. Smart placement (mesure réelle, évite l'overflow).

### Bannières spéciales (transverses)

- `<ImpersonateBanner />` : bandeau orange dès `authStore.impersonating` truthy. Doit rester visible en mode impersonation.
- `<NetworkErrorBanner />` : bandeau brun en cas de coupure réseau.
- `<Sentry.ErrorBoundary fallback={...}>` : enveloppe `<App />` dans `main.tsx`.

---

## 4. Routes existantes (cartographie écran ↔ route)

### Auth (non authentifié)
```
/login                       → LoginPage
/register                    → RegisterForm
/forgot-password             → ForgotPasswordForm
/reset-password              → ResetPasswordForm
/invitation/:token           → AcceptInvitationPage   (legacy: ?token= à migrer en G3)
```

### Onboarding
```
/onboarding                  → OnboardingPage  (wizard premier login si user.onboardingDone=false)
```

### App principale (authentifié)
```
/dashboard ou /              → DashboardPage
/knowledge                   → KnowledgePage  (sidebar catégories arborescentes + liste articles + tags)
/articles/new                → ArticleEditor  (ouverture vide)
/articles/:id                → ArticlePage    (lecture)
/articles/:id/edit           → ArticleEditor  (édition)
/trees                       → TreesPage      (liste processus guidés)
/trees/:id                   → QuestionTreePage (mode lecture, navigation dans l'arbre)
/trees/:id/edit              → TreeEditor     (édition arbre)
/faqs                        → FaqsPage       (tableau dense + filtres)
/faqs/new                    → FaqEditor      (vide, query param `question` pré-remplit)
/faqs/:id/edit               → FaqEditor      (édition)
/members                     → MembersPage    (admin only — équipe + invitations)
/analytics                   → AnalyticsPage  (admin/manager only — KB Health Score + bandeau Réponse IA + top tags + zero-result + suggesteur FAQ)
/chats                       → ChatsPage      (admin only — conversations chatbot)
/audit                       → AuditPage      (admin STRICT only — pas managers)
/settings                    → SettingsPage   (avec section, voir tableau ci-dessous)
/account                     → AccountPage    (profil + email + mot de passe)
```

### Modes spéciaux (legacy query string)
```
?superadmin                  → SuperadminApp  (login + liste orgs + impersonation + reindex)
?api-docs                    → ApiDocsApp     (doc API publique)
```

### Settings — sous-sections internes (`/settings`)
- Général (nom org, locale, timezone)
- ✨ IA (Réponse IA admin : industry, tone, addressForm, glossary, on/off)
- 💬 Chatbot (welcome message, fallback, primary color, logo, allowed domains, handoff webhook/email, system prompt custom, **Confidentialité RGPD**, **rétention conversations 30/60/90/180j**)
- Notifications (préférences user)
- API Keys (génération/révocation)
- Synonymes (recherche)
- Tags (rename, delete)
- Imports (PDF/DOCX → article)
- Billing (placeholder)
- Danger zone (delete org, etc.)

---

## 5. États à livrer pour CHAQUE écran

Helix ne doit pas livrer juste le « happy path ». Pour chaque écran, **les 4 états suivants doivent exister** :

| État | Quand | Composant typique |
|---|---|---|
| **Loading** | Chargement initial des données | `<Skeleton />` (jamais de spinner global) |
| **Empty** | Aucune donnée à afficher | `<EmptyState title desc cta />` |
| **Error** | API a échoué | Toast (`toast.error`) + UI dégradée mais accessible |
| **Disabled** | Module désactivé / permission insuffisante | Variante grisée + tooltip explicatif si possible |

**Règle d'or** : « Loading initial échoue → toast.error + l'écran reste là, l'utilisateur sait qu'il y a un problème ». Pas d'écran blanc.

---

## 6. Conventions / contraintes à respecter

### Accessibilité
- `<button>` natif (jamais `<div onClick>`)
- `<label htmlFor>` lié à `<input id>`
- `aria-invalid`, `aria-describedby` sur les inputs en erreur
- `role="alert"` sur les messages d'erreur dynamiques
- `role="status" aria-live="polite"` sur les toasts
- `focus-visible` rings (déjà gérés via `--brand-500 outline 2.5px`)
- Navigation clavier complète : Tab, Esc, Enter
- Contrast ratio AA minimum (titre/texte sur background)
- **Jamais** la couleur seule pour transmettre du sens (cf. StatusBadge)

### Internationalisation (i18n)
- App actuellement **full français**, hardcodé
- **Pas de bibliothèque i18n** (react-i18next non installée)
- **Mais** : Helix doit structurer pour permettre l'extraction future. Concrètement : éviter les concaténations inline, regrouper les strings dans des variables nommées si possible
- **Aide en ligne** : 53 articles markdown statiques en français dans `src/features/help/content/`

### Animations
- Entrée modale : `fade-up` 0.2s ease (déjà défini dans `Modal.css`)
- Toast slide : `slide-in-right` 0.2s ease (`Toast.css`)
- Hover boutons : `--t-fast` (120ms) sur background + border
- **Pas d'animations gratuites** sur les contenus (article, FAQ, etc.) — interfèrent avec la lecture

### Breakpoints
```css
@media (max-width: 1024px) { /* tablet */ }
@media (max-width: 720px)  { /* mobile, single column, hide sidenav */ }
```

Pas de breakpoint plus fin pour MVP. Helix doit conserver ces deux ou en proposer un système clair.

---

## 7. Fonctionnalités RGPD / sécurité à conserver

À ne pas oublier ou retirer accidentellement :

- **Page `/audit`** : badge « 🔒 Coordonnées masquées » dans la modale transcript
- **Page `/chats`** : modale transcript a son propre badge « Coordonnées masquées »
- **Settings → Chatbot** : bloc « Confidentialité (RGPD) » avec textarea disclaimer + URL politique + sélecteur durée de conservation
- **Settings → Chatbot → Rétention** : si l'admin BAISSE la durée, ConfirmDialog s'affiche avec count de conversations qui seront supprimées
- **Bandeau orange impersonation** : `<ImpersonateBanner>` toujours visible quand on est en peau d'un admin via le superadmin
- **Sentry ErrorBoundary** : `main.tsx` enveloppe `<App />` avec un fallback UI

---

## 8. Liste des screens à mocker dans Helix mais qui existent en prod (à connecter à du vrai)

| Mocked | Vraie source |
|---|---|
| `HELIX_DATA.kbArticles` | `GET /api/v1/articles?categoryId=&tags=&page=` |
| `HELIX_DATA.modules` (e-learning, QM, surveys) | **N'EXISTE PAS en DB**, 3 modules désactivés sont des propositions produit non encore validées |
| `HELIX_DATA.kbHealthScore` | `GET /api/v1/kbscore` (5 dimensions : Couverture, Satisfaction FAQ, Fraîcheur, Utilisation, Clarté) |
| 5 stats footer | `GET /api/v1/analytics/overview` |
| Avatars / agents / activité live | `GET /api/v1/members` (pas d'activité live — pas de WebSocket presence) |

---

## 9. Backlog de questions à l'aller-retour

Cocher avec Claude Design / le PO :

- [ ] **Modules désactivés (e-learning, QM, surveys)** : on les affiche grisés ou on les retire ? Si grisés, comment expliquer « bientôt » sans frustrer l'utilisateur ?
- [ ] **Police Inter vs DM Sans** : on garde DM Sans (notre actuel) ou on bascule sur Inter ? Coût migration : faible mais bouge le rendu de tous les écrans.
- [ ] **Wording « Brouillon » vs « Draft »** : Helix a-t-il harmonisé ?
- [ ] **JetBrains Mono pour chiffres/code** : où exactement ? `chiffres KPI`, `metadata JSON audit`, autre ?
- [ ] **Refonte sidebar** : ordre ? regroupement ? Au-delà des 3 modules désactivés, qu'est-ce qui change ?
- [ ] **Reporting & insights** : c'est notre `/analytics` actuel ou un nouveau périmètre ?
- [ ] **Chatbot placeholder** : tu écris une nouvelle UI ou on garde le widget actuel + page admin `/chats` ?
- [ ] **Statégie de migration** : feature flag `?helix=true` pour switch ancien/nouveau pendant la transition ?

---

## 10. Format de livraison demandé

- **Pas** de fichier HTML+Babel inline (la maquette actuelle)
- **Oui** : composants React TS dans la structure du repo (`src/features/<x>/components/<Y>.tsx`)
- **Oui** : CSS extrait en `<feature>.css` co-localisé avec import depuis le `.tsx`
- **Oui** : PR par lot logique (auth+login, dashboard, KB, FAQs, etc.) — pas une PR géante
- **Oui** : page démo / Storybook avec tous les nouveaux composants côte-à-côte pour comparaison visuelle avant merge

---

## Annexes utiles

- Repo frontend : `BrieucLA/KnowDesk-frontend` — branch `main`
- `CLAUDE.md` racine du repo : contexte produit complet + roadmap
- Stylelint config : `.stylelintrc.json` (`npm run lint:css` → 0 erreur)
- Build : `npm run build` (Vite, ~1.2s, 145 kB CSS gzip 22 kB)
- Tests : `npm test` (8 tests authStore + ProtectedRoute, à étendre)
