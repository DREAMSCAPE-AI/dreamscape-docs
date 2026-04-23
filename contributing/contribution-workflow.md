# Workflow de contribution

Ce document décrit le processus de contribution à DreamScape : organisation des branches, convention de commits, pull requests, code review.

## Vue d'ensemble

DreamScape est organisé en **5 repositories Git indépendants**, chacun ayant son propre workflow :

| Repository | Usage principal |
|------------|----------------|
| `dreamscape-services` | Microservices backend (auth, user, voyage, payment, ai) |
| `dreamscape-frontend` | Web client, gateway, panorama VR |
| `dreamscape-infra` | Terraform, K8s, CI/CD centralisé, Docker Compose prod |
| `dreamscape-tests` | Tests centralisés (E2E, intégration, mocks) |
| `dreamscape-docs` | Documentation technique et produit |

Le dossier parent qui contient ces 5 repos **n'est pas** lui-même un repo Git.

## Stratégie de branches

### Branches permanentes

| Branche | Rôle | Environnement |
|---------|------|---------------|
| `main` | Code en production | production |
| `develop` | Intégration continue | staging |

### Branches temporaires

| Préfixe | Usage | Base | Merge vers |
|---------|-------|------|-----------|
| `feature/DR-XXX-slug` | Nouvelle fonctionnalité | `develop` | `develop` |
| `bugfix/DR-XXX-slug` | Correction non critique | `develop` | `develop` |
| `hotfix/DR-XXX-slug` | Correction urgente prod | `main` | `main` + `develop` |
| `chore/slug` | Maintenance, refacto | `develop` | `develop` |
| `docs/slug` | Documentation seule | `develop` | `develop` |

### Règles

- **Une branche = un ticket Jira** (sauf `chore`/`docs` mineurs).
- Slug kebab-case court et descriptif : `feature/DR-286-gdpr-consent-banner`.
- Durée de vie courte : merge ou rebase sous 5 jours ouvrés.
- Rebase sur la base (`develop` / `main`) avant d'ouvrir la PR.
- Suppression automatique après merge.

## Projet Jira

- URL : `epitech-team-t7wc668a.atlassian.net`
- Project key : **DR** (DreamScape)
- Hiérarchie : Epic > Feature > Story > Task / Bug
- Workflow : `Backlog` → `À faire` → `En cours` → `En revue` → `Terminé`

### Liaison Git ↔ Jira

- Le nom de branche commence par `DR-XXX`.
- Chaque commit mentionne le ticket : `feat(auth): DR-123 add OAuth Google flow`.
- Le passage en **En cours** se fait à la création de la branche, **En revue** à l'ouverture de la PR.

## Conventional Commits

Format obligatoire des messages de commit :

```
<type>(<scope>): <ticket> <description>

[body optionnel]

[footer optionnel]
```

### Types

| Type | Usage |
|------|-------|
| `feat` | Nouvelle fonctionnalité utilisateur |
| `fix` | Correction de bug |
| `refactor` | Refacto sans changement de comportement |
| `perf` | Amélioration de performance |
| `test` | Ajout / modification de tests |
| `docs` | Documentation uniquement |
| `chore` | Maintenance, config, dépendances |
| `ci` | Modification pipeline CI/CD |
| `build` | Build system, Docker, bundler |
| `style` | Formatage, pas de changement logique |

### Scopes recommandés

`auth`, `user`, `voyage`, `payment`, `ai`, `panorama`, `gateway`, `web-client`, `db`, `kafka`, `infra`, `docs`, `tests`.

### Exemples

```
feat(voyage): DR-312 add multi-city flight search
fix(auth): DR-298 prevent token reuse after logout
refactor(user): DR-305 extract preferences into dedicated service
test(payment): DR-271 add integration tests for Stripe webhooks
docs(contributing): add development standards guide
chore(deps): bump prisma to 5.12.0
```

### Breaking changes

Ajouter `!` après le scope **et** une section `BREAKING CHANGE:` dans le body :

```
feat(auth)!: DR-400 switch to JWT RS256 signing

BREAKING CHANGE: all existing tokens are invalidated. Clients must re-authenticate.
```

### Commits atomiques

- Un commit = une intention cohérente.
- Éviter les commits monstres (> 500 lignes modifiées) sauf renommage massif.
- Préférer `git rebase -i` (localement uniquement) pour nettoyer l'historique avant PR.
- **Ne jamais force-push sur `main` ou `develop`**.

## Workflow feature (du ticket à la prod)

### 1. Préparation

```bash
# Repo concerné (ex: services)
cd dreamscape-services
git checkout develop
git pull origin develop

# Créer la branche
git checkout -b feature/DR-312-multi-city-search
```

Passer le ticket Jira en **En cours**.

### 2. Développement

- Implémenter la feature avec tests unitaires et d'intégration.
- Commiter régulièrement en respectant Conventional Commits.
- Maintenir le `npm run lint` et `npm test` au vert localement.
- Mettre à jour la documentation (`dreamscape-docs/`) si contrat API modifié.

### 3. Synchronisation avec `develop`

Avant d'ouvrir la PR :

```bash
git fetch origin
git rebase origin/develop
# Résoudre les conflits si besoin
git push --force-with-lease origin feature/DR-312-multi-city-search
```

`--force-with-lease` protège contre l'écrasement du travail d'un·e collègue sur la même branche.

### 4. Pull Request

- Ouvrir la PR vers `develop` (ou `main` pour un hotfix).
- Remplir le template (voir section dédiée).
- Auto-assigner un reviewer (minimum 1, 2 pour les changements critiques).
- Passer le ticket Jira en **En revue**.

### 5. Code review

Voir section [Code review](#code-review) plus bas.

### 6. Merge

- **Squash & merge** par défaut (historique propre sur `develop`).
- `Merge commit` autorisé pour les features volumineuses (> 20 commits cohérents).
- `Rebase & merge` interdit sur `develop` / `main` (multiplie les commits).

### 7. Déploiement

- Merge sur `develop` → déploiement automatique en **staging** (voir [procédures CI/CD](ci-cd-procedures.md)).
- Merge sur `main` → déploiement automatique en **production** (sauf approbation manuelle si configurée).
- Ticket Jira passé en **Terminé** après vérification en environnement cible.

## Workflow hotfix

Pour une correction urgente en production :

```bash
cd dreamscape-services
git checkout main
git pull origin main
git checkout -b hotfix/DR-XXX-critical-auth-bug

# Correction + test
# ...

git push -u origin hotfix/DR-XXX-critical-auth-bug
```

- PR vers `main` avec label `hotfix`.
- Après merge, **rétroporter** sur `develop` :
  ```bash
  git checkout develop
  git pull
  git merge --no-ff main
  git push origin develop
  ```

## Pull Request

### Template

Les repositories embarquent un `.github/PULL_REQUEST_TEMPLATE.md`. À défaut, suivre ce format :

```markdown
## Ticket
[DR-XXX](https://epitech-team-t7wc668a.atlassian.net/browse/DR-XXX)

## Contexte
Brève description du problème ou de la feature.

## Changements
- Point 1
- Point 2

## Impacts
- Breaking change : oui/non
- Migration DB : oui/non (lien vers migration)
- Variables d'environnement ajoutées : oui/non
- Services impactés : auth, user, ...

## Tests
- [ ] Unitaires ajoutés/mis à jour
- [ ] Intégration ajoutés/mis à jour
- [ ] E2E si parcours utilisateur modifié
- [ ] Testé localement avec `make start`

## Checklist
- [ ] Lint passe (`npm run lint`)
- [ ] Build passe (`npm run build`)
- [ ] Tests passent (`npm test`)
- [ ] Documentation mise à jour
- [ ] Pas de secret en dur
- [ ] Reviewers assignés
```

### Exigences

- **Titre** : `<type>(<scope>): DR-XXX Description concise` — même format que les commits.
- Description non vide, contexte clair.
- Tous les checks CI verts (lint, tests, build, security scan).
- Au moins **1 approval** (2 pour changements sécurité/DB/CI).
- Pas de conflits avec la base.
- Branche à jour avec la base (rebase récent).

## Code review

### En tant qu'auteur

- PR de taille raisonnable (**< 400 lignes modifiées** idéal, < 800 max).
- Si trop gros : découper en plusieurs PR dépendantes ou ouvrir une **draft PR** explicative.
- Répondre aux commentaires sous 1 jour ouvré.
- Ne pas fermer un thread de review sans résolution.

### En tant que reviewer

- Répondre à une demande de review sous 1 jour ouvré.
- Prioriser **correction > conventions > optimisation**.
- Utiliser les niveaux de commentaires :
  - `nit:` — détail optionnel (ne bloque pas).
  - `suggestion:` — amélioration recommandée.
  - `request:` — changement requis avant merge.
  - `question:` — clarification nécessaire.
- Tester localement si la PR touche un parcours critique (auth, paiement).

### Points de vigilance

1. **Sécurité** — inputs validés, pas de secret, pas d'injection SQL/XSS.
2. **Performance** — requêtes N+1, indexes manquants, appels externes non cachés.
3. **Gestion d'erreurs** — try/catch, rollback Prisma, publication Kafka non-bloquante.
4. **Tests** — couvrent le happy path **et** les cas d'erreur.
5. **Migrations DB** — réversibles, testées sur une copie de prod si possible.
6. **Breaking changes** — documentés et versionnés API (v1 → v2).
7. **Configuration** — valeurs par défaut sûres, variables d'env documentées.

## Coordination multi-repos

Un changement peut impacter plusieurs repositories (ex: nouvelle feature backend + frontend + test E2E). Dans ce cas :

1. Ouvrir les PR **dans l'ordre de dépendance** : db → services → frontend → tests.
2. Lier les PR entre elles dans la description (`See also dreamscape-frontend#42`).
3. Merger dans l'ordre, en respectant les pipelines (voir [CI/CD](ci-cd-procedures.md)).
4. Si blocage, utiliser une branche `develop` partagée plutôt que de forcer.

### Ordre de merge recommandé

```
1. dreamscape-docs      (peut merger en parallèle)
2. dreamscape-services  (si schéma Prisma modifié, merger en premier)
3. dreamscape-frontend  (consomme les nouvelles APIs)
4. dreamscape-tests     (valide le tout en E2E)
5. dreamscape-infra     (dernier — impacte le déploiement)
```

## Gestion des conflits

### Rebase préféré au merge

```bash
git fetch origin
git rebase origin/develop
# Résoudre les conflits fichier par fichier
git add <fichier>
git rebase --continue
git push --force-with-lease
```

### Conflits sur `package-lock.json`

Ne jamais résoudre manuellement — régénérer :

```bash
git checkout origin/develop -- package-lock.json
npm install
git add package-lock.json
git rebase --continue
```

### Conflits sur `schema.prisma`

Coordination impérative avec l'auteur des changements concurrents. Merger les deux jeux de modifications à la main, puis :

```bash
cd dreamscape-services/db
npx prisma format
npx prisma db push
npx prisma generate
```

Lancer ensuite `npx prisma generate` dans tous les services consommateurs.

## Onboarding d'un nouveau contributeur

1. Lire [Prérequis](../getting-started/prerequisites.md) et [Installation locale](../getting-started/local-development.md).
2. Parcourir l'[architecture](../architecture/README.md) et la [vue des microservices](../architecture/microservices-overview.md).
3. Lire ce document + [Standards de développement](development-standards.md).
4. Configurer les accès : GitHub (5 repos), Jira DR, Docker, registre GHCR.
5. Cloner les 5 repos dans un dossier `dreamscape/`.
6. Lancer `make start` à la racine et vérifier `make health`.
7. Prendre un premier ticket `good-first-issue` sur Jira.

## FAQ

**Q : Je dois modifier le schéma Prisma dans ma feature. Que faire ?**
Modifier `dreamscape-services/db/prisma/schema.prisma`, lancer `npx prisma db push` + `npx prisma generate`, propager le client dans tous les services consommateurs. Inclure la migration dans la même PR que le code qui l'utilise.

**Q : Un test E2E casse après ma modification mais il n'est pas dans mon repo.**
Ouvrir une PR dans `dreamscape-tests` en parallèle et la lier. Merger `services` d'abord, puis `tests`.

**Q : Comment tester ma PR dans un environnement partagé ?**
La branche `develop` est déployée automatiquement en staging. Les branches de feature peuvent être déployées en dev via trigger manuel du workflow `unified-cicd` (voir [CI/CD](ci-cd-procedures.md)).

**Q : J'ai oublié de mentionner le ticket dans mon commit.**
`git commit --amend` si pas encore pushé. Sinon, ajouter le ticket dans la description de la PR — c'est acceptable mais à éviter.
