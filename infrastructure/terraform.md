# Terraform — Infrastructure as Code

DreamScape utilise Terraform pour provisionner l'infrastructure cloud.

## Structure

```
dreamscape-infra/terraform/
├── modules/
│   ├── k3s-cluster/       # Cluster Kubernetes k3s
│   ├── database/          # PostgreSQL managé
│   ├── redis/             # Redis managé
│   ├── networking/        # VPC, subnets, security groups
│   └── storage/           # Object storage (images panoramiques)
├── environments/
│   ├── staging/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── terraform.tfvars
│   └── production/
│       ├── main.tf
│       ├── variables.tf
│       └── terraform.tfvars
└── backend.tf             # Remote state (S3/GCS)
```

## Commandes

```bash
cd dreamscape-infra/terraform/environments/staging

# Initialiser (télécharger providers)
terraform init

# Planifier les changements
terraform plan

# Appliquer
terraform apply

# Détruire (⚠️ irréversible en production)
terraform destroy
```

## State

L'état Terraform est stocké dans un backend distant (S3 ou GCS) pour permettre la collaboration et éviter les conflits.

```hcl
# backend.tf
terraform {
  backend "s3" {
    bucket = "dreamscape-terraform-state"
    key    = "staging/terraform.tfstate"
    region = "eu-west-3"
  }
}
```

## Variables importantes

| Variable | Description |
|----------|-------------|
| `environment` | `staging` \| `production` |
| `region` | Région cloud |
| `k3s_node_count` | Nombre de nœuds K8s |
| `db_instance_type` | Taille de l'instance PostgreSQL |
| `domain_name` | Domaine de l'application |
