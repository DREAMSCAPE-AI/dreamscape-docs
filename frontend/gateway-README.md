# DreamScape API Gateway

## Aperçu
La passerelle API DreamScape sert de point d'entrée unique pour toutes les requêtes client vers la plateforme de voyage DreamScape. Elle achemine les requêtes entrantes vers les microservices appropriés, gère les préoccupations transversales comme l'authentification et la surveillance, et fournit une expérience API unifiée pour les applications frontend.

## Fonctionnalités clés
- **Accès API unifié** : Point d'entrée unique pour les applications frontend
- **Routage intelligent des requêtes** : Acheminement dynamique vers les microservices appropriés
- **Authentification et autorisation** : Validation JWT et contrôle d'accès
- **Limitation de débit** : Protection contre les abus et les attaques DDoS
- **Agrégation des réponses** : Combine les réponses de plusieurs services lorsque nécessaire
- **Surveillance et journalisation** : Suivi complet des requêtes et métriques de performance
- **Documentation API** : Documentation OpenAPI centralisée pour tous les services

## Stack technique
- **NGINX** : Technologie de base de la passerelle API
- **Node.js** : Pour les middlewares personnalisés et la logique de routage
- **Redis** : Pour la limitation de débit et la mise en cache
- **Prometheus/Grafana** : Pour la surveillance et les alertes
- **OpenAPI/Swagger** : Pour la documentation API

## Architecture
La passerelle implémente le modèle de passerelle API et sert de façade pour tous les microservices sous-jacents :
```
Applications Frontend
        ↓
Passerelle API DreamScape
        ↓
┌───────┬───────┬────────┬─────┬──────────┐
│ Auth  │ User  │ Voyage │ AI  │ Panorama │ ...
└───────┴───────┴────────┴─────┴──────────┘
```

## Développement local
### Prérequis
- Docker et Docker Compose
- Node.js 18+
- Redis

### Pour commencer
1. Cloner ce dépôt
   ```
   git clone https://github.com/dreamscape/dreamscape-gateway.git
   ```
2. Installer les dépendances
   ```
   npm install
   ```
3. Configurer les variables d'environnement
   ```
   cp .env.example .env
   ```
   Éditer .env avec votre configuration
4. Démarrer la passerelle en mode développement
   ```
   npm run dev
   ```
   La passerelle sera disponible à l'adresse http://localhost:8000

### Tests
```
npm test        # Exécuter les tests unitaires
npm run test:e2e # Exécuter les tests de bout en bout
```

## Documentation API
Lors de l'exécution en local, la documentation API est disponible à :
- http://localhost:8000/docs

## Déploiement
La passerelle est déployée à l'aide de Kubernetes. Les configurations de déploiement se trouvent dans le répertoire `k8s`.

## Contribution
Veuillez consulter le fichier [CONTRIBUTING.md](CONTRIBUTING.md) pour plus de détails sur notre code de conduite et le processus de soumission des pull requests.

### Style de codage
Nous utilisons ESLint et Prettier pour garantir la qualité et la cohérence du code. Veuillez exécuter les commandes suivantes avant de valider :
```
npm run lint
npm run format
```

## Dépôts associés
- [dreamscape-auth](https://github.com/dreamscape/dreamscape-auth)
- [dreamscape-user](https://github.com/dreamscape/dreamscape-user)
- [dreamscape-voyage](https://github.com/dreamscape/dreamscape-voyage)
- [dreamscape-ai](https://github.com/dreamscape/dreamscape-ai)
- [dreamscape-panorama](https://github.com/dreamscape/dreamscape-panorama)
- [dreamscape-web](https://github.com/dreamscape/dreamscape-web)

## Contexte du projet
Ce dépôt fait partie de la plateforme de voyage DreamScape développée avec un rythme de travail de 2 jours par semaine. La passerelle API est un composant d'infrastructure critique qui permet la communication entre les applications frontend et notre architecture de microservices.

## Licence
Ce projet est propriétaire et confidentiel. La copie, le transfert ou l'utilisation non autorisés sont strictement interdits.
