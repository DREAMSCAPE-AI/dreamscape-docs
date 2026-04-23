# Guides de développement par module

Guides pratiques pour démarrer, contribuer et déboguer chaque microservice du backend DreamScape.

| Module | Guide | Port | Pod |
|--------|-------|------|-----|
| Auth Service | [auth-service-dev.md](auth-service-dev.md) | 3001 | Core |
| User Service | [user-service-dev.md](user-service-dev.md) | 3002 | Core |
| Voyage Service | [voyage-service-dev.md](voyage-service-dev.md) | 3003 | Business |
| Payment Service | [payment-service-dev.md](payment-service-dev.md) | 3004 | Business |
| AI Service | [ai-service-dev.md](ai-service-dev.md) | 3005 | Business |
| Panorama VR Service | [panorama-vr-dev.md](panorama-vr-dev.md) | 3006 | Experience |

## Structure commune des guides

Chaque guide couvre :
1. **Vue d'ensemble** — responsabilités, dépendances
2. **Prérequis & installation** — outils, variables d'env, services externes
3. **Démarrage local** — commandes pour lancer le service en mode dev
4. **Architecture du code** — arborescence, fichiers clés
5. **Modèles Prisma & migrations** — schéma utilisé, commandes DB
6. **Endpoints & routes** — pointeur vers la spec OpenAPI
7. **Événements Kafka** — topics produits / consommés
8. **Tests** — unitaires, intégration, E2E
9. **Debug & dépannage** — pièges courants, logs utiles
10. **Contribution** — branches, PR, conventions de commit

## Lancer tous les services

Voir [`getting-started/local-development.md`](../../getting-started/local-development.md) pour la procédure globale.

```bash
# Depuis la racine du monorepo
make start            # Tous les services + frontend
make services         # Backend uniquement
make health           # Vérifier l'état
```
