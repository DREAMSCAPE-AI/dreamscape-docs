# User Service

**Port** : 3002 | **Package** : `dreamscape-user-service` | **Pod** : Core

## Responsabilités

- Gestion des profils et préférences utilisateurs
- Parcours d'onboarding (questionnaire de préférences voyages)
- Historique d'activité et favoris
- Notifications temps réel (Socket.IO)
- Préférences de notifications (par type et canal)
- Conformité RGPD (consentement, export, suppression)
- Administration (suspension de comptes, audit)
- Intégration IA (profil vectoriel utilisateur)

## Stack technique

| Dépendance | Usage |
|------------|-------|
| Express 4.18 | Framework HTTP |
| Prisma 5.7 | ORM PostgreSQL |
| Socket.IO 4.8 | Notifications temps réel |
| Multer 2.0 | Upload d'avatar |
| SendGrid | Emails transactionnels |
| kafkajs 2.2 | Événements asynchrones |
| express-validator | Validation des entrées |

## Routes

| Module | Préfixe | Fichier |
|--------|---------|---------|
| Profil | `/api/v1/users/profile` | `routes/profile.ts` |
| Onboarding | `/api/v1/users/onboarding` | `routes/onboarding.ts` |
| Historique | `/api/v1/users/history` | `routes/history.ts` |
| Favoris | `/api/v1/users/favorites` | `routes/favorites.ts` |
| RGPD | `/api/v1/users/gdpr` | `routes/gdpr.ts` |
| Notifications | `/api/v1/users/notifications` | `routes/notificationRoutes.ts` |
| Préférences notifications | `/api/v1/users/notification-preferences` | `routes/notificationPreferencesRoutes.ts` |
| Intégration IA | `/api/v1/ai` | `routes/aiIntegration.ts` |
| Administration | `/api/v1/admin` | `routes/admin.ts` |
| Health | `/health` | `routes/health.ts` |

## Profil utilisateur

### `GET /api/v1/users/profile`
Récupère le profil complet de l'utilisateur connecté.

**Auth** : Bearer JWT

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "email": "...",
    "firstName": "...",
    "lastName": "...",
    "avatar": "https://...",
    "bio": "...",
    "location": "...",
    "preferences": { ... }
  }
}
```

### `PUT /api/v1/users/profile`
Met à jour le profil. Supporte l'upload d'avatar (multipart/form-data via Multer).

### `DELETE /api/v1/users/profile`
Supprime le compte utilisateur (soft delete RGPD).

## Onboarding

### `POST /api/v1/users/onboarding/init`
Initialise le profil d'onboarding.

### `POST /api/v1/users/onboarding/progress`
Sauvegarde la progression à l'étape en cours.

**Body :**
```json
{
  "step": "travel_style",
  "data": {
    "preferredDestinations": ["europe", "asia"],
    "travelBudget": "medium",
    "travelFrequency": "2-3_per_year",
    "groupType": "couple"
  }
}
```

### `GET /api/v1/users/onboarding/progress`
Récupère l'état actuel de l'onboarding.

### `POST /api/v1/users/onboarding/complete`
Finalise l'onboarding. Déclenche la génération du vecteur IA.

**Kafka event** : `dreamscape.user.onboarding.completed`

## Favoris

### `GET /api/v1/users/favorites`
Liste tous les favoris de l'utilisateur.

### `POST /api/v1/users/favorites`
Ajoute un élément aux favoris.

**Body :**
```json
{
  "itemType": "destination",  // "destination" | "flight" | "hotel" | "activity"
  "itemId": "..."
}
```

### `DELETE /api/v1/users/favorites/:id`
Supprime un favori.

### `POST /api/v1/users/favorites/batch`
Ajout en masse.

### `DELETE /api/v1/users/favorites/batch`
Suppression en masse.

## Historique

### `GET /api/v1/users/history`
Retourne l'historique de recherches et d'actions de l'utilisateur.

Paramètres query : `type`, `limit`, `offset`, `from`, `to`

### `DELETE /api/v1/users/history`
Efface l'historique (RGPD).

## Notifications temps réel

Les notifications sont envoyées en temps réel via Socket.IO. La connexion WebSocket passe par le Gateway.

### `GET /api/v1/users/notifications`
Liste les notifications de l'utilisateur.

Paramètres : `status` (unread/read/all), `type`, `limit`, `offset`

### `PATCH /api/v1/users/notifications/:id/read`
Marque une notification comme lue.

### `DELETE /api/v1/users/notifications`
Supprime toutes les notifications lues.

## Préférences de notifications

### `GET /api/v1/users/notification-preferences`
Retourne les préférences par type et canal.

**Réponse :**
```json
{
  "success": true,
  "data": {
    "booking_confirmation": { "email": true, "push": true, "sms": false },
    "price_alert": { "email": true, "push": false, "sms": false },
    "trip_reminder": { "email": true, "push": true, "sms": true }
  }
}
```

### `PUT /api/v1/users/notification-preferences`
Met à jour les préférences de manière granulaire.

## RGPD

### `GET /api/v1/users/gdpr/consent`
Retourne les consentements actuels de l'utilisateur.

### `POST /api/v1/users/gdpr/consent`
Met à jour le consentement.

**Body :**
```json
{
  "analytics": true,
  "marketing": false,
  "functional": true,
  "preferences": true
}
```

**Réponse :** `{ "success": true, "data": { "analytics": true, ... } }`

> Le contrôleur retourne l'objet directement dans `data`, **pas** imbriqué (`{ "data": { "consent": {...} } }` est incorrect).

### `POST /api/v1/users/gdpr/request`
Soumet une demande RGPD.

**Body :**
```json
{
  "type": "DATA_EXPORT",  // DATA_EXPORT | DATA_DELETION | DATA_RECTIFICATION | RESTRICTION | PORTABILITY
  "reason": "..."
}
```

### `GET /api/v1/users/gdpr/requests`
Liste les demandes RGPD de l'utilisateur.

### `GET /api/v1/users/gdpr/privacy-policy`
Retourne la politique de confidentialité en vigueur.

### `POST /api/v1/users/gdpr/privacy-policy/accept`
Enregistre l'acceptation de la politique de confidentialité.

## Administration

### `GET /api/v1/admin/users`
Liste tous les utilisateurs (admin uniquement).

### `GET /api/v1/admin/users/:id`
Détails d'un utilisateur.

### `POST /api/v1/admin/users/:id/suspend`
Suspend un compte utilisateur.

**Body :** `{ "reason": "...", "duration": "7d" }`

### `POST /api/v1/admin/users/:id/unsuspend`
Réactive un compte suspendu.

## Modèles Prisma

| Modèle | Description |
|--------|-------------|
| `UserProfile` | Profil étendu (bio, avatar, localisation) |
| `UserPreferences` | Préférences de voyage |
| `UserSettings` | Paramètres (notifications, langue, fuseau horaire) |
| `UserHistory` | Journal d'activité (avec index de performance) |
| `UserBehavior` | Suivi des actions pour analytics |
| `Favorite` | Éléments sauvegardés (vols, hôtels, destinations) |
| `TravelOnboardingProfile` | Questionnaire complet d'onboarding (8 dimensions) |
| `Notification` | Notifications utilisateur |
| `NotificationPreference` | Préférences par type/canal |
| `GdprRequest` | Demandes d'exercice des droits |
| `UserConsent` | Historique des consentements par catégorie |
| `PrivacyPolicy` | Versioning de la politique de confidentialité |

## Événements Kafka

### Produits

| Topic | Déclencheur |
|-------|-------------|
| `dreamscape.user.created` | Création de profil |
| `dreamscape.user.updated` | Mise à jour profil |
| `dreamscape.user.preferences.updated` | Changement de préférences |
| `dreamscape.user.onboarding.completed` | Fin d'onboarding |

### Consommés

| Topic | Action |
|-------|--------|
| `dreamscape.auth.user.login` | Mise à jour lastLoginAt |
| `dreamscape.payment.completed` | Notification de confirmation de réservation |
