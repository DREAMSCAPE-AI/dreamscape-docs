# User Events Documentation

**Ticket**: DR-264 - US-CORE-007
**Service**: user-service (Core Pod)
**Version**: 1.0
**Last Updated**: 2025-12-12

## Overview

This document describes the Kafka events published by the `user-service` when user profiles and preferences are created or modified. These events enable other services in the DreamScape ecosystem to react to user changes in real-time.

## Event Topics

All user events follow the naming convention: `dreamscape.user.<event>`

| Topic | Event Type | Description |
|-------|------------|-------------|
| `dreamscape.user.created` | user.created | Published when a new user is created (via auth-service) |
| `dreamscape.user.updated` | user.updated | Published when basic user information changes |
| `dreamscape.user.profile.updated` | user.profile.updated | Published when user profile is created or updated |
| `dreamscape.user.preferences.updated` | user.preferences.updated | Published when user preferences change |

## Event Structure

All events follow the standard DreamScape event structure:

```typescript
interface BaseEvent<T> {
  eventId: string;           // Unique event identifier (UUID v4)
  eventType: string;          // Event type (e.g., "user.created")
  timestamp: string;          // ISO 8601 timestamp
  version: string;            // Event schema version (e.g., "1.0")
  source: string;             // Source service (e.g., "user-service")
  correlationId?: string;     // Optional correlation ID for tracing
  causationId?: string;       // Optional ID of the event that caused this one
  metadata?: Record<string, unknown>; // Optional metadata
  payload: T;                 // Event-specific payload
}
```

## Event Payloads

### 1. user.created

**Topic**: `dreamscape.user.created`
**Published by**: auth-service (during registration)
**Consumed by**: user-service, ai-service

```typescript
interface UserCreatedPayload {
  userId: string;              // User unique identifier
  email: string;               // User email address
  firstName?: string;          // User first name (optional)
  lastName?: string;           // User last name (optional)
  createdAt: string;           // ISO 8601 timestamp
}
```

**Example**:
```json
{
  "eventId": "a1b2c3d4-e5f6-4a5b-8c7d-9e8f7a6b5c4d",
  "eventType": "user.created",
  "timestamp": "2025-12-12T10:30:00.000Z",
  "version": "1.0",
  "source": "auth-service",
  "payload": {
    "userId": "usr_123456789",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "createdAt": "2025-12-12T10:30:00.000Z"
  }
}
```

### 2. user.updated

**Topic**: `dreamscape.user.updated`
**Published by**: user-service
**Consumed by**: ai-service, analytics-service

```typescript
interface UserUpdatedPayload {
  userId: string;              // User unique identifier
  changes: Record<string, {    // Map of changed fields
    old: unknown;              // Previous value
    new: unknown;              // New value
  }>;
  updatedAt: string;           // ISO 8601 timestamp
}
```

**Example**:
```json
{
  "eventId": "b2c3d4e5-f6a7-4b5c-9d8e-0f1a2b3c4d5e",
  "eventType": "user.updated",
  "timestamp": "2025-12-12T11:45:00.000Z",
  "version": "1.0",
  "source": "user-service",
  "payload": {
    "userId": "usr_123456789",
    "changes": {
      "username": {
        "old": "johndoe",
        "new": "john_doe_2025"
      },
      "email": {
        "old": "john.old@example.com",
        "new": "john.new@example.com"
      }
    },
    "updatedAt": "2025-12-12T11:45:00.000Z"
  }
}
```

### 3. user.profile.updated

**Topic**: `dreamscape.user.profile.updated`
**Published by**: user-service
**Consumed by**: ai-service, recommendation-service

```typescript
interface UserProfileUpdatedPayload {
  userId: string;              // User unique identifier
  profile: {                   // Updated profile fields
    firstName?: string;        // First name
    lastName?: string;         // Last name
    phone?: string;            // Phone number
    avatar?: string;           // Avatar URL
    dateOfBirth?: string;      // ISO 8601 date
    nationality?: string;      // ISO 3166-1 alpha-2 country code
  };
  updatedAt: string;           // ISO 8601 timestamp
}
```

**Example**:
```json
{
  "eventId": "c3d4e5f6-a7b8-4c5d-0e9f-1a2b3c4d5e6f",
  "eventType": "user.profile.updated",
  "timestamp": "2025-12-12T12:00:00.000Z",
  "version": "1.0",
  "source": "user-service",
  "payload": {
    "userId": "usr_123456789",
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+33612345678",
      "avatar": "/uploads/avatars/avatar-1702382400000-123456789.png",
      "dateOfBirth": "1990-01-15"
    },
    "updatedAt": "2025-12-12T12:00:00.000Z"
  }
}
```

### 4. user.preferences.updated

**Topic**: `dreamscape.user.preferences.updated`
**Published by**: user-service
**Consumed by**: ai-service, recommendation-service, notification-service

```typescript
interface UserPreferencesUpdatedPayload {
  userId: string;              // User unique identifier
  preferences: {               // Updated preferences
    language?: string;         // Language code (ISO 639-1)
    currency?: string;         // Currency code (ISO 4217)
    notifications?: {          // Notification preferences
      email: boolean;          // Email notifications enabled
      sms: boolean;            // SMS notifications enabled
      push: boolean;           // Push notifications enabled
    };
    travelPreferences?: {      // Travel-specific preferences
      seatPreference?: string; // Preferred seat (e.g., "window", "aisle")
      mealPreference?: string; // Meal preference (e.g., "vegetarian")
      classPreference?: string; // Travel class (e.g., "economy", "business")
    };
  };
  updatedAt: string;           // ISO 8601 timestamp
}
```

**Example**:
```json
{
  "eventId": "d4e5f6a7-b8c9-4d5e-1f0a-2b3c4d5e6f7a",
  "eventType": "user.preferences.updated",
  "timestamp": "2025-12-12T13:15:00.000Z",
  "version": "1.0",
  "source": "user-service",
  "payload": {
    "userId": "usr_123456789",
    "preferences": {
      "language": "fr",
      "currency": "EUR",
      "notifications": {
        "email": true,
        "sms": false,
        "push": true
      },
      "travelPreferences": {
        "seatPreference": "window",
        "mealPreference": "vegetarian",
        "classPreference": "economy"
      }
    },
    "updatedAt": "2025-12-12T13:15:00.000Z"
  }
}
```

## Triggering Events

### Profile Creation
**Route**: `POST /api/v1/users/profile/:userId`

Publishes:
- `user.profile.updated`

### Profile Update
**Route**: `PUT /api/v1/users/profile`

Publishes (depending on what changed):
- `user.updated` (if username or email changed)
- `user.profile.updated` (if profile photo changed)
- `user.preferences.updated` (if preferences changed)

### Avatar Upload
**Route**: `POST /api/v1/users/profile/:userId/avatar`

Publishes:
- `user.profile.updated` (with avatar field)

## Consumer Integration Guide

### Prerequisites

1. Add the `@dreamscape/kafka` package dependency
2. Configure Kafka connection (brokers, authentication)
3. Define consumer group ID

### Example Consumer (Node.js)

```typescript
import { getKafkaClient, KAFKA_TOPICS } from '@dreamscape/kafka';

// Initialize Kafka client
const kafka = getKafkaClient('my-service');
await kafka.connect();

// Subscribe to user events
await kafka.subscribe('my-service-group', [
  {
    topic: KAFKA_TOPICS.USER_PROFILE_UPDATED,
    handler: async ({ event, message }) => {
      const { userId, profile } = event.payload;

      // Handle profile update
      console.log(`User ${userId} updated profile:`, profile);

      // Your business logic here
      await updateLocalCache(userId, profile);
    },
  },
  {
    topic: KAFKA_TOPICS.USER_PREFERENCES_UPDATED,
    handler: async ({ event, message }) => {
      const { userId, preferences } = event.payload;

      // Handle preferences update
      console.log(`User ${userId} updated preferences:`, preferences);

      // Your business logic here
      await updateRecommendationEngine(userId, preferences);
    },
  },
]);
```

### Error Handling

All event publishers implement graceful error handling:
- If Kafka is unavailable, errors are logged but don't block the HTTP response
- Events are published asynchronously (fire-and-forget)
- Consumer should implement retry logic with exponential backoff

```typescript
// Example retry logic
const retryWithBackoff = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
};
```

## Event Ordering

- Events are partitioned by `userId` to ensure ordering per user
- All events for the same user will be processed in order
- Cross-user event ordering is not guaranteed

## Schema Evolution

When modifying event schemas:
1. Increment the `version` field
2. Maintain backward compatibility for at least 2 versions
3. Add new fields as optional
4. Never remove or rename existing fields without migration

## Monitoring

### Kafka Metrics

Monitor the following metrics:
- Event production rate (events/second)
- Event lag (time between production and consumption)
- Consumer group lag (messages behind)
- Failed event publications (errors logged)

### Health Checks

The user-service `/health` endpoint includes Kafka connectivity status:

```bash
GET /health
```

Response:
```json
{
  "status": "healthy",
  "kafka": {
    "connected": true,
    "topics": ["dreamscape.user.profile.updated", "dreamscape.user.preferences.updated"]
  }
}
```

## Testing

Integration tests are available in `dreamscape-tests/integration/kafka/user-events-kafka.test.ts`

Run tests:
```bash
cd dreamscape-tests
npm run test:kafka:user-events
```

## Support

For questions or issues with user events:
- **Slack**: #dreamscape-events
- **Documentation**: https://docs.dreamscape.io/events/user
- **Repository**: https://github.com/DREAMSCAPE-AI/dreamscape-services

## Related Documentation

- [Kafka Configuration](../infrastructure/kafka-setup.md)
- [Event-Driven Architecture](../architecture/event-driven.md)
- [User Service API](../api/user-service.md)
- [Auth Service Events](./auth-events.md)
