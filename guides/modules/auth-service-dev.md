# Guide de développement — Auth Service

**Port** : 3001 (hardcodé) · **Pod** : Core · **Stack** : Node 18+ / Express / Prisma / Redis / Kafka

## 1. Vue d'ensemble

Service responsable de l'authentification, de la gestion des sessions et des profils utilisateurs de base.

**Fonctions** :
- Inscription, connexion, déconnexion
- Émission JWT (access + refresh tokens)
- Révocation de tokens (logout, logout-all)
- Profil utilisateur de base
- Rate limiting et brute force protection

**Dépendances** :
- PostgreSQL (Prisma — modèles `User`, `Session`, `TokenBlacklist`, `UserPreferences`)
- Redis (sessions, rate limiting, blacklist)
- Kafka (publie `dreamscape.user.created`, `dreamscape.auth.*`)

## 2. Prérequis

| Outil | Version | Notes |
|-------|---------|-------|
| Node.js | >= 18 | LTS recommandé |
| PostgreSQL | 14+ | via Docker Compose |
| Redis | 7+ | via Docker Compose |
| Kafka | optionnel | dégradation gracieuse si absent |

Variables d'environnement (`.env`) :
```bash
NODE_ENV=development
PORT=3001                                    # ⚠️ ignoré, hardcodé dans server.ts
DATABASE_URL=postgresql://dreamscape_user:password@localhost:5432/dreamscape
JWT_SECRET=change-me-in-production-min-32-chars
JWT_EXPIRES_IN=7d
REDIS_HOST=localhost
REDIS_PORT=6379
KAFKA_BROKERS=localhost:9092                 # facultatif
CLIENT_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
```

## 3. Démarrage local

```bash
cd dreamscape-services/auth

# Premier lancement
npm install
npx prisma generate                          # générer le client Prisma
npm run db:push                              # appliquer le schéma

# Démarrer en hot-reload
npm run dev                                  # tsx watch src/server.ts
# → http://localhost:3001/health
```

Vérification :
```bash
curl http://localhost:3001/health
# { "status": "healthy", "uptime": ..., "database": "connected", "cache": "connected" }
```

## 4. Architecture du code

```
auth/
├── src/
│   ├── config/             # Redis, environnement
│   ├── database/           # DatabaseService (singleton Prisma)
│   ├── middleware/         # auth.ts (JWT verify), rateLimit.ts, errorHandler.ts
│   ├── routes/             # auth.routes.ts, health.routes.ts
│   ├── services/           # AuthService (business logic), TokenService, UserService
│   ├── types/              # interfaces TS
│   ├── utils/              # password hashing (bcrypt), validators
│   └── server.ts           # Express init, port hardcodé 3001
├── prisma/                 # ⚠️ utilise @dreamscape/db (lien fichier)
├── tests/
│   ├── unit/
│   ├── integration/
│   └── setup.ts
└── package.json
```

**Fichiers clés** :
- `src/server.ts` — bootstrap Express, init DB/Redis/Kafka
- `src/services/AuthService.ts` — `register()`, `login()`, `refreshToken()`, `logout()`
- `src/middleware/auth.ts` — middleware `requireAuth` qui décode le JWT
- `src/routes/auth.routes.ts` — déclaration des routes

## 5. Base de données

Schéma partagé : [`dreamscape-services/db/prisma/schema.prisma`](../../architecture/database-schema.md).

Modèles utilisés :
- `User` — entité principale
- `Session` — refresh tokens actifs
- `TokenBlacklist` — JWTs révoqués
- `UserPreferences` — préférences

Commandes (depuis `dreamscape-services/db/`) :
```bash
npx prisma generate          # ⚠️ refaire dans CHAQUE service après modif schema
npx prisma db push           # dev — pas de migration formelle
npx prisma migrate dev       # créer une migration nommée
npx prisma studio            # GUI sur localhost:5555
```

## 6. Endpoints

Spec complète : [`api-reference/openapi/auth.openapi.yaml`](../../api-reference/openapi/auth.openapi.yaml)
Référence markdown : [`api-reference/auth-api.md`](../../api-reference/auth-api.md)

| Méthode | Path | Auth |
|---------|------|------|
| POST | `/api/v1/auth/register` | — |
| POST | `/api/v1/auth/login` | — |
| GET / PUT | `/api/v1/auth/profile` | JWT |
| POST | `/api/v1/auth/change-password` | JWT |
| POST | `/api/v1/auth/refresh` | Cookie |
| POST | `/api/v1/auth/verify-token` | JWT |
| POST | `/api/v1/auth/logout` | Cookie |
| POST | `/api/v1/auth/logout-all` | JWT |

## 7. Événements Kafka

**Publiés** :
- `dreamscape.user.created` — après inscription
- `dreamscape.auth.login.success` / `failed`
- `dreamscape.auth.logout`
- `dreamscape.auth.password.changed`

**Pattern non-bloquant** :
```ts
kafkaService.publishEvent('dreamscape.user.created', payload)
  .catch(err => console.error('Kafka publish failed', err))
// ⚠️ ne JAMAIS await — garder la réponse HTTP rapide
```

Voir [`events/auth-events.md`](../../events/auth-events.md).

## 8. Tests

```bash
npm test                     # unit + integration
npm run test:unit
npm run test:integration     # nécessite DB + Redis
npm run test:coverage        # seuil 70%
```

**Conventions** :
- Tests d'intégration : `supertest` + `makeRequest()` helper
- Header `x-test-rate-limit: true` pour bypass le rate limit
- `beforeEach` : créer un utilisateur via `/register` → récupérer le token

## 9. Debug & pièges courants

| Symptôme | Cause | Solution |
|----------|-------|----------|
| `PORT` env ignoré | Hardcoded `const PORT = 3001` | Modifier `src/server.ts` (rare) |
| `prisma client out of sync` | Schéma modifié sans regen | `npx prisma generate` dans **chaque** service |
| `429 Too Many Requests` en test | Rate limit actif | Header `x-test-rate-limit: true` |
| `JWT malformed` | Secret différent entre services | Vérifier `JWT_SECRET` partagé |
| Refresh token invalide | Cookie domain/secure mismatch | Vérifier `CLIENT_URL` et HTTPS en prod |
| Kafka warnings au démarrage | Broker indisponible | Normal en local sans Kafka — service démarre quand même |

**Logs utiles** :
```bash
# Suivre les logs du service
npm run dev | tee /tmp/auth.log

# Inspecter Redis
redis-cli
> KEYS dreamscape:*
> GET dreamscape:session:<userId>
```

## 10. Contribution

- **Branche** : `feature/DR-XXX-short-description`
- **Commits** : convention `feat(auth):`, `fix(auth):`, `chore(auth):`
- **PR** : lien vers le ticket Jira DR-XXX, description du changement, captures si UI affectée
- **Avant push** : `npm run lint && npm test`
