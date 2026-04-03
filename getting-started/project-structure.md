# Structure du projet

DreamScape est organisé en **5 repositories Git indépendants** regroupés dans un dossier parent commun (monorepo logique).

## Vue d'ensemble

```
dreamscape/                            # Dossier parent (pas un repo Git)
├── dreamscape-services/               # Backend microservices
├── dreamscape-frontend/               # Applications web et VR
├── dreamscape-infra/                  # Infrastructure, CI/CD, K8s
├── dreamscape-tests/                  # Tests E2E et intégration centralisés
└── dreamscape-docs/                   # Documentation (ce repo)
```

> Chaque sous-dossier est un repository Git indépendant avec son propre `.git/`, ses propres branches et son propre historique.

---

## dreamscape-services/ — Backend

```
dreamscape-services/
├── auth/                   # Auth Service (port 3001)
│   ├── src/
│   │   ├── config/        # Redis, environnement
│   │   ├── middleware/    # authenticateToken, rateLimiter, auditLogger
│   │   ├── routes/        # auth.ts, health.ts
│   │   ├── services/      # AuthService, KafkaService
│   │   └── server.ts      # Point d'entrée Express
│   ├── Dockerfile.prod
│   └── package.json
│
├── user/                   # User Service (port 3002)
│   ├── src/
│   │   ├── routes/        # profile, onboarding, favorites, gdpr, notifications,
│   │   │                  # notificationPreferences, history, admin, aiIntegration
│   │   ├── services/      # UserService, GDPRService, NotificationService...
│   │   └── server.ts
│   └── package.json
│
├── voyage/                 # Voyage Service (port 3003)
│   ├── src/
│   │   ├── routes/        # flights, hotels, activities, cart, bookings,
│   │   │                  # itineraries, airlines, airports, locations, transfers
│   │   ├── services/      # AmadeusService, CartService, BookingService...
│   │   └── server.ts
│   └── package.json
│
├── payment/                # Payment Service (port 3004)
│   ├── src/
│   │   ├── routes/        # payment.ts (Stripe + webhook)
│   │   ├── services/      # PaymentService, StripeService
│   │   └── index.ts       # Point d'entrée (ts-node + nodemon, pas tsx)
│   └── package.json
│
├── ai/                     # AI Service (port 3005)
│   ├── src/
│   │   ├── routes/        # recommendations, accommodations, onboarding,
│   │   │                  # predictions, admin
│   │   ├── services/      # RecommendationService, VectorService, SegmentationService
│   │   └── server.ts
│   └── package.json
│
├── db/                     # Schéma Prisma partagé
│   ├── prisma/
│   │   ├── schema.prisma  # Schéma unifié (804 lignes, ~25 modèles)
│   │   └── seed.ts        # Données de test
│   ├── index.ts           # Export du client Prisma
│   └── package.json       # Package: @dreamscape/db
│
├── shared/
│   └── kafka/             # Package Kafka partagé
│       ├── src/
│       │   ├── config.ts  # Topics registry
│       │   ├── types.ts   # Interfaces des événements
│       │   └── utils.ts   # createEvent(), helpers
│       └── package.json   # Package: @dreamscape/kafka
│
├── docker-compose.prod.yml
├── docker-compose.core.prod.yml
├── docker-compose.business.prod.yml
└── README.md
```

---

## dreamscape-frontend/ — Frontend

```
dreamscape-frontend/
├── gateway/                # API Gateway (port 3000 Docker / 4000 dev)
│   ├── src/
│   │   ├── routes/        # health.ts, vr-sessions.ts
│   │   └── server.ts      # Proxy HTTP + WebSocket vers les services
│   ├── nginx/             # Config NGINX pour les Big Pods
│   ├── Dockerfile.prod
│   └── package.json
│
├── web-client/             # Application React (port 5173)
│   ├── src/
│   │   ├── pages/         # 30+ pages (flights, hotels, dashboard, admin...)
│   │   ├── components/    # Composants UI réutilisables par domaine
│   │   ├── services/      # Classes API (AuthService, VoyageService, CartService...)
│   │   ├── store/         # Stores Zustand (cart, booking, itinerary, onboarding)
│   │   ├── hooks/         # Hooks React personnalisés
│   │   ├── contexts/      # FavoritesBatchContext
│   │   ├── types/         # Interfaces TypeScript
│   │   ├── utils/         # Fonctions utilitaires
│   │   ├── layouts/       # Layout wrappers (MainLayout, AdminLayout)
│   │   ├── i18n/          # Configuration i18next
│   │   ├── constants/     # Constantes applicatives
│   │   └── App.tsx        # Router principal (React Router v6)
│   ├── public/
│   │   └── locales/       # Fichiers de traduction EN/FR
│   ├── cypress/           # Tests E2E Cypress
│   ├── vite.config.ts
│   └── package.json
│
└── panorama/              # Application VR (port 3006)
    ├── src/               # Composants React Three Fiber
    ├── public/
    │   └── panoramas/     # Images 360° (4096×2048 à 8192×4096 px)
    └── package.json
```

---

## dreamscape-infra/ — Infrastructure

```
dreamscape-infra/
├── docker/                # Fichiers Docker Compose par pod
│   ├── docker-compose.core-pod.yml
│   ├── docker-compose.business-pod.yml
│   ├── docker-compose.experience-pod.yml
│   ├── docker-compose.kafka.yml
│   ├── docker-compose.monitoring.yml
│   └── docker-compose.bigpods.prod.yml
│
├── k8s/                   # Manifestes Kubernetes (kustomize)
│   ├── base/              # Configs de base
│   └── overlays/          # dev / staging / production
│
├── terraform/             # Infrastructure as Code (AWS/GCP/Azure)
│
├── monitoring/            # Prometheus + Grafana
│   ├── prometheus.yml
│   └── grafana/
│
├── .github/workflows/     # CI/CD GitHub Actions
│   ├── ci.yml
│   ├── bigpods-ci.yml
│   ├── bigpods-cd.yml
│   └── bigpods-release.yml
│
├── launch-core-pod.sh         # Lanceur Big Pods — Core Pod
├── launch-business-pod.sh     # Lanceur Big Pods — Business Pod
├── launch-experience-pod.sh   # Lanceur Big Pods — Experience Pod
└── README.md
```

---

## dreamscape-tests/ — Tests centralisés

```
dreamscape-tests/
├── tests/                 # Tests unitaires et intégration par feature
│   ├── US-IA-001-*/      # Recommandations de base (13 tests)
│   ├── US-IA-002-*/      # Cold start (24 tests)
│   ├── US-IA-003-*/      # Recommandations hôtels
│   ├── US-IA-004-*/      # Recommandations activités
│   ├── DR-59-*/          # Profil utilisateur
│   ├── DR-61-*/          # Intégration Amadeus flights
│   ├── DR-67-*/          # Intégration Amadeus hotels
│   └── ...
│
├── integration/           # Tests d'intégration (API + Kafka)
│
├── cypress/               # Tests E2E
│   ├── e2e/
│   │   ├── authentication.cy.js
│   │   ├── cart-booking-flow.cy.js
│   │   ├── booking-management.cy.js
│   │   ├── gdpr-compliance.cy.js
│   │   ├── vr-access.cy.js
│   │   ├── recommendation-flow.cy.js
│   │   └── i18n-*.cy.js
│   └── support/
│
└── package.json           # 70+ scripts de test
```

---

## Conventions de nommage

| Élément | Convention | Exemple |
|---------|------------|---------|
| Branches Git | `feature/DR-XXX-description` | `feature/DR-286-rgpd-compliance` |
| Topics Kafka | `dreamscape.<domain>.<event>[.<sub-event>]` | `dreamscape.user.created` |
| Tables DB | `snake_case` (via `@@map`) | `user_profile` |
| Modèles Prisma | `PascalCase` | `UserProfile` |
| Endpoints API | `/api/v1/<service>/<resource>` | `/api/v1/voyage/flights` |
| Packages internes | `@dreamscape/<name>` | `@dreamscape/db`, `@dreamscape/kafka` |
