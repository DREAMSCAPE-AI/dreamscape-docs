# Auth Events Documentation

**Ticket**: DR-382 / DR-383 - US-INFRA-011.1
**Service**: auth-service (Core Pod)
**Version**: 1.0
**Last Updated**: 2025-12-18

## Overview

This document describes the Kafka events published by the `auth-service` when authentication actions occur. These events enable other services in the DreamScape ecosystem to track user authentication, session management, and security-related activities in real-time.

## Event Topics

All auth events follow the naming convention: `dreamscape.auth.<event>`

| Topic | Event Type | Description |
|-------|------------|-------------|
| `dreamscape.auth.login` | auth.login | Published when a user successfully logs in |
| `dreamscape.auth.logout` | auth.logout | Published when a user logs out |
| `dreamscape.auth.token.refreshed` | auth.token.refreshed | Published when an authentication token is refreshed |
| `dreamscape.auth.password.changed` | auth.password.changed | Published when a user changes their password |
| `dreamscape.auth.password.reset.requested` | auth.password.reset.requested | Published when a password reset is requested |
| `dreamscape.auth.account.locked` | auth.account.locked | Published when an account is locked (security) |

## Event Structure

All events follow the standard DreamScape event structure:

```typescript
interface BaseEvent<T> {
  eventId: string;           // Unique event identifier (UUID v4)
  eventType: string;          // Event type (e.g., "auth.login")
  timestamp: string;          // ISO 8601 timestamp
  version: string;            // Event schema version (e.g., "1.0")
  source: string;             // Source service (e.g., "auth-service")
  correlationId?: string;     // Optional correlation ID for tracing
  causationId?: string;       // Optional ID of the event that caused this one
  metadata?: Record<string, unknown>; // Optional metadata
  payload: T;                 // Event-specific payload
}
```

## Event Payloads

### 1. auth.login

**Topic**: `dreamscape.auth.login`
**Published by**: auth-service
**Consumed by**: user-service, ai-service, analytics-service, security-service

```typescript
interface AuthLoginPayload {
  userId: string;                    // User unique identifier
  sessionId: string;                 // Session unique identifier
  ipAddress: string;                 // IP address of the login
  userAgent: string;                 // User agent string
  loginAt: string;                   // ISO 8601 timestamp
  method: 'password' | 'oauth' | 'token'; // Authentication method used
}
```

**Example**:
```json
{
  "eventId": "a1b2c3d4-e5f6-4a5b-8c7d-9e8f7a6b5c4d",
  "eventType": "auth.login",
  "timestamp": "2025-12-18T10:30:00.000Z",
  "version": "1.0",
  "source": "auth-service",
  "payload": {
    "userId": "usr_123456789",
    "sessionId": "sess_abc123xyz",
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "loginAt": "2025-12-18T10:30:00.000Z",
    "method": "password"
  }
}
```

**Use Cases**:
- Track user login activity
- Detect suspicious login patterns
- Analytics on login methods
- Session management

### 2. auth.logout

**Topic**: `dreamscape.auth.logout`
**Published by**: auth-service
**Consumed by**: user-service, analytics-service

```typescript
interface AuthLogoutPayload {
  userId: string;                    // User unique identifier
  sessionId: string;                 // Session unique identifier
  logoutAt: string;                  // ISO 8601 timestamp
  reason?: 'user_initiated' | 'session_expired' | 'forced'; // Logout reason
}
```

**Example**:
```json
{
  "eventId": "b2c3d4e5-f6a7-4b5c-9d8e-0f1a2b3c4d5e",
  "eventType": "auth.logout",
  "timestamp": "2025-12-18T11:45:00.000Z",
  "version": "1.0",
  "source": "auth-service",
  "payload": {
    "userId": "usr_123456789",
    "sessionId": "sess_abc123xyz",
    "logoutAt": "2025-12-18T11:45:00.000Z",
    "reason": "user_initiated"
  }
}
```

**Use Cases**:
- Clean up user sessions
- Track session duration
- Analyze logout patterns

### 3. auth.token.refreshed

**Topic**: `dreamscape.auth.token.refreshed`
**Published by**: auth-service
**Consumed by**: analytics-service, security-service

```typescript
interface AuthTokenRefreshedPayload {
  userId: string;                    // User unique identifier
  sessionId: string;                 // Session unique identifier
  refreshedAt: string;               // ISO 8601 timestamp
  expiresAt: string;                 // ISO 8601 timestamp of new expiration
}
```

**Example**:
```json
{
  "eventId": "c3d4e5f6-a7b8-4c5d-0e9f-1a2b3c4d5e6f",
  "eventType": "auth.token.refreshed",
  "timestamp": "2025-12-18T12:00:00.000Z",
  "version": "1.0",
  "source": "auth-service",
  "payload": {
    "userId": "usr_123456789",
    "sessionId": "sess_abc123xyz",
    "refreshedAt": "2025-12-18T12:00:00.000Z",
    "expiresAt": "2025-12-25T12:00:00.000Z"
  }
}
```

**Use Cases**:
- Monitor token refresh patterns
- Detect token abuse
- Session analytics

### 4. auth.password.changed

**Topic**: `dreamscape.auth.password.changed`
**Published by**: auth-service
**Consumed by**: user-service, notification-service, security-service

```typescript
interface AuthPasswordChangedPayload {
  userId: string;                    // User unique identifier
  changedAt: string;                 // ISO 8601 timestamp
  method: 'user_initiated' | 'admin_reset' | 'forgot_password'; // Change method
}
```

**Example**:
```json
{
  "eventId": "d4e5f6a7-b8c9-4d5e-1f0a-2b3c4d5e6f7a",
  "eventType": "auth.password.changed",
  "timestamp": "2025-12-18T13:15:00.000Z",
  "version": "1.0",
  "source": "auth-service",
  "payload": {
    "userId": "usr_123456789",
    "changedAt": "2025-12-18T13:15:00.000Z",
    "method": "user_initiated"
  }
}
```

**Use Cases**:
- Send notification emails
- Invalidate all active sessions
- Security audit logs
- Track password change frequency

### 5. auth.password.reset.requested

**Topic**: `dreamscape.auth.password.reset.requested`
**Published by**: auth-service
**Consumed by**: notification-service, security-service

```typescript
interface AuthPasswordResetRequestedPayload {
  userId: string;                    // User unique identifier
  email: string;                     // User email address
  requestedAt: string;               // ISO 8601 timestamp
  expiresAt: string;                 // ISO 8601 timestamp
  resetToken: string;                // Password reset token (hashed)
}
```

**Example**:
```json
{
  "eventId": "e5f6a7b8-c9d0-4e5f-2a0b-3c4d5e6f7a8b",
  "eventType": "auth.password.reset.requested",
  "timestamp": "2025-12-18T14:00:00.000Z",
  "version": "1.0",
  "source": "auth-service",
  "payload": {
    "userId": "usr_123456789",
    "email": "john.doe@example.com",
    "requestedAt": "2025-12-18T14:00:00.000Z",
    "expiresAt": "2025-12-18T15:00:00.000Z",
    "resetToken": "hashed_token_abc123"
  }
}
```

**Use Cases**:
- Send password reset emails
- Track reset request patterns
- Detect potential abuse
- Security monitoring

### 6. auth.account.locked

**Topic**: `dreamscape.auth.account.locked`
**Published by**: auth-service
**Consumed by**: notification-service, security-service, admin-service

```typescript
interface AuthAccountLockedPayload {
  userId: string;                    // User unique identifier
  lockedAt: string;                  // ISO 8601 timestamp
  reason: 'too_many_attempts' | 'suspicious_activity' | 'admin_action'; // Lock reason
  unlockAt?: string;                 // Optional auto-unlock timestamp
}
```

**Example**:
```json
{
  "eventId": "f6a7b8c9-d0e1-4f5a-3b0c-4d5e6f7a8b9c",
  "eventType": "auth.account.locked",
  "timestamp": "2025-12-18T15:30:00.000Z",
  "version": "1.0",
  "source": "auth-service",
  "payload": {
    "userId": "usr_123456789",
    "lockedAt": "2025-12-18T15:30:00.000Z",
    "reason": "too_many_attempts",
    "unlockAt": "2025-12-18T16:30:00.000Z"
  }
}
```

**Use Cases**:
- Send account locked notifications
- Security alerts
- Admin dashboard updates
- Fraud detection

## Triggering Events

### User Login
**Route**: `POST /api/v1/auth/login`

Publishes:
- `auth.login` (on successful login)

### User Logout
**Route**: `POST /api/v1/auth/logout`

Publishes:
- `auth.logout`

### Token Refresh
**Route**: `POST /api/v1/auth/refresh`

Publishes:
- `auth.token.refreshed` (on successful refresh)

### Password Change
**Route**: `POST /api/v1/auth/change-password`

Publishes:
- `auth.password.changed`

### Password Reset Request
**Route**: `POST /api/v1/auth/forgot-password`

Publishes:
- `auth.password.reset.requested`

### Account Lock (Security)
**Trigger**: Multiple failed login attempts or admin action

Publishes:
- `auth.account.locked`

## Consumer Integration Guide

### Prerequisites

1. Add the `@dreamscape/kafka` package dependency
2. Configure Kafka connection (brokers, authentication)
3. Define consumer group ID

### Example Consumer (Node.js/TypeScript)

```typescript
import {
  getKafkaClient,
  KAFKA_TOPICS,
  CONSUMER_GROUPS,
  type AuthLoginPayload,
  type AuthPasswordChangedPayload,
  type BaseEvent
} from '@dreamscape/kafka';

// Initialize Kafka client
const kafka = getKafkaClient('my-service');
await kafka.connect();

// Subscribe to auth events
await kafka.subscribe(CONSUMER_GROUPS.AI_SERVICE, [
  {
    topic: KAFKA_TOPICS.AUTH_LOGIN,
    handler: async (message: BaseEvent<AuthLoginPayload>) => {
      console.log(`User ${message.payload.userId} logged in from ${message.payload.ipAddress}`);

      // Track login for user behavior analysis
      await trackUserLogin({
        userId: message.payload.userId,
        method: message.payload.method,
        timestamp: message.payload.loginAt,
      });
    },
  },
  {
    topic: KAFKA_TOPICS.AUTH_PASSWORD_CHANGED,
    handler: async (message: BaseEvent<AuthPasswordChangedPayload>) => {
      console.log(`Password changed for user ${message.payload.userId}`);

      // Send notification email
      await sendPasswordChangedEmail(message.payload.userId);
    },
  },
]);

console.log('Subscribed to auth events');
```

### Error Handling

```typescript
await kafka.subscribe(CONSUMER_GROUPS.MY_SERVICE, [
  {
    topic: KAFKA_TOPICS.AUTH_LOGIN,
    handler: async (message) => {
      try {
        await processLoginEvent(message);
      } catch (error) {
        console.error('Failed to process login event:', error);
        // Implement dead letter queue or retry logic
        await sendToDeadLetterQueue(message, error);
      }
    },
  },
]);
```

## Producer Integration Guide

### Publishing Events from Auth Service

```typescript
import authKafkaService from './services/KafkaService';

// Initialize Kafka on service startup
await authKafkaService.initialize();

// Publish login event
await authKafkaService.publishLogin({
  userId: user.id,
  sessionId: session.id,
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  loginAt: new Date().toISOString(),
  method: 'password',
});

// Publish password changed event
await authKafkaService.publishPasswordChanged({
  userId: user.id,
  changedAt: new Date().toISOString(),
  method: 'user_initiated',
});

// Publish account locked event
await authKafkaService.publishAccountLocked({
  userId: user.id,
  lockedAt: new Date().toISOString(),
  reason: 'too_many_attempts',
  unlockAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
});
```

## Event Flow Examples

### Login Flow

```
1. User sends credentials → auth-service
2. auth-service validates credentials
3. auth-service creates session
4. auth-service publishes auth.login → Kafka
5. Consumers react:
   - analytics-service: Track login
   - ai-service: Update user behavior model
   - security-service: Check for anomalies
```

### Password Reset Flow

```
1. User requests password reset → auth-service
2. auth-service generates reset token
3. auth-service publishes auth.password.reset.requested → Kafka
4. notification-service consumes event
5. notification-service sends password reset email
6. User clicks link and sets new password
7. auth-service publishes auth.password.changed → Kafka
8. notification-service sends confirmation email
```

### Account Lock Flow

```
1. User fails login 5 times → auth-service
2. auth-service locks account
3. auth-service publishes auth.account.locked → Kafka
4. Consumers react:
   - notification-service: Send account locked email
   - security-service: Log security event
   - admin-service: Update admin dashboard
```

## Partitioning Strategy

All auth events are partitioned by `userId` to ensure:
- Ordered processing of events for the same user
- Even distribution across Kafka partitions
- Scalability for high-volume scenarios

## Security Considerations

1. **Sensitive Data**: The `resetToken` in password reset events is hashed before publishing
2. **IP Addresses**: Logged for security but consider GDPR compliance
3. **User Agents**: Stored for analytics but anonymized where required
4. **Session IDs**: Not linked directly to user data in analytics

## Monitoring & Observability

### Key Metrics

- **auth.login**: Login rate, failed login attempts
- **auth.logout**: Logout rate, session duration
- **auth.token.refreshed**: Token refresh rate
- **auth.password.changed**: Password change frequency
- **auth.password.reset.requested**: Reset request rate
- **auth.account.locked**: Account lock rate, unlock success rate

### Alerting

- High rate of failed logins
- Unusual login patterns (geo-location, time of day)
- High password reset request rate
- Frequent account locks

## Schema Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-18 | Initial release |

## Related Documentation

- [User Events Documentation](./user-events.md)
- [Payment Events Documentation](./payment-events.md)
- [Event-Driven Architecture Guide](../architecture/event-driven.md)
- [Kafka Configuration Guide](../infrastructure/kafka.md)

## Support

For questions or issues:
- **Slack**: #dreamscape-backend-events
- **Email**: backend-team@dreamscape.com
- **Jira**: DR-382 / DR-383
