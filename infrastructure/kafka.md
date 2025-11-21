# DreamScape Kafka Infrastructure

## Overview

Apache Kafka is used as the message broker for event-driven communication between DreamScape microservices. This enables asynchronous, decoupled communication patterns.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DreamScape Kafka Cluster                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Services (Producers)          Kafka           Services (Consumers)
│  ┌─────────────────┐         ┌───────┐        ┌─────────────────┐
│  │   Auth Service  │────────▶│       │───────▶│   AI Service    │
│  │   User Service  │────────▶│ Topics │───────▶│  Notification   │
│  │  Voyage Service │────────▶│       │───────▶│   Analytics     │
│  │ Payment Service │────────▶│       │───────▶│  Other Services │
│  └─────────────────┘         └───────┘        └─────────────────┘
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Components

| Component | Description | Port |
|-----------|-------------|------|
| Zookeeper | Cluster coordination | 2181 |
| Kafka Broker | Message broker | 9092 (external), 29092 (internal) |
| Kafka UI | Web interface for debugging | 8080 |
| Schema Registry | Schema management (optional) | 8081 |

## Topics

### Naming Convention
```
dreamscape.<domain>.<event>[.<sub-event>]
```

### Topic Categories

#### User Domain (5 topics)
- `dreamscape.user.created`
- `dreamscape.user.updated`
- `dreamscape.user.deleted`
- `dreamscape.user.profile.updated`
- `dreamscape.user.preferences.updated`

#### Auth Domain (6 topics)
- `dreamscape.auth.login`
- `dreamscape.auth.logout`
- `dreamscape.auth.token.refreshed`
- `dreamscape.auth.password.changed`
- `dreamscape.auth.password.reset.requested`
- `dreamscape.auth.account.locked`

#### Voyage Domain (7 topics)
- `dreamscape.voyage.search.performed`
- `dreamscape.voyage.booking.created`
- `dreamscape.voyage.booking.confirmed`
- `dreamscape.voyage.booking.cancelled`
- `dreamscape.voyage.booking.updated`
- `dreamscape.voyage.flight.selected`
- `dreamscape.voyage.hotel.selected`

#### Payment Domain (5 topics)
- `dreamscape.payment.initiated`
- `dreamscape.payment.completed`
- `dreamscape.payment.failed`
- `dreamscape.payment.refunded`
- `dreamscape.payment.partial.refund`

#### AI Domain (4 topics)
- `dreamscape.ai.recommendation.requested`
- `dreamscape.ai.recommendation.generated`
- `dreamscape.ai.prediction.made`
- `dreamscape.ai.user.behavior.analyzed`

#### Notification Domain (3 topics)
- `dreamscape.notification.email.requested`
- `dreamscape.notification.sms.requested`
- `dreamscape.notification.push.requested`

#### Analytics Domain (2 topics)
- `dreamscape.analytics.event.tracked`
- `dreamscape.analytics.page.view`

## Getting Started

### Start Kafka Infrastructure

```bash
# Navigate to infra directory
cd dreamscape-infra

# Start minimal Kafka (Zookeeper + Kafka + Topic Init)
docker-compose -f docker/docker-compose.kafka.yml up -d

# Start with Kafka UI for debugging
docker-compose -f docker/docker-compose.kafka.yml --profile ui up -d

# Start with Schema Registry
docker-compose -f docker/docker-compose.kafka.yml --profile schema up -d
```

### Verify Installation

```bash
# Check running containers
docker ps | grep dreamscape

# Access Kafka UI
open http://localhost:8080

# List topics via CLI
docker exec dreamscape-kafka kafka-topics --list --bootstrap-server localhost:9092
```

### Stop Infrastructure

```bash
docker-compose -f docker/docker-compose.kafka.yml down

# Remove volumes (data)
docker-compose -f docker/docker-compose.kafka.yml down -v
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `KAFKA_BROKERS` | Comma-separated broker list | `localhost:9092` |
| `KAFKA_SSL` | Enable SSL | `false` |
| `KAFKA_SASL_USERNAME` | SASL username | - |
| `KAFKA_SASL_PASSWORD` | SASL password | - |
| `KAFKA_SASL_MECHANISM` | SASL mechanism | `plain` |
| `KAFKA_LOG_LEVEL` | Log level | `info` |

### Service Configuration

Each service uses the shared `@dreamscape/kafka` package:

```typescript
// Example: Initialize Kafka in a service
import { authKafkaService } from './services/KafkaService';

async function startService() {
  // Connect to Kafka
  await authKafkaService.initialize();

  // Subscribe to events
  await authKafkaService.subscribeToUserEvents({
    onUserCreated: async (event) => {
      console.log('User created:', event.payload);
    },
  });
}
```

## Event Structure

All events follow a common structure:

```typescript
interface BaseEvent<T> {
  eventId: string;          // Unique event ID (UUID)
  eventType: string;        // Event type (e.g., "user.created")
  timestamp: string;        // ISO 8601 timestamp
  version: string;          // Schema version
  source: string;           // Source service
  correlationId?: string;   // For distributed tracing
  causationId?: string;     // ID of causing event
  metadata?: object;        // Additional metadata
  payload: T;               // Event-specific data
}
```

### Example Event

```json
{
  "eventId": "550e8400-e29b-41d4-a716-446655440000",
  "eventType": "user.created",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0",
  "source": "user-service",
  "correlationId": "corr-123456",
  "payload": {
    "userId": "user-123",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

## Consumer Groups

Each service has its own consumer group:

| Service | Consumer Group |
|---------|---------------|
| Auth | `dreamscape-auth-service-group` |
| User | `dreamscape-user-service-group` |
| Voyage | `dreamscape-voyage-service-group` |
| Payment | `dreamscape-payment-service-group` |
| AI | `dreamscape-ai-service-group` |

## Monitoring

### Health Check Endpoint

Services expose Kafka health via their health endpoints:

```bash
curl http://localhost:3001/health/kafka
```

### Key Metrics

- Consumer lag
- Message throughput
- Error rates
- Partition distribution

### Kafka UI Dashboard

Access at `http://localhost:8080` when running with `--profile ui`:

- View topics and messages
- Monitor consumer groups
- Check broker health
- Manage topics

## Troubleshooting

### Common Issues

1. **Connection refused**
   - Check if Kafka containers are running
   - Verify `KAFKA_BROKERS` environment variable

2. **Consumer lag increasing**
   - Scale consumer instances
   - Check for processing bottlenecks

3. **Message loss**
   - Enable producer idempotence
   - Verify acknowledgment settings

### Debugging Commands

```bash
# View consumer groups
docker exec dreamscape-kafka kafka-consumer-groups \
  --bootstrap-server localhost:9092 --list

# Check consumer lag
docker exec dreamscape-kafka kafka-consumer-groups \
  --bootstrap-server localhost:9092 \
  --describe --group dreamscape-auth-service-group

# Read messages from topic
docker exec dreamscape-kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic dreamscape.user.created \
  --from-beginning --max-messages 5
```

## Related Documentation

- [Kafka Architecture (Services)](../services/kafka-architecture.md)
- [Event-Driven Patterns](../architecture/event-driven.md)
- [Docker Compose Guide](../deployment/docker-compose.md)

## References

- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
- [KafkaJS Documentation](https://kafka.js.org/)
- [Confluent Platform](https://docs.confluent.io/)
