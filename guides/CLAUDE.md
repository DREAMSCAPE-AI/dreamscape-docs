# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DreamScape is an online travel agency (OTA) platform combining contextual AI and VR panoramic experiences for personalized travel planning. This is a monorepo with microservices architecture.

**Development Pace**: 2 days/week - comprehensive tests and documentation are critical for continuity.

## Architecture

```
┌─────────────────┐
│   Web Client    │ React (5173)
└────────┬────────┘
         │
┌────────┴────────┐
│   API Gateway   │ Express (3000)
└────────┬────────┘
         │
    ┌────┼────┬────────┬────────┬──────────┐
    ↓    ↓    ↓        ↓        ↓          ↓
  Auth  User  Voyage  Payment   AI     Panorama
  3001  3002  3003    3004     3005     3006
    │    │      │       │        │         │
    └────┴──────┴───────┴────────┴─────────┘
              │         │           
        PostgreSQL    Redis
```

### Directory Structure
- `dreamscape-services/` - Backend microservices (Node.js/Express/TypeScript/Prisma)
  - `auth/`, `user/`, `voyage/`, `payment/`, `ai/`
  - `db/` - Shared Prisma database layer
  - `shared/` - Shared utilities (Kafka events)
- `dreamscape-frontend/` - Frontend applications
  - `web-client/` - React app (Vite, Tailwind CSS)
  - `gateway/` - API Gateway
  - `panorama/` - VR interface (Marzipano)
- `dreamscape-tests/` - Centralized test suite
- `dreamscape-infra/docker/` - Docker Compose configurations
- `dreamscape-docs/` - Documentation

### External APIs
- **Amadeus SDK** - Flight/hotel bookings (Voyage service)
- **OpenAI API** - AI recommendations (AI service)
- **Stripe API** - Payment processing (Payment service)

## Build & Test Commands

### Root Level (from `dreamscape-tests/` or root)
```bash
npm run test:working              # Quick validation (simple-test + mock-service)
npm run test:integration          # Auth + User integration tests
npm run test:e2e                  # Cypress E2E (voyage + web)
npm run test:coverage             # Coverage with 70% threshold
npm run test:dr59                 # Profile user feature tests
npm run ci                        # Full CI: setup + all tests + report
npm run mock:start                # Start mock API server
```

### Service Development
```bash
# In any service directory (e.g., dreamscape-services/auth/)
npm run dev                       # Watch mode with tsx
npm run build                     # TypeScript compilation
npm run test                      # Jest tests
npm run test:unit                 # Unit tests only
npm run test:integration          # Integration tests

# Database (services with Prisma)
npm run db:generate               # Generate Prisma client
npm run db:push                   # Push schema to database
npm run db:migrate                # Run migrations
npm run db:seed                   # Seed test data
```

### Frontend Development
```bash
# In dreamscape-frontend/web-client/
npm run dev                       # Vite dev server (5173)
npm run build                     # Production build
npm run lint                      # ESLint check
npm run typecheck                 # TypeScript check
```

### Docker
```bash
# From dreamscape-infra/docker/
docker-compose up -d              # Start base services (Postgres, Redis, Gateway)
docker-compose --profile dev up   # + Auth & User services
docker-compose --profile monitoring up  # + Prometheus/Grafana
docker-compose logs -f [service]  # Stream logs
```

## Test Organization

Tests follow a pyramid structure and are organized by feature:
- `tests/unit-tests/` - Unit tests
- `tests/integration/` - API integration tests
- `tests/e2e/` - Cypress E2E scenarios
- `tests/DR-59-profile-user/` - Profile feature tests
- `tests/DR-61-amadeus-integration/` - Flight booking tests
- `tests/bigpods/` - BigPods feature tests

### Test Configuration
- Jest config: `jest.config.js` (30s timeout, 70% coverage threshold)
- Cypress config: `cypress.config.js` (base URL localhost:5173)
- Global test utilities in `jest.setup.js`:
  - `generateTestToken()` - JWT for auth tests
  - `generateTestUser()` - Random user data factory
  - `wait(ms)` - Async delay utility

## Code Conventions

### Branch Naming
```
feature/service-name/description
fix/service-name/description
test/service-name/description
```

### Service Structure Pattern
```
service-name/
├── src/
│   ├── server.ts          # Express app entry
│   ├── routes/            # Route handlers
│   ├── controllers/       # Business logic
│   ├── middleware/        # Custom middleware
│   ├── services/          # External API integrations
│   └── config/            # Configuration
├── prisma/schema.prisma   # Database schema
├── jest.config.unit.js
└── jest.config.integration.js
```

### API Gateway Routes
```
/auth/*           → Auth Service (3001)
/users/*          → User Service (3002)
/voyages/*        → Voyage Service (3003)
/payments/*       → Payment Service (3004)
/recommendations/* → AI Service (3005)
/panoramas/*      → Panorama Service (3006)
```

## Environment Setup

1. Copy `.env.example` to `.env` with local URLs
2. Start infrastructure: `docker-compose up -d`
3. Install dependencies: `npm install` in root and each service
4. Seed databases: `npm run db:seed` in each service
5. Validate setup: `npm run test:working`

### Key Environment Variables
```
AUTH_SERVICE_URL=http://localhost:3001
USER_SERVICE_URL=http://localhost:3002
VOYAGE_SERVICE_URL=http://localhost:3003
DATABASE_URL=postgresql://...
JWT_SECRET=...
AMADEUS_CLIENT_ID=...
OPENAI_API_KEY=...
STRIPE_SECRET_KEY=...
```

## Tech Stack Summary

**Backend**: Node.js 18+, Express, TypeScript, Prisma ORM
**Frontend**: React 19, Vite, Tailwind CSS, Redux Toolkit
**Databases**: PostgreSQL (primary), Redis (cache/sessions)
**Testing**: Jest 29, Cypress 13, Supertest, React Testing Library
**Infrastructure**: Docker, Kubernetes (K3s), Cloudflare (CDN/Pages)
