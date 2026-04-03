# Kubernetes (k3s)

DreamScape utilise **k3s** (distribution légère de Kubernetes) pour l'orchestration en production et staging.

## Structure des manifestes

```
dreamscape-infra/k8s/
├── base/                          # Configurations de base (kustomize)
│   ├── core-pod/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   └── configmap.yaml
│   ├── business-pod/
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   ├── experience-pod/
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   └── kustomization.yaml
│
└── overlays/                      # Configurations par environnement
    ├── dev/
    │   └── kustomization.yaml
    ├── staging/
    │   ├── kustomization.yaml
    │   └── patches/
    └── production/
        ├── kustomization.yaml
        └── patches/
```

## Bootstrap de production

```bash
# Déploiement initial k3s
kubectl apply -f dreamscape-infra/k8s/bigpods-production-bootstrap.yaml

# Déploiement staging
kubectl apply -f dreamscape-infra/k8s/bigpods-staging-bootstrap.yaml
```

## Déploiement par environnement (kustomize)

```bash
# Dev
kubectl apply -k dreamscape-infra/k8s/overlays/dev/

# Staging
kubectl apply -k dreamscape-infra/k8s/overlays/staging/

# Production
kubectl apply -k dreamscape-infra/k8s/overlays/production/
```

## Configuration des secrets

Les secrets Kubernetes sont injectés via des variables d'environnement dans les pods :

```bash
# Créer les secrets (une fois, par environnement)
kubectl create secret generic dreamscape-secrets \
  --from-literal=JWT_SECRET="..." \
  --from-literal=DATABASE_URL="..." \
  --from-literal=STRIPE_SECRET_KEY="..." \
  --from-literal=AMADEUS_API_KEY="..." \
  --namespace=dreamscape-production
```

Les Deployments référencent ces secrets via `envFrom`:
```yaml
envFrom:
  - secretRef:
      name: dreamscape-secrets
```

## Images Docker

Les images sont publiées sur GitHub Container Registry (GHCR) :

```
ghcr.io/dreamscape-ai/core-pod:latest
ghcr.io/dreamscape-ai/business-pod:latest
ghcr.io/dreamscape-ai/experience-pod:latest
```

Tags disponibles : `latest`, `main`, `staging`, `<git-sha>`

## Health Checks K8s

Chaque pod expose `/health` pour les probes Kubernetes :

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3001
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health
    port: 3001
  initialDelaySeconds: 10
  periodSeconds: 5
```

## Commandes utiles

```bash
# Statut des pods
kubectl get pods -n dreamscape-production

# Logs d'un pod
kubectl logs -f deployment/core-pod -n dreamscape-production

# Redémarrer un déploiement (rolling update)
kubectl rollout restart deployment/core-pod -n dreamscape-production

# Vérifier un déploiement
kubectl rollout status deployment/business-pod -n dreamscape-production

# Scale horizontal
kubectl scale deployment/core-pod --replicas=3 -n dreamscape-production
```
