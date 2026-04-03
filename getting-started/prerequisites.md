# Prérequis

Ce document liste tous les outils nécessaires avant d'installer et démarrer DreamScape en local.

## Outils obligatoires

### Node.js 18+
Tous les services backend et le frontend requièrent Node.js 18 ou supérieur.

```bash
node --version   # >= 18.0.0
npm --version    # >= 9.0.0
```

Téléchargement : https://nodejs.org/en/download (LTS recommandé)

### Docker & Docker Compose
Requis pour PostgreSQL, Redis, Kafka, et les déploiements en pods.

```bash
docker --version          # >= 24.0.0
docker compose version    # >= 2.20.0
```

Téléchargement : https://docs.docker.com/get-docker/

### Git
Pour cloner les 5 sous-repos du monorepo.

```bash
git --version   # >= 2.40.0
```

## Outils recommandés

### Make (Linux/macOS)
Permet d'utiliser les commandes `make start`, `make stop`, etc. depuis la racine.

```bash
# macOS
brew install make

# Ubuntu/Debian
sudo apt-get install make
```

> **Windows** : utiliser les scripts PowerShell (`.\start-all.ps1`) ou WSL2.

### Prisma CLI
Nécessaire pour les migrations de schéma et la génération du client.

```bash
npm install -g prisma
prisma --version
```

### ts-node / tsx (optionnel)
Installés localement dans chaque service via `npm install`, pas besoin d'installation globale.

## Accès aux services externes

Ces clés API sont nécessaires pour le développement complet. Des valeurs de test suffisent pour commencer.

| Service | Variable | Utilisation |
|---------|----------|-------------|
| Amadeus | `AMADEUS_API_KEY`, `AMADEUS_API_SECRET` | Recherche de vols/hôtels (voyage-service) |
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` | Paiements (payment-service) |
| OpenAI | `OPENAI_API_KEY` | Futur usage (ai-service) |
| Mapbox | `VITE_MAPBOX_TOKEN` | Cartes (web-client) |
| SendGrid | `SENDGRID_API_KEY` | Emails (user-service) |

> Sans ces clés, les fonctionnalités correspondantes retourneront des erreurs mais les autres services continueront de fonctionner.

## Ports requis (libres sur votre machine)

| Port | Service |
|------|---------|
| 3001 | Auth Service |
| 3002 | User Service |
| 3003 | Voyage Service |
| 3004 | Payment Service |
| 3005 | AI Service |
| 3006 | Panorama VR |
| 3000 | API Gateway |
| 4000 | Gateway (dev alternatif) |
| 5173 | Web Client (Vite) |
| 5432 | PostgreSQL |
| 6379 | Redis |
| 9092 | Kafka |
| 2181 | Zookeeper |

## Vérification

```bash
# Vérifier que les ports sont libres (Linux/macOS)
for port in 3001 3002 3003 3004 3005 3006 5432 6379 9092; do
  nc -z localhost $port 2>/dev/null && echo "PORT $port OCCUPÉ" || echo "Port $port libre"
done
```
