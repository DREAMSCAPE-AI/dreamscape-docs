# Services DreamScape

Documentation pour tous les microservices de l'écosystème DreamScape.

## Services disponibles

### 🔐 [Auth Service](auth-service/)
Service d'authentification centralisé gérant :
- Inscription et connexion utilisateur
- Gestion des tokens JWT
- Vérification d'identité  
- Gestion des profils utilisateur

### ✈️ [Voyage Service](voyage-service/)
Service principal de voyage gérant :
- Recherche et réservation de vols
- Recherche et réservation d'hôtels
- Activités et expériences
- Intégration API Amadeus

### 🤖 [AI Service](ai-service/)
Service d'intelligence artificielle pour :
- Recommandations personnalisées
- Prédictions de prix
- Analyse des préférences utilisateur

### 👥 [User Service](user-service/)
Service de gestion utilisateur pour :
- Profils utilisateur étendus
- Historique d'activités
- Préférences de voyage

### 💳 [Payment Service](payment-service/)
Service de paiement pour :
- Traitement des paiements
- Gestion des remboursements
- Intégration avec les fournisseurs de paiement

### 🌅 [Panorama Service](panorama-service/)
Service de vues panoramiques pour :
- Vues VR des destinations
- Images panoramiques 360°
- Expérience immersive

## Architecture inter-services

Les services communiquent entre eux via :
- **HTTP/REST** pour les appels synchrones
- **Kafka** pour les événements asynchrones
- **Redis** pour le cache partagé
- **PostgreSQL** pour les données relationnelles
- **MongoDB** pour les analytics et données non-relationnelles