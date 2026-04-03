# Infrastructure

## Stack

| Composant | Technologie |
|-----------|-------------|
| Conteneurs | Docker + Docker Compose |
| Orchestration prod | Kubernetes (k3s) + kustomize |
| CI/CD | GitHub Actions (pipeline 2 stages) |
| IaC | Terraform |
| Monitoring | Prometheus + Grafana |
| Message broker | Apache Kafka + Zookeeper |
| Cache | Redis 6+ |
| Base de données | PostgreSQL 15+ |

## Big Pods — Architecture de déploiement

En production, les 6 microservices de développement sont regroupés en **3 pods de déploiement** :

| Pod | Services inclus | Lancement |
|-----|----------------|-----------|
| Core Pod | auth-service + user-service | `./launch-core-pod.sh start` |
| Business Pod | voyage-service + payment-service + ai-service | `./launch-business-pod.sh start` |
| Experience Pod | gateway + web-client + panorama | `./launch-experience-pod.sh start` |

Chaque pod utilise **Supervisor** pour la gestion multi-processus et **NGINX** pour le routage interne.

**Bénéfices vs microservices classiques :**
- -90% de latence (localhost vs cross-container HTTP)
- -30% RAM (ressources partagées)
- -50% de conteneurs à gérer

Voir [Big Pods](../architecture/docker/big-pods.md) pour l'architecture détaillée.

## Environnements

| Environnement | Branche Git | Déploiement |
|---------------|-------------|-------------|
| `development` | `feature/**`, `bugfix/**` | Auto (PR) |
| `staging` | `develop` | Auto |
| `production` | `main` | Auto |

## Ports

| Service | Port dev | Port Docker |
|---------|----------|-------------|
| Auth Service | 3001 | 3001 |
| User Service | 3002 | 3002 |
| Voyage Service | 3003 | 3003 |
| Payment Service | 3004 | 3004 |
| AI Service | 3005 | 3005 |
| Panorama VR | 3006 | 3006 |
| Gateway | 4000 (dev) / 3000 | 3000 |
| Web Client | 5173 | — |
| PostgreSQL | 5432 | 5432 |
| Redis | 6379 | 6379 |
| Kafka | 9092 | 9092 |
| Zookeeper | 2181 | 2181 |
| Prometheus | 9090 | 9090 |
| Grafana | 3030 | 3030 |

## Référence

| Document | Contenu |
|----------|---------|
| [kafka.md](kafka.md) | Cluster Kafka, topics, consumers |
| [docker-compose.md](docker-compose.md) | Orchestration locale et production |
| [kubernetes.md](kubernetes.md) | k3s, kustomize, overlays |
| [ci-cd.md](ci-cd.md) | GitHub Actions, pipeline 2 stages |
| [monitoring.md](monitoring.md) | Prometheus, Grafana |
| [terraform.md](terraform.md) | IaC cloud |
