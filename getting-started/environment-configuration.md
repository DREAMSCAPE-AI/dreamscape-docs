# Configuration des environnements

Variables d'environnement requises pour chaque service.

## Variables communes (tous les services)

| Variable | Description | Exemple |
|----------|-------------|---------|
| `NODE_ENV` | Environnement d'exécution | `development` \| `staging` \| `production` |
| `PORT` | Port d'écoute du service | `3001` |
| `DATABASE_URL` | Connexion PostgreSQL | voir ci-dessous |
| `JWT_SECRET` | Clé secrète JWT (partagée entre services) | chaîne aléatoire ≥ 32 chars |
| `JWT_EXPIRES_IN` | Durée de vie du token d'accès | `7d` |
| `REDIS_URL` | Connexion Redis | `redis://localhost:6379` |

**Pattern DATABASE_URL :**
```
postgresql://dreamscape_user:password@localhost:5432/dreamscape
```

---

## Auth Service (`dreamscape-services/auth/.env`)

```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://dreamscape_user:password@localhost:5432/dreamscape
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_REFRESH_EXPIRES_IN=7d
REDIS_URL=redis://localhost:6379
CLIENT_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
KAFKA_BROKERS=localhost:9092
```

---

## User Service (`dreamscape-services/user/.env`)

```env
NODE_ENV=development
PORT=3002
DATABASE_URL=postgresql://dreamscape_user:password@localhost:5432/dreamscape
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
REDIS_URL=redis://localhost:6379
SENDGRID_API_KEY=SG.xxxx
KAFKA_BROKERS=localhost:9092
AUTH_SERVICE_URL=http://localhost:3001
```

---

## Voyage Service (`dreamscape-services/voyage/.env`)

```env
NODE_ENV=development
PORT=3003
DATABASE_URL=postgresql://dreamscape_user:password@localhost:5432/dreamscape
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
REDIS_HOST=localhost
REDIS_PORT=6379
AMADEUS_API_KEY=your-amadeus-api-key
AMADEUS_API_SECRET=your-amadeus-api-secret
AMADEUS_HOSTNAME=test           # test | production
KAFKA_BROKERS=localhost:9092
PAYMENT_SERVICE_URL=http://localhost:3004
```

> **Amadeus Test** : En environnement `test`, seules 8 villes sont disponibles pour les recherches de vols. Voir [Limitations Amadeus](../reference/amadeus-test-limitations.md).

---

## Payment Service (`dreamscape-services/payment/.env`)

```env
NODE_ENV=development
PORT=3004
DATABASE_URL=postgresql://dreamscape_user:password@localhost:5432/dreamscape
STRIPE_SECRET_KEY=sk_test_xxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxx
KAFKA_BROKERS=localhost:9092
VOYAGE_SERVICE_URL=http://localhost:3003
```

> Ne jamais committer les clés Stripe. Utiliser `sk_test_` en développement.

---

## AI Service (`dreamscape-services/ai/.env`)

```env
NODE_ENV=development
PORT=3005
DATABASE_URL=postgresql://dreamscape_user:password@localhost:5432/dreamscape
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-xxxx      # Optionnel — pour features IA futures
KAFKA_BROKERS=localhost:9092
```

---

## API Gateway (`dreamscape-frontend/gateway/.env`)

```env
NODE_ENV=development
GATEWAY_PORT=3000
AUTH_SERVICE_URL=http://localhost:3001
USER_SERVICE_URL=http://localhost:3002
VOYAGE_SERVICE_URL=http://localhost:3003
PAYMENT_SERVICE_URL=http://localhost:3004
AI_SERVICE_URL=http://localhost:3005
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
REDIS_URL=redis://localhost:6379
CORS_ORIGIN=http://localhost:5173
```

---

## Web Client (`dreamscape-frontend/web-client/.env`)

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_API_GATEWAY_URL=http://localhost:3000/api
VITE_AUTH_SERVICE_URL=http://localhost:3001/api
VITE_USER_SERVICE_URL=http://localhost:3002/api
VITE_VOYAGE_SERVICE_URL=http://localhost:3003/api
VITE_AI_SERVICE_URL=http://localhost:3005/api
VITE_MAPBOX_TOKEN=pk.eyJ1...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxx
VITE_UNSPLASH_ACCESS_KEY=your-unsplash-key
VITE_PANORAMA_URL=http://localhost:3006
```

---

## Environnements de déploiement

| Environnement | API Gateway | Web Client |
|---------------|-------------|------------|
| Local (dev) | `http://localhost:3000` | `http://localhost:5173` |
| Staging | `http://79.72.27.180` | Cloudflare Pages (staging) |
| Production | `http://84.235.237.183` | Cloudflare Pages (prod) |

### Mapping Git → Environnement (CI/CD)

| Branche | Environnement |
|---------|---------------|
| `main` | production |
| `develop` | staging |
| `feature/**`, `bugfix/**`, `hotfix/**` | dev |
| Pull Request | dev |

---

## Bonnes pratiques

- Ne jamais committer de fichiers `.env` — ils sont dans `.gitignore`
- Utiliser `.env.example` comme template (valeurs neutres, sans secrets)
- En production, injecter les secrets via les variables d'environnement Kubernetes (Secrets K8s)
- Le `JWT_SECRET` doit être identique sur tous les services (ils valident tous les tokens)
