# Schéma de base de données

DreamScape utilise une **base PostgreSQL unique** partagée par tous les services backend, via un schéma Prisma unifié de 804 lignes dans `dreamscape-services/db/prisma/schema.prisma`.

## Configuration Prisma

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

**Pattern DATABASE_URL :**
```
postgresql://dreamscape_user:password@localhost:5432/dreamscape
```

## Vue d'ensemble des modèles

```mermaid
erDiagram
    User ||--o{ Session : "a"
    User ||--o{ TokenBlacklist : "a"
    User ||--|| UserProfile : "a"
    User ||--|| UserPreferences : "a"
    User ||--|| UserSettings : "a"
    User ||--o{ UserHistory : "a"
    User ||--o{ Favorite : "a"
    User ||--o| TravelOnboardingProfile : "a"
    User ||--o{ Notification : "a"
    User ||--o{ NotificationPreference : "a"
    User ||--o{ BookingData : "a"
    User ||--o{ Cart : "a"
    User ||--o{ Itinerary : "a"
    User ||--o| UserVector : "a"
    User ||--o{ Recommendation : "a"
    User ||--o{ PaymentTransaction : "a"
    User ||--o{ GdprRequest : "a"
    User ||--o{ UserConsent : "a"
    Cart ||--o{ CartItem : "a"
    BookingData ||--o{ PaymentTransaction : "a"
    Itinerary ||--o{ ItineraryItem : "a"
    ItemVector ||--o{ Recommendation : "a"
```

## Modèles par domaine

### Authentification (Auth Service)

#### `User` → table `users`
Entité centrale. Toutes les autres entités ont une relation avec `User`.

| Champ | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Clé primaire |
| `email` | String (unique) | Email de l'utilisateur |
| `password` | String | Hash bcrypt |
| `role` | Enum `Role` | `USER`, `ADMIN` |
| `firstName` | String? | Prénom |
| `lastName` | String? | Nom |
| `username` | String? (unique) | Pseudonyme |
| `isActive` | Boolean | Compte actif |
| `isEmailVerified` | Boolean | Email vérifié |
| `onboardingCompleted` | Boolean | Onboarding terminé |
| `createdAt` | DateTime | Date de création |
| `lastLoginAt` | DateTime? | Dernière connexion |

#### `Session` → table `sessions`
Sessions actives avec refresh tokens.

#### `TokenBlacklist` → table `token_blacklist`
Tokens révoqués avant expiration (logout, changement de mot de passe).

---

### Profil Utilisateur (User Service)

#### `UserProfile` → table `user_profiles`
Informations étendues du profil.

| Champ | Description |
|-------|-------------|
| `bio` | Biographie |
| `avatar` | URL de l'avatar |
| `location` | Localisation |
| `timezone` | Fuseau horaire |
| `language` | Langue préférée |
| `phone` | Numéro de téléphone |

#### `UserPreferences` → table `user_preferences`
Préférences de voyage.

| Champ | Description |
|-------|-------------|
| `preferredDestinations` | String[] — régions préférées |
| `travelBudget` | Budget moyen par voyage |
| `travelFrequency` | Fréquence de voyage |
| `accommodationType` | Type hébergement préféré |
| `groupType` | Solo / Couple / Famille / Groupe |

#### `UserSettings` → table `user_settings`
Paramètres applicatifs (notifications, confidentialité, localisation).

#### `UserHistory` → table `user_history`
Journal d'activité (recherches, vues, réservations). Indexé sur `userId` + `createdAt` pour les performances.

#### `TravelOnboardingProfile` → table `travel_onboarding_profiles`
Questionnaire d'onboarding complet. Stocke les 8 dimensions vectorielles + contraintes (accessibilité, régimes alimentaires, restrictions de voyage).

---

### Favoris

#### `Favorite` → table `favorites`

| Champ | Description |
|-------|-------------|
| `userId` | Référence utilisateur |
| `itemType` | `DESTINATION`, `FLIGHT`, `HOTEL`, `ACTIVITY` |
| `itemId` | ID de l'élément sauvegardé |
| `metadata` | JSON — données additionnelles |

---

### Voyage & Réservations (Voyage Service)

#### `FlightData` → table `flight_data`
Cache des offres de vols Amadeus (expire automatiquement).

#### `HotelData` → table `hotel_data`
Cache des données hôtels Amadeus.

#### `LocationData` → table `location_data`
Villes, aéroports, coordonnées géographiques.

#### `Cart` → table `carts`
Panier utilisateur.

| Champ | Description |
|-------|-------------|
| `userId` | Propriétaire |
| `status` | `ACTIVE`, `CHECKED_OUT`, `ABANDONED` |
| `expiresAt` | Expiration du panier |

#### `CartItem` → table `cart_items`
Article du panier.

| Champ | Description |
|-------|-------------|
| `cartId` | Référence panier |
| `itemType` | `FLIGHT`, `HOTEL`, `ACTIVITY` |
| `itemData` | JSON — données complètes de l'offre Amadeus |
| `price` | Prix unitaire |
| `currency` | Devise |
| `quantity` | Quantité |

#### `BookingData` → table `bookings`
Réservation confirmée.

| Champ | Description |
|-------|-------------|
| `reference` | Référence unique (format `DS-XXXXXXXX`) |
| `userId` | Propriétaire |
| `status` | `PENDING`, `CONFIRMED`, `CANCELLED`, `REFUNDED` |
| `totalAmount` | Montant total |
| `paymentIntentId` | Référence Stripe |
| `items` | JSON — articles réservés |

#### `Itinerary` → table `itineraries`
Itinéraire de voyage.

#### `ItineraryItem` → table `itinerary_items`
Élément d'itinéraire (vol, hôtel, activité, note personnelle).

---

### Recommandations IA (AI Service)

#### `UserVector` → table `user_vectors`
Vecteur 8D de l'utilisateur (mis à jour à chaque interaction).

| Champ | Type | Description |
|-------|------|-------------|
| `userId` | String | Référence utilisateur |
| `climate` | Float | Dimension 1 |
| `cultureNature` | Float | Dimension 2 |
| `budget` | Float | Dimension 3 |
| `activity` | Float | Dimension 4 |
| `groupType` | Float | Dimension 5 |
| `urbanRural` | Float | Dimension 6 |
| `gastronomy` | Float | Dimension 7 |
| `popularity` | Float | Dimension 8 |
| `confidence` | Float | Niveau de confiance du vecteur [0-1] |
| `segment` | String? | Segment calculé |

#### `ItemVector` → table `item_vectors`
Vecteur 8D d'une destination/hôtel/activité.

#### `Recommendation` → table `recommendations`
Recommandation générée avec score, raisons et tracking.

| Champ | Description |
|-------|-------------|
| `userId` | Bénéficiaire |
| `itemVectorId` | Item recommandé |
| `score` | Score de similarité [0-1] |
| `confidence` | Confiance de la recommandation |
| `reasons` | String[] — raisons du match |
| `status` | `ACTIVE`, `VIEWED`, `CLICKED`, `BOOKED`, `DISMISSED` |
| `contextType` | `GENERAL`, `FLIGHT`, `HOTEL`, `ACTIVITY` |

#### `PredictionData` / `Analytics`
Sorties ML et métriques de performance.

---

### Paiements (Payment Service)

#### `PaymentTransaction` → table `payment_transactions`

| Champ | Description |
|-------|-------------|
| `paymentIntentId` | ID Stripe (unique) |
| `userId` | Payeur |
| `bookingReference` | Référence réservation |
| `amount` | Montant en centimes |
| `currency` | Devise (EUR) |
| `status` | `PENDING`, `SUCCEEDED`, `FAILED`, `REFUNDED` |

#### `ProcessedWebhookEvent` → table `processed_webhook_events`
Dédupliquation des webhooks Stripe (idempotence).

---

### RGPD & Consentement (User Service)

#### `PrivacyPolicy` → table `privacy_policies`
Versioning de la politique de confidentialité.

#### `UserConsent` → table `user_consents`
Consentements par catégorie (analytics, marketing, functional, preferences).

#### `ConsentHistory` → table `consent_history`
Historique des changements de consentement.

#### `GdprRequest` → table `gdpr_requests`
Demandes d'exercice des droits RGPD.

| Type | Description |
|------|-------------|
| `DATA_EXPORT` | Export des données personnelles |
| `DATA_DELETION` | Suppression du compte |
| `DATA_RECTIFICATION` | Correction des données |
| `RESTRICTION` | Limitation du traitement |
| `PORTABILITY` | Portabilité des données |

#### `DataAccessLog` → table `data_access_logs`
Journal d'accès aux données sensibles (IP, user-agent, timestamp).

---

### Notifications (User Service)

#### `Notification` → table `notifications`

| Champ | Description |
|-------|-------------|
| `userId` | Destinataire |
| `type` | Type de notification (booking_confirmation, price_alert...) |
| `title` | Titre |
| `body` | Corps du message |
| `status` | `UNREAD`, `READ`, `DELETED` |
| `metadata` | JSON — données contextuelles |

#### `NotificationPreference` → table `notification_preferences`
Préférences par type et canal (email, push, sms).

---

## Conventions

- Toutes les relations utilisent `onDelete: Cascade` pour l'intégrité des données
- Les modèles sont en `PascalCase`, les tables en `snake_case` (via `@@map`)
- Indexes sur les colonnes fréquemment requêtées (`userId`, `createdAt`, `status`)
- Les dates sont stockées en UTC

## Opérations courantes

```bash
# Depuis dreamscape-services/db/

# Pousser le schéma (dev)
npm run db:push

# Créer une migration (production)
npm run db:migrate

# Régénérer le client Prisma (OBLIGATOIRE après chaque modif)
npm run db:generate

# Interface graphique
npm run db:studio

# Seeder
npm run db:seed
```

> Après toute modification du schéma, lancer `npm run db:generate` dans `dreamscape-services/db/` **et** dans chaque service qui importe `@dreamscape/db`.
