# DreamScape CI/CD Setup Guide

## Overview

This repository contains the complete CI/CD infrastructure for the DreamScape platform - an innovative travel platform combining contextual AI and 360° panoramic experiences.

## Architecture

- **Cloud Provider**: Oracle Cloud Infrastructure (OCI)
- **Container Orchestration**: K3s (lightweight Kubernetes)
- **CI/CD**: GitHub Actions
- **Infrastructure as Code**: Terraform
- **Monitoring**: Prometheus + Grafana
- **Service Mesh**: Native K3s networking with NetworkPolicies

## Prerequisites

Before setting up the infrastructure, ensure you have:

1. **OCI Account** with appropriate permissions
2. **GitHub Repository** with Actions enabled
3. **Local Tools**:
   - Docker
   - kubectl
   - Terraform (>= 1.0)
   - Helm (>= 3.0)
   - OCI CLI
   - Kustomize

## Quick Start

### 1. Environment Setup

```bash
# Clone the repository
git clone https://github.com/dreamscape/dreamscape-cicd.git
cd dreamscape-cicd

# Setup development environment
./scripts/setup-env.sh dev
```

### 2. Configure Secrets

```bash
# Copy secrets template
cp secrets/dev/secrets.template.yaml secrets/dev/secrets.yaml

# Fill in actual values (DO NOT commit this file)
vim secrets/dev/secrets.yaml
```

### 3. Deploy Infrastructure

```bash
# Navigate to Terraform directory
cd terraform/environments/dev

# Initialize and apply
terraform init
terraform plan
terraform apply
```

### 4. Deploy Applications

```bash
# Deploy all services to development
./scripts/deploy.sh all dev

# Or deploy specific service
./scripts/deploy.sh gateway dev
```

## Repository Structure

```
dreamscape-cicd/
├── .github/workflows/        # GitHub Actions workflows
│   ├── auth.yml             # Auth service CI/CD
│   ├── gateway.yml          # Gateway service CI/CD
│   ├── user.yml             # User service CI/CD
│   └── voyage.yml           # Voyage service CI/CD
├── terraform/               # Infrastructure as Code
│   ├── environments/        # Environment-specific configs
│   │   ├── dev/
│   │   ├── staging/
│   │   └── prod/
│   └── modules/             # Reusable Terraform modules
│       ├── k3s/             # K3s cluster module
│       ├── networking/      # VCN and networking
│       └── databases/       # Database resources
├── k8s/                     # Kubernetes manifests
│   ├── base/                # Base configurations
│   │   ├── auth/
│   │   ├── gateway/
│   │   ├── user/
│   │   ├── voyage/
│   │   └── common/
│   └── overlays/            # Environment overlays
│       ├── dev/
│       ├── staging/
│       └── prod/
├── scripts/                 # Utility scripts
│   ├── setup-env.sh        # Environment setup
│   ├── deploy.sh           # Deployment script
│   └── rollback.sh         # Rollback script
├── monitoring/              # Monitoring configurations
│   ├── prometheus/         # Prometheus configs
│   └── grafana/            # Grafana dashboards
└── secrets/                # Secret templates (not committed)
    ├── dev/
    ├── staging/
    └── prod/
```

## Environment Configuration

### Development
- **Purpose**: Feature development and testing
- **Resources**: Minimal (1 replica per service)
- **Domain**: `dev-*.dreamscape.com`
- **Monitoring**: Debug logging enabled

### Staging
- **Purpose**: Pre-production testing and validation
- **Resources**: Production-like (2 replicas per service)
- **Domain**: `staging-*.dreamscape.com`
- **Monitoring**: Full monitoring with alerts

### Production
- **Purpose**: Live customer-facing environment
- **Resources**: High availability (3+ replicas)
- **Domain**: `*.dreamscape.com`
- **Monitoring**: Full monitoring, alerting, and SLA tracking

## Services

### Auth Service (`auth-service`)
- **Technology**: Node.js
- **Port**: 3001
- **Purpose**: Authentication and authorization
- **Dependencies**: PostgreSQL, Redis
- **Key Features**:
  - JWT token management
  - OAuth integration (Google)
  - Session management
  - Rate limiting

### Gateway Service (`gateway-service`)
- **Technology**: Node.js
- **Port**: 3000
- **Purpose**: API Gateway and request routing
- **Dependencies**: All microservices
- **Key Features**:
  - Request routing
  - Load balancing
  - API rate limiting
  - Request/response transformation

### User Service (`user-service`)
- **Technology**: Node.js
- **Port**: 3002
- **Purpose**: User profile and preference management
- **Dependencies**: PostgreSQL, Redis
- **Key Features**:
  - User profile management
  - GDPR compliance
  - Preference storage
  - Privacy controls

### Voyage Service (`voyage-service`)
- **Technology**: Python
- **Port**: 3003
- **Purpose**: AI-powered travel recommendations and 360° content
- **Dependencies**: MongoDB, Elasticsearch, OpenAI API
- **Key Features**:
  - AI-powered recommendations
  - 360° content processing
  - Search and discovery
  - Content personalization

## CI/CD Workflows

### Build & Test Pipeline
1. **Code Quality**: Linting, type checking
2. **Testing**: Unit, integration, and E2E tests
3. **Security**: Dependency scanning, SAST
4. **Build**: Docker image creation and push

### Deployment Pipeline
1. **Development**: Automatic deployment on `develop` branch
2. **Staging**: Automatic deployment on `main` branch
3. **Production**: Manual approval required
4. **Rollback**: Automated rollback on failure

### Security Features
- **Secrets Management**: GitHub Secrets integration
- **Vulnerability Scanning**: Trivy for container images
- **Dependency Scanning**: OWASP dependency check
- **Network Policies**: Kubernetes NetworkPolicies
- **Image Security**: Non-root containers, minimal base images

## Monitoring and Alerting

### Prometheus Metrics
- **Service Health**: Uptime, response times, error rates
- **Infrastructure**: CPU, memory, disk usage
- **Business Metrics**: User registrations, AI recommendations
- **Custom Metrics**: 360° content processing, search queries

### Grafana Dashboards
- **Platform Overview**: System-wide health and performance
- **Service Details**: Individual service metrics
- **Infrastructure**: Node and cluster health
- **AI Services**: Machine learning pipeline metrics

### Alert Rules
- **Critical**: Service down, high error rates
- **Warning**: High resource usage, slow responses
- **Info**: Deployment notifications, scaling events

## Database Configuration

### PostgreSQL (User & Auth Services)
- **Engine**: Autonomous Database on OCI
- **Purpose**: Structured data storage
- **Features**: ACID compliance, backup/recovery
- **Scaling**: Automatic scaling enabled

### MongoDB (Voyage Service)
- **Deployment**: Self-managed on OCI
- **Purpose**: Document storage for travel data
- **Features**: Replica set, automatic backups
- **Scaling**: Horizontal scaling with sharding

### Redis (Caching)
- **Deployment**: OCI Cache with Redis
- **Purpose**: Session storage, caching
- **Features**: High availability, persistence
- **Scaling**: Automatic scaling

### Elasticsearch (Voyage Service)
- **Deployment**: Self-managed cluster
- **Purpose**: Search and analytics
- **Features**: Full-text search, aggregations
- **Scaling**: Multi-node cluster

## Security Best Practices

### Container Security
- Non-root user execution
- Minimal base images (distroless)
- No unnecessary privileges
- Security context enforcement

### Network Security
- NetworkPolicies for pod-to-pod communication
- Ingress controller with SSL termination
- Service mesh considerations

### Data Security
- Encryption at rest and in transit
- Secrets management via Kubernetes secrets
- GDPR compliance for user data
- Regular security audits

## Disaster Recovery

### Backup Strategy
- **Databases**: Automated daily backups
- **Configuration**: GitOps approach
- **Monitoring Data**: 30-day retention
- **Secrets**: Secure backup to OCI vault

### Recovery Procedures
- **Service Recovery**: Automated rollback scripts
- **Data Recovery**: Point-in-time restoration
- **Infrastructure Recovery**: Terraform recreation
- **Cross-region**: Multi-AZ deployment

## Troubleshooting

### Common Issues

#### 1. Service Won't Start
```bash
# Check pod logs
kubectl logs -f deployment/SERVICE-service -n dreamscape-ENVIRONMENT

# Check pod events
kubectl describe pod POD-NAME -n dreamscape-ENVIRONMENT
```

#### 2. Database Connection Issues
```bash
# Check secrets
kubectl get secret dreamscape-secrets -n dreamscape-ENVIRONMENT -o yaml

# Test database connectivity
kubectl exec -it deployment/SERVICE-service -n dreamscape-ENVIRONMENT -- nc -zv DATABASE-HOST 5432
```

#### 3. High Resource Usage
```bash
# Check resource usage
kubectl top pods -n dreamscape-ENVIRONMENT

# Check HPA status
kubectl get hpa -n dreamscape-ENVIRONMENT
```

### Emergency Procedures

#### Emergency Rollback
```bash
# Rollback all services immediately
EMERGENCY=true ./scripts/rollback.sh all production
```

#### Scale Down
```bash
# Scale down during maintenance
kubectl scale deployment --all --replicas=0 -n dreamscape-production
```

### Monitoring Access

- **Prometheus**: Internal cluster access only
- **Grafana**: https://grafana.dreamscape.com
- **AlertManager**: Integrated with Slack notifications

## Development Workflow

### Adding New Services
1. Create service directory in `k8s/base/`
2. Add Kustomization resources
3. Update environment overlays
4. Create GitHub Actions workflow
5. Update monitoring configuration

### Environment Promotion
1. **Development**: Merge to `develop` branch
2. **Staging**: Merge to `main` branch
3. **Production**: Create release tag

### Configuration Changes
1. Update Kustomization files
2. Test in development environment
3. Promote through staging to production

## Support and Maintenance

### Regular Tasks
- **Weekly**: Review monitoring alerts and performance
- **Monthly**: Security updates and dependency upgrades
- **Quarterly**: Disaster recovery testing
- **Annually**: Full security audit

### Contact Information
- **DevOps Team**: devops@dreamscape.com
- **Security Team**: security@dreamscape.com
- **On-call**: Slack #incidents

## Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Terraform OCI Provider](https://registry.terraform.io/providers/oracle/oci/latest/docs)
- [Prometheus Monitoring](https://prometheus.io/docs/)
- [OCI Documentation](https://docs.oracle.com/en-us/iaas/)