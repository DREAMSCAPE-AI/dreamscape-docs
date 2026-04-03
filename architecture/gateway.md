# API Gateway

**Port** : 3000 (Docker) / 4000 (dev alternatif) | **Package** : `dreamscape-gateway`

## Rôle

Le Gateway est le **point d'entrée unique** de l'application pour le frontend Web Client. Il :
- Proxy les requêtes HTTP vers les microservices appropriés
- Proxy le WebSocket Socket.IO vers le User Service (notifications)
- Gère les sessions VR par code PIN (DR-574)
- Applique le rate limiting global
- Ajoute les headers de sécurité (Helmet)

## Table de routage

| Path | Cible | Notes |
|------|-------|-------|
| `GET/POST /api/v1/auth/*` | Auth Service :3001 | Login, register, refresh... |
| `GET/POST /api/v1/users/*` | User Service :3002 | Profils, favoris, RGPD... |
| `GET/POST /api/v1/admin/*` | User Service :3002 | Administration |
| `GET/POST /api/v1/voyage/*` | Voyage Service :3003 | Vols, hôtels, panier... |
| `GET/POST /api/v1/payment/*` | Payment Service :3004 | Stripe, webhooks |
| `GET/POST /api/v1/ai/*` | AI Service :3005 | Recommandations |
| `GET/POST /api/v1/vr/*` | Local (gateway) | Sessions VR par PIN |
| `WS /socket.io` | User Service :3002 | Notifications temps réel |
| `GET /health` | Local | Health check du gateway |
| `GET /docs` | Local | Description des routes |

> Le proxy utilise `http-proxy-middleware` avec `changeOrigin: true`. Les headers sont préservés, y compris `Authorization`.

## Configuration

| Variable | Défaut | Description |
|----------|--------|-------------|
| `GATEWAY_PORT` | `3000` | Port d'écoute |
| `AUTH_SERVICE_URL` | `http://localhost:3001` | URL Auth Service |
| `USER_SERVICE_URL` | `http://localhost:3002` | URL User Service |
| `VOYAGE_SERVICE_URL` | `http://localhost:3003` | URL Voyage Service |
| `PAYMENT_SERVICE_URL` | `http://localhost:3004` | URL Payment Service |
| `AI_SERVICE_URL` | `http://localhost:3005` | URL AI Service |

En production (Kubernetes), ces URLs pointent vers les noms de service K8s.

## Rate Limiting

- **Fenêtre** : 15 minutes
- **Limite** : 100 requêtes par IP
- **Bibliothèque** : `express-rate-limit`
- **Bypass** : Header `x-test-rate-limit: true` (tests d'intégration uniquement)

## Sécurité

- **Helmet** : CSP, X-Frame-Options, X-Content-Type-Options, HSTS
- **CORS** : Configuré pour l'origin du Web Client
- **Body parsing** : `express.json({ limit: '10mb' })` + `express.urlencoded()`

## Sessions VR (DR-574)

Les sessions VR sont gérées localement par le gateway (pas via un service backend séparé) pour minimiser la latence.

### `POST /api/v1/vr/sessions`

Crée une session VR avec un code PIN.

**Body :**
```json
{
  "destination": "paris",
  "userId": "..."
}
```

**Réponse :**
```json
{
  "pin": "4823",
  "sessionId": "...",
  "expiresAt": "2024-01-15T10:30:00Z",
  "redirectUrl": "http://localhost:3006?environment=paris"
}
```

### `GET /api/v1/vr/sessions/:pin`

Valide un PIN et retourne les données de session.

### `DELETE /api/v1/vr/sessions/:pin`

Invalide une session VR.

## WebSocket (Socket.IO)

Le Gateway proxie le WebSocket vers le User Service pour les notifications temps réel :

```
Client (Web) ←──── WS /socket.io ──── Gateway ──── WS proxy ──── User Service :3002
```

La connexion WebSocket est initiée par le Web Client via la librairie `socket.io-client`. Le gateway la proxie de façon transparente avec `ws: true` dans la configuration proxy.

## Exemple de flux complet

```
1. Frontend → GET /api/v1/voyage/flights/search?originLocationCode=CDG...
2. Gateway rate limit check (100 req/15min/IP)
3. Gateway → proxy → Voyage Service :3003/api/v1/voyage/flights/search
4. Voyage Service → Amadeus API → retourne résultats
5. Voyage Service → Gateway → Frontend
```

## Health Check

```
GET /health
→ 200 { "status": "healthy", "gateway": "running", "timestamp": "..." }
```

## Déploiement

### Développement local
```bash
cd dreamscape-frontend/gateway
npm run dev     # nodemon, port 4000
```

### Production (Docker)
```bash
docker build -f Dockerfile.prod -t dreamscape-gateway .
# Port exposé : 3000
```

### Big Pods (Experience Pod)
Dans l'Experience Pod, le Gateway tourne sous Supervisor avec NGINX en frontal. NGINX gère le SSL termination et route vers le Gateway en interne.
