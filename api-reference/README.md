# API Reference

Documentation complète de tous les endpoints de la plateforme DreamScape.

## URLs de base

| Environnement | URL |
|---------------|-----|
| Local (via Gateway) | `http://localhost:3000/api/v1` |
| Local (direct service) | `http://localhost:300{X}/api/v1` |
| Staging | `http://79.72.27.180/api/v1` |
| Production | `http://84.235.237.183/api/v1` |

> En production, toutes les requêtes passent par le Gateway. En développement local, les services peuvent aussi être appelés directement.

## Authentification

La plupart des endpoints nécessitent un `Bearer` token JWT :

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Obtenir un token :**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password1!"}'
```

**Durée de vie :**
- Access token : 15 minutes
- Refresh token : 7 jours (30 jours si `rememberMe: true`)

**Renouvellement :**
```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  --cookie "refreshToken=<token>"
```

## Format des réponses

### Succès
```json
{
  "success": true,
  "data": { ... }
}
```

### Erreur
```json
{
  "success": false,
  "message": "Description de l'erreur"
}
```

### Erreur de validation
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Please provide a valid email address" }
  ]
}
```

## Codes HTTP

| Code | Signification |
|------|---------------|
| `200` | Succès |
| `201` | Ressource créée |
| `400` | Paramètres invalides / validation échouée |
| `401` | Non authentifié |
| `403` | Accès refusé (permissions insuffisantes) |
| `404` | Ressource introuvable |
| `409` | Conflit (ex : email déjà utilisé) |
| `429` | Too Many Requests (rate limiting) |
| `500` | Erreur interne du serveur |

## Rate Limiting

Le Gateway applique une limite de **100 requêtes par IP par 15 minutes**.

Pour les tests d'intégration, ajouter le header :
```
x-test-rate-limit: true
```

## Pagination

Les endpoints retournant des listes supportent :

| Param | Défaut | Description |
|-------|--------|-------------|
| `limit` | 20 | Nombre de résultats par page |
| `offset` | 0 | Décalage (pour la pagination) |

Réponse paginée :
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 150,
    "limit": 20,
    "offset": 0
  }
}
```

## Références par service

| Service | Document |
|---------|----------|
| Auth | [auth-api.md](auth-api.md) |
| User | [user-api.md](user-api.md) |
| Voyage | [voyage-api.md](voyage-api.md) |
| Payment | [payment-api.md](payment-api.md) |
| AI | [ai-api.md](ai-api.md) |
| Gateway | [gateway-api.md](gateway-api.md) |
