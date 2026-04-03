# Vue d'ensemble des microservices

## Carte des services

| Service | Port | Package npm | Entry point | Hot reload |
|---------|------|-------------|-------------|-----------|
| Auth | 3001 | `dreamscape-auth-service` | `src/server.ts` | `tsx watch` |
| User | 3002 | `dreamscape-user-service` | `src/server.ts` | `tsx watch` |
| Voyage | 3003 | `dreamscape-voyage-service` | `src/server.ts` | `tsx watch` |
| Payment | 3004 | `@dreamscape/payment-service` | `src/index.ts` | `nodemon + ts-node` |
| AI | 3005 | `dreamscape-ai-service` | `src/server.ts` | `tsx watch` |
| Gateway | 3000 | `dreamscape-gateway` | `src/server.ts` | `nodemon` |
| Web Client | 5173 | — | `src/main.tsx` | Vite HMR |
| Panorama VR | 3006 | `dreamscape-vr-poc` | `src/index.tsx` | React Scripts |

> **Note** : Le Payment Service utilise `ts-node + nodemon` à la place de `tsx`. Ne pas changer cette configuration.

## Dépendances inter-services

```
Auth Service ←── Gateway ──→ User Service
                   │    └──→ Voyage Service ──→ Payment Service
                   │                 └──→ (Kafka events)
                   └──→ AI Service ────→ (Kafka consumer)
```

### Packages internes partagés

| Package | Chemin | Consommateurs |
|---------|--------|---------------|
| `@dreamscape/db` | `dreamscape-services/db/` | auth, user, voyage, payment, ai |
| `@dreamscape/kafka` | `dreamscape-services/shared/kafka/` | auth, user, voyage, payment, ai |

> Après modification de `@dreamscape/kafka`, lancer `npm run build` dans `shared/kafka/` avant de redémarrer les services consommateurs.

## Auth Service (port 3001)

**Responsabilités** : Inscription, connexion, gestion des tokens JWT, révocation de sessions.

**Stack** : Express, Prisma, JWT, bcryptjs, Redis, Cookie-parser, kafkajs

**Routes** : `/api/v1/auth/*`

**Modèles Prisma** : `User`, `Session`, `TokenBlacklist`

**Kafka events produits** :
- `dreamscape.auth.user.login`
- `dreamscape.auth.user.logout`
- `dreamscape.auth.user.password-changed`

**Port hardcodé** : `3001` (défini directement dans `server.ts`, pas via `process.env.PORT`)

---

## User Service (port 3002)

**Responsabilités** : Profils utilisateur, préférences, onboarding, historique, favoris, notifications temps réel, RGPD, administration.

**Stack** : Express, Prisma, Socket.IO, Multer, SendGrid, kafkajs

**Routes** : `/api/v1/users/*`, `/api/v1/admin/*`

**Modèles Prisma** : `UserProfile`, `UserPreferences`, `UserSettings`, `UserHistory`, `UserBehavior`, `Favorite`, `TravelOnboardingProfile`, `Notification`, `NotificationPreference`, `GdprRequest`, `UserConsent`, `PrivacyPolicy`

**Kafka events produits** :
- `dreamscape.user.created`
- `dreamscape.user.updated`
- `dreamscape.user.preferences.updated`
- `dreamscape.user.onboarding.completed`

**Fonctionnalités notables** :
- Upload d'avatar (Multer)
- Notifications temps réel via Socket.IO (canal WebSocket `/socket.io`)
- Suspension de compte (admin)
- Audit logging (middleware `auditLogger`)
- Export/suppression données RGPD

---

## Voyage Service (port 3003)

**Responsabilités** : Recherche et réservation de vols, hôtels, activités. Gestion du panier multi-items et des itinéraires. Export PDF/ICS.

**Stack** : Express, Prisma, Amadeus SDK, Redis, jsPDF, ics, kafkajs

**Routes** : `/api/v1/voyage/*`

**Modèles Prisma** : `FlightData`, `HotelData`, `BookingData`, `LocationData`, `Cart`, `CartItem`, `Itinerary`, `ItineraryItem`, `SearchHistory`

**APIs externes** : Amadeus Flight Search API, Hotel Search API, Activity Search API, Flight Delay Prediction

**Kafka events produits** :
- `dreamscape.voyage.booking.created`
- `dreamscape.voyage.booking.confirmed`
- `dreamscape.voyage.cart.checkout`

**Kafka events consommés** :
- `dreamscape.payment.completed` → confirme la réservation
- `dreamscape.payment.failed` → annule la réservation

---

## Payment Service (port 3004)

**Responsabilités** : Traitement des paiements Stripe, gestion des webhooks, suivi des transactions.

**Stack** : Express, Stripe SDK, kafkajs

**Routes** : `/api/v1/payment/*`

**Modèles Prisma** : `PaymentTransaction`, `ProcessedWebhookEvent`

**Stripe** : Paiements par Intent, webhooks idempotents (dédupliqués via `ProcessedWebhookEvent`)

**Kafka events produits** :
- `dreamscape.payment.initiated`
- `dreamscape.payment.completed`
- `dreamscape.payment.failed`
- `dreamscape.payment.refunded`

**Note importante** : Le webhook Stripe nécessite le body brut (raw) — le middleware `express.raw()` est appliqué uniquement sur la route `/webhook`.

---

## AI Service (port 3005)

**Responsabilités** : Recommandations de destinations, hôtels et activités via un moteur vectoriel 8 dimensions. Gestion du cold start pour les nouveaux utilisateurs.

**Stack** : Express, Prisma, Redis, kafkajs

**Routes** : `/api/v1/ai/*`

**Modèles Prisma** : `UserVector`, `ItemVector`, `Recommendation`, `PredictionData`, `Analytics`

**Algorithmes** :
- Similarité cosinus (angle entre vecteurs)
- Similarité euclidienne (distance)
- Score hybride (70% cosinus + 30% euclidien)

**8 dimensions vectorielles** :
1. Climat
2. Culture / Nature
3. Budget
4. Activité
5. Groupe (solo, couple, famille...)
6. Urbain / Rural
7. Gastronomie
8. Popularité

**8 segments utilisateur** (cold start) :
`BUDGET_BACKPACKER`, `FAMILY_EXPLORER`, `LUXURY_TRAVELER`, `ADVENTURE_SEEKER`, `CULTURAL_ENTHUSIAST`, `ROMANTIC_COUPLE`, `BUSINESS_LEISURE`, `SENIOR_COMFORT`

---

## API Gateway (port 3000)

**Responsabilités** : Point d'entrée unique pour le frontend. Proxy HTTP vers les microservices, proxy WebSocket pour Socket.IO, sessions VR par PIN.

**Stack** : Express, http-proxy-middleware, Helmet, express-rate-limit, Redis

**Routes** :
- `/api/v1/auth/*` → Auth Service (3001)
- `/api/v1/users/*` → User Service (3002)
- `/api/v1/admin/*` → User Service (3002)
- `/api/v1/voyage/*` → Voyage Service (3003)
- `/api/v1/payment/*` → Payment Service (3004)
- `/api/v1/ai/*` → AI Service (3005)
- `/api/v1/vr/*` → Routes locales (gestion sessions VR — DR-574)
- `/socket.io` → WebSocket proxy vers User Service

**Rate limiting** : 100 requêtes / 15 minutes / IP

---

## Web Client (port 5173)

**Responsabilités** : Interface utilisateur principale. SPA React avec 30+ pages, paiement Stripe, cartes Mapbox, support i18n EN/FR.

Voir [Frontend — Web Client](../frontend/web-client.md) pour le détail.

---

## Panorama VR (port 3006)

**Responsabilités** : Expériences immersives 360°. Supporte les navigateurs desktop/mobile et les casques WebXR (Meta Quest 3, Apple Vision Pro).

Voir [Panorama VR Service](../services/panorama-vr.md) pour le détail.
