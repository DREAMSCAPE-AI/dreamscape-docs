# Standards de développement

Ce document définit les conventions de code, la configuration des outils et les exigences qualité applicables à tous les services DreamScape.

## Stack technique

| Domaine | Technologie | Version |
|---------|-------------|---------|
| Runtime backend | Node.js | 18+ |
| Langage | TypeScript | 5.x |
| Target | ES2022 | — |
| Module system | CommonJS (services), ESM (frontend) | — |
| Framework backend | Express | 4.18+ |
| ORM | Prisma | 5.x |
| Message broker | Kafka (kafkajs) | 2.2.4 |
| Cache / Sessions | Redis | 7+ |
| Base de données | PostgreSQL | 15+ |
| Frontend | React + Vite | 18.3 + 5.4 |
| VR | Three.js + R3F | 0.155 |

## TypeScript

### Configuration commune (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/*"],
      "@services/*": ["src/services/*"],
      "@middleware/*": ["src/middleware/*"],
      "@config/*": ["src/config/*"],
      "@routes/*": ["src/routes/*"],
      "@dreamscape/db": ["../db/index.ts"]
    }
  }
}
```

### Règles strictes

- `strict: true` obligatoire — pas de `any` implicite.
- Utiliser des **types explicites** sur les signatures publiques (exports, contrôleurs, services).
- Éviter `as` sauf pour raffiner un type depuis `unknown`.
- Pas de `// @ts-ignore` — préférer `// @ts-expect-error` avec commentaire de justification.
- Les path aliases (`@/*`, `@services/*`) doivent être utilisés plutôt que des chemins relatifs `../../../`.

## Structure des services

```
service/
├── src/
│   ├── config/        # Redis, DB, env, constantes
│   ├── database/      # Queries, seeds
│   ├── middleware/    # Auth, errors, validation, audit
│   ├── routes/        # Endpoints Express (routage + validation)
│   ├── services/      # Logique métier (découplée des routes)
│   ├── types/         # Interfaces TypeScript
│   ├── utils/         # Helpers purs
│   └── server.ts      # Bootstrap Express
├── tests/
│   ├── unit/          # Mocks complets
│   └── integration/   # Base de test réelle
├── dist/              # Build (gitignored)
└── Dockerfile.prod
```

### Règles

- **Routes ne contiennent pas de logique métier** — elles appellent les services.
- Un service = une responsabilité (Single Responsibility).
- Les **singletons** (`DatabaseService.getInstance()`) sont initialisés dans `server.ts`, jamais dans les routes.
- Les imports circulaires sont interdits — utiliser l'injection de dépendances ou les events Kafka.

## Nommage

| Élément | Convention | Exemple |
|---------|------------|---------|
| Fichier TypeScript | kebab-case | `user-preferences.service.ts` |
| Classe | PascalCase | `UserPreferencesService` |
| Interface | PascalCase, sans préfixe `I` | `UserPreferences` |
| Type alias | PascalCase | `UserId` |
| Variable / fonction | camelCase | `getUserById` |
| Constante globale | SCREAMING_SNAKE_CASE | `JWT_EXPIRES_IN` |
| Fichier React (composant) | PascalCase | `UserProfile.tsx` |
| Hook React | camelCase avec préfixe `use` | `useAuth` |
| Modèle Prisma | PascalCase | `UserPreferences` |
| Table PostgreSQL | snake_case via `@@map` | `user_preferences` |
| Topic Kafka | `dreamscape.<domain>.<event>` | `dreamscape.user.preferences.updated` |
| Route API | kebab-case + versionnage | `/api/v1/user-preferences` |

## Formatage & Linting

### ESLint

Chaque service embarque une config ESLint. Commandes :

```bash
npm run lint         # Vérification
npm run lint:fix     # Auto-correction
```

### Règles non-négociables

- Pas de `console.log` dans le code commité (utiliser un logger).
- Pas d'imports non utilisés.
- `async` doit être accompagné de `await` ou retour direct de promesse.
- Gestion explicite des erreurs dans les handlers Express (`try/catch` + `next(err)` ou middleware d'erreur).

### Prettier (si présent)

- Indentation : 2 espaces.
- Point-virgule : oui.
- Guillemets : simples `'` en TS, doubles `"` en JSON.
- Largeur max : 100 caractères.

## Gestion des erreurs

### Backend

```typescript
// Jamais
throw new Error('user not found');

// Préférer
import { NotFoundError } from '@middleware/errors';
throw new NotFoundError('User', userId);
```

Règles :

- Les erreurs métier étendent une classe de base (`AppError`).
- Un middleware global capture toutes les erreurs et sérialise la réponse.
- Format de réponse d'erreur standardisé :

```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "Utilisateur introuvable",
    "details": { "userId": "..." }
  }
}
```

### Format de réponse succès

```json
{
  "success": true,
  "data": { /* payload direct, pas d'imbrication superflue */ }
}
```

## Base de données

### Schéma Prisma

- Fichier unique : `dreamscape-services/db/prisma/schema.prisma`.
- Toute modification nécessite :
  ```bash
  cd dreamscape-services/db
  npx prisma db push        # en dev (évite les conflits shadow DB)
  npx prisma generate
  ```
- **Propager le client** : `npx prisma generate` dans chaque service qui importe `@dreamscape/db` (auth, user, voyage, payment, ai).

### Relations & index

- Utiliser `onDelete: Cascade` pour l'intégrité référentielle.
- Ajouter un `@@index` sur tout champ filtré fréquemment.
- Les clés étrangères pointent vers l'ID PascalCase (ex: `userId String`).

### Migrations

- En développement : `npx prisma db push`.
- En staging/production : `npx prisma migrate deploy` (migrations versionnées et committées).
- Ne jamais committer une migration générée sans la tester en local.

## Communication inter-services

### Synchrone (HTTP)

- Client : `axios` avec header JWT `Authorization: Bearer <token>`.
- URLs via noms de containers Docker (`http://auth-service:3001`).
- Timeout explicite : 5s par défaut, 30s pour AI.
- Retry : 3 tentatives avec backoff exponentiel sur les 5xx uniquement.

### Asynchrone (Kafka)

- Topics : `dreamscape.<domain>.<event>[.<sub-event>]` (voir [événements](../events/README.md)).
- **Publication non-bloquante** : toujours `.catch()` pour ne pas bloquer la réponse HTTP.
  ```typescript
  kafkaService.publishEvent(data).catch(err => logger.error('Kafka publish failed', err));
  ```
- **Degradation gracieuse** : service démarre même si Kafka indisponible (log warning).
- Utiliser `createEvent()` depuis `@dreamscape/kafka/utils` pour le formatage standard.
- Après modification de `shared/kafka/src/` : `npm run build` avant d'importer depuis les services consommateurs.

## Sécurité

### Obligatoire sur tout service exposé

- `helmet()` pour les headers HTTP de sécurité.
- `cors({ origin: process.env.CLIENT_URL, credentials: true })` — origine explicite, pas de `*`.
- `express-rate-limit` avec backend Redis.
- `express.json({ limit: '10mb' })` — taille maximale stricte.
- Validation des inputs : Zod ou Joi sur tout `req.body`, `req.query`, `req.params`.
- JWT : valider signature + expiration via middleware `authenticate`.

### Secrets

- **Jamais** de secret en dur dans le code ou dans Git.
- Variables d'environnement via `.env` (gitignored) en local, Kubernetes Secrets en prod.
- Fichier `.env.example` committé avec placeholders uniquement.
- Rotation des clés JWT tous les 90 jours.

### Dépendances

- `npm audit` exécuté en CI — bloque sur critique/high.
- Scanner Trivy sur les images Docker avant push GHCR.
- Mises à jour sécurité appliquées sous 7 jours pour les CVE critiques.

## Tests

Voir [guides/testing.md](../guides/testing.md) pour le détail des commandes.

### Exigences

| Type | Couverture min | Framework |
|------|----------------|-----------|
| Unit | 70% branches/fonctions/lignes/statements | Jest (back) / Vitest (front) |
| Intégration | Parcours critiques couverts | Jest + supertest |
| E2E | Flows utilisateur principaux | Cypress |

### Règles

- Un bug corrigé = un test de régression ajouté.
- Pas de tests « snapshot-only » sur la logique métier.
- Les tests d'intégration utilisent une vraie base PostgreSQL (pas de mock).
- Header `x-test-rate-limit: true` pour bypasser le rate limiting en test.
- Les mocks externes (Amadeus, OpenAI, Stripe) passent par le mock server : `npm run mock:start`.

## Logs & Observabilité

### Logger

- `morgan('combined')` en middleware Express.
- Logger structuré (Winston/Pino recommandé) pour le reste — jamais `console.log` directement.
- Niveaux : `error`, `warn`, `info`, `debug` (désactivé en prod).

### Health checks

Tout service DOIT exposer `/health` avec ce format :

```json
{
  "status": "healthy",
  "uptime": 123.45,
  "database": "connected",
  "cache": "connected",
  "memory": { "used": "150MB", "total": "512MB" }
}
```

Retourne `200` si healthy, `503` si une dépendance critique est down.

### Métriques Prometheus

Exposer `/metrics` avec à minima :
- `http_requests_total` (labels : method, route, status)
- `http_request_duration_seconds`
- Métriques métier (ex: `bookings_created_total`, `recommendations_generated_total`)

## Frontend

### Stack

- React 18.3 + TypeScript 5.5
- Vite 5.4
- Tailwind CSS 3.4
- Zustand (state global), React Query (server state), React Context (auth uniquement)
- React Router v6

### Règles

- Composants fonctionnels + hooks (pas de classes).
- `useEffect` avec dépendances exhaustives (ESLint `react-hooks/exhaustive-deps`).
- Découper les pages en composants < 200 lignes.
- Dossier `services/` pour les classes API (`AuthService`, `VoyageService`) — jamais d'appel `fetch` inline dans un composant.
- Accessibilité : labels ARIA, navigation clavier, contraste AA minimum.
- i18n : toutes les strings passent par `useTranslation()` (EN/FR).

## Documentation

- Toute nouvelle API ou feature documentée dans `dreamscape-docs/`.
- Swagger/OpenAPI mis à jour sur changement de contrat API.
- Les modèles Prisma commentés si leur usage n'est pas évident.
- Les commentaires de code sont rares et expliquent **pourquoi**, pas **quoi**.

## Checklist avant commit

- [ ] `npm run lint` passe
- [ ] `npm run build` (TypeScript) passe
- [ ] `npm test` passe localement
- [ ] Pas de secret / token / clé en dur
- [ ] Pas de `console.log` de debug
- [ ] Documentation mise à jour si contrat modifié
- [ ] Message de commit au format Conventional Commits (voir [workflow](contribution-workflow.md))
