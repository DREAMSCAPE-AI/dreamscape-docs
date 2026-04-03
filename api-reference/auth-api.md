# Auth API

**Base URL** : `/api/v1/auth` | **Service** : Auth Service (:3001)

## Endpoints

| Méthode | Path | Auth | Description |
|---------|------|------|-------------|
| `POST` | `/register` | Non | Inscription |
| `POST` | `/login` | Non | Connexion |
| `GET` | `/profile` | JWT | Profil courant |
| `PUT` | `/profile` | JWT | Mise à jour profil |
| `POST` | `/change-password` | JWT | Changement mot de passe |
| `POST` | `/refresh` | Cookie | Renouvellement token |
| `POST` | `/verify-token` | JWT | Vérification token |
| `POST` | `/logout` | Cookie | Déconnexion |
| `POST` | `/logout-all` | JWT | Déconnexion tous appareils |
| `GET` | `/health` | Non | Health check |

---

## `POST /register`

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jean@example.com",
    "password": "Password1!",
    "firstName": "Jean",
    "lastName": "Dupont"
  }'
```

**Body :**

| Champ | Type | Requis | Contraintes |
|-------|------|--------|-------------|
| `email` | string | oui | Format email valide |
| `password` | string | oui | Min 8 chars, maj + min + chiffre + spécial |
| `firstName` | string | non | 1-50 chars |
| `lastName` | string | non | 1-50 chars |
| `username` | string | non | 3-30 chars |

**201 Created :**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clxxxxx",
      "email": "jean@example.com",
      "firstName": "Jean",
      "lastName": "Dupont",
      "role": "user"
    },
    "tokens": { "accessToken": "eyJ..." }
  }
}
```

Cookie `refreshToken` posé automatiquement (httpOnly, 7 jours).

**Erreurs :** `400` validation | `409` email déjà utilisé

---

## `POST /login`

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "jean@example.com", "password": "Password1!"}'
```

**Body :**

| Champ | Type | Requis |
|-------|------|--------|
| `email` | string | oui |
| `password` | string | oui |
| `rememberMe` | boolean | non — refresh token 30j si `true` |

**200 OK :**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "role": "user", "firstName": "...", "lastName": "..." },
    "tokens": { "accessToken": "eyJ..." }
  }
}
```

**Erreurs :** `400` validation | `401` identifiants incorrects

---

## `GET /profile`

```bash
curl http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer eyJ..."
```

**200 OK :**
```json
{
  "success": true,
  "data": {
    "id": "...", "email": "...", "firstName": "...", "lastName": "...",
    "username": "...", "role": "user", "onboardingCompleted": true
  }
}
```

---

## `PUT /profile`

```bash
curl -X PUT http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{"firstName": "Jean-Pierre", "username": "jp_dupont"}'
```

---

## `POST /change-password`

```bash
curl -X POST http://localhost:3000/api/v1/auth/change-password \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{"currentPassword": "OldPassword1!", "newPassword": "NewPassword2@"}'
```

---

## `POST /refresh`

```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  --cookie "refreshToken=<token>"
```

Ou via body : `{ "refreshToken": "..." }`

**200 OK :**
```json
{
  "success": true,
  "data": { "tokens": { "accessToken": "eyJ..." } }
}
```

---

## `POST /verify-token`

```bash
curl -X POST http://localhost:3000/api/v1/auth/verify-token \
  -H "Authorization: Bearer eyJ..."
```

**200 OK :**
```json
{
  "success": true,
  "message": "Token is valid",
  "data": { "user": { "id": "...", "email": "...", "role": "..." } }
}
```

---

## `POST /logout`

```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  --cookie "refreshToken=<token>"
```

**200 OK :** `{ "success": true, "message": "Logged out successfully" }`

---

## `POST /logout-all`

```bash
curl -X POST http://localhost:3000/api/v1/auth/logout-all \
  -H "Authorization: Bearer eyJ..."
```

Révoque tous les refresh tokens de l'utilisateur (déconnexion multi-appareils).
