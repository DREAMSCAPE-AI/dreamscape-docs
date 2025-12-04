# Docker Compose Production - DreamScape Services

Configuration Docker Compose pour l'environnement de production, organisée en **Big Pods**.

## 📦 Architecture

### Core Pod
Services d'authentification et gestion utilisateurs.
- **auth-service** (port 3001)
- **user-service** (port 3002)
- **PostgreSQL** (core-db)

### Business Pod
Services métier : paiement, voyages, intelligence artificielle.
- **payment-service** (port 3003)
- **voyage-service** (port 3004)
- **ai-service** (port 3005)
- **PostgreSQL** (business-db)

### Experience Pod
_Note: Les services frontend (gateway, web-client, panorama) sont dans le repo `dreamscape-frontend`._

## 🚀 Démarrage rapide

### 1. Configuration

Copier `.env.example` vers `.env` et configurer les variables :

```bash
cp .env.example .env
```

Éditer `.env` avec vos credentials :
```env
POSTGRES_PASSWORD=your-secure-password
JWT_SECRET=your-random-jwt-secret
AMADEUS_API_KEY=your-amadeus-key
AMADEUS_API_SECRET=your-amadeus-secret
OPENAI_API_KEY=your-openai-key
```

### 2. Build et Test

**PowerShell** (Windows) :
```powershell
# Tester tout (Core + Business)
.\test-production.ps1

# Tester uniquement Core Pod
.\test-production.ps1 -Pod core

# Tester uniquement Business Pod
.\test-production.ps1 -Pod business

# Build sans tests
.\test-production.ps1 -BuildOnly

# Nettoyer avant build
.\test-production.ps1 -Clean
```

### 3. Démarrage production

**Option 1 : Tous les services**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

**Option 2 : Par pod**
```bash
# Core Pod uniquement
docker-compose -f docker-compose.core.prod.yml up -d

# Business Pod uniquement
docker-compose -f docker-compose.business.prod.yml up -d
```

### 4. Vérification

```bash
# Voir les services en cours
docker-compose -f docker-compose.prod.yml ps

# Voir les logs
docker-compose -f docker-compose.prod.yml logs -f

# Health check
curl http://localhost:3001/health  # Auth
curl http://localhost:3002/health  # User
curl http://localhost:3003/health  # Payment
curl http://localhost:3004/health  # Voyage
curl http://localhost:3005/health  # AI
```

### 5. Arrêt

```bash
# Arrêter tous les services
docker-compose -f docker-compose.prod.yml down

# Arrêter et supprimer les volumes
docker-compose -f docker-compose.prod.yml down -v
```

## 📁 Structure des fichiers

```
dreamscape-services/
├── docker-compose.prod.yml              # Orchestration globale (Core + Business)
├── docker-compose.core.prod.yml         # Core Pod uniquement
├── docker-compose.business.prod.yml     # Business Pod uniquement
├── .env.example                         # Template des variables d'environnement
├── test-production.ps1                  # Script de test PowerShell
│
├── auth/
│   └── Dockerfile.prod
├── user/
│   └── Dockerfile.prod
├── payment/
│   └── Dockerfile.prod
├── voyage/
│   └── Dockerfile.prod
└── ai/
    └── Dockerfile.prod
```

## 🔧 Configuration avancée

### Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `POSTGRES_PASSWORD` | Mot de passe PostgreSQL | `dreamscape_secure_password` |
| `JWT_SECRET` | Secret pour JWT | `your-production-jwt-secret-change-me` |
| `AMADEUS_API_KEY` | Clé API Amadeus | `test-key` |
| `AMADEUS_API_SECRET` | Secret API Amadeus | `test-secret` |
| `OPENAI_API_KEY` | Clé API OpenAI | `test-key` |

### Ports

| Service | Port | Description |
|---------|------|-------------|
| auth-service | 3001 | API d'authentification |
| user-service | 3002 | API de gestion utilisateurs |
| payment-service | 3003 | API de paiement |
| voyage-service | 3004 | API de réservation voyages |
| ai-service | 3005 | API d'intelligence artificielle |

### Health Checks

Tous les services ont des health checks configurés :
- **Interval** : 30s
- **Timeout** : 10s
- **Retries** : 3
- **Start period** : 40s

## 🐛 Troubleshooting

### Les services ne démarrent pas

1. Vérifier les logs :
```bash
docker-compose -f docker-compose.prod.yml logs
```

2. Vérifier que Docker Desktop est lancé

3. Vérifier les ports disponibles :
```bash
netstat -ano | findstr "3001 3002 3003 3004 3005"
```

### Build échoue

1. Nettoyer les images et caches :
```bash
docker-compose -f docker-compose.prod.yml down -v
docker system prune -a
```

2. Rebuild sans cache :
```bash
docker-compose -f docker-compose.prod.yml build --no-cache
```

### Base de données corrompue

Supprimer les volumes et recréer :
```bash
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d
```

## 📝 Notes

- Les Dockerfiles utilisent des **multi-stage builds** pour optimiser la taille des images
- Les services dépendent de `@dreamscape/db` (workspace local) qui est copié dans le build context
- Les bases de données PostgreSQL utilisent des **volumes persistants**
- Tous les containers utilisent **dumb-init** pour un meilleur signal handling

## 🎯 TODO

- [ ] Ajouter Experience Pod (nécessite repo `dreamscape-frontend`)
- [ ] Configurer Redis pour auth-service
- [ ] Ajouter monitoring (Prometheus/Grafana)
- [ ] Configurer backup automatique des DBs
- [ ] Ajouter certificats SSL/TLS

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
