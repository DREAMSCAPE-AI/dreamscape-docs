# Dépôt de Documentation DreamScape

## À propos

Ce dépôt centralise toute la documentation technique et fonctionnelle du projet DreamScape, une plateforme innovante de voyage combinant intelligence artificielle contextuelle et expériences panoramiques immersives pour offrir des expériences de voyage personnalisées.

Ce référentiel sert de source unique de vérité pour tous les aspects documentaires du projet, permettant une gestion efficace des connaissances malgré notre rythme de développement de 2 jours par semaine.

## Structure du dépôt

La documentation est organisée pour centraliser toute la documentation de l'écosystème DreamScape :

```
documentation/
├── services/                        # Documentation par service
│   ├── auth-service/                # Service d'authentification
│   ├── voyage-service/              # Service de voyage principal
│   ├── ai-service/                  # Service d'IA et recommandations
│   ├── user-service/                # Service de gestion utilisateur
│   ├── payment-service/             # Service de paiement
│   └── panorama-service/            # Service de vues panoramiques
│
├── infrastructure/                  # Documentation infrastructure
│   ├── cicd/                        # CI/CD et déploiement
│   ├── docker/                      # Configuration Docker
│   └── kubernetes/                  # Déploiement Kubernetes
│
├── guides/                          # Guides techniques
│   ├── setup/                       # Guides d'installation
│   ├── deployment/                  # Guides de déploiement
│   └── development/                 # Guides de développement
│
├── summaries/                       # Résumés d'implémentation
│   ├── IMPLEMENTATION-SUMMARY-DR334.md
│   ├── IMPLEMENTATION-SUMMARY-DR336.md
│   └── TESTS_IMPLEMENTATION_SUMMARY.md
│
├── LICENSE                          # Licence du repository
└── README.md                        # Ce fichier
```

## Installation et utilisation

### Prérequis

- Node.js 18 ou supérieur
- Yarn ou npm

### Installation locale

```bash
# Cloner le dépôt
git clone https://github.com/dreamscape/dreamscape-documentation.git

# Installer les dépendances
cd dreamscape-documentation
yarn install

# Démarrer le serveur de développement
yarn start
```

La documentation sera accessible à l'adresse http://localhost:3000.

### Génération de la documentation

```bash
# Construire le site statique
yarn build

# Servir le site construit localement
yarn serve
```

## Comment contribuer

### Principes généraux

1. **Documentation as Code** : La documentation est traitée comme du code, avec versionnement, revues et tests.
2. **Format Markdown** : Les documents sont rédigés en Markdown enrichi de fonctionnalités Docusaurus (admonitions, tabs, etc.).
3. **Diagrammes as Code** : Les diagrammes sont créés avec Mermaid, intégrés directement dans les documents Markdown.
4. **Revue par les pairs** : Chaque modification significative doit être revue par au moins un autre membre de l'équipe.

### Structure des documents

Chaque document Markdown doit commencer par un en-tête frontmatter :

```markdown
---
id: nom-unique-du-document
title: Titre du document
description: Brève description du contenu
sidebar_label: Libellé dans la barre latérale
sidebar_position: 1
tags: [tag1, tag2]
---

Contenu du document...
```

### Procédure de contribution

1. Créez une branche à partir de `main` avec le format `doc/[module]/[sujet]`
2. Effectuez vos modifications en respectant la structure Docusaurus
3. Prévisualisez vos modifications avec `yarn start`
4. Soumettez une Pull Request avec un titre clair
5. Demandez une revue à au moins un membre de l'équipe concernée
6. Une fois approuvée, la PR peut être fusionnée dans `main`

### Utilisation des fonctionnalités Docusaurus

Docusaurus offre plusieurs fonctionnalités pour enrichir la documentation :

- **Admonitions** : Encadrés pour mettre en évidence des informations importantes
  ```markdown
  :::note Titre
  Contenu de la note
  :::

  :::warning
  Avertissement important
  :::
  ```

- **Onglets** : Pour présenter des alternatives (ex: différentes plateformes)
  ```markdown
  import Tabs from '@theme/Tabs';
  import TabItem from '@theme/TabItem';

  <Tabs>
    <TabItem value="web" label="Web">Contenu web</TabItem>
    <TabItem value="mobile" label="Mobile">Contenu mobile</TabItem>
  </Tabs>
  ```

- **Diagrammes Mermaid** : Pour des diagrammes techniques
  ```markdown
  ```mermaid
  graph TD;
      A-->B;
      A-->C;
      B-->D;
      C-->D;
  ```
  ```

## Intégration continue

Le dépôt utilise GitHub Actions pour l'intégration continue :

1. **Documentation CI** : Vérifie la validité de la documentation à chaque pull request
   - Linting Markdown
   - Validation des liens internes
   - Construction du site Docusaurus

2. **Documentation CD** : Déploie automatiquement le site après fusion dans `main`
   - Construction du site statique
   - Déploiement sur GitHub Pages ou notre serveur interne
   - Génération de versions PDF pour téléchargement

## Versionnement de la documentation

Docusaurus permet le versionnement de la documentation, ce qui est particulièrement utile pour suivre les évolutions du projet :

- **Version courante** : Documentation de la dernière version (`next`)
- **Versions stables** : Documentation des jalons majeurs (ex: MVP, Release 1.0)

Les commandes pour gérer les versions :

```bash
# Créer une nouvelle version à partir de la documentation actuelle
yarn run docusaurus docs:version 1.0.0

# Construire toutes les versions
yarn build
```

## Recherche et navigation

La documentation intègre Algolia DocSearch pour une recherche performante :

- Indexation automatique du contenu
- Recherche instantanée
- Suggestions pertinentes

La navigation est facilitée par :
- Une barre latérale organisée thématiquement
- Des liens contextuels entre documents liés
- Un fil d'Ariane pour situer le document dans la hiérarchie

## Contacts

Pour toute question concernant la documentation :

- **Responsable documentation** : Kevin Coutellier
- **Canal Slack** : #dreamscape-documentation
- **Email** : documentation@dreamscape.internal

## Planning de mise à jour

La documentation suit un cycle de mise à jour régulier :

- **Mise à jour majeure** : À la fin de chaque phase du projet, avec création d'une nouvelle version
- **Mise à jour mineure** : À la fin de chaque sprint, reflétée dans les articles de blog
- **Révision complète** : Avant chaque jalon clé (keynote, MVP)

---

Dernière mise à jour : 20 mai 2025
