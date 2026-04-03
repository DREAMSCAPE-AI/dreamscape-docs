# DreamScape — Documentation

Documentation complète de la plateforme DreamScape, une OTA (Online Travel Agency) basée sur une architecture microservices avec IA embarquée et expériences VR immersives.

## Navigation rapide

| Section | Description |
|---------|-------------|
| [Démarrage rapide](#démarrage-rapide) | Installation et lancement en local |
| [Architecture](#architecture) | Conception système, schéma de données, événements |
| [Services backend](#services-backend) | Documentation de chaque microservice |
| [API Reference](#api-reference) | Endpoints, requêtes, réponses |
| [Frontend](#frontend) | Application React, pages, stores |
| [Infrastructure](#infrastructure) | Docker, Kubernetes, CI/CD, monitoring |
| [Guides](#guides) | Tests, notifications, i18n, flux métier |
| [Sécurité & RGPD](#sécurité--rgpd) | Analyses sécurité, conformité RGPD |

---

## Démarrage rapide

| Document | Contenu |
|----------|---------|
| [Prérequis](getting-started/prerequisites.md) | Node 18+, Docker, outils requis |
| [Installation locale](getting-started/local-development.md) | Cloner, installer, démarrer tous les services |
| [Configuration des environnements](getting-started/environment-configuration.md) | Variables d'environnement, ports, secrets |
| [Structure du projet](getting-started/project-structure.md) | Carte du monorepo (5 sous-repos) |

---

## Architecture

| Document | Contenu |
|----------|---------|
| [Vue d'ensemble](architecture/README.md) | Diagramme système global, flux de données |
| [Microservices](architecture/microservices-overview.md) | Carte des services, ports, responsabilités |
| [Architecture événementielle](architecture/event-driven.md) | Patterns Kafka, SAGA, CQRS, ECST |
| [Schéma de base de données](architecture/database-schema.md) | Modèles Prisma, ERD, relations |
| [API Gateway](architecture/gateway.md) | Proxy routing, sessions VR, WebSocket |
| **Docker** | |
| [Multi-stage builds](architecture/docker/multi-stage-builds.md) | Optimisation des images Docker |
| [Supervisor & Big Pods](architecture/docker/big-pods.md) | Architecture 3 pods de déploiement |
| [Orchestration Supervisor](architecture/docker/supervisor-orchestration.md) | Gestion multi-processus |

---

## Services backend

| Service | Port | Document |
|---------|------|----------|
| Auth Service | 3001 | [auth-service.md](services/auth-service.md) |
| User Service | 3002 | [user-service.md](services/user-service.md) |
| Voyage Service | 3003 | [voyage-service.md](services/voyage-service.md) |
| Payment Service | 3004 | [payment-service.md](services/payment-service.md) |
| AI Service | 3005 | [ai-service.md](services/ai-service.md) |
| Panorama VR | 3006 | [panorama-vr.md](services/panorama-vr.md) |

---

## API Reference

Documentation détaillée de tous les endpoints (méthode, path, auth, body, réponse).

| Document | Contenu |
|----------|---------|
| [Conventions & Erreurs](api-reference/README.md) | Auth headers, format erreurs, pagination |
| [Auth API](api-reference/auth-api.md) | Login, register, refresh, logout, profil |
| [User API](api-reference/user-api.md) | Profil, onboarding, favoris, RGPD, notifications |
| [Voyage API](api-reference/voyage-api.md) | Vols, hôtels, activités, panier, réservations |
| [Payment API](api-reference/payment-api.md) | Paiements Stripe, webhooks |
| [AI API](api-reference/ai-api.md) | Recommandations, cold start, prédictions |
| [Gateway API](api-reference/gateway-api.md) | Routes proxy, sessions VR |

---

## Événements Kafka

| Document | Topics couverts |
|----------|----------------|
| [Vue d'ensemble](events/README.md) | Architecture événementielle, conventions de nommage |
| [Auth Events](events/auth-events.md) | login, logout, password, token |
| [User Events](events/user-events.md) | created, updated, preferences, onboarding |
| [Payment Events](events/payment-events.md) | initiated, completed, failed, refunded |
| [Voyage Events](events/voyage-events.md) | booking, cart, itinerary |
| [AI Events](events/ai-events.md) | recommendation, prediction, segmentation |

---

## Frontend

| Document | Contenu |
|----------|---------|
| [Vue d'ensemble](frontend/README.md) | Stack technique, architecture globale |
| [Web Client](frontend/web-client.md) | 30+ pages, routing, auth flow, i18n |
| [Stores & State](frontend/stores-and-state.md) | Zustand stores, React Query |
| [Couche services](frontend/service-layer.md) | Classes API (Auth, Voyage, Cart, etc.) |
| [Composants](frontend/components.md) | Design system, composants clés |
| [Panel Admin](frontend/admin-panel.md) | Pages admin, KPIs, gestion utilisateurs |

---

## Infrastructure

| Document | Contenu |
|----------|---------|
| [Vue d'ensemble](infrastructure/README.md) | Stack infra, Big Pods, environnements |
| [Kafka](infrastructure/kafka.md) | Cluster, topics, consumers, monitoring |
| [Docker Compose](infrastructure/docker-compose.md) | Orchestration locale et production |
| [Kubernetes](infrastructure/kubernetes.md) | k3s, kustomize, overlays par env |
| [CI/CD](infrastructure/ci-cd.md) | GitHub Actions, pipeline en 2 stages |
| [Monitoring](infrastructure/monitoring.md) | Prometheus, Grafana, alertes |
| [Terraform](infrastructure/terraform.md) | Infrastructure as Code |

---

## Guides

| Document | Contenu |
|----------|---------|
| [Tests](guides/testing.md) | Jest, Vitest, Cypress, couverture, mock server |
| [Notifications](guides/notifications.md) | Socket.IO, préférences, Kafka |
| [Flux panier & réservation](guides/cart-and-booking-flow.md) | Parcours d'achat end-to-end |
| [Cache Redis](guides/redis-cache.md) | Stratégie de cache, TTL, patterns |
| [Internationalisation](guides/i18n.md) | i18next, EN/FR, workflow de traduction |

---

## Sécurité & RGPD

| Document | Contenu |
|----------|---------|
| [Analyse sécurité globale](security/README.md) | Vue d'ensemble, recommandations |
| [Sécurité Auth Service](security/auth-security.md) | JWT, brute force, session management |
| [Sécurité Payment Service](security/payment-security.md) | PCI DSS, Stripe, webhooks |
| [Conformité RGPD](security/gdpr/compliance.md) | Implémentation technique RGPD |
| [Politique des cookies](security/gdpr/cookie-policy.md) | Catégories, consentement |
| [Politique de confidentialité](security/gdpr/privacy-policy.md) | Données collectées, droits utilisateur |

---

## Référence

| Document | Contenu |
|----------|---------|
| [Limitations API Amadeus (test)](reference/amadeus-test-limitations.md) | Restrictions en environnement test |
| [Exemples recherche de vols](reference/flight-search-examples.md) | curl, TypeScript, React |
| [Setup base de données](reference/database-setup.md) | PostgreSQL, Prisma migrations |
| [Données ML de seed](reference/seed-data.md) | Génération du jeu de données ML |
| [Spécifications VR Paris](reference/paris-vr-spec.md) | Environnement panoramique Paris |

---

## Archives

Les résumés d'implémentation Jira se trouvent dans [summaries/](summaries/).

---

*Plateforme DreamScape — Architecture microservices · React 18 · Node.js 18 · PostgreSQL · Kafka · Kubernetes*
