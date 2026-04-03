# Web Client

Application React 18 SPA accessible sur `http://localhost:5173`.

## Pages

### Pages publiques (sans authentification)

| Route | Composant | Description |
|-------|-----------|-------------|
| `/` | `pages/index.tsx` | Page d'accueil — carousel destinations, tendances |
| `/about` | `pages/about/` | À propos de DreamScape |
| `/support` | `pages/support/` | Support client |
| `/flights` | `pages/flights/` | Recherche et réservation de vols |
| `/hotels` | `pages/hotels/` | Recherche d'hôtels |
| `/destinations` | `pages/destinations/` | Guide des destinations |
| `/destination/:id` | `pages/destination/` | Page détail d'une destination |
| `/experiences` | `pages/experiences/` | Expériences de voyage |
| `/experiences/:id` | `pages/experiences/` | Détail d'une expérience |
| `/activities` | `pages/activities/` | Recherche d'activités |
| `/activities/:id` | `pages/activities/` | Détail d'une activité |
| `/airlines` | `pages/airlines/` | Informations compagnies |
| `/airports` | `pages/airports/` | Informations aéroports |
| `/transfers` | `pages/transfers/` | Transports terrestres |
| `/flight-status` | `pages/flight-status.tsx` | Suivi de vol en temps réel |
| `/map` | `pages/map/` | Carte interactive Mapbox |
| `/legal/PrivacyPolicy` | `pages/legal/` | Politique de confidentialité |
| `/auth` | `pages/auth/` | Connexion / Inscription |

### Pages authentifiées

| Route | Description |
|-------|-------------|
| `/onboarding` | Wizard de configuration du profil |
| `/dashboard` | Dashboard personnalisé (4 types selon profil) |
| `/planner` | Planificateur d'itinéraires |
| `/planner/:id` | Détail d'un itinéraire |
| `/bookings` | Liste des réservations |
| `/bookings/:reference` | Détail d'une réservation |
| `/favorites` | Destinations et expériences sauvegardées |
| `/history` | Historique de recherches |
| `/settings` | Préférences utilisateur |
| `/profile/setup` | Configuration initiale du profil |
| `/checkout` | Formulaire de paiement Stripe |
| `/payment/confirmation` | Confirmation de paiement |
| `/analytics` | Statistiques de voyages |
| `/insights` | Recommandations personnalisées |
| `/vr/:id` | Viewer VR 360° |

### Pages admin (rôle `admin` requis)

| Route | Description |
|-------|-------------|
| `/admin/dashboard` | KPIs et métriques plateforme |
| `/admin/users` | Gestion des utilisateurs |
| `/admin/users/:id` | Détail d'un utilisateur |
| `/admin/bookings` | Toutes les réservations |
| `/admin/bookings/:id` | Détail d'une réservation |
| `/admin/payments` | Historique des paiements |

## Types de dashboards

Le dashboard s'adapte au type de voyageur défini lors de l'onboarding :

| Type | Route | Public cible |
|------|-------|-------------|
| `user` | `/dashboard` | Utilisateur standard |
| `leisure` | `/dashboard` | Voyageur loisirs |
| `business` | `/dashboard` | Voyageur d'affaires |
| `bleisure` | `/dashboard` | Business + loisirs |

## Flux d'authentification

```
1. Utilisateur visite l'app
2. App montée → useAuth().checkAuth()
   → Vérifie localStorage 'auth-storage'
   → Si token présent, GET /api/v1/auth/verify-token
3. Si valide → utilisateur connecté
4. Si invalide → POST /api/v1/auth/refresh (cookie refreshToken)
5. Si refresh échoue → redirect vers /auth
```

**Stockage :** Token en mémoire Zustand + persistance localStorage via `zustand/middleware/persist`.

**Clé localStorage :** `auth-storage`

**Routes protégées :** Wrapper `OnboardingGuard` vérifie `user.onboardingCompleted`. Si false, redirige vers `/onboarding`.

## Internationalisation

- **Langues** : Français (`fr`) et Anglais (`en`)
- **Détection** : Préférence navigateur → fallback `en`
- **Persistance** : `localStorage` clé `dreamscape-language`
- **Fichiers** : `public/locales/{lang}/{namespace}.json`

**Namespaces disponibles :**
`common`, `auth`, `dashboard`, `flights`, `hotels`, `destinations`, `experiences`, `activities`, `planner`, `settings`, `gdpr`, `support`, `onboarding`, `about`, `checkout`, `bookings`, `tools`, `errors`

**Utilisation dans les composants :**
```tsx
import { useTranslation } from 'react-i18next';

const { t } = useTranslation('flights');
return <h1>{t('search.title')}</h1>;
```

## Notifications temps réel

Le Web Client se connecte au User Service via Socket.IO à travers le Gateway :

```tsx
import { io } from 'socket.io-client';

const socket = io(GATEWAY_URL, {
  auth: { token: accessToken }
});

socket.on('notification', (notification) => {
  // Afficher toast via Sonner
  toast(notification.title, { description: notification.body });
});
```

## Flux de paiement (Stripe)

```
1. Utilisateur → /checkout
2. useCartStore.checkout() → POST /api/v1/voyage/cart/:userId/checkout
3. Réponse : { clientSecret, paymentIntentId, amount }
4. loadStripe(publishableKey) → <Elements stripe={stripe} clientSecret={cs}>
5. <StripeCheckoutForm> → stripe.confirmPayment()
6. Succès → POST /api/v1/voyage/bookings/:reference/confirm
7. Redirect → /payment/confirmation
8. useCartStore.clearCart()
```

## Variables d'environnement

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_API_GATEWAY_URL=http://localhost:3000/api
VITE_MAPBOX_TOKEN=pk.eyJ1...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_UNSPLASH_ACCESS_KEY=...
VITE_PANORAMA_URL=http://localhost:3006
```

## Scripts npm

```bash
npm run dev              # Vite dev server (HMR)
npm run build            # Build production → dist/
npm run preview          # Prévisualiser le build

npm run test             # Vitest (watch mode)
npm run test:run         # Vitest (CI mode)
npm run test:coverage    # Couverture de code

npm run cypress:open     # Tests E2E interactifs
npm run cypress:run      # Tests E2E headless

npm run test:mobile      # Tests viewport mobile (390×844)
npm run audit:responsive # Audit responsive
npm run audit:performance # Audit performances
```
