# User API

**Base URL** : `/api/v1/users` + `/api/v1/admin` | **Service** : User Service (:3002)

## Endpoints — Profil

| Méthode | Path | Auth | Description |
|---------|------|------|-------------|
| `GET` | `/users/profile` | JWT | Récupérer le profil |
| `PUT` | `/users/profile` | JWT | Mettre à jour le profil |
| `DELETE` | `/users/profile` | JWT | Supprimer le compte |

### `GET /users/profile`
```bash
curl http://localhost:3000/api/v1/users/profile \
  -H "Authorization: Bearer eyJ..."
```

---

## Endpoints — Onboarding

| Méthode | Path | Auth | Description |
|---------|------|------|-------------|
| `POST` | `/users/onboarding/init` | JWT | Initialiser l'onboarding |
| `POST` | `/users/onboarding/progress` | JWT | Sauvegarder une étape |
| `GET` | `/users/onboarding/progress` | JWT | Obtenir la progression |
| `POST` | `/users/onboarding/complete` | JWT | Finaliser l'onboarding |

### `POST /users/onboarding/progress`
```json
{
  "step": "travel_style",
  "data": {
    "preferredDestinations": ["europe", "asia"],
    "travelBudget": "medium",
    "travelFrequency": "2-3_per_year",
    "groupType": "couple",
    "accommodationType": "hotel"
  }
}
```

---

## Endpoints — Favoris

| Méthode | Path | Auth | Description |
|---------|------|------|-------------|
| `GET` | `/users/favorites` | JWT | Lister les favoris |
| `POST` | `/users/favorites` | JWT | Ajouter un favori |
| `DELETE` | `/users/favorites/:id` | JWT | Supprimer un favori |
| `POST` | `/users/favorites/batch` | JWT | Ajout en masse |
| `DELETE` | `/users/favorites/batch` | JWT | Suppression en masse |

### `POST /users/favorites`
```json
{
  "itemType": "destination",
  "itemId": "paris-cdg"
}
```
`itemType` : `destination` | `flight` | `hotel` | `activity`

---

## Endpoints — Historique

| Méthode | Path | Auth | Description |
|---------|------|------|-------------|
| `GET` | `/users/history` | JWT | Historique de recherches |
| `DELETE` | `/users/history` | JWT | Effacer l'historique |

**Query params pour GET :** `type`, `limit` (défaut 20), `offset`, `from` (date), `to` (date)

---

## Endpoints — Notifications

| Méthode | Path | Auth | Description |
|---------|------|------|-------------|
| `GET` | `/users/notifications` | JWT | Lister les notifications |
| `PATCH` | `/users/notifications/:id/read` | JWT | Marquer comme lue |
| `DELETE` | `/users/notifications` | JWT | Supprimer les lues |

**Query params pour GET :** `status` (unread/read/all), `type`, `limit`, `offset`

---

## Endpoints — Préférences de notifications

| Méthode | Path | Auth | Description |
|---------|------|------|-------------|
| `GET` | `/users/notification-preferences` | JWT | Lire les préférences |
| `PUT` | `/users/notification-preferences` | JWT | Mettre à jour |

### `GET /users/notification-preferences`
```json
{
  "success": true,
  "data": {
    "booking_confirmation": { "email": true, "push": true, "sms": false },
    "price_alert": { "email": true, "push": false, "sms": false },
    "trip_reminder": { "email": true, "push": true, "sms": true },
    "promotions": { "email": false, "push": false, "sms": false }
  }
}
```

---

## Endpoints — RGPD

| Méthode | Path | Auth | Description |
|---------|------|------|-------------|
| `GET` | `/users/gdpr/consent` | JWT | Lire les consentements |
| `POST` | `/users/gdpr/consent` | JWT | Mettre à jour les consentements |
| `POST` | `/users/gdpr/request` | JWT | Soumettre une demande RGPD |
| `GET` | `/users/gdpr/requests` | JWT | Lister mes demandes |
| `GET` | `/users/gdpr/privacy-policy` | Non | Politique en vigueur |
| `POST` | `/users/gdpr/privacy-policy/accept` | JWT | Accepter la politique |

### `POST /users/gdpr/consent`
```json
{
  "analytics": true,
  "marketing": false,
  "functional": true,
  "preferences": true
}
```
**200 OK :** `{ "success": true, "data": { "analytics": true, "marketing": false, ... } }`

### `POST /users/gdpr/request`
```json
{
  "type": "DATA_EXPORT",
  "reason": "Je souhaite récupérer mes données personnelles"
}
```
Types : `DATA_EXPORT` | `DATA_DELETION` | `DATA_RECTIFICATION` | `RESTRICTION` | `PORTABILITY`

---

## Endpoints — Administration

**Requiert le rôle `admin`**

| Méthode | Path | Auth | Description |
|---------|------|------|-------------|
| `GET` | `/admin/users` | JWT+admin | Liste tous les utilisateurs |
| `GET` | `/admin/users/:id` | JWT+admin | Détails d'un utilisateur |
| `POST` | `/admin/users/:id/suspend` | JWT+admin | Suspendre un compte |
| `POST` | `/admin/users/:id/unsuspend` | JWT+admin | Réactiver un compte |

### `POST /admin/users/:id/suspend`
```json
{
  "reason": "Violation des conditions d'utilisation",
  "duration": "7d"
}
```
