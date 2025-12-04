# Projet DreamScape - Frontend Web

## Vue d'ensemble

Le repository `dreamscape-web` contient l'interface utilisateur web du projet DreamScape, une plateforme innovante de voyage qui combine l'intelligence artificielle contextuelle et la réalité virtuelle pour offrir des expériences de voyage personnalisées.

Cette application React constitue le point d'entrée principal pour les utilisateurs finaux, leur permettant de découvrir, planifier et personnaliser leurs voyages à travers une expérience immersive et intuitive.

## Prérequis

- Node.js v18.x ou supérieur
- npm v8.x ou supérieur
- Accès au registry npm privé de DreamScape

## Installation

1. Cloner le repository :
   ```bash
   git clone https://github.com/dreamscape/dreamscape-web.git
   cd dreamscape-web
   ```

2. Installer les dépendances :
   ```bash
   npm install
   ```

3. Configurer les variables d'environnement :
   ```bash
   cp .env.example .env.local
   ```
   Puis éditer le fichier `.env.local` avec les valeurs appropriées.

## Structure du projet

```
├── public/               # Assets statiques
├── src/
│   ├── components/       # Composants React réutilisables
│   │   ├── common/       # Composants génériques
│   │   ├── auth/         # Composants liés à l'authentification
│   │   ├── voyage/       # Composants liés aux voyages et réservations
│   │   ├── panorama/     # Composants pour l'expérience panoramique
│   │   └── profile/      # Composants de gestion de profil
│   ├── hooks/            # Custom hooks React
│   ├── pages/            # Composants de page
│   ├── services/         # Services d'API et logique métier
│   ├── store/            # État global (Redux)
│   │   ├── actions/      # Actions Redux
│   │   ├── reducers/     # Reducers Redux
│   │   └── selectors/    # Sélecteurs Redux
│   ├── styles/           # Fichiers de style globaux
│   ├── utils/            # Utilitaires et helpers
│   ├── App.tsx           # Composant racine
│   └── index.tsx         # Point d'entrée de l'application
├── .env.example          # Exemple de variables d'environnement
├── .eslintrc.js          # Configuration ESLint
├── .prettierrc           # Configuration Prettier
├── jest.config.js        # Configuration Jest
├── package.json          # Dépendances et scripts npm
├── tsconfig.json         # Configuration TypeScript
└── vite.config.ts        # Configuration Vite
```

## Démarrage

Pour lancer l'application en mode développement :

```bash
npm run dev
```

L'application sera disponible à l'adresse [http://localhost:5173](http://localhost:5173).

## Scripts disponibles

- `npm run dev` : Lance l'application en mode développement
- `npm run build` : Construit l'application pour la production
- `npm run preview` : Prévisualise la build de production localement
- `npm run lint` : Vérifie le code avec ESLint
- `npm run lint:fix` : Corrige automatiquement les problèmes détectés par ESLint
- `npm run test` : Exécute les tests unitaires avec Jest
- `npm run test:coverage` : Exécute les tests avec rapport de couverture
- `npm run storybook` : Lance Storybook pour explorer les composants

## Communication avec le backend

L'application communique exclusivement avec l'API Gateway (`dreamscape-gateway`) qui route les requêtes vers les services appropriés. Toutes les requêtes API sont centralisées dans le dossier `src/services`.

### Exemple d'utilisation :

```typescript
import { searchFlights } from '@/services/voyageService';

// Dans un composant React
const SearchPage = () => {
  const handleSearch = async (criteria) => {
    try {
      const results = await searchFlights(criteria);
      // Traitement des résultats
    } catch (error) {
      // Gestion des erreurs
    }
  };
  
  // ...
};
```

## Gestion de l'état

L'application utilise Redux Toolkit pour la gestion de l'état global. Les états sont organisés par domaine fonctionnel :

- `auth` : État d'authentification et informations utilisateur
- `voyage` : Recherches, résultats et réservations
- `recommendations` : Suggestions personnalisées
- `panorama` : État de l'expérience panoramique
- `ui` : État de l'interface utilisateur (modales, toasts, etc.)

## Expérience panoramique

L'expérience panoramique utilise une combinaison de Marzipano pour les vues 360° et CesiumJS pour la navigation globale. Ces intégrations sont encapsulées dans des composants React réutilisables dans le dossier `src/components/panorama`.

## Tests

Les tests unitaires sont écrits avec Jest et React Testing Library. Les tests d'intégration utilisent MSW (Mock Service Worker) pour simuler les appels API.

Pour exécuter les tests :

```bash
npm run test
```

## Déploiement

L'application est déployée automatiquement sur Cloudflare Pages via le pipeline CI/CD configuré dans GitHub Actions. Chaque push sur la branche `main` déclenche un déploiement en production, tandis que les pull requests génèrent des environnements de preview.

## Internationalisation

L'application supporte le français et l'anglais via react-i18next. Les traductions sont stockées dans le dossier `public/locales`.

Pour ajouter ou modifier des traductions, éditez les fichiers JSON correspondants.

## Contribution

Pour contribuer au projet, veuillez suivre ces étapes :

1. Créer une branche à partir de `develop` avec un nom descriptif
2. Implémenter vos modifications avec des commits atomiques
3. S'assurer que les tests passent et que le linting est correct
4. Soumettre une pull request vers `develop`
5. Attendre la revue de code et l'approbation

### Conventions de code

- Respect des règles ESLint et Prettier configurées
- Composants React fonctionnels avec hooks
- Typage strict avec TypeScript
- Tests unitaires pour tous les nouveaux composants
- Documentation des props et fonctions complexes

## Documentation

Pour une documentation plus détaillée :

- [Guide de style et design system](https://confluence.dreamscape.com/design-system)
- [API Gateway Documentation](https://confluence.dreamscape.com/api-docs)
- [Architecture technique globale](https://confluence.dreamscape.com/architecture)

## Liens utiles

- [Jira du projet](https://jira.dreamscape.com/projects/DREAM)
- [Figma designs](https://figma.com/team/dreamscape)
- [Environnement de staging](https://staging.dreamscape.com)

## Contact

Pour toute question concernant ce repository, veuillez contacter :
- **Product Owner** : Kevin Coutellier
- **Tech Lead Frontend** : [Nom du Tech Lead]

## Licence

Ce projet est propriétaire et confidentiel. © DreamScape 2025.
