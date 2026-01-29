# API Documentation - Cold Start System

## Base URL
```
Production:  https://api.dreamscape.com/api/v1
Staging:     https://api-staging.dreamscape.com/api/v1
Development: http://localhost:3000/api/v1
```

---

## Endpoints

### 1. Get Popular Destinations

Retrieve popular destinations, optionally filtered by segment or category.

```http
GET /recommendations/popular
```

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `segment` | string | No | - | Filter by user segment (e.g., `FAMILY_EXPLORER`) |
| `category` | string | No | - | Filter by category (e.g., `BEACH`, `CITY`) |
| `limit` | integer | No | 20 | Number of results (max: 50) |

**Example Request:**
```bash
curl -X GET "https://api.dreamscape.com/api/v1/recommendations/popular?segment=FAMILY_EXPLORER&limit=10"
```

**Example Response:**
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
  "metadata": {
    "source": "cache",
    "segment": "FAMILY_EXPLORER",
    "category": null
  }
}
```

---

### 2. Get Cold Start Recommendations

Generate personalized recommendations for new users.

```http
GET /recommendations/cold-start
```

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `userId` | string | **Yes** | - | User identifier |
| `strategy` | string | No | `adaptive` | `adaptive`, `popularity_only`, `hybrid_segment`, `hybrid_preferences` |
| `limit` | integer | No | 20 | Number of results (max: 50) |
| `diversityFactor` | float | No | 0.3 | Diversity factor [0-1] |

**Example Request:**
```bash
curl -X GET "https://api.dreamscape.com/api/v1/recommendations/cold-start?userId=user123&strategy=hybrid_preferences&limit=15"
```

**Example Response:**
```json
{
  "userId": "user123",
  "count": 15,
  "strategy": "HYBRID_PREFERENCES",
  "recommendations": [
    {
      "destinationId": "BCN",
      "destinationName": "Barcelona",
      "destinationType": "CITY",
      "score": 0.87,
      "confidence": 0.85,
      "breakdown": {
        "popularityScore": 0.82,
        "similarityScore": 0.89,
        "finalScore": 0.87
      },
      "reasons": [
        "Popular among CULTURAL_ENTHUSIAST travelers",
        "Matches your preferences",
        "High quality destination"
      ],
      "strategy": "HYBRID_PREFERENCES",
      "rank": 1
    }
  ]
}
```

---

### 3. Complete Onboarding

Process onboarding completion and generate initial recommendations.

```http
POST /ai/onboarding/complete
```

**Request Body:**
```json
{
  "userId": "user123",
  "onboardingData": {
    "userId": "user123",
    "isOnboardingCompleted": true,
    "preferences": {
      "destinations": {
        "regions": ["EUROPE", "ASIA"],
        "climates": ["TEMPERATE", "TROPICAL"]
      },
      "budget": {
        "globalRange": { "min": 80, "max": 150, "currency": "EUR" }
      },
      "travel": {
        "types": ["CULTURAL", "LEISURE"],
        "groupTypes": ["COUPLE"]
      },
      "activities": {
        "activityLevel": "moderate"
      }
    }
  }
}
```

**Example Response:**
```json
{
  "success": true,
  "fallback": false,
  "userVector": {
    "segment": "CULTURAL_ENTHUSIAST",
    "confidence": 0.85,
    "source": "blended"
  },
  "recommendations": [
    /* Top 10 recommendations */
  ],
  "metadata": {
    "processingTime": 345,
    "strategy": "blended",
    "segmentAssigned": "CULTURAL_ENTHUSIAST",
    "confidence": 0.85
  }
}
```

---

### 4. Refine User Profile

Update user vector based on interactions.

```http
PATCH /ai/users/:userId/refine
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | **Yes** | User identifier |

**Request Body:**
```json
{
  "interaction": {
    "type": "book",
    "destinationId": "BCN",
    "timestamp": "2026-01-29T10:30:00Z"
  }
}
```

**Interaction Types:**
- `view`: Simple consultation (learning rate: 0.05)
- `click`: Confirmed interest (learning rate: 0.10)
- `like`: Explicit positive signal (learning rate: 0.15)
- `book`: Actual conversion (learning rate: 0.20)
- `dislike`: Negative signal (learning rate: -0.10)

**Example Response:**
```json
{
  "success": true,
  "vectorUpdated": true,
  "segmentsChanged": false,
  "newRecommendationsGenerated": false
}
```

---

### 5. Get User Segment

Retrieve user's assigned segment(s).

```http
GET /ai/users/:userId/segment
```

**Example Response:**
```json
{
  "userId": "user123",
  "segments": [
    {
      "segment": "CULTURAL_ENTHUSIAST",
      "score": 0.85,
      "reasons": ["cultural/urban focus", "moderate activity level match"],
      "assignedAt": "2026-01-29T08:15:00Z"
    },
    {
      "segment": "ROMANTIC_COUPLE",
      "score": 0.72,
      "reasons": ["couple travel preference"],
      "assignedAt": "2026-01-29T08:15:00Z"
    }
  ],
  "primarySegment": "CULTURAL_ENTHUSIAST",
  "confidence": 0.85,
  "lastUpdated": "2026-01-29T08:15:00Z"
}
```

---

### 6. Refresh Popularity Scores

Manually trigger popularity score recalculation (admin only).

```http
POST /recommendations/popularity/refresh
```

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Example Response:**
```json
{
  "success": true,
  "result": {
    "success": true,
    "destinationsUpdated": 8542,
    "duration": 245000,
    "averageScore": 0.42,
    "topDestination": {
      "id": "PAR",
      "name": "Paris",
      "score": 0.98
    },
    "completedAt": "2026-01-29T03:05:15Z"
  }
}
```

---

### 7. Get Cache Statistics

Retrieve cache performance metrics (admin only).

```http
GET /recommendations/cache/stats
```

**Example Response:**
```json
{
  "keys": 45,
  "memory": "12.3MB",
  "hitRate": 94.5,
  "metadata": {
    "lastUpdated": "2026-01-29T03:05:15Z",
    "ttl": 86400,
    "itemCount": 50,
    "algorithmVersion": "1.0.0"
  }
}
```

---

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| 400 | Bad Request | Missing required parameter |
| 404 | Not Found | User or resource not found |
| 500 | Internal Error | Server error |
| 503 | Service Unavailable | Cache or database unavailable |

**Example Error Response:**
```json
{
  "error": "Failed to generate recommendations",
  "message": "User vector not found",
  "timestamp": "2026-01-29T10:30:00Z"
}
```

---

## Rate Limiting

| Endpoint | Rate Limit | Window |
|----------|------------|--------|
| `/popular` | 100 req | 1 min |
| `/cold-start` | 20 req | 1 min |
| `/onboarding/complete` | 5 req | 1 min |
| `/refine` | 50 req | 1 min |
| Admin endpoints | 10 req | 1 min |

---

## Webhooks (Kafka Events)

### Published Events

#### ai.onboarding.completed
Emitted when onboarding workflow completes.

```json
{
  "userId": "user123",
  "primarySegment": "CULTURAL_ENTHUSIAST",
  "confidence": 0.85,
  "recommendationCount": 30,
  "timestamp": "2026-01-29T08:15:00Z"
}
```

#### ai.popularity.refreshed
Emitted after popularity scores refresh.

```json
{
  "success": true,
  "destinationsUpdated": 8542,
  "duration": 245000,
  "topDestinationId": "PAR",
  "timestamp": "2026-01-29T03:05:15Z"
}
```

### Consumed Events

#### user.onboarding.completed
Triggers cold start workflow.

```json
{
  "userId": "user123",
  "profile": { /* TravelOnboardingProfile */ },
  "completedAt": "2026-01-29T08:15:00Z"
}
```

---

## Testing

### Postman Collection
Available at: `dreamscape-tests/postman/cold-start.json`

### Example Test Users

```javascript
// Budget Backpacker
{
  userId: "test-budget-001",
  expectedSegment: "BUDGET_BACKPACKER"
}

// Family Explorer
{
  userId: "test-family-001",
  expectedSegment: "FAMILY_EXPLORER"
}
```

---

**Version**: 1.0
**Last Updated**: 2026-01-29
