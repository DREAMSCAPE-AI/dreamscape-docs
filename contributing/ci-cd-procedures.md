# Procédures CI/CD

Ce document décrit les procédures opérationnelles du pipeline CI/CD DreamScape : déclenchement, suivi, déploiement, rollback. Pour la **configuration infrastructure** (Terraform, K3s, OCI), voir [infrastructure/ci-cd.md](../infrastructure/ci-cd.md).

## Architecture du pipeline

DreamScape utilise un **pipeline en 2 stages** via `repository_dispatch` pour découpler les responsabilités :

```
┌────────────────────────────┐          ┌────────────────────────────┐
│  Stage 1 : CI local        │          │  Stage 2 : CI/CD centralisé│
│  (repo source)             │          │  (dreamscape-infra)        │
│                            │          │                            │
│  - Détection des changes   │          │  - Reçoit l'événement      │
│  - Lint                    │─ dispatch┤  - Clone le repo source    │
│  - Tests                   │  event   │  - Run tests               │
│  - Déclenche infra         │          │  - Build Docker            │
└────────────────────────────┘          │  - Push GHCR               │
                                        │  - Deploy K3s              │
                                        │  - GitHub Deployment       │
                                        └────────────────────────────┘
```

### Fichiers clés

| Fichier | Rôle |
|---------|------|
| `dreamscape-services/.github/workflows/ci-trigger.yml` | Stage 1 — CI local des services |
| `dreamscape-frontend/.github/workflows/ci-trigger.yml` | Stage 1 — CI local du frontend |
| `dreamscape-infra/.github/workflows/unified-cicd.yml` | Stage 2 — CI/CD centralisé |
| `dreamscape-infra/k8s/overlays/<env>/` | Manifestes Kustomize par environnement |
| `dreamscape-tests/.github/workflows/e2e.yml` | Tests E2E post-déploiement |

## Stage 1 — CI local (repo source)

### Déclencheurs

| Événement | Action |
|-----------|--------|
| `push` sur `main` | Lint + tests + dispatch vers infra (env: production) |
| `push` sur `develop` | Lint + tests + dispatch vers infra (env: staging) |
| `push` sur `feature/**`, `bugfix/**`, `hotfix/**` | Lint + tests + dispatch vers infra (env: dev) |
| `pull_request` | Lint + tests (pas de dispatch) |

### Détection des services modifiés

Le job `detect-changes` analyse les chemins modifiés et émet une matrice des services à traiter :

```yaml
outputs:
  services: [auth, user, voyage, payment, ai, panorama]
  run_all: true/false  # true si shared/ ou db/ modifiés
```

Règles :

- Modification de `auth/**` → service `auth` uniquement.
- Modification de `shared/**` ou `db/**` → **tous** les services (`run_all: true`).
- Modification de `docs/**` ou `*.md` seuls → aucun build déclenché.

### Jobs exécutés

1. **Lint** — `npm run lint` par service modifié.
2. **Type check** — `npm run build` (tsc --noEmit).
3. **Tests unitaires** — `npm run test:unit`.
4. **Dispatch** — émet l'événement `services-changed` vers `dreamscape-infra`.

### Payload du dispatch

```json
{
  "event_type": "services-changed",
  "client_payload": {
    "source_repo": "dreamscape-services",
    "ref": "refs/heads/develop",
    "sha": "abc123...",
    "component": "auth",
    "environment": "staging"
  }
}
```

## Stage 2 — CI/CD centralisé (dreamscape-infra)

### Déclencheurs

- `repository_dispatch` avec `event_type: services-changed` (déclenché par Stage 1).
- `workflow_dispatch` pour trigger manuel (utile pour redéployer sans changement de code).

### Étapes

```
1. Parse event          → lit le payload, détermine env cible
2. Checkout source      → clone le repo source au SHA spécifié
3. Test                 → test suite complète (unit + integration)
4. Build Docker         → multi-stage build avec Dockerfile.prod
5. Security scan        → Trivy sur l'image construite
6. Push GHCR            → ghcr.io/dreamscape-ai/<service>:<sha> + :latest
7. Deploy K3s           → kustomize build + kubectl apply sur l'env
8. Smoke tests          → curl sur /health après rollout
9. Create Deployment    → GitHub Deployment + status (success/failure)
```

### Mapping branche → environnement

| Branche | Environnement | URL |
|---------|---------------|-----|
| `main` | production | `*.dreamscape.com` |
| `develop` | staging | `staging-*.dreamscape.com` |
| `feature/**`, `bugfix/**`, `hotfix/**` | dev | `dev-*.dreamscape.com` |
| Pull requests | dev (preview) | `pr-<num>-*.dreamscape.com` |

### Tags Docker

| Tag | Usage |
|-----|-------|
| `<sha>` | Identifiant immuable, utilisé pour déployer |
| `latest` | Alias mobile — dernière version mergée |
| `<env>-latest` | Dernière version déployée sur un env (`staging-latest`, `prod-latest`) |
| `v<X.Y.Z>` | Release taggée (prod uniquement) |

## Suivre un déploiement

### Interface GitHub Actions

1. Aller sur le repo source → onglet **Actions**.
2. Ouvrir le run en cours (`ci-trigger.yml`).
3. Vérifier le succès du dispatch vers infra.
4. Passer sur `dreamscape-infra` → Actions → `unified-cicd.yml`.
5. Suivre le job en temps réel.

### Statut de déploiement GitHub

Chaque run crée un **GitHub Deployment** visible sur la page du repo → Environments.

- `pending` → build / test en cours
- `in_progress` → rollout Kubernetes en cours
- `success` → déployé, smoke tests OK
- `failure` → échec (voir logs)

### Vérifications post-déploiement

```bash
# Récupérer le contexte K3s (variable selon environnement)
export KUBECONFIG=~/.kube/dreamscape-<env>.yaml

# Vérifier les pods
kubectl get pods -n dreamscape-<env>

# Vérifier un service
kubectl describe deployment <service>-service -n dreamscape-<env>

# Logs temps réel
kubectl logs -f deployment/<service>-service -n dreamscape-<env>

# Health check HTTP
curl -sf https://<env>-<service>.dreamscape.com/health | jq
```

## Trigger manuel d'un déploiement

Pour déployer sans changement de code (redeploy, promotion, test config) :

### Via GitHub UI

1. `dreamscape-infra` → Actions → `unified-cicd.yml` → **Run workflow**.
2. Renseigner les inputs :
   - `source_repo` (ex: `dreamscape-services`)
   - `ref` (branche ou SHA)
   - `component` (ex: `auth` ou `all`)
   - `environment` (`dev` / `staging` / `production`)
3. Lancer.

### Via GitHub CLI

```bash
gh workflow run unified-cicd.yml \
  --repo dreamscape-ai/dreamscape-infra \
  -f source_repo=dreamscape-services \
  -f ref=develop \
  -f component=auth \
  -f environment=staging
```

### Via API (repository_dispatch)

```bash
curl -X POST \
  -H "Authorization: Bearer $GH_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/dreamscape-ai/dreamscape-infra/dispatches \
  -d '{
    "event_type": "services-changed",
    "client_payload": {
      "source_repo": "dreamscape-services",
      "ref": "refs/heads/develop",
      "sha": "HEAD",
      "component": "auth",
      "environment": "staging"
    }
  }'
```

## Promotion entre environnements

### Dev → Staging

Automatique : merge d'une PR dans `develop` → déploiement staging.

### Staging → Production

1. Créer une PR `develop` → `main`.
2. Lister les changements depuis la dernière release dans la description.
3. Obtenir 2 approvals (tech lead + PO).
4. Vérifier les métriques staging sur [Grafana](https://grafana.dreamscape.com).
5. Merger la PR → déploiement production automatique.
6. Tagger la release :
   ```bash
   cd dreamscape-services
   git checkout main && git pull
   git tag -a v1.2.3 -m "Release v1.2.3 — DR-XXX, DR-YYY"
   git push origin v1.2.3
   ```

### Release notes

Générées depuis les Conventional Commits entre deux tags :

```bash
git log v1.2.2..v1.2.3 --pretty=format:"- %s (%an)" --no-merges
```

Publier sur GitHub Releases + Confluence.

## Rollback

### Rollback rapide (dernière version)

```bash
# Via helper script
cd dreamscape-infra
./scripts/rollback.sh <service> <env>

# Ou directement avec kubectl
kubectl rollout undo deployment/<service>-service -n dreamscape-<env>
kubectl rollout status deployment/<service>-service -n dreamscape-<env>
```

### Rollback vers un SHA spécifique

Utiliser le workflow `unified-cicd.yml` en passant un ancien SHA comme `ref`.

```bash
gh workflow run unified-cicd.yml \
  --repo dreamscape-ai/dreamscape-infra \
  -f source_repo=dreamscape-services \
  -f ref=<sha-stable> \
  -f component=<service> \
  -f environment=production
```

### Rollback d'urgence (tous services)

```bash
cd dreamscape-infra
EMERGENCY=true ./scripts/rollback.sh all production
```

Ce script :
- Stoppe les déploiements en cours.
- Restaure le dernier `ReplicaSet` healthy de chaque service.
- Envoie une alerte Slack `#incidents`.

### Rollback de base de données

Prisma ne fournit pas de `down` migration automatique. Procédure :

1. Identifier la migration fautive dans `dreamscape-services/db/prisma/migrations/`.
2. Écrire une migration inverse manuelle ou restaurer depuis backup :
   ```bash
   # Backup automatique quotidien sur OCI
   oci db autonomous-database restore --autonomous-database-id <ocid> \
     --timestamp 2026-04-17T08:00:00Z
   ```
3. Redéployer les services avec le client Prisma correspondant.

**Règle** : toute migration déployée en prod DOIT être précédée d'un backup manuel confirmé.

## Gestion des secrets

### Hiérarchie

1. **GitHub Secrets** — secrets CI/CD (tokens GHCR, OCI, Kubeconfig).
2. **Kubernetes Secrets** — secrets runtime injectés dans les pods.
3. **OCI Vault** — source de vérité pour les secrets production.

### Rotation

| Secret | Fréquence | Responsable |
|--------|-----------|-------------|
| `JWT_SECRET` | 90 jours | DevOps |
| API keys externes (Amadeus, OpenAI, Stripe) | Sur rotation fournisseur | Équipe service |
| DB passwords | 180 jours | DevOps |
| `GHCR_TOKEN` | 1 an | DevOps |

### Procédure d'ajout d'un secret

1. Ajouter à l'OCI Vault.
2. Référencer dans le manifest Kubernetes (`secretKeyRef`).
3. Mettre à jour le template `secrets/<env>/secrets.template.yaml`.
4. Documenter dans [environment-configuration.md](../getting-started/environment-configuration.md).
5. **Ne jamais** committer la valeur réelle.

## Monitoring du pipeline

### Métriques suivies

- **Durée de build** par service (cible : < 5 min).
- **Durée de déploiement** par environnement (cible : < 3 min).
- **Taux de succès** des runs CI (cible : > 95%).
- **MTTR** (Mean Time To Recovery) après incident (cible : < 30 min).
- **Fréquence de déploiement** (DORA metric).

### Alertes

- Échec 2 déploiements consécutifs sur un service → Slack `#ci-cd`.
- Durée de build > 10 min → Slack `#ci-cd`.
- Échec d'un rollback → PagerDuty (oncall DevOps).

### Dashboards

- [Grafana — CI/CD overview](https://grafana.dreamscape.com/d/cicd)
- [GitHub Actions usage](https://github.com/dreamscape-ai/dreamscape-infra/actions)

## Tests automatisés dans le pipeline

### Gates de qualité

Un déploiement **ne passe pas** si :

- Tests unitaires en échec.
- Couverture < 70% (branches, fonctions, lignes, statements).
- Lint en erreur.
- Scan Trivy remonte une vulnérabilité `CRITICAL` ou `HIGH`.
- `npm audit` remonte une CVE `critical`.
- Smoke tests post-déploiement en échec (health endpoints).

### Tests E2E post-déploiement

Après un déploiement en staging, le workflow `dreamscape-tests/.github/workflows/e2e.yml` est déclenché automatiquement :

```bash
# Cypress E2E sur staging
npm run test:e2e:voyage -- --env API_BASE_URL=https://staging-api.dreamscape.com
npm run test:e2e:web    -- --env API_BASE_URL=https://staging-api.dreamscape.com
npm run test:e2e:cart   -- --env API_BASE_URL=https://staging-api.dreamscape.com
```

Un échec bloque la promotion vers `main`.

## Cas particuliers

### Déploiement coordonné multi-repos

Quand une feature touche `services` **et** `frontend` :

1. Merger `services` en premier sur `develop` → déploie staging-api.
2. Attendre le succès du déploiement et des smoke tests.
3. Merger `frontend` sur `develop` → déploie staging-web.
4. Lancer les E2E `dreamscape-tests` sur staging.
5. Si tout est vert, promotion simultanée `main` pour les deux repos.

### Migration de base de données

1. Merger le PR contenant la migration sur `develop`.
2. Le déploiement staging applique automatiquement via `prisma migrate deploy` en init container.
3. Vérifier en staging : `kubectl logs <pod> -c prisma-migrate`.
4. **En production** : la migration est appliquée au démarrage du service. Pour les migrations coûteuses (reindex, alter sur grosses tables), passer en mode manuel :
   - Commenter l'init container Prisma temporairement.
   - Appliquer la migration manuellement hors pic de trafic.
   - Réactiver l'init container.

### Hotfix en production

```
1. Créer hotfix/DR-XXX à partir de main
2. Corriger + tester localement
3. PR vers main (label `hotfix`, fast-track review)
4. Merge → déploiement auto production
5. Vérifier métriques Grafana 15 min
6. Rétroporter sur develop (merge --no-ff)
```

## Troubleshooting

### Le dispatch ne déclenche pas le workflow central

**Causes fréquentes** :
- Token GitHub sans permission `repo` sur `dreamscape-infra`.
- Payload mal formé (vérifier `event_type` exact).
- Branche `develop` désactivée pour les workflows.

**Vérification** :
```bash
gh run list --repo dreamscape-ai/dreamscape-infra --workflow unified-cicd.yml --limit 5
```

### Build Docker échoue sur GHCR push

```
denied: permission_denied: write_package
```

→ Vérifier que le `GHCR_TOKEN` secret est à jour et a le scope `write:packages`.

### Rollout bloqué (`0/3 replicas updated`)

```bash
kubectl describe pod <pod> -n dreamscape-<env>
# Chercher "Events" en bas
```

Causes fréquentes :
- Image non disponible (push GHCR incomplet).
- Secret manquant référencé.
- Resource limits trop bas (OOMKilled).
- Readiness probe qui échoue (DB pas prête).

### Smoke test échoue mais rollout OK

Le pod démarre mais `/health` retourne 503 — généralement une dépendance (DB, Redis, Kafka) non atteignable.

```bash
kubectl exec -it deployment/<service>-service -n dreamscape-<env> -- \
  curl -sv postgres-service:5432
```

## Checklist avant un déploiement production

- [ ] Tous les checks CI verts sur `develop`
- [ ] Staging stable depuis au moins 24h
- [ ] E2E staging au vert
- [ ] Monitoring Grafana staging sans alerte
- [ ] Release notes rédigées
- [ ] Backup DB de production vérifié (< 24h)
- [ ] Créneau de déploiement communiqué (Slack `#releases`)
- [ ] Oncall DevOps notifié
- [ ] Plan de rollback validé
