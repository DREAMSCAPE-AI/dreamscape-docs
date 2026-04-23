# Kubernetes (k3s)

DreamScape utilise **k3s** (distribution légère certifiée CNCF) pour l'orchestration en staging et production. L'architecture **Big Pods** consolide les 6 microservices en 3 deployments (Core, Business, Experience) pour réduire la latence inter-services et l'empreinte mémoire.

---

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                       Cluster k3s                                │
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │   Core Pod     │  │  Business Pod  │  │ Experience Pod │    │
│  │  (auth+user)   │  │ (pay+voy+ai)   │  │  (gw+web+vr)   │    │
│  │   3 replicas   │  │   3 replicas   │  │   2 replicas   │    │
│  └────────────────┘  └────────────────┘  └────────────────┘    │
│         ↓                    ↓                    ↓              │
│  ┌──────────────────────────────────────────────────────┐       │
│  │         PostgreSQL (StatefulSet) + Redis             │       │
│  └──────────────────────────────────────────────────────┘       │
│                                                                  │
│  Ingress NGINX → cert-manager (Let's Encrypt) → External-DNS    │
└─────────────────────────────────────────────────────────────────┘
```

**Namespaces** :
- `dreamscape-dev` (overlay dev)
- `dreamscape-staging` (overlay staging)
- `dreamscape-production` (overlay production)
- `monitoring` (Prometheus, Grafana, Alertmanager)
- `ingress-nginx`, `cert-manager` (système)

---

## Structure des manifestes (Kustomize)

```
dreamscape-infra/k8s/
├── base/                          # Configurations partagées
│   ├── core-pod/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── configmap.yaml
│   │   ├── hpa.yaml               # HorizontalPodAutoscaler
│   │   └── pdb.yaml               # PodDisruptionBudget
│   ├── business-pod/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── configmap.yaml
│   │   └── hpa.yaml
│   ├── experience-pod/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── configmap.yaml
│   │   └── ingress.yaml
│   ├── postgres/
│   │   ├── statefulset.yaml
│   │   ├── service.yaml
│   │   └── pvc.yaml
│   ├── redis/
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   ├── kafka/
│   │   └── kustomization.yaml     # Strimzi operator
│   └── kustomization.yaml
│
├── overlays/                      # Per-environment patches
│   ├── dev/
│   │   ├── kustomization.yaml
│   │   └── patches/
│   │       ├── replicas.yaml      # 1 replica
│   │       └── resources.yaml     # CPU/RAM réduits
│   ├── staging/
│   │   ├── kustomization.yaml
│   │   └── patches/
│   │       ├── replicas.yaml      # 2 replicas
│   │       ├── ingress.yaml       # staging.dreamscape.app
│   │       └── secrets.yaml
│   └── production/
│       ├── kustomization.yaml
│       └── patches/
│           ├── replicas.yaml      # 3+ replicas
│           ├── ingress.yaml       # dreamscape.app
│           ├── resources.yaml     # CPU/RAM majorés
│           └── pdb.yaml           # disruption budgets
│
├── bigpods-production-bootstrap.yaml
├── bigpods-staging-bootstrap.yaml
└── README.md
```

---

## Déploiement

### Bootstrap initial (premier déploiement)

```bash
# 1. Configurer kubectl avec le kubeconfig du cluster
export KUBECONFIG=~/.kube/dreamscape-prod.yaml

# 2. Créer les namespaces et installer les opérateurs
kubectl apply -f dreamscape-infra/k8s/bigpods-production-bootstrap.yaml

# 3. Créer les secrets (voir plus bas)
./dreamscape-infra/k8s/scripts/create-secrets.sh production

# 4. Déployer l'application
kubectl apply -k dreamscape-infra/k8s/overlays/production/
```

### Déploiement courant (kustomize)

```bash
# Dev
kubectl apply -k dreamscape-infra/k8s/overlays/dev/

# Staging
kubectl apply -k dreamscape-infra/k8s/overlays/staging/

# Production (via CI/CD uniquement, pas en local)
kubectl apply -k dreamscape-infra/k8s/overlays/production/
```

### Aperçu sans appliquer

```bash
# Voir le YAML généré (utile en review PR)
kubectl kustomize dreamscape-infra/k8s/overlays/staging/

# Diff entre le cluster et le manifest
kubectl diff -k dreamscape-infra/k8s/overlays/staging/
```

---

## Exemples de manifestes

### Deployment (Core Pod)

`base/core-pod/deployment.yaml` :
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: core-pod
  labels: { app: core-pod, tier: backend }
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate: { maxSurge: 1, maxUnavailable: 0 }
  selector:
    matchLabels: { app: core-pod }
  template:
    metadata:
      labels: { app: core-pod, tier: backend }
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "9090"
    spec:
      containers:
        - name: core-pod
          image: ghcr.io/dreamscape-ai/core-pod:latest
          ports:
            - { name: auth, containerPort: 3001 }
            - { name: user, containerPort: 3002 }
            - { name: nginx, containerPort: 80 }
          envFrom:
            - secretRef: { name: dreamscape-secrets }
            - configMapRef: { name: core-pod-config }
          resources:
            requests: { cpu: 200m,  memory: 256Mi }
            limits:   { cpu: 1000m, memory: 1Gi }
          livenessProbe:
            httpGet: { path: /health, port: nginx }
            initialDelaySeconds: 30
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet: { path: /health, port: nginx }
            initialDelaySeconds: 10
            periodSeconds: 5
            failureThreshold: 2
          startupProbe:
            httpGet: { path: /health, port: nginx }
            failureThreshold: 30
            periodSeconds: 5
          securityContext:
            runAsNonRoot: true
            runAsUser: 1001
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: false
            capabilities: { drop: [ALL] }
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels: { app: core-pod }
                topologyKey: kubernetes.io/hostname
```

### Service

`base/core-pod/service.yaml` :
```yaml
apiVersion: v1
kind: Service
metadata:
  name: core-pod
spec:
  type: ClusterIP
  selector: { app: core-pod }
  ports:
    - { name: http, port: 80, targetPort: nginx }
```

### Ingress (Experience Pod)

`base/experience-pod/ingress.yaml` :
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: dreamscape-ingress
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/proxy-body-size: 10m
    nginx.ingress.kubernetes.io/enable-cors: "true"
spec:
  ingressClassName: nginx
  tls:
    - hosts: [dreamscape.app, api.dreamscape.app]
      secretName: dreamscape-tls
  rules:
    - host: dreamscape.app
      http:
        paths:
          - { path: /,        pathType: Prefix, backend: { service: { name: experience-pod, port: { number: 80 }}}}
    - host: api.dreamscape.app
      http:
        paths:
          - { path: /api/v1/auth,    pathType: Prefix, backend: { service: { name: core-pod,       port: { number: 80 }}}}
          - { path: /api/v1/users,   pathType: Prefix, backend: { service: { name: core-pod,       port: { number: 80 }}}}
          - { path: /api/v1/voyage,  pathType: Prefix, backend: { service: { name: business-pod,   port: { number: 80 }}}}
          - { path: /api/v1/payment, pathType: Prefix, backend: { service: { name: business-pod,   port: { number: 80 }}}}
          - { path: /api/v1/ai,      pathType: Prefix, backend: { service: { name: business-pod,   port: { number: 80 }}}}
          - { path: /api/v1/vr,      pathType: Prefix, backend: { service: { name: experience-pod, port: { number: 80 }}}}
```

### HorizontalPodAutoscaler

`base/business-pod/hpa.yaml` :
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: business-pod
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: business-pod
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource: { name: cpu,    target: { type: Utilization, averageUtilization: 70 }}
    - type: Resource
      resource: { name: memory, target: { type: Utilization, averageUtilization: 80 }}
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
    scaleUp:
      stabilizationWindowSeconds: 60
```

### PodDisruptionBudget

`base/core-pod/pdb.yaml` :
```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: core-pod
spec:
  minAvailable: 1
  selector:
    matchLabels: { app: core-pod }
```

### Overlay production

`overlays/production/kustomization.yaml` :
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: dreamscape-production

resources:
  - ../../base

images:
  - { name: ghcr.io/dreamscape-ai/core-pod,       newTag: v1.4.2 }
  - { name: ghcr.io/dreamscape-ai/business-pod,   newTag: v1.4.2 }
  - { name: ghcr.io/dreamscape-ai/experience-pod, newTag: v1.4.2 }

patches:
  - { path: patches/replicas.yaml }
  - { path: patches/resources.yaml }
  - { path: patches/ingress.yaml }

configMapGenerator:
  - name: core-pod-config
    behavior: merge
    literals:
      - NODE_ENV=production
      - LOG_LEVEL=info
```

---

## Secrets

Les secrets sensibles ne sont **jamais** dans Git. Trois stratégies disponibles :

### Option A — Création manuelle (bootstrap)

```bash
kubectl create secret generic dreamscape-secrets \
  --from-literal=JWT_SECRET="$(openssl rand -base64 64)" \
  --from-literal=DATABASE_URL="postgresql://dreamscape:***@db:5432/dreamscape" \
  --from-literal=REDIS_URL="redis://:***@redis:6379" \
  --from-literal=STRIPE_SECRET_KEY="sk_live_***" \
  --from-literal=STRIPE_WEBHOOK_SECRET="whsec_***" \
  --from-literal=AMADEUS_API_KEY="***" \
  --from-literal=AMADEUS_API_SECRET="***" \
  --from-literal=OPENAI_API_KEY="sk-***" \
  --namespace=dreamscape-production
```

### Option B — Sealed Secrets (GitOps)

```bash
# Encoder un secret pour le commiter dans Git
echo -n "ma-valeur" | kubectl create secret generic mysecret \
  --dry-run=client --from-file=key=/dev/stdin -o yaml | \
  kubeseal -o yaml > sealed-secret.yaml

git add sealed-secret.yaml && git commit
```

### Option C — External Secrets Operator + Vault / AWS Secrets Manager

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata: { name: dreamscape-secrets }
spec:
  refreshInterval: 1h
  secretStoreRef: { name: aws-secretsmanager, kind: ClusterSecretStore }
  target: { name: dreamscape-secrets, creationPolicy: Owner }
  data:
    - { secretKey: JWT_SECRET,        remoteRef: { key: dreamscape/prod/jwt_secret }}
    - { secretKey: DATABASE_URL,      remoteRef: { key: dreamscape/prod/database_url }}
    - { secretKey: STRIPE_SECRET_KEY, remoteRef: { key: dreamscape/prod/stripe_secret }}
```

---

## Images Docker

Publiées sur GitHub Container Registry (GHCR) via le pipeline CI/CD :

```
ghcr.io/dreamscape-ai/core-pod:<tag>
ghcr.io/dreamscape-ai/business-pod:<tag>
ghcr.io/dreamscape-ai/experience-pod:<tag>
```

**Tags disponibles** :
| Tag         | Source                               |
|-------------|--------------------------------------|
| `latest`    | Dernière build de la branche `main`  |
| `main`      | Identique à `latest`                 |
| `staging`   | Dernière build de la branche `develop` |
| `<git-sha>` | Build immuable par commit (recommandé en prod) |
| `v1.4.2`    | Tag git semver                        |

> **Bonne pratique** : en production, utiliser `<git-sha>` ou `vX.Y.Z` (jamais `latest`) pour garantir l'immutabilité.

**Pull secret** (si registry privé) :
```bash
kubectl create secret docker-registry ghcr-pull \
  --docker-server=ghcr.io \
  --docker-username=USER \
  --docker-password=$GHCR_TOKEN \
  --namespace=dreamscape-production
```

---

## Health checks

Chaque pod expose `/health` pour les probes Kubernetes :

| Probe        | Rôle                                            | Tolérance       |
|--------------|-------------------------------------------------|-----------------|
| `startupProbe`   | Détecte le démarrage initial (apps lentes)   | 150s max        |
| `livenessProbe`  | Redémarre si le process est freezé           | 3 échecs / 30s  |
| `readinessProbe` | Sort du load balancer si pas prêt            | 2 échecs / 10s  |

Format de réponse `/health` :
```json
{
  "status": "healthy",
  "uptime": 12345.67,
  "database": "connected",
  "cache": "connected",
  "memory": { "used": "150MB", "total": "1GB" }
}
```

---

## Commandes utiles

```bash
# ─── État ──────────────────────────────────────────
kubectl get pods,svc,ingress -n dreamscape-production
kubectl get hpa -n dreamscape-production
kubectl describe pod <pod-name> -n dreamscape-production
kubectl top pods -n dreamscape-production

# ─── Logs ──────────────────────────────────────────
kubectl logs -f deployment/core-pod -n dreamscape-production
kubectl logs -f deployment/core-pod -c core-pod --tail=200
kubectl logs -f -l app=business-pod --max-log-requests=10  # tous les pods

# ─── Debug ─────────────────────────────────────────
kubectl exec -it deployment/core-pod -n dreamscape-production -- sh
kubectl port-forward svc/core-pod 3001:80 -n dreamscape-production

# ─── Déploiement ───────────────────────────────────
kubectl rollout status deployment/core-pod -n dreamscape-production
kubectl rollout restart deployment/core-pod -n dreamscape-production
kubectl rollout undo deployment/core-pod -n dreamscape-production
kubectl rollout history deployment/core-pod -n dreamscape-production

# ─── Scaling ───────────────────────────────────────
kubectl scale deployment/core-pod --replicas=5 -n dreamscape-production
kubectl autoscale deployment/business-pod --min=2 --max=10 --cpu-percent=70

# ─── Secrets / Config ──────────────────────────────
kubectl get secrets -n dreamscape-production
kubectl get cm core-pod-config -o yaml -n dreamscape-production
kubectl edit secret dreamscape-secrets -n dreamscape-production

# ─── Cluster ───────────────────────────────────────
kubectl get nodes -o wide
kubectl describe node <node-name>
kubectl drain <node-name> --ignore-daemonsets  # Maintenance d'un nœud
```

---

## Stratégie de déploiement

| Stratégie       | Quand                                         | Configuration                                |
|-----------------|-----------------------------------------------|----------------------------------------------|
| **Rolling**     | Défaut. Compatible avec changements mineurs   | `maxSurge: 1, maxUnavailable: 0`             |
| **Blue/Green**  | Migrations DB, changements breaking           | Deux deployments + bascule via Service       |
| **Canary**      | Nouvelles features risquées                   | Argo Rollouts + analyse Prometheus           |

Exemple Argo Rollout (canary) :
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
spec:
  strategy:
    canary:
      steps:
        - setWeight: 10
        - pause: { duration: 5m }
        - analysis:
            templates: [{ templateName: success-rate }]
        - setWeight: 50
        - pause: { duration: 10m }
        - setWeight: 100
```

---

## Monitoring intégré

Les pods exposent les métriques Prometheus sur `/metrics:9090`. Voir [`monitoring.md`](monitoring.md) pour le détail des dashboards.

Annotations standard :
```yaml
prometheus.io/scrape: "true"
prometheus.io/port:   "9090"
prometheus.io/path:   "/metrics"
```

---

## Sécurité

- **NetworkPolicies** : trafic inter-namespaces refusé par défaut, ouvertures explicites
- **PodSecurityStandards** : niveau `restricted` sur tous les namespaces applicatifs
- **RBAC** : un ServiceAccount par pod avec permissions minimales
- **Image scanning** : Trivy en CI, blocage des images avec CVE Critical
- **Secrets at rest** : chiffrement etcd activé sur le cluster

Voir [`security/`](../security/README.md) pour les analyses détaillées.

---

## Liens utiles

- [Documentation k3s](https://docs.k3s.io/)
- [Kustomize reference](https://kubectl.docs.kubernetes.io/references/kustomize/)
- [cert-manager](https://cert-manager.io/docs/)
- [Strimzi Kafka Operator](https://strimzi.io/)
- [Argo Rollouts](https://argoproj.github.io/argo-rollouts/)
