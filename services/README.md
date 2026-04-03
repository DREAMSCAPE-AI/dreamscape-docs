# Services backend

DreamScape comprend 5 microservices backend et 1 service VR :

| Service | Port | Document | Responsabilité |
|---------|------|----------|----------------|
| Auth | 3001 | [auth-service.md](auth-service.md) | Authentification JWT, sessions |
| User | 3002 | [user-service.md](user-service.md) | Profils, RGPD, notifications |
| Voyage | 3003 | [voyage-service.md](voyage-service.md) | Vols, hôtels, panier, réservations |
| Payment | 3004 | [payment-service.md](payment-service.md) | Stripe, webhooks |
| AI | 3005 | [ai-service.md](ai-service.md) | Recommandations vectorielles |
| Panorama VR | 3006 | [panorama-vr.md](panorama-vr.md) | Expériences 360° / WebXR |

## Conventions communes

Tous les services suivent ces patterns :

**Réponse API unifiée :**
```json
{ "success": true, "data": { ... } }
{ "success": false, "message": "Description de l'erreur" }
```

**Health check :**
```
GET /health
→ { "status": "healthy", "database": "connected", "cache": "connected" }
```

**Authentification :**
```
Authorization: Bearer <access_token>
```

**Structure de code :**
```
src/
├── config/       # Redis, environnement
├── middleware/   # auth, rateLimiter, auditLogger
├── routes/       # Endpoints API
├── services/     # Logique métier (découplée des routes)
├── types/        # Interfaces TypeScript
└── server.ts     # Initialisation Express
```
