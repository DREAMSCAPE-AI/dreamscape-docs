# Auth Service

**Port** : 3001 | **Package** : `dreamscape-auth-service` | **Pod** : Core

## Responsabilités

- Inscription et connexion des utilisateurs
- Gestion des tokens JWT (access token + refresh token en cookie httpOnly)
- Révocation de tokens (blacklist Redis)
- Gestion multi-appareils (logout-all)
- Rate limiting par endpoint
- Publication d'événements Kafka sur les actions d'authentification

## Stack technique

| Dépendance | Usage |
|------------|-------|
| Express 4.18 | Framework HTTP |
| Prisma 5.7 | ORM PostgreSQL |
| jsonwebtoken 9.0 | Génération/validation JWT |
| bcryptjs | Hashage des mots de passe |
| cookie-parser | Gestion des cookies httpOnly |
| express-validator | Validation des entrées |
| redis 4.6 | Cache sessions + token blacklist |
| kafkajs 2.2 | Publication d'événements |
| helmet | Headers de sécurité |

## Configuration

| Variable | Valeur par défaut | Description |
|----------|-------------------|-------------|
| `PORT` | `3001` (hardcodé dans server.ts) | Port d'écoute |
| `JWT_SECRET` | — | Clé secrète access token (partagée avec tous les services) |
| `JWT_EXPIRES_IN` | `15m` | Durée access token |
| `JWT_REFRESH_SECRET` | — | Clé secrète refresh token |
| `JWT_REFRESH_EXPIRES_IN` | `7d` (30j si rememberMe) | Durée refresh token |
| `DATABASE_URL` | — | Connexion PostgreSQL |
| `REDIS_URL` | `redis://localhost:6379` | Cache |
| `CLIENT_URL` | `http://localhost:5173` | Origin autorisée CORS |
| `KAFKA_BROKERS` | `localhost:9092` | Adresses Kafka |

## Endpoints

### `POST /api/v1/auth/register`

Crée un nouveau compte utilisateur.

**Auth** : Publique | **Rate limit** : `registerLimiter`

**Body :**
```json
{
  "email": "user@example.com",       // requis, format email
  "password": "Password1!",          // requis, min 8 chars, maj + min + chiffre + spécial
  "firstName": "Jean",               // optionnel, 1-50 chars
  "lastName": "Dupont",              // optionnel, 1-50 chars
  "username": "jeandupont"           // optionnel, 3-30 chars
}
```

**Réponse 201 :**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "role": "user" },
    "tokens": { "accessToken": "eyJ..." }
  }
}
```

> Le `refreshToken` est automatiquement placé dans un cookie httpOnly `refreshToken` (7 jours).

**Erreurs** : `400` validation | `409` email déjà utilisé

---

### `POST /api/v1/auth/login`

Authentifie un utilisateur et retourne un access token.

**Auth** : Publique | **Rate limit** : `loginLimiter`

**Body :**
```json
{
  "email": "user@example.com",
  "password": "Password1!",
  "rememberMe": false        // optionnel — refresh token 30j si true (7j sinon)
}
```

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "role": "user", "firstName": "...", "lastName": "..." },
    "tokens": { "accessToken": "eyJ..." }
  }
}
```

**Kafka event** : `dreamscape.auth.user.login` (userId, sessionId, loginAt, method, ipAddress, userAgent)

**Erreurs** : `400` validation | `401` identifiants incorrects

---

### `GET /api/v1/auth/profile`

Retourne le profil de l'utilisateur connecté.

**Auth** : Bearer JWT requis

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "email": "...",
    "firstName": "...",
    "lastName": "...",
    "username": "...",
    "role": "user"
  }
}
```

---

### `PUT /api/v1/auth/profile`

Met à jour le profil de l'utilisateur connecté.

**Auth** : Bearer JWT requis

**Body** (tous champs optionnels) :
```json
{
  "email": "newemail@example.com",
  "firstName": "Jean",
  "lastName": "Martin",
  "username": "jeanmartin"
}
```

---

### `POST /api/v1/auth/change-password`

Change le mot de passe de l'utilisateur.

**Auth** : Bearer JWT requis

**Body :**
```json
{
  "currentPassword": "OldPassword1!",
  "newPassword": "NewPassword1!"
}
```

**Effets** : Invalide tous les refresh tokens existants + publie `dreamscape.auth.user.password-changed`

---

### `POST /api/v1/auth/refresh`

Renouvelle l'access token via le refresh token.

**Auth** : Cookie `refreshToken` (ou `body.refreshToken`) | **Rate limit** : `refreshLimiter`

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "tokens": { "accessToken": "eyJ..." }
  }
}
```

---

### `POST /api/v1/auth/verify-token`

Vérifie la validité d'un access token.

**Auth** : Bearer JWT requis

**Réponse 200 :**
```json
{
  "success": true,
  "message": "Token is valid",
  "data": { "user": { "id": "...", "email": "...", "role": "..." } }
}
```

---

### `POST /api/v1/auth/logout`

Révoque le refresh token et nettoie le cookie.

**Auth** : Cookie `refreshToken`

**Kafka event** : `dreamscape.auth.user.logout` (userId, sessionId, logoutAt, reason)

---

### `POST /api/v1/auth/logout-all`

Révoque tous les refresh tokens de l'utilisateur (déconnexion multi-appareils).

**Auth** : Bearer JWT requis

---

### `GET /health`

```json
{ "status": "healthy", "database": "connected", "cache": "connected" }
```

## Modèles Prisma

| Modèle | Table | Description |
|--------|-------|-------------|
| `User` | `users` | Entité utilisateur principale |
| `Session` | `sessions` | Sessions actives |
| `TokenBlacklist` | `token_blacklist` | Tokens révoqués |

## Événements Kafka produits

| Topic | Déclencheur | Payload clés |
|-------|-------------|-------------|
| `dreamscape.auth.user.login` | Login réussi | userId, sessionId, loginAt, ipAddress, userAgent |
| `dreamscape.auth.user.logout` | Logout | userId, sessionId, logoutAt, reason |
| `dreamscape.auth.user.password-changed` | Changement mot de passe | userId, changedAt, method |

## Sécurité

- Mots de passe hashés avec bcryptjs (cost factor 12)
- Refresh tokens en cookie httpOnly + secure (prod) + sameSite: strict
- Access tokens à courte durée de vie (15 min par défaut)
- Token blacklist Redis pour révocation immédiate
- Rate limiting par endpoint (login, register, refresh)
- Headers sécurité via Helmet

Voir [Analyse sécurité Auth](../security/auth-security.md) pour l'audit détaillé.
