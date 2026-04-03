# AI Service

**Port** : 3005 | **Package** : `dreamscape-ai-service` | **Pod** : Business

## Responsabilités

- Recommandations personnalisées de destinations, hôtels et activités
- Modélisation vectorielle 8 dimensions des utilisateurs et des items
- Gestion du cold start (4 stratégies, 8 segments utilisateur)
- Segmentation automatique des utilisateurs
- Explainability des recommandations (raisons du match)
- Diversification des résultats (ML diversity)

## Stack technique

| Dépendance | Usage |
|------------|-------|
| Express 4.18 | Framework HTTP |
| Prisma 5.7 | ORM PostgreSQL |
| Redis | Cache popularité, vecteurs fréquents |
| kafkajs 2.2 | Consommation d'événements |

## Modèle Vectoriel 8 Dimensions

Chaque utilisateur et chaque destination est représenté par un vecteur de 8 dimensions normalisées `[0, 1]` :

| Dimension | Description |
|-----------|-------------|
| `climate` | Préférence climatique (froid → chaud) |
| `culture_nature` | Culture urbaine vs nature sauvage |
| `budget` | Budget faible → luxe (échelle logarithmique) |
| `activity` | Sédentaire → très actif |
| `group_type` | Solo → famille nombreuse |
| `urban_rural` | Ville → campagne |
| `gastronomy` | Sensibilité gastronomique |
| `popularity` | Tolérance aux destinations touristiques |

**Calcul de similarité :**
- **Cosinus** : `score = 1 - angle(userVector, itemVector)` — pertinent pour la direction préférentielle
- **Euclidien** : `score = 1 / (1 + distance)` — pertinent pour la proximité absolue
- **Hybride** : `0.70 × cosinus + 0.30 × euclidien` — meilleur résultat global

## Endpoints

### `POST /api/v1/ai/recommendations/generate`

Génère de nouvelles recommandations pour un utilisateur.

**Body :**
```json
{
  "userId": "user-uuid",
  "contextType": "general",    // "general" | "flight" | "hotel" | "activity"
  "limit": 10,
  "minScore": 0.3
}
```

**Réponse :**
```json
{
  "userId": "user-uuid",
  "count": 10,
  "recommendations": [
    {
      "destinationId": "BCN",
      "destinationName": "Barcelona",
      "score": 0.87,
      "confidence": 0.85,
      "reasons": ["Matches cultural preferences", "Climate compatible"],
      "breakdown": {
        "popularityScore": 0.82,
        "similarityScore": 0.89,
        "finalScore": 0.87
      }
    }
  ]
}
```

---

### `GET /api/v1/ai/recommendations/personalized`

Retourne les recommandations actives d'un utilisateur. Si aucune n'existe, les génère à la volée.

**Query params :** `userId` (requis), `limit`, `status`, `includeItemVector`

---

### `GET /api/v1/ai/recommendations/popular`

Destinations populaires, optionnellement filtrées par segment ou catégorie.

**Query params :** `segment`, `category`, `limit` (max 50)

**Réponse :**
```json
{
  "count": 10,
  "popular": [
    {
      "destinationId": "PAR",
      "name": "Paris",
      "popularityScore": 0.95,
      "bookingCount": 15420
    }
  ],
  "metadata": { "source": "cache", "segment": "FAMILY_EXPLORER" }
}
```

---

### `GET /api/v1/ai/recommendations/cold-start`

Recommandations pour les nouveaux utilisateurs sans historique.

**Query params :**
| Param | Type | Défaut | Description |
|-------|------|--------|-------------|
| `userId` | string | requis | Identifiant utilisateur |
| `strategy` | string | `adaptive` | `adaptive` \| `popularity_only` \| `hybrid_segment` \| `hybrid_preferences` |
| `limit` | integer | 20 | Max 50 |
| `diversityFactor` | float | 0.3 | Facteur de diversification [0-1] |

---

### `POST /api/v1/ai/recommendations/track`

Enregistre une interaction utilisateur (view, click, book) pour améliorer les recommandations.

**Body :** `{ "userId": "...", "destinationId": "...", "action": "view" | "click" | "book" }`

---

### `GET /api/v1/ai/accommodations/recommendations`

Recommandations d'hôtels basées sur le profil utilisateur.

**Query params :** `userId`, `destinationId`, `checkIn`, `checkOut`, `limit`

---

### `GET /api/v1/ai/recommendations/segmentation/:userId`

Retourne le segment calculé d'un utilisateur.

**Réponse :**
```json
{
  "userId": "...",
  "segment": "CULTURAL_ENTHUSIAST",
  "confidence": 0.78,
  "vector": [0.3, 0.8, 0.5, 0.4, 0.2, 0.7, 0.9, 0.6]
}
```

---

### `POST /api/v1/ai/onboarding/initialize`

Initialise le vecteur utilisateur depuis les réponses d'onboarding.

**Body :** `{ "userId": "...", "onboardingData": { ... } }`

---

### `GET /api/v1/ai/predictions/:userId`

Récupère les prédictions comportementales de l'utilisateur.

---

### `GET /health`
```json
{ "status": "healthy", "database": "connected", "cache": "connected" }
```

## Architecture Cold Start (US-IA-002)

Le cold start résout le problème des nouveaux utilisateurs sans historique.

### 4 Stratégies

| Stratégie | Déclenchement | Comportement |
|-----------|--------------|-------------|
| `POPULARITY_ONLY` | Aucune donnée utilisateur | Top destinations globales |
| `HYBRID_SEGMENT` | Segment identifié, pas de vecteur | Popularité filtrée par segment |
| `HYBRID_PREFERENCES` | Onboarding complété | Blend popularité + vecteur onboarding |
| `ADAPTIVE` (défaut) | Automatique | Choisit la meilleure stratégie selon les données dispo |

### 8 Segments Utilisateur

| Segment | Profil type | Budget/jour |
|---------|------------|-------------|
| `BUDGET_BACKPACKER` | Solo, aventure, économique | 20-50€ |
| `FAMILY_EXPLORER` | Famille avec enfants | 80-150€ |
| `LUXURY_TRAVELER` | Premium, exclusif | 200€+ |
| `ADVENTURE_SEEKER` | Actif, nature, sports | 60-130€ |
| `CULTURAL_ENTHUSIAST` | Culture, histoire, gastronomie | 70-180€ |
| `ROMANTIC_COUPLE` | Couple, romantique | 100-250€ |
| `BUSINESS_LEISURE` | Business + loisirs | 120-300€ |
| `SENIOR_COMFORT` | Senior, confort | 90-200€ |

### Algorithme de Segmentation

```
Pour chaque utilisateur :
  1. Normaliser les dimensions [0-1]
  2. Calculer la distance euclidienne avec chaque centroïde de segment
  3. Assigner le segment le plus proche
  4. Calculer la confiance (distance relative)
```

## Modèles Prisma

| Modèle | Description |
|--------|-------------|
| `UserVector` | Vecteur 8D d'un utilisateur |
| `ItemVector` | Vecteur 8D d'une destination/hôtel/activité |
| `Recommendation` | Recommandation générée avec score et tracking |
| `PredictionData` | Prédictions comportementales |
| `Analytics` | Métriques ML |

## Événements Kafka

### Consommés

| Topic | Action |
|-------|--------|
| `dreamscape.user.onboarding.completed` | Initialise le vecteur utilisateur |
| `dreamscape.user.preferences.updated` | Met à jour le vecteur utilisateur |
| `dreamscape.voyage.booking.confirmed` | Enrichit le vecteur (feedback implicite) |

## Seeding des données ML

Pour initialiser les données de test (100 utilisateurs, 50 destinations, ~2000 recommandations) :

```bash
cd dreamscape-services/db
npm run db:seed
```

Voir [Seed ML data](../reference/seed-data.md) pour la documentation du dataset.
