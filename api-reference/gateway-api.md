# Gateway API

**Port** : 3000 | **Package** : `dreamscape-gateway`

## Routes de proxy

Le Gateway proxie toutes les requêtes vers les microservices. La table complète :

| Path | Service cible | Port |
|------|--------------|------|
| `/api/v1/auth/*` | Auth Service | 3001 |
| `/api/v1/users/*` | User Service | 3002 |
| `/api/v1/admin/*` | User Service | 3002 |
| `/api/v1/voyage/*` | Voyage Service | 3003 |
| `/api/v1/payment/*` | Payment Service | 3004 |
| `/api/v1/ai/*` | AI Service | 3005 |
| `/api/v1/vr/*` | Local (gateway) | — |
| `/socket.io` | User Service (WS) | 3002 |

## Routes locales

### `GET /health`

```json
{
  "status": "healthy",
  "gateway": "running",
  "timestamp": "2024-03-15T10:30:00Z"
}
```

### `GET /docs`

Retourne la description des routes disponibles.

```json
{
  "title": "DreamScape API Gateway",
  "version": "1.0.0",
  "endpoints": {
    "/api/v1/auth": "Authentication service",
    "/api/v1/users": "User management service",
    "/api/v1/vr/sessions": "VR PIN sessions (DR-574)",
    "/health": "Health check endpoint"
  }
}
```

### `GET /`

```json
{
  "message": "DreamScape API Gateway",
  "version": "1.0.0",
  "status": "running"
}
```

## Sessions VR (DR-574)

### `POST /api/v1/vr/sessions`

Crée une session VR avec un code PIN à 4 chiffres.

**Body :**
```json
{
  "destination": "paris",
  "userId": "user-uuid"
}
```

**200 OK :**
```json
{
  "pin": "4823",
  "sessionId": "vr-session-uuid",
  "destination": "paris",
  "expiresAt": "2024-03-15T11:30:00Z",
  "redirectUrl": "http://localhost:3006?environment=paris"
}
```

### `GET /api/v1/vr/sessions/:pin`

Valide un PIN et retourne les données de session.

**200 OK :**
```json
{
  "valid": true,
  "sessionId": "...",
  "destination": "paris",
  "expiresAt": "..."
}
```

**404 :** PIN invalide ou expiré.

### `DELETE /api/v1/vr/sessions/:pin`

Invalide une session VR.

## Rate Limiting

- **Limite** : 100 requêtes / 15 minutes / IP
- **En-tête de dépassement** : `Retry-After: <seconds>`
- **Code retour** : `429 Too Many Requests`
- **Bypass test** : `x-test-rate-limit: true`

## WebSocket

Le Gateway proxie les connexions Socket.IO vers le User Service :

```javascript
// Côté client (web-client)
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: accessToken }
});

socket.on('notification', (data) => {
  console.log('Nouvelle notification:', data);
});
```
