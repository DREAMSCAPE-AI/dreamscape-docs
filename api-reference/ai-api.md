# AI API

**Base URL** : `/api/v1/ai` | **Service** : AI Service (:3005)

## Endpoints

| Méthode | Path | Auth | Description |
|---------|------|------|-------------|
| `POST` | `/ai/recommendations/generate` | JWT | Générer des recommandations |
| `GET` | `/ai/recommendations/personalized` | JWT | Recommandations actives |
| `GET` | `/ai/recommendations/popular` | Non | Destinations populaires |
| `GET` | `/ai/recommendations/cold-start` | Non | Cold start |
| `POST` | `/ai/recommendations/track` | JWT | Tracker une interaction |
| `GET` | `/ai/recommendations/segmentation/:userId` | JWT | Segment d'un utilisateur |
| `GET` | `/ai/accommodations/recommendations` | JWT | Recommandations hôtels |
| `POST` | `/ai/onboarding/initialize` | JWT | Initialiser le vecteur |
| `GET` | `/ai/predictions/:userId` | JWT | Prédictions comportementales |
| `GET` | `/health` | Non | Health check |

---

## `POST /ai/recommendations/generate`

```bash
curl -X POST http://localhost:3000/api/v1/ai/recommendations/generate \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-uuid", "limit": 10, "contextType": "general"}'
```

**Body :**

| Champ | Type | Défaut | Description |
|-------|------|--------|-------------|
| `userId` | string | requis | ID utilisateur |
| `contextType` | string | `general` | `general` \| `flight` \| `hotel` \| `activity` |
| `limit` | integer | 10 | Nombre de recommandations |
| `minScore` | float | 0.3 | Score minimum [0-1] |

**200 OK :**
```json
{
  "userId": "user-uuid",
  "count": 10,
  "recommendations": [
    {
      "destinationId": "BCN",
      "destinationName": "Barcelona",
      "destinationType": "CITY",
      "score": 0.87,
      "confidence": 0.85,
      "reasons": [
        "Matches your cultural preferences",
        "Climate compatible with preferences",
        "Within budget range"
      ],
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

## `GET /ai/recommendations/personalized`

```bash
curl "http://localhost:3000/api/v1/ai/recommendations/personalized?userId=user-uuid&limit=10" \
  -H "Authorization: Bearer eyJ..."
```

**Query params :**

| Param | Requis | Description |
|-------|--------|-------------|
| `userId` | oui | ID utilisateur |
| `limit` | non | 10 défaut |
| `status` | non | `ACTIVE` \| `VIEWED` \| `CLICKED` |
| `includeItemVector` | non | `false` défaut |

---

## `GET /ai/recommendations/popular`

```bash
curl "http://localhost:3000/api/v1/ai/recommendations/popular?segment=FAMILY_EXPLORER&limit=10"
```

**Query params :** `segment`, `category`, `limit` (max 50)

**200 OK :**
```json
{
  "count": 10,
  "popular": [
    {
      "destinationId": "PAR",
      "name": "Paris",
      "destinationType": "CITY",
      "popularityScore": 0.95,
      "bookingCount": 15420,
      "searchCount": 89500
    }
  ],
  "metadata": { "source": "cache", "segment": "FAMILY_EXPLORER" }
}
```

---

## `GET /ai/recommendations/cold-start`

```bash
curl "http://localhost:3000/api/v1/ai/recommendations/cold-start?\
userId=new-user-uuid\
&strategy=hybrid_preferences\
&limit=15"
```

**Query params :**

| Param | Requis | Défaut | Options |
|-------|--------|--------|---------|
| `userId` | oui | — | — |
| `strategy` | non | `adaptive` | `adaptive` \| `popularity_only` \| `hybrid_segment` \| `hybrid_preferences` |
| `limit` | non | 20 | max 50 |
| `diversityFactor` | non | 0.3 | [0-1] |

**200 OK :**
```json
{
  "userId": "new-user-uuid",
  "count": 15,
  "strategy": "HYBRID_PREFERENCES",
  "recommendations": [
    {
      "destinationId": "BCN",
      "score": 0.87,
      "confidence": 0.85,
      "reasons": ["Popular among CULTURAL_ENTHUSIAST travelers"]
    }
  ]
}
```

---

## `POST /ai/recommendations/track`

Enregistre une interaction pour améliorer les recommandations futures.

```json
{
  "userId": "user-uuid",
  "destinationId": "BCN",
  "action": "click"
}
```

`action` : `view` | `click` | `book` | `dismiss`

---

## `GET /ai/recommendations/segmentation/:userId`

**200 OK :**
```json
{
  "userId": "user-uuid",
  "segment": "CULTURAL_ENTHUSIAST",
  "confidence": 0.78,
  "vector": [0.3, 0.8, 0.5, 0.4, 0.2, 0.7, 0.9, 0.6]
}
```

Segments : `BUDGET_BACKPACKER` | `FAMILY_EXPLORER` | `LUXURY_TRAVELER` | `ADVENTURE_SEEKER` | `CULTURAL_ENTHUSIAST` | `ROMANTIC_COUPLE` | `BUSINESS_LEISURE` | `SENIOR_COMFORT`

---

## `POST /ai/onboarding/initialize`

Crée ou met à jour le vecteur utilisateur depuis les données d'onboarding.

```json
{
  "userId": "user-uuid",
  "onboardingData": {
    "travelBudget": "medium",
    "groupType": "couple",
    "preferredActivities": ["culture", "gastronomy"],
    "preferredClimate": "warm",
    "travelFrequency": "3-4_per_year"
  }
}
```
