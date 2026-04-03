# Démarrage rapide

Bienvenue sur DreamScape. Ce guide vous permet de mettre en place l'environnement de développement complet.

## Checklist d'installation

1. [Prérequis](prerequisites.md) — Vérifier Node 18+, Docker, ports disponibles
2. [Installation locale](local-development.md) — Cloner, installer, configurer et démarrer
3. [Configuration](environment-configuration.md) — Variables d'environnement par service
4. [Structure du projet](project-structure.md) — Comprendre l'organisation du code

## Démarrage minimal (5 minutes)

Si Docker est déjà installé et les ports disponibles :

```bash
# 1. Démarrer l'infrastructure
cd dreamscape-infra/docker
docker compose up -d postgres redis

# 2. Initialiser la base de données
cd dreamscape-services/db
npm install && npm run db:push && npm run db:generate

# 3. Démarrer tous les services
cd <monorepo-root>
make start         # Linux/macOS
.\start-all.ps1    # Windows PowerShell

# 4. Ouvrir le frontend
open http://localhost:5173
```

## Architecture en un coup d'œil

```
Web Client (5173)
      │
   Gateway (3000)
      │
  ┌───┼──────────────────────────┐
  │   │                          │
Auth  User  Voyage  Payment  AI  │
3001  3002   3003    3004   3005  │
  │                              │
  └──────────── PostgreSQL ──────┘
                Redis    Kafka
```

## Liens rapides

- [Tous les endpoints API](../api-reference/README.md)
- [Architecture détaillée](../architecture/README.md)
- [Lancer les tests](../guides/testing.md)
