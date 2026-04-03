# Guide des tests

DreamScape utilise 3 frameworks de test : **Jest** (intégration backend), **Vitest** (unitaires frontend), **Cypress** (E2E).

## Prérequis

Les tests d'intégration nécessitent une base de données PostgreSQL active et les services en cours d'exécution.

```bash
# Démarrer l'infrastructure de test
cd dreamscape-infra/docker
docker compose up -d postgres redis

# Initialiser la base de test
cd dreamscape-services/db
npm run db:push && npm run db:generate
```

## Tests centralisés (`dreamscape-tests/`)

### Commandes principales

```bash
cd dreamscape-tests

npm run test:working          # Tests smoke rapides (recommandé en premier)
npm run test:health           # Vérification des health endpoints

# Intégration par service
npm run test:integration:auth
npm run test:integration:user
npm run test:integration:kafka

# E2E complet
npm run test:e2e:voyage
npm run test:e2e:web
npm run test:e2e:cart

# Coverage par service
npm run test:coverage:all-services
npm run test:coverage:auth
npm run test:coverage:user
npm run test:coverage:voyage
npm run test:coverage:ai
npm run test:coverage:payment
```

### Tests par feature IA

```bash
npm run test:ia001    # US-IA-001 : Recommandations de base (13 tests)
npm run test:ia002    # US-IA-002 : Cold start (24 tests)
npm run test:ia003    # US-IA-003 : Recommandations hôtels
npm run test:ia004    # US-IA-004 : Recommandations activités
npm run test:ia009    # US-IA-009 : ML diversity
npm run test:ia010    # US-IA-010 : Intégration frontend
```

### Tests RGPD

```bash
npm run test:integration:gdpr
npm run test:integration:kafka:gdpr
npm run test:e2e:gdpr
```

### Tests VR

```bash
npm run test:e2e:vr-access
```

## Tests unitaires frontend (`dreamscape-frontend/web-client/`)

```bash
cd dreamscape-frontend/web-client

npm run test           # Vitest (watch mode)
npm run test:run       # Vitest (CI — une passe)
npm run test:coverage  # Rapport de couverture
npm run test:ui        # Interface Vitest UI

# Mobile
npm run test:mobile    # Viewport 390×844 (iPhone 14 Pro)
npm run test:devices   # Multi-device
```

## Tests E2E avec Cypress

```bash
# Frontend
cd dreamscape-frontend/web-client
npm run cypress:open    # Mode interactif (navigateur)
npm run cypress:run     # Mode headless (CI)

# Tests centralisés
cd dreamscape-tests
npm run test:e2e:cart          # Flux panier
npm run test:e2e:cart:kafka    # Panier + Kafka
npm run test:e2e:auth          # Authentification
npm run test:e2e:booking       # Gestion des réservations
npm run test:e2e:gdpr          # Conformité RGPD
npm run test:e2e:recommendation # Flux de recommandations
npm run test:e2e:i18n          # Internationalisation
```

**Fichiers Cypress E2E (dreamscape-tests/cypress/e2e/) :**
- `authentication.cy.js`
- `cart-booking-flow.cy.js`
- `cart-booking-kafka.cy.js`
- `booking-management.cy.js`
- `vr-access.cy.js`
- `recommendation-flow.cy.js`
- `gdpr-compliance.cy.js`
- `i18n-en.cy.js`, `i18n-fr.cy.js`

## Mock Server

Un serveur mock est disponible pour les tests isolés (sans services backend réels) :

```bash
cd dreamscape-tests
npm run mock:start    # Démarre le mock server
```

## Patterns de tests d'intégration

Les tests d'intégration backend suivent ces conventions :

```typescript
// 1. Utiliser supertest avec le helper makeRequest()
import { makeRequest } from '../helpers/request';

// 2. Header obligatoire pour bypasser le rate limiting
const headers = { 'x-test-rate-limit': 'true' };

// 3. Inscription via auth-service en beforeEach
beforeEach(async () => {
  const { data } = await makeRequest('POST', '/api/v1/auth/register', {
    email: `test+${Date.now()}@example.com`,
    password: 'TestPassword1!',
  }, headers);
  token = data.tokens.accessToken;
});

// 4. Nettoyer les données de test en afterEach
afterEach(async () => {
  await makeRequest('POST', '/api/v1/auth/test/cleanup', {}, headers);
});
```

## Seuil de couverture

Seuil minimum configuré dans `jest.config.js` :

```json
{
  "coverageThreshold": {
    "global": {
      "branches": 70,
      "functions": 70,
      "lines": 70,
      "statements": 70
    }
  }
}
```

## État de la couverture

| Service / Feature | Tests | Statut |
|-------------------|-------|--------|
| US-IA-001 (recommandations) | 13/13 | ✅ 100% |
| US-IA-002 (cold start) | 24/24 | ✅ 100% |
| Auth Service | — | ✅ Passing |
| User Service (RGPD) | — | ✅ Passing |
| Health endpoints | 58+ | ✅ Passing |
| E2E flux panier | — | ✅ Passing |
