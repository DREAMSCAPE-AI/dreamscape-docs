---
id: docker-compose-guide
title: Docker Compose Guide
description: Guide complet d'utilisation de Docker Compose pour le développement et déploiement DreamScape
sidebar_label: Docker Compose
sidebar_position: 3
tags: [docker, docker-compose, deployment, development, infrastructure]
---

# Docker Compose Guide

## Vue d'Ensemble

DreamScape utilise Docker Compose pour orchestrer les microservices et l'infrastructure en environnement de développement et production. Cette approche simplifie le déploiement, la configuration et la gestion des dépendances.

## Architecture des Fichiers Compose

### Localisation

```
dreamscape-infra/
├── docker/
│   ├── docker-compose.kafka.yml       # Infrastructure Kafka
│   ├── docker-compose.redis.yml       # Cache Redis
│   └── docker-compose.postgres.yml    # Bases de données
dreamscape-services/
├── docker-compose.prod.yml            # Tous les services (production)
├── docker-compose.core.prod.yml       # Core Pod uniquement
└── docker-compose.business.prod.yml   # Business Pod uniquement
```

### Hiérarchie

```
Infrastructure (dreamscape-infra)
├── Kafka + Zookeeper
├── Redis
└── PostgreSQL (dreamscape_core + dreamscape_business)

Services (dreamscape-services)
├── Core Pod
│   ├── auth-service (3001)
│   └── user-service (3002)
└── Business Pod
    ├── payment-service (3003)
    ├── voyage-service (3004)
    └── ai-service (3005)

Frontend (dreamscape-frontend)
├── Gateway (3000)
├── Web Client (5173)
└── Panorama VR (3006)
```

## Fichiers de Configuration

### 1. Infrastructure Kafka

**Fichier**: `dreamscape-infra/docker/docker-compose.kafka.yml`

```yaml
version: '3.8'

services:
  # Zookeeper - Coordination du cluster
  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    container_name: dreamscape-zookeeper
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    ports:
      - "2181:2181"
    networks:
      - dreamscape-network
    volumes:
      - zookeeper-data:/var/lib/zookeeper/data
      - zookeeper-logs:/var/lib/zookeeper/log

  # Kafka Broker
  kafka:
    image: confluentinc/cp-kafka:7.5.0
    container_name: dreamscape-kafka
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"     # External
      - "29092:29092"   # Internal
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:29092,PLAINTEXT_HOST://localhost:9092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true"
    networks:
      - dreamscape-network
    volumes:
      - kafka-data:/var/lib/kafka/data

  # Kafka Topic Initialization
  kafka-init:
    image: confluentinc/cp-kafka:7.5.0
    container_name: dreamscape-kafka-init
    depends_on:
      - kafka
    entrypoint: [ '/bin/sh', '-c' ]
    command: |
      "
      # Wait for Kafka to be ready
      cub kafka-ready -b kafka:29092 1 60

      # Create topics
      kafka-topics --create --if-not-exists --bootstrap-server kafka:29092 --replication-factor 1 --partitions 3 --topic dreamscape.user.created
      kafka-topics --create --if-not-exists --bootstrap-server kafka:29092 --replication-factor 1 --partitions 3 --topic dreamscape.user.updated
      kafka-topics --create --if-not-exists --bootstrap-server kafka:29092 --replication-factor 1 --partitions 3 --topic dreamscape.user.profile.updated
      kafka-topics --create --if-not-exists --bootstrap-server kafka:29092 --replication-factor 1 --partitions 3 --topic dreamscape.auth.login
      kafka-topics --create --if-not-exists --bootstrap-server kafka:29092 --replication-factor 1 --partitions 3 --topic dreamscape.payment.completed
      kafka-topics --create --if-not-exists --bootstrap-server kafka:29092 --replication-factor 1 --partitions 3 --topic dreamscape.voyage.booking.created

      echo 'Topics created successfully'
      "
    networks:
      - dreamscape-network

  # Kafka UI (Profile: ui)
  kafka-ui:
    image: provectuslabs/kafka-ui:latest
    container_name: dreamscape-kafka-ui
    depends_on:
      - kafka
    ports:
      - "8080:8080"
    environment:
      KAFKA_CLUSTERS_0_NAME: dreamscape
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:29092
      KAFKA_CLUSTERS_0_ZOOKEEPER: zookeeper:2181
    networks:
      - dreamscape-network
    profiles:
      - ui

networks:
  dreamscape-network:
    external: true

volumes:
  zookeeper-data:
  zookeeper-logs:
  kafka-data:
```

**Commandes**:
```bash
# Démarrer Kafka minimal
docker-compose -f docker/docker-compose.kafka.yml up -d

# Démarrer avec UI
docker-compose -f docker/docker-compose.kafka.yml --profile ui up -d

# Arrêter
docker-compose -f docker/docker-compose.kafka.yml down

# Arrêter et supprimer volumes
docker-compose -f docker/docker-compose.kafka.yml down -v
```

### 2. Services Production (All-in-One)

**Fichier**: `dreamscape-services/docker-compose.prod.yml`

```yaml
version: '3.8'

services:
  # Auth Service (Core Pod)
  auth-service:
    build:
      context: ./auth
      dockerfile: Dockerfile.prod
    container_name: dreamscape-auth-service
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      PORT: 3001
      DATABASE_URL: postgresql://dreamscape:${DB_PASSWORD}@postgres:5432/dreamscape_core?schema=auth
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: 7d
      REDIS_HOST: redis
      REDIS_PORT: 6379
      KAFKA_BROKERS: kafka:29092
    depends_on:
      - postgres
      - redis
      - kafka
    networks:
      - dreamscape-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3001/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # User Service (Core Pod)
  user-service:
    build:
      context: ./user
      dockerfile: Dockerfile.prod
    container_name: dreamscape-user-service
    ports:
      - "3002:3002"
    environment:
      NODE_ENV: production
      PORT: 3002
      DATABASE_URL: postgresql://dreamscape:${DB_PASSWORD}@postgres:5432/dreamscape_core?schema=user
      JWT_SECRET: ${JWT_SECRET}
      KAFKA_BROKERS: kafka:29092
    depends_on:
      - postgres
      - kafka
    networks:
      - dreamscape-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3002/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Payment Service (Business Pod)
  payment-service:
    build:
      context: ./payment
      dockerfile: Dockerfile.prod
    container_name: dreamscape-payment-service
    ports:
      - "3003:3003"
    environment:
      NODE_ENV: production
      PORT: 3003
      DATABASE_URL: postgresql://dreamscape:${DB_PASSWORD}@postgres:5432/dreamscape_business?schema=payment
      JWT_SECRET: ${JWT_SECRET}
      STRIPE_API_KEY: ${STRIPE_API_KEY}
      STRIPE_WEBHOOK_SECRET: ${STRIPE_WEBHOOK_SECRET}
      KAFKA_BROKERS: kafka:29092
    depends_on:
      - postgres
      - kafka
    networks:
      - dreamscape-network
    restart: unless-stopped

  # Voyage Service (Business Pod)
  voyage-service:
    build:
      context: ./voyage
      dockerfile: Dockerfile.prod
    container_name: dreamscape-voyage-service
    ports:
      - "3004:3004"
    environment:
      NODE_ENV: production
      PORT: 3004
      DATABASE_URL: postgresql://dreamscape:${DB_PASSWORD}@postgres:5432/dreamscape_business?schema=voyage
      JWT_SECRET: ${JWT_SECRET}
      AMADEUS_API_KEY: ${AMADEUS_API_KEY}
      AMADEUS_API_SECRET: ${AMADEUS_API_SECRET}
      REDIS_HOST: redis
      REDIS_PORT: 6379
      KAFKA_BROKERS: kafka:29092
    depends_on:
      - postgres
      - redis
      - kafka
    networks:
      - dreamscape-network
    restart: unless-stopped

  # AI Service (Business Pod)
  ai-service:
    build:
      context: ./ai
      dockerfile: Dockerfile.prod
    container_name: dreamscape-ai-service
    ports:
      - "3005:3005"
    environment:
      NODE_ENV: production
      PORT: 3005
      DATABASE_URL: postgresql://dreamscape:${DB_PASSWORD}@postgres:5432/dreamscape_business?schema=ai
      JWT_SECRET: ${JWT_SECRET}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      KAFKA_BROKERS: kafka:29092
    depends_on:
      - postgres
      - kafka
    networks:
      - dreamscape-network
    restart: unless-stopped

networks:
  dreamscape-network:
    external: true
```

**Commandes**:
```bash
# Démarrer tous les services
docker-compose -f docker-compose.prod.yml up -d

# Démarrer avec rebuild
docker-compose -f docker-compose.prod.yml up -d --build

# Voir les logs
docker-compose -f docker-compose.prod.yml logs -f

# Arrêter
docker-compose -f docker-compose.prod.yml down
```

### 3. Core Pod Uniquement

**Fichier**: `dreamscape-services/docker-compose.core.prod.yml`

Contient uniquement auth-service et user-service avec leurs dépendances.

**Commandes**:
```bash
docker-compose -f docker-compose.core.prod.yml up -d
```

### 4. Business Pod Uniquement

**Fichier**: `dreamscape-services/docker-compose.business.prod.yml`

Contient payment-service, voyage-service et ai-service.

**Commandes**:
```bash
docker-compose -f docker-compose.business.prod.yml up -d
```

## Réseau Docker

### Création du Réseau

```bash
# Créer le réseau partagé
docker network create dreamscape-network

# Vérifier
docker network ls | grep dreamscape
```

### Services sur le Réseau

Tous les services communiquent via `dreamscape-network`:
- Résolution DNS automatique (nom du conteneur)
- Isolation réseau
- Communication inter-services sécurisée

```typescript
// Services utilisent les noms de conteneurs
const AUTH_SERVICE_URL = 'http://auth-service:3001';
const KAFKA_BROKERS = ['kafka:29092'];
const REDIS_HOST = 'redis';
```

## Variables d'Environnement

### Fichier .env

Créer un fichier `.env` à la racine de chaque répertoire compose:

```bash
# Database
DB_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your_jwt_secret_key_min_32_chars

# Stripe (Payment Service)
STRIPE_API_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Amadeus (Voyage Service)
AMADEUS_API_KEY=your_amadeus_key
AMADEUS_API_SECRET=your_amadeus_secret

# OpenAI (AI Service)
OPENAI_API_KEY=sk-...
```

### Chargement Automatique

Docker Compose charge automatiquement `.env` depuis le répertoire d'exécution:

```yaml
environment:
  STRIPE_API_KEY: ${STRIPE_API_KEY}  # Résolu depuis .env
```

## Volumes et Persistance

### Types de Volumes

1. **Named Volumes** (Recommandé pour prod)
```yaml
volumes:
  postgres-data:
  redis-data:
  kafka-data:
```

2. **Bind Mounts** (Développement)
```yaml
volumes:
  - ./auth/src:/app/src
  - ./auth/prisma:/app/prisma
```

### Gestion des Volumes

```bash
# Lister les volumes
docker volume ls

# Inspecter un volume
docker volume inspect dreamscape-services_postgres-data

# Supprimer les volumes inutilisés
docker volume prune

# Backup d'un volume
docker run --rm -v dreamscape-services_postgres-data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz /data
```

## Health Checks

### Configuration

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
  interval: 30s      # Fréquence des checks
  timeout: 10s       # Timeout par check
  retries: 3         # Nombre de tentatives
  start_period: 40s  # Délai avant premier check
```

### Vérification

```bash
# Voir le statut de santé
docker ps

# Détails du healthcheck
docker inspect --format='{{json .State.Health}}' dreamscape-auth-service | jq
```

## Logs et Monitoring

### Consulter les Logs

```bash
# Tous les services
docker-compose logs -f

# Service spécifique
docker-compose logs -f auth-service

# Dernières 100 lignes
docker-compose logs --tail=100 auth-service

# Depuis une date
docker-compose logs --since 2024-01-15T10:00:00 auth-service
```

### Configuration des Logs

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

## Scaling

### Horizontal Scaling

```bash
# Démarrer 3 instances d'un service
docker-compose up -d --scale voyage-service=3

# Avec load balancer
docker-compose up -d --scale voyage-service=3 nginx
```

### Configuration

```yaml
voyage-service:
  # ... config
  deploy:
    replicas: 3
    resources:
      limits:
        cpus: '0.5'
        memory: 512M
      reservations:
        cpus: '0.25'
        memory: 256M
```

## Dépendances entre Services

### depends_on

```yaml
auth-service:
  depends_on:
    - postgres   # Attend que postgres soit démarré
    - redis
    - kafka
```

### Ordre de Démarrage

1. Infrastructure (postgres, redis, kafka)
2. Core Services (auth, user)
3. Business Services (payment, voyage, ai)
4. Frontend Services (gateway, web-client)

### Attente Robuste

```yaml
auth-service:
  depends_on:
    postgres:
      condition: service_healthy  # Attend le healthcheck
    kafka:
      condition: service_started
```

## Commandes Utiles

### Gestion des Services

```bash
# Démarrer en arrière-plan
docker-compose up -d

# Démarrer et reconstruire les images
docker-compose up -d --build

# Redémarrer un service
docker-compose restart auth-service

# Arrêter sans supprimer
docker-compose stop

# Arrêter et supprimer conteneurs
docker-compose down

# Supprimer tout (conteneurs, volumes, réseaux)
docker-compose down -v

# Voir l'état
docker-compose ps
```

### Debug

```bash
# Shell dans un conteneur
docker-compose exec auth-service sh

# Exécuter une commande
docker-compose exec auth-service npm run db:migrate

# Voir les variables d'environnement
docker-compose exec auth-service env

# Inspecter un service
docker-compose config | grep auth-service -A 20
```

### Performance

```bash
# Statistiques en temps réel
docker stats

# Ressources utilisées par service
docker-compose top

# Événements
docker events --filter 'container=dreamscape-auth-service'
```

## Profils Docker Compose

### Définition

```yaml
services:
  kafka-ui:
    # ... config
    profiles:
      - ui
      - debug

  pgadmin:
    # ... config
    profiles:
      - admin
```

### Utilisation

```bash
# Démarrer avec profile
docker-compose --profile ui up -d

# Plusieurs profiles
docker-compose --profile ui --profile admin up -d

# Sans profile (services par défaut uniquement)
docker-compose up -d
```

## Multi-Stage Déploiement

### Environnements

```bash
# Development
docker-compose -f docker-compose.dev.yml up -d

# Staging
docker-compose -f docker-compose.staging.yml up -d

# Production
docker-compose -f docker-compose.prod.yml up -d
```

### Fichier Override

```bash
# Base + Override
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d

# Production avec override local
docker-compose -f docker-compose.prod.yml -f docker-compose.local.yml up -d
```

## Sécurité

### Secrets

```bash
# Créer un secret
echo "my_secret_password" | docker secret create db_password -

# Utiliser dans compose
services:
  auth-service:
    secrets:
      - db_password
    environment:
      DB_PASSWORD_FILE: /run/secrets/db_password

secrets:
  db_password:
    external: true
```

### Utilisateur Non-Root

```dockerfile
# Dockerfile
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs
```

```yaml
# docker-compose.yml
user: "1001:1001"
```

### Limites de Ressources

```yaml
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 512M
    reservations:
      cpus: '0.25'
      memory: 256M
```

## Troubleshooting

### Service ne démarre pas

```bash
# Voir les logs d'erreur
docker-compose logs auth-service

# Vérifier la config
docker-compose config

# Tester la connexion réseau
docker-compose exec auth-service ping postgres
```

### Problème de Volumes

```bash
# Recréer les volumes
docker-compose down -v
docker-compose up -d

# Vérifier les permissions
docker-compose exec auth-service ls -la /app
```

### Problème de Build

```bash
# Nettoyer le cache
docker-compose build --no-cache auth-service

# Supprimer les images orphelines
docker image prune -a
```

## Scripts d'Automatisation

### Start All

```bash
#!/bin/bash
# scripts/start-all.sh

echo "🚀 Starting DreamScape infrastructure..."

# Créer le réseau
docker network create dreamscape-network 2>/dev/null || true

# Démarrer l'infrastructure
cd dreamscape-infra
docker-compose -f docker/docker-compose.kafka.yml up -d
docker-compose -f docker/docker-compose.redis.yml up -d
docker-compose -f docker/docker-compose.postgres.yml up -d

# Attendre que les services soient prêts
echo "⏳ Waiting for infrastructure to be ready..."
sleep 10

# Démarrer les services
cd ../dreamscape-services
docker-compose -f docker-compose.prod.yml up -d

echo "✅ All services started!"
echo "📊 Check status: docker-compose ps"
```

### Stop All

```bash
#!/bin/bash
# scripts/stop-all.sh

echo "🛑 Stopping DreamScape..."

cd dreamscape-services
docker-compose -f docker-compose.prod.yml down

cd ../dreamscape-infra
docker-compose -f docker/docker-compose.kafka.yml down
docker-compose -f docker/docker-compose.redis.yml down
docker-compose -f docker/docker-compose.postgres.yml down

echo "✅ All services stopped"
```

## Documentation Liée

- [Infrastructure Kafka](../infrastructure/kafka.md)
- [Kafka Architecture](../services/kafka-architecture.md)
- [CI/CD Pipeline](./cicd-pipeline.md)

## Références

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Docker Compose File Reference](https://docs.docker.com/compose/compose-file/)
- [Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

**Version**: 1.0.0
**Dernière mise à jour**: 7 janvier 2026
**Auteurs**: Équipe DreamScape DevOps
