# Terraform — Infrastructure as Code

DreamScape utilise **Terraform >= 1.6** pour provisionner l'infrastructure cloud (cluster k3s, base de données managée, Redis, networking, stockage objet) de manière reproductible et auditable.

---

## Structure du dépôt

```
dreamscape-infra/terraform/
├── modules/
│   ├── k3s-cluster/         # Cluster Kubernetes k3s (control plane + workers)
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── README.md
│   ├── database/            # PostgreSQL managé (RDS / Cloud SQL)
│   ├── redis/               # Redis managé (ElastiCache / Memorystore)
│   ├── networking/          # VPC, subnets, security groups, NAT gateway
│   ├── storage/             # Object storage (panoramas VR, exports RGPD)
│   ├── kafka/               # Cluster Kafka managé (MSK / Confluent Cloud)
│   ├── monitoring/          # Prometheus + Grafana + Alertmanager
│   └── dns/                 # Zone DNS, certificats ACME
├── environments/
│   ├── dev/
│   │   ├── main.tf          # Compose les modules
│   │   ├── variables.tf
│   │   ├── terraform.tfvars # ⚠️ gitignore, valeurs spécifiques à l'env
│   │   └── backend.tf
│   ├── staging/
│   └── production/
├── shared/
│   └── locals.tf            # Tags, naming conventions
└── README.md
```

---

## Pré-requis

| Outil       | Version       | Installation                         |
|-------------|---------------|--------------------------------------|
| Terraform   | >= 1.6        | `tfenv install 1.6.6`                |
| Cloud CLI   | provider-spec | `aws-cli` / `gcloud` / `scw`         |
| `kubectl`   | >= 1.28       | Pour valider le cluster post-deploy  |
| `tflint`    | dernier       | `brew install tflint` — linter HCL   |
| `tfsec`     | dernier       | Audit de sécurité IaC                |

Authentification cloud :
```bash
# AWS
aws sso login --profile dreamscape-prod
export AWS_PROFILE=dreamscape-prod

# GCP
gcloud auth application-default login

# Scaleway (optionnel)
scw init
```

---

## Workflow standard

```bash
cd dreamscape-infra/terraform/environments/staging

# 1. Initialisation (télécharge providers, configure backend)
terraform init

# 2. Formatage et validation
terraform fmt -recursive
terraform validate

# 3. Lint et audit sécurité
tflint --recursive
tfsec .

# 4. Planifier les changements
terraform plan -out=tfplan

# 5. Appliquer
terraform apply tfplan

# 6. Vérifier l'état
terraform state list
terraform output
```

> ⚠️ **Production** : tout `apply` doit passer par une PR review + pipeline CI (`.github/workflows/terraform-apply.yml`).

---

## Backend distant (state)

L'état Terraform est stocké dans un backend distant chiffré pour permettre la collaboration et le verrouillage concurrentiel.

```hcl
# environments/staging/backend.tf
terraform {
  required_version = ">= 1.6"

  required_providers {
    aws        = { source = "hashicorp/aws",        version = "~> 5.0" }
    kubernetes = { source = "hashicorp/kubernetes", version = "~> 2.25" }
    helm       = { source = "hashicorp/helm",       version = "~> 2.12" }
  }

  backend "s3" {
    bucket         = "dreamscape-terraform-state"
    key            = "staging/terraform.tfstate"
    region         = "eu-west-3"
    encrypt        = true
    dynamodb_table = "dreamscape-terraform-locks"  # state locking
  }
}
```

**Bootstrap du backend** (une seule fois par compte cloud) :
```bash
cd dreamscape-infra/terraform/bootstrap
terraform init
terraform apply  # Crée bucket S3 + table DynamoDB de lock
```

---

## Variables principales

| Variable             | Type     | Exemple              | Description                           |
|----------------------|----------|----------------------|---------------------------------------|
| `environment`        | string   | `staging`            | `dev` \| `staging` \| `production`    |
| `region`             | string   | `eu-west-3`          | Région cloud principale               |
| `k3s_node_count`     | number   | `3`                  | Nombre de nœuds workers k3s           |
| `k3s_node_type`      | string   | `t3.large`           | Taille des instances workers          |
| `db_instance_type`   | string   | `db.t4g.medium`      | Taille de l'instance PostgreSQL       |
| `db_storage_gb`      | number   | `50`                 | Stockage initial PostgreSQL           |
| `db_backup_days`     | number   | `7`                  | Rétention des backups automatiques    |
| `redis_node_type`    | string   | `cache.t4g.small`    | Taille de l'instance Redis            |
| `domain_name`        | string   | `dreamscape.app`     | Domaine principal                     |
| `enable_monitoring`  | bool     | `true`               | Déployer Prometheus + Grafana         |
| `tags`               | map      | `{ env = "staging" }`| Tags appliqués à toutes les ressources|

---

## Exemple : module `k3s-cluster`

`modules/k3s-cluster/main.tf` :
```hcl
variable "node_count"   { type = number }
variable "node_type"    { type = string }
variable "subnet_ids"   { type = list(string) }
variable "tags"         { type = map(string) }

resource "aws_instance" "control_plane" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.node_type
  subnet_id              = var.subnet_ids[0]
  vpc_security_group_ids = [aws_security_group.k3s.id]

  user_data = templatefile("${path.module}/cloud-init/control-plane.yaml", {
    k3s_token = random_password.k3s_token.result
  })

  tags = merge(var.tags, { Name = "k3s-control-plane", Role = "control-plane" })
}

resource "aws_instance" "workers" {
  count = var.node_count

  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.node_type
  subnet_id              = element(var.subnet_ids, count.index)
  vpc_security_group_ids = [aws_security_group.k3s.id]

  user_data = templatefile("${path.module}/cloud-init/worker.yaml", {
    server_url = "https://${aws_instance.control_plane.private_ip}:6443"
    k3s_token  = random_password.k3s_token.result
  })

  tags = merge(var.tags, { Name = "k3s-worker-${count.index}", Role = "worker" })
}

output "kubeconfig" {
  value     = data.external.kubeconfig.result.kubeconfig
  sensitive = true
}
```

---

## Composition d'un environnement

`environments/staging/main.tf` :
```hcl
module "networking" {
  source             = "../../modules/networking"
  environment        = var.environment
  vpc_cidr           = "10.20.0.0/16"
  availability_zones = ["eu-west-3a", "eu-west-3b", "eu-west-3c"]
  tags               = local.tags
}

module "k3s" {
  source     = "../../modules/k3s-cluster"
  node_count = var.k3s_node_count
  node_type  = var.k3s_node_type
  subnet_ids = module.networking.private_subnet_ids
  tags       = local.tags
}

module "database" {
  source        = "../../modules/database"
  instance_type = var.db_instance_type
  storage_gb    = var.db_storage_gb
  backup_days   = var.db_backup_days
  subnet_ids    = module.networking.private_subnet_ids
  vpc_id        = module.networking.vpc_id
  tags          = local.tags
}

module "redis" {
  source     = "../../modules/redis"
  node_type  = var.redis_node_type
  subnet_ids = module.networking.private_subnet_ids
  vpc_id     = module.networking.vpc_id
  tags       = local.tags
}

module "storage" {
  source      = "../../modules/storage"
  bucket_name = "dreamscape-${var.environment}-assets"
  tags        = local.tags
}

# Outputs consommés par K8s manifests / CI/CD
output "database_url"   { value = module.database.connection_string  sensitive = true }
output "redis_endpoint" { value = module.redis.endpoint }
output "kubeconfig"     { value = module.k3s.kubeconfig             sensitive = true }
output "assets_bucket"  { value = module.storage.bucket_name }
```

---

## Workflow CI/CD Terraform

`.github/workflows/terraform-apply.yml` :
```yaml
name: Terraform Apply
on:
  push:
    branches: [main]
    paths: ['terraform/**']
  pull_request:
    paths: ['terraform/**']

jobs:
  terraform:
    runs-on: ubuntu-latest
    permissions:
      id-token: write   # OIDC vers AWS
      contents: read
      pull-requests: write
    strategy:
      matrix:
        env: [dev, staging, production]
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
        with: { terraform_version: 1.6.6 }
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::ACCOUNT_ID:role/dreamscape-terraform
          aws-region: eu-west-3
      - run: terraform init
        working-directory: terraform/environments/${{ matrix.env }}
      - run: terraform plan -no-color
        working-directory: terraform/environments/${{ matrix.env }}
      - if: github.event_name == 'push' && matrix.env != 'production'
        run: terraform apply -auto-approve
        working-directory: terraform/environments/${{ matrix.env }}
      - if: github.event_name == 'push' && matrix.env == 'production'
        run: echo "⚠️ Production apply manuel uniquement"
```

> Production : exiger l'environment protection rule sur GitHub avec reviewers requis.

---

## Bonnes pratiques

1. **Modules versionnés** : tag git semver sur les modules (`v1.2.0`) pour éviter les régressions silencieuses.
2. **Variables sensibles** : jamais en clair dans `terraform.tfvars` versionné — utiliser `terraform.tfvars.local` (gitignored) ou variables d'environnement `TF_VAR_*`.
3. **State locking** : toujours configurer DynamoDB / GCS object lock pour éviter les writes concurrents.
4. **Drift detection** : `terraform plan` quotidien en CI pour détecter les changements manuels via console cloud.
5. **Cost estimation** : intégrer [Infracost](https://www.infracost.io/) dans la CI pour afficher le coût mensuel estimé sur chaque PR.
6. **Destroy en production** : interdire via policy IAM ; nécessite passage manuel en mode "break-glass".

---

## Commandes de dépannage

```bash
# Voir l'état actuel
terraform state list
terraform state show module.database.aws_db_instance.main

# Importer une ressource créée hors Terraform
terraform import module.database.aws_db_instance.main mydb-instance-1

# Marquer une ressource pour recréation
terraform taint module.k3s.aws_instance.workers[0]

# Appliquer ciblé (à éviter, mais utile en debug)
terraform apply -target=module.redis

# Décrocher un lock bloqué
terraform force-unlock <LOCK_ID>

# Migrer le backend (changement de bucket)
terraform init -migrate-state
```

---

## Liens utiles

- [Documentation Terraform](https://developer.hashicorp.com/terraform/docs)
- [Provider AWS](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [tfsec rules](https://aquasecurity.github.io/tfsec/)
- [k3s installation](https://docs.k3s.io/)
