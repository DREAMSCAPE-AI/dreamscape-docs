# Contribution à DreamScape

Documentation destinée aux développeurs contribuant au projet DreamScape : standards de code, workflows Git, procédures CI/CD.

## Navigation

| Document | Contenu |
|----------|---------|
| [Standards de développement](development-standards.md) | Conventions de code, TypeScript, linting, tests, sécurité |
| [Workflow de contribution](contribution-workflow.md) | Git flow, branches, commits, pull requests, code review |
| [Procédures CI/CD](ci-cd-procedures.md) | Pipeline en 2 stages, déclenchement, déploiement, rollback |

## Principes clés

- **Monorepo éclaté** : 5 repositories indépendants (services, frontend, infra, tests, docs) synchronisés via `repository_dispatch`.
- **Conventional Commits** : format strict pour faciliter le changelog et le versioning automatique.
- **Trunk-based avec feature branches** : base `develop`, release via `main`, hotfix directement sur `main`.
- **Pipeline 2 stages** : CI local (lint + tests) dans le repo source → CI/CD centralisé (build + deploy) dans `dreamscape-infra`.
- **Jira-driven** : chaque branche référence un ticket DR-XXX, les commits et PR le mentionnent.

## Ressources associées

- [Guide des tests](../guides/testing.md) — frameworks, commandes, couverture
- [Infrastructure CI/CD](../infrastructure/ci-cd.md) — détails techniques K3s, Terraform, monitoring
- [Configuration des environnements](../getting-started/environment-configuration.md) — variables, secrets
- [Sécurité globale](../security/README.md) — recommandations, audits
