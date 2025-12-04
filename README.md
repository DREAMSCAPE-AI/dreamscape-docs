# DreamScape Documentation Hub

Bienvenue dans la documentation centralisée du projet DreamScape - une plateforme de voyage innovante combinant l'intelligence artificielle contextuelle et la réalité virtuelle.

## 📚 Structure de la Documentation

### 🏗️ Infrastructure (`infrastructure/`)
Documentation de l'architecture, du déploiement et de la gestion de l'infrastructure.

- [Architecture Overview](infrastructure/ARCHITECTURE.md) - Vue d'ensemble de l'architecture système
- [Big Pods Guide](infrastructure/bigpods-guide.md) - Guide complet des Big Pods
- [Big Pods Scripts](infrastructure/bigpods-scripts.md) - Scripts d'automatisation
- [Migration Kubernetes](infrastructure/migration-kubernetes.md) - Guide de migration K8s
- [Configuration Guide](infrastructure/configuration-guide.md) - Configuration système
- [Deployment Guide](infrastructure/deployment-guide.md) - Guide de déploiement
- [Infrastructure Guide](infrastructure/infrastructure-guide.md) - Guide d'infrastructure complet
- [Kubernetes Setup](infrastructure/kubernetes-setup.md) - Configuration K8s
- [Monitoring](infrastructure/monitoring.md) - Observabilité et monitoring
- [Network Architecture](infrastructure/network-architecture.md) - Architecture réseau
- [Redis Cache](infrastructure/redis-cache.md) - Configuration Redis
- [Scripts Index](infrastructure/scripts-index.md) - Index des scripts d'automatisation

### 🔧 Services Backend (`services/`)
Documentation des microservices backend (Node.js/Express/TypeScript).

- [Auth Service](services/auth-service.md) - Service d'authentification
- [User Service](services/user-service.md) - Service de gestion utilisateurs
- [Voyage Service](services/voyage-service.md) - Service de recherche de voyages
- [Payment Service](services/payment-service.md) - Service de paiement
- [AI Service](services/ai-service.md) - Service d'IA contextuelle
- [Amadeus Integration](services/amadeus-integration.md) - Intégration API Amadeus
- [OpenAI Integration](services/openai-integration.md) - Intégration OpenAI
- [Stripe Integration](services/stripe-integration.md) - Intégration Stripe
- [Database Schema](services/database-schema.md) - Schéma Prisma partagé
- [Kafka Events](services/kafka-events.md) - Architecture événementielle
- [Services Overview](services/services-overview.md) - Vue d'ensemble des services

### 🎨 Frontend (`frontend/`)
Documentation des applications frontend (React/Vite).

- [Web Client](frontend/web-client.md) - Application web React
- [API Gateway](frontend/gateway.md) - Passerelle API Gateway
- [Panorama VR](frontend/panorama.md) - Interface VR immersive
- [Frontend Architecture](frontend/frontend-architecture.md) - Architecture frontend
- [Frontend Overview](frontend/frontend-overview.md) - Vue d'ensemble frontend

### 🧪 Tests (`tests/`)
Documentation de la stratégie de test et des suites de tests.

- [Profile User Tests](tests/profile-user-tests.md) - Tests du profil utilisateur (DR-59)
- [Amadeus Integration Tests](tests/amadeus-integration-tests.md) - Tests Amadeus (DR-61)
- [Big Pods Tests](tests/bigpods-tests.md) - Tests des Big Pods (DR-331)
- [Profile Tests README](tests/PROFILE_TESTS_README.md) - Documentation tests profil
- [Tests Overview](tests/README.md) - Vue d'ensemble de la stratégie de test
- [Test Scripts](tests/test-scripts.md) - Scripts de test

### 🚀 CI/CD (`cicd/`)
Documentation de l'intégration continue et du déploiement continu.

- [CI/CD Overview](cicd/cicd-overview.md) - Vue d'ensemble CI/CD
- [CI/CD Refactor](cicd/cicd-refactor.md) - Refactorisation CI/CD
- [GitHub Actions](cicd/github-actions.md) - Configuration GitHub Actions
- [Deployment Pipeline](cicd/deployment-pipeline.md) - Pipeline de déploiement
- [Environment Management](cicd/environment-management.md) - Gestion des environnements
- [Multi-Repo Strategy](cicd/multi-repo-strategy.md) - Stratégie multi-dépôts

### 🐳 Docker (`docker/`)
Documentation des conteneurs et de l'orchestration Docker.

- [Docker Overview](docker/docker-overview.md) - Vue d'ensemble Docker
- [Docker Compose](docker/docker-compose.md) - Configuration Docker Compose
- [Dockerfiles Guide](docker/dockerfiles-guide.md) - Guide des Dockerfiles
- [Big Pods Docker](docker/bigpods-docker.md) - Architecture Big Pods
- [Multi-Stage Builds](docker/multi-stage-builds.md) - Builds multi-étapes

### 📊 Monitoring (`monitoring/`)
Documentation de l'observabilité et du monitoring.

- [Monitoring Overview](monitoring/monitoring-overview.md) - Vue d'ensemble monitoring
- [Prometheus Setup](monitoring/prometheus.md) - Configuration Prometheus
- [Grafana Dashboards](monitoring/grafana.md) - Tableaux de bord Grafana
- [Logging Strategy](monitoring/logging.md) - Stratégie de logging
- [Alerting](monitoring/alerting.md) - Configuration des alertes

### 📖 Guides (`guides/`)
Documentation des guides de développement et conventions.

- **[CLAUDE.md](guides/CLAUDE.md)** ⭐ - Instructions pour Claude Code (AI assistant)
- [Conventions/](guides/conventions/) - Conventions et standards
  - [Git Conventions Audit](guides/conventions/AUDIT_GIT_CONVENTIONS.md) - Audit des conventions Git

### 📋 Gestion de Projet (`project-management/`)
Documentation de gestion de projet et conformité.

- [Rapport Conformité PAQ/CDC](project-management/RAPPORT_CONFORMITE_PAQ_CDC.md) - Rapport de conformité qualité
- [Verification Checklist](project-management/VERIFICATION_CHECKLIST.md) - Liste de vérification projet

### 📝 Résumés (`summaries/`)
Résumés et tracking des changements importants.

- [CI/CD Refactor Summary](summaries/CICD_REFACTOR_SUMMARY.md) - Résumé de la refactorisation CI/CD
- [Files Created Summary](summaries/FILES_CREATED_SUMMARY.md) - Tracking des fichiers créés

## 🎯 Points d'Entrée par Cas d'Usage

### Je veux déployer l'application
1. [Architecture Overview](infrastructure/ARCHITECTURE.md) - Comprendre l'architecture
2. [Deployment Guide](infrastructure/deployment-guide.md) - Guide de déploiement
3. [Docker Overview](docker/docker-overview.md) - Comprendre Docker
4. [CI/CD Overview](cicd/cicd-overview.md) - Pipeline de déploiement

### Je veux développer un nouveau service
1. [Services Overview](services/services-overview.md) - Architecture des services
2. [Database Schema](services/database-schema.md) - Schéma de données
3. [Kafka Events](services/kafka-events.md) - Communication inter-services
4. [Frontend Architecture](frontend/frontend-architecture.md) - Intégration frontend

### Je veux écrire des tests
1. [Tests Overview](tests/README.md) - Stratégie de test
2. [Profile User Tests](tests/profile-user-tests.md) - Exemple de tests complets
3. [Test Scripts](tests/test-scripts.md) - Scripts de test disponibles

### Je veux comprendre l'infrastructure
1. [Architecture Overview](infrastructure/ARCHITECTURE.md) - Architecture système
2. [Network Architecture](infrastructure/network-architecture.md) - Architecture réseau
3. [Kubernetes Setup](infrastructure/kubernetes-setup.md) - Configuration K8s
4. [Big Pods Guide](infrastructure/bigpods-guide.md) - Architecture Big Pods

### Je veux configurer le monitoring
1. [Monitoring Overview](monitoring/monitoring-overview.md) - Vue d'ensemble
2. [Prometheus Setup](monitoring/prometheus.md) - Configuration Prometheus
3. [Grafana Dashboards](monitoring/grafana.md) - Tableaux de bord
4. [Alerting](monitoring/alerting.md) - Configuration alertes

## 🔗 Liens Rapides

### Repositories
- [dreamscape-services](https://github.com/DREAMSCAPE-AI/dreamscape-services) - Services backend
- [dreamscape-frontend](https://github.com/DREAMSCAPE-AI/dreamscape-frontend) - Applications frontend
- [dreamscape-infra](https://github.com/DREAMSCAPE-AI/dreamscape-infra) - Infrastructure et scripts
- [dreamscape-tests](https://github.com/DREAMSCAPE-AI/dreamscape-tests) - Suite de tests

### Jira
- [Tableau Jira DreamScape](https://epitech-team-t7wc668a.atlassian.net/) - Gestion de projet

### Documentation Technique
- [Amadeus API](https://developers.amadeus.com/) - Documentation API Amadeus
- [Stripe API](https://stripe.com/docs/api) - Documentation API Stripe
- [OpenAI API](https://platform.openai.com/docs) - Documentation API OpenAI

## 📝 Conventions

### Branches
```
feature/service-name/description
fix/service-name/description
test/service-name/description
docs/description
```

### Commits
```
feat: nouvelle fonctionnalité
fix: correction de bug
test: ajout de tests
docs: mise à jour documentation
refactor: refactorisation
style: formatting
chore: tâches maintenance
```

## 🚦 Statut du Projet

- **CI/CD Pipeline**: ✅ Fonctionnel sur tous les environnements (dev, staging, production)
- **Docker**: ✅ Tous les services ont des Dockerfile.prod
- **Tests**: ✅ Suites de tests complètes (unit, integration, e2e)
- **K8s Deployment**: ⚠️ En attente de configuration réseau
- **Monitoring**: ✅ Prometheus + Grafana configurés

## 🤝 Contribution

Ce projet suit un rythme de développement de **2 jours par semaine**. Pour cette raison:
- Documentation complète et à jour est critique
- Tests automatisés sont obligatoires
- Chaque PR doit inclure sa documentation
- Les commits doivent être descriptifs

## 📞 Support

Pour toute question:
- **GitHub Issues**: Créer une issue dans le repo approprié
- **Documentation**: Consultez d'abord cette doc centralisée
- **Jira**: Vérifiez les tickets existants

---

**Dernière mise à jour**: 2025-12-04  
**Version**: 1.0.0  
**Maintainers**: Équipe DreamScape
