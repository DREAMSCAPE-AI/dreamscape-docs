# Installation locale

Guide pas-à-pas pour démarrer l'ensemble de la plateforme DreamScape en local.

## Étape 1 — Cloner les repositories

DreamScape est organisé en 5 repositories indépendants. Les cloner dans un même dossier parent :

```bash
mkdir dreamscape && cd dreamscape

git clone https://github.com/dreamscape-ai/dreamscape-services.git
git clone https://github.com/dreamscape-ai/dreamscape-frontend.git
git clone https://github.com/dreamscape-ai/dreamscape-infra.git
git clone https://github.com/dreamscape-ai/dreamscape-tests.git
git clone https://github.com/dreamscape-ai/dreamscape-docs.git
```

## Étape 2 — Infrastructure (PostgreSQL, Redis, Kafka)

Démarrer les services d'infrastructure via Docker Compose :

```bash
cd dreamscape-infra/docker

# Base de données + cache uniquement
docker compose up -d postgres redis

# Avec Kafka (pour les événements asynchrones)
docker compose -f docker-compose.kafka.yml up -d

# Vérification
docker compose ps
```

PostgreSQL est accessible sur `localhost:5432` avec :
- User : `dreamscape_user`
- Password : `password` (dev)
- Database : `dreamscape`

## Étape 3 — Base de données (Prisma)

```bash
cd dreamscape-services/db

# Installer les dépendances du package partagé
npm install

# Pousser le schéma (dev — sans migration formelle)
npm run db:push

# Générer le client Prisma
npm run db:generate

# Seeder les données de test (optionnel)
npm run db:seed
```

> Si `db:push` échoue (conflit shadow database), utiliser `npx prisma db push --force-reset` en dev uniquement.

## Étape 4 — Installer les dépendances de tous les services

```bash
# Depuis la racine du monorepo (si Makefile disponible)
make install

# OU manuellement pour chaque service
cd dreamscape-services/auth    && npm install && cd -
cd dreamscape-services/user    && npm install && cd -
cd dreamscape-services/voyage  && npm install && cd -
cd dreamscape-services/payment && npm install && cd -
cd dreamscape-services/ai      && npm install && cd -

# Frontend
cd dreamscape-frontend/gateway    && npm install && cd -
cd dreamscape-frontend/web-client && npm install && cd -
cd dreamscape-frontend/panorama   && npm install && cd -
```

## Étape 5 — Variables d'environnement

Copier les fichiers `.env.example` dans chaque service :

```bash
for service in auth user voyage payment ai; do
  cp dreamscape-services/$service/.env.example dreamscape-services/$service/.env
done

cp dreamscape-frontend/gateway/.env.example dreamscape-frontend/gateway/.env
cp dreamscape-frontend/web-client/.env.example dreamscape-frontend/web-client/.env
```

Éditer chaque `.env` avec vos valeurs. Voir [Configuration des environnements](environment-configuration.md) pour le détail.

## Étape 6 — Démarrer les services backend

Ouvrir un terminal par service (ou utiliser `make start`) :

```bash
# Terminal 1 — Auth Service (port 3001)
cd dreamscape-services/auth && npm run dev

# Terminal 2 — User Service (port 3002)
cd dreamscape-services/user && npm run dev

# Terminal 3 — Voyage Service (port 3003)
cd dreamscape-services/voyage && npm run dev

# Terminal 4 — Payment Service (port 3004)
cd dreamscape-services/payment && npm run dev

# Terminal 5 — AI Service (port 3005)
cd dreamscape-services/ai && npm run dev
```

**Commande unique (Makefile) :**
```bash
make services   # Démarre tous les services backend
```

**PowerShell (Windows) :**
```powershell
.\start-all.ps1
```

## Étape 7 — Démarrer le frontend

```bash
# Terminal 6 — Gateway (port 3000)
cd dreamscape-frontend/gateway && npm run dev

# Terminal 7 — Web Client (port 5173)
cd dreamscape-frontend/web-client && npm run dev

# Terminal 8 — Panorama VR (port 3006) — optionnel
cd dreamscape-frontend/panorama && npm start
```

**Commande unique (Makefile) :**
```bash
make frontend
```

## Étape 8 — Vérification

Tester que tous les services répondent :

```bash
# Health checks
curl http://localhost:3001/health   # Auth Service
curl http://localhost:3002/health   # User Service
curl http://localhost:3003/health   # Voyage Service
curl http://localhost:3004/health   # Payment Service
curl http://localhost:3005/health   # AI Service
curl http://localhost:3000/health   # Gateway

# Frontend
open http://localhost:5173          # Web Client (navigateur)
open http://localhost:3006          # Panorama VR (optionnel)
```

Réponse attendue (chaque health endpoint) :
```json
{
  "status": "healthy",
  "database": "connected",
  "cache": "connected"
}
```

## Démarrage tout-en-un (Makefile)

```bash
cd <monorepo-root>
make start    # Lance DB + tous les services + frontend
make stop     # Arrête tout (tue tous les processus node)
make status   # Vérifie quels services sont en cours
make health   # Vérifie tous les endpoints /health
```

## Dépannage courant

| Problème | Solution |
|----------|----------|
| `Cannot connect to PostgreSQL` | Vérifier que `docker compose up -d postgres` est bien lancé |
| `Prisma: schema not found` | Lancer `npm run db:generate` dans `dreamscape-services/db/` |
| Port déjà utilisé | Identifier le processus avec `lsof -i :<port>` puis le tuer |
| `JWT_SECRET not set` | Vérifier le fichier `.env` du service concerné |
| Kafka non disponible | Les services démarrent sans Kafka (dégradation gracieuse) — pas bloquant |
| `@dreamscape/db not found` | Lancer `npm install` puis `npm run db:generate` dans `db/` |
