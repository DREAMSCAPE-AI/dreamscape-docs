---
id: kafka-architecture-services
title: Kafka Architecture - Service Integration
description: How DreamScape microservices integrate with Apache Kafka for event-driven communication
sidebar_label: Kafka Architecture
sidebar_position: 10
tags: [kafka, architecture, events, messaging, microservices]
---

# Kafka Architecture - Service Integration

## Vue d'Ensemble

Cette documentation décrit comment chaque microservice DreamScape intègre Apache Kafka pour la communication asynchrone et événementielle. Tous les services utilisent le package partagé **@dreamscape/kafka** pour une interface unifiée.

## Package Partagé: @dreamscape/kafka

### Localisation

```
dreamscape-services/packages/kafka/
├── src/
│   ├── KafkaService.ts         # Classe principale
│   ├── types.ts                # Types TypeScript
│   ├── utils.ts                # Utilitaires
│   └── index.ts                # Exports
├── package.json
└── tsconfig.json
```

### Installation

```bash
# Dans chaque service
cd dreamscape-services/<service-name>
npm install @dreamscape/kafka
```

### Interface Principale

```typescript
// @dreamscape/kafka/src/KafkaService.ts
import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';

export class KafkaService {
  private kafka: Kafka;
  private producer: Producer | null = null;
  private consumers: Map<string, Consumer> = new Map();

  constructor(config: KafkaConfig) {
    this.kafka = new Kafka({
      clientId: config.clientId,
      brokers: config.brokers,
      logLevel: config.logLevel || logLevel.INFO,
    });
  }

  // Initialize producer
  async initialize(): Promise<void>;

  // Publish event to topic
  async publish<T>(topic: string, event: BaseEvent<T>): Promise<void>;

  // Subscribe to topic
  async subscribe(
    topic: string,
    groupId: string,
    handler: (payload: EachMessagePayload) => Promise<void>
  ): Promise<void>;

  // Graceful shutdown
  async shutdown(): Promise<void>;
}
```

## Architecture par Service

### 1. Auth Service (Port 3001)

**Responsabilités Kafka** :
- Publier les événements d'authentification
- Écouter les événements utilisateur pour la synchronisation

#### Topics Publiés

| Topic | Événement | Payload |
|-------|-----------|---------|
| `dreamscape.auth.login` | Connexion utilisateur | `{ userId, timestamp, ipAddress, userAgent }` |
| `dreamscape.auth.logout` | Déconnexion utilisateur | `{ userId, sessionId, timestamp }` |
| `dreamscape.auth.token.refreshed` | Token rafraîchi | `{ userId, oldTokenId, newTokenId }` |
| `dreamscape.auth.password.changed` | Mot de passe changé | `{ userId, timestamp }` |
| `dreamscape.auth.password.reset.requested` | Demande de reset MDP | `{ email, resetToken, expiresAt }` |
| `dreamscape.auth.account.locked` | Compte verrouillé | `{ userId, reason, lockedUntil }` |

#### Topics Consommés

| Topic | Action |
|-------|--------|
| `dreamscape.user.created` | Créer session d'authentification |
| `dreamscape.user.deleted` | Invalider tous les tokens |

#### Implémentation

```typescript
// auth-service/src/services/KafkaService.ts
import { KafkaService } from '@dreamscape/kafka';

export const authKafkaService = new KafkaService({
  clientId: 'auth-service',
  brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
  groupId: 'dreamscape-auth-service-group',
});

// Initialize on startup
export async function initializeKafka() {
  await authKafkaService.initialize();

  // Subscribe to user events
  await authKafkaService.subscribe(
    'dreamscape.user.created',
    'dreamscape-auth-service-group',
    handleUserCreated
  );

  await authKafkaService.subscribe(
    'dreamscape.user.deleted',
    'dreamscape-auth-service-group',
    handleUserDeleted
  );

  console.log('✅ Auth Kafka service initialized');
}

// Publish login event
export async function publishLoginEvent(userId: string, metadata: any) {
  await authKafkaService.publish('dreamscape.auth.login', {
    eventId: generateUUID(),
    eventType: 'auth.login',
    timestamp: new Date().toISOString(),
    version: '1.0',
    source: 'auth-service',
    payload: {
      userId,
      ...metadata
    }
  });
}
```

### 2. User Service (Port 3002)

**Responsabilités Kafka** :
- Publier les événements utilisateur (CRUD)
- Publier les événements de profil et préférences
- Écouter les événements auth pour la synchronisation

#### Topics Publiés (DR-264)

| Topic | Événement | Payload |
|-------|-----------|---------|
| `dreamscape.user.created` | Nouvel utilisateur | `{ userId, email, firstName, lastName }` |
| `dreamscape.user.updated` | Utilisateur mis à jour | `{ userId, changes: {} }` |
| `dreamscape.user.deleted` | Utilisateur supprimé | `{ userId, deletedAt }` |
| `dreamscape.user.profile.updated` | Profil modifié (DR-265) | `{ userId, profileData: {} }` |
| `dreamscape.user.preferences.updated` | Préférences modifiées (DR-266) | `{ userId, preferences: {} }` |

#### Topics Consommés

| Topic | Action |
|-------|--------|
| `dreamscape.auth.login` | Mettre à jour lastLogin |
| `dreamscape.payment.completed` | Mettre à jour statut premium |

#### Implémentation (DR-264)

```typescript
// user-service/src/services/KafkaService.ts
import { KafkaService } from '@dreamscape/kafka';

export const userKafkaService = new KafkaService({
  clientId: 'user-service',
  brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
  groupId: 'dreamscape-user-service-group',
});

// Initialize with graceful shutdown
export async function initializeKafka() {
  await userKafkaService.initialize();
  console.log('✅ User Kafka service initialized');
}

// Publish user profile updated event (DR-265)
export async function publishUserProfileUpdated(userId: string, profileData: any) {
  await userKafkaService.publish('dreamscape.user.profile.updated', {
    eventId: generateUUID(),
    eventType: 'user.profile.updated',
    timestamp: new Date().toISOString(),
    version: '1.0',
    source: 'user-service',
    payload: {
      userId,
      profileData
    }
  });
}

// Publish user preferences updated event (DR-266)
export async function publishUserPreferencesUpdated(userId: string, preferences: any) {
  await userKafkaService.publish('dreamscape.user.preferences.updated', {
    eventId: generateUUID(),
    eventType: 'user.preferences.updated',
    timestamp: new Date().toISOString(),
    version: '1.0',
    source: 'user-service',
    payload: {
      userId,
      preferences
    }
  });
}
```

**Tests d'intégration** (DR-264): Voir `dreamscape-tests/integration/kafka/user-events-kafka.test.ts`

### 3. Voyage Service (Port 3004)

**Responsabilités Kafka** :
- Publier les événements de recherche et réservation
- Écouter les événements de paiement
- Notifier l'AI service des sélections utilisateur

#### Topics Publiés

| Topic | Événement | Payload |
|-------|-----------|---------|
| `dreamscape.voyage.search.performed` | Recherche effectuée | `{ userId, searchCriteria, resultCount }` |
| `dreamscape.voyage.booking.created` | Réservation créée | `{ bookingId, userId, flightId, hotelId }` |
| `dreamscape.voyage.booking.confirmed` | Réservation confirmée | `{ bookingId, confirmationCode }` |
| `dreamscape.voyage.booking.cancelled` | Réservation annulée | `{ bookingId, reason }` |
| `dreamscape.voyage.booking.updated` | Réservation modifiée | `{ bookingId, changes: {} }` |
| `dreamscape.voyage.flight.selected` | Vol sélectionné | `{ userId, flightId, flightData }` |
| `dreamscape.voyage.hotel.selected` | Hôtel sélectionné | `{ userId, hotelId, hotelData }` |

#### Topics Consommés

| Topic | Action |
|-------|--------|
| `dreamscape.payment.completed` | Confirmer la réservation |
| `dreamscape.payment.failed` | Annuler la réservation |

#### Implémentation

```typescript
// voyage-service/src/services/KafkaService.ts
import { KafkaService } from '@dreamscape/kafka';

export const voyageKafkaService = new KafkaService({
  clientId: 'voyage-service',
  brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
  groupId: 'dreamscape-voyage-service-group',
});

// Subscribe to payment events
export async function initializeKafka() {
  await voyageKafkaService.initialize();

  await voyageKafkaService.subscribe(
    'dreamscape.payment.completed',
    'dreamscape-voyage-service-group',
    handlePaymentCompleted
  );

  await voyageKafkaService.subscribe(
    'dreamscape.payment.failed',
    'dreamscape-voyage-service-group',
    handlePaymentFailed
  );
}

// Publish search event
export async function publishSearchPerformed(userId: string, searchCriteria: any) {
  await voyageKafkaService.publish('dreamscape.voyage.search.performed', {
    eventId: generateUUID(),
    eventType: 'voyage.search.performed',
    timestamp: new Date().toISOString(),
    version: '1.0',
    source: 'voyage-service',
    payload: {
      userId,
      searchCriteria,
      resultCount: searchCriteria.results?.length || 0
    }
  });
}
```

### 4. Payment Service (Port 3003)

**Responsabilités Kafka** :
- Publier les événements de transaction
- Écouter les événements de réservation
- Notifier l'échec/succès des paiements

#### Topics Publiés

| Topic | Événement | Payload |
|-------|-----------|---------|
| `dreamscape.payment.initiated` | Paiement initié | `{ transactionId, userId, amount, currency }` |
| `dreamscape.payment.completed` | Paiement réussi | `{ transactionId, stripePaymentId }` |
| `dreamscape.payment.failed` | Paiement échoué | `{ transactionId, errorCode, reason }` |
| `dreamscape.payment.refunded` | Remboursement complet | `{ transactionId, refundId, amount }` |
| `dreamscape.payment.partial.refund` | Remboursement partiel | `{ transactionId, refundId, amount }` |

#### Topics Consommés

| Topic | Action |
|-------|--------|
| `dreamscape.voyage.booking.created` | Initier le paiement |
| `dreamscape.voyage.booking.cancelled` | Traiter le remboursement |

#### Implémentation

```typescript
// payment-service/src/services/KafkaService.ts
import { KafkaService } from '@dreamscape/kafka';

export const paymentKafkaService = new KafkaService({
  clientId: 'payment-service',
  brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
  groupId: 'dreamscape-payment-service-group',
});

// Publish payment completed
export async function publishPaymentCompleted(transactionId: string, stripePaymentId: string) {
  await paymentKafkaService.publish('dreamscape.payment.completed', {
    eventId: generateUUID(),
    eventType: 'payment.completed',
    timestamp: new Date().toISOString(),
    version: '1.0',
    source: 'payment-service',
    payload: {
      transactionId,
      stripePaymentId
    }
  });
}
```

### 5. AI Service (Port 3005)

**Responsabilités Kafka** :
- Analyser le comportement utilisateur
- Générer des recommandations
- Publier les prédictions

#### Topics Publiés

| Topic | Événement | Payload |
|-------|-----------|---------|
| `dreamscape.ai.recommendation.requested` | Demande de recommandation | `{ userId, context }` |
| `dreamscape.ai.recommendation.generated` | Recommandation créée | `{ userId, recommendations: [] }` |
| `dreamscape.ai.prediction.made` | Prédiction générée | `{ userId, predictionType, data }` |
| `dreamscape.ai.user.behavior.analyzed` | Comportement analysé | `{ userId, insights: {} }` |

#### Topics Consommés

| Topic | Action |
|-------|--------|
| `dreamscape.voyage.search.performed` | Analyser les préférences |
| `dreamscape.voyage.flight.selected` | Mettre à jour le profil |
| `dreamscape.voyage.hotel.selected` | Affiner les recommandations |
| `dreamscape.user.profile.updated` | Recalculer les recommandations |

#### Implémentation

```typescript
// ai-service/src/services/KafkaService.ts
import { KafkaService } from '@dreamscape/kafka';

export const aiKafkaService = new KafkaService({
  clientId: 'ai-service',
  brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
  groupId: 'dreamscape-ai-service-group',
});

// Subscribe to user behavior events
export async function initializeKafka() {
  await aiKafkaService.initialize();

  const topics = [
    'dreamscape.voyage.search.performed',
    'dreamscape.voyage.flight.selected',
    'dreamscape.voyage.hotel.selected',
    'dreamscape.user.profile.updated',
  ];

  for (const topic of topics) {
    await aiKafkaService.subscribe(
      topic,
      'dreamscape-ai-service-group',
      analyzeBehavior
    );
  }
}

// Publish recommendation
export async function publishRecommendation(userId: string, recommendations: any[]) {
  await aiKafkaService.publish('dreamscape.ai.recommendation.generated', {
    eventId: generateUUID(),
    eventType: 'ai.recommendation.generated',
    timestamp: new Date().toISOString(),
    version: '1.0',
    source: 'ai-service',
    payload: {
      userId,
      recommendations
    }
  });
}
```

## Patterns d'Intégration

### 1. Fire-and-Forget

Publier un événement sans attendre de réponse.

```typescript
// Ne bloque pas le flux HTTP
async function createUser(userData: any) {
  const user = await db.user.create({ data: userData });

  // Fire-and-forget: ne bloque pas la réponse HTTP
  userKafkaService.publish('dreamscape.user.created', {
    eventId: generateUUID(),
    eventType: 'user.created',
    timestamp: new Date().toISOString(),
    version: '1.0',
    source: 'user-service',
    payload: user
  }).catch(err => {
    console.error('Failed to publish event:', err);
    // L'événement échoue mais l'opération DB réussit
  });

  return user;
}
```

### 2. Guaranteed Delivery

S'assurer que l'événement est publié avant de répondre.

```typescript
async function processPayment(transactionData: any) {
  const transaction = await db.transaction.create({ data: transactionData });

  // Attendre la publication avant de répondre
  await paymentKafkaService.publish('dreamscape.payment.completed', {
    eventId: generateUUID(),
    eventType: 'payment.completed',
    timestamp: new Date().toISOString(),
    version: '1.0',
    source: 'payment-service',
    payload: transaction
  });

  return transaction;
}
```

### 3. Event Sourcing

Reconstruire l'état à partir des événements.

```typescript
// Reconstruire l'historique d'un utilisateur
async function getUserHistory(userId: string) {
  const events = await fetchEventsForUser(userId);

  return events.reduce((state, event) => {
    switch (event.eventType) {
      case 'user.created':
        return { ...state, ...event.payload };
      case 'user.profile.updated':
        return { ...state, profile: event.payload.profileData };
      case 'user.preferences.updated':
        return { ...state, preferences: event.payload.preferences };
      default:
        return state;
    }
  }, {});
}
```

### 4. SAGA Pattern

Orchestration de transactions distribuées.

```typescript
// Exemple: Booking SAGA
async function handleBookingCreated(event: BookingCreatedEvent) {
  try {
    // Étape 1: Initier le paiement
    await publishPaymentInitiated(event.payload.bookingId);

    // Attendre confirmation paiement (dans un autre handler)
  } catch (error) {
    // Compensation: annuler la réservation
    await publishBookingCancelled(event.payload.bookingId, 'Payment failed');
  }
}
```

## Gestion des Erreurs

### Retry Strategy

```typescript
// Configuration du producer avec retry
const producer = kafka.producer({
  retry: {
    initialRetryTime: 100,
    retries: 8,
    maxRetryTime: 30000,
    multiplier: 2,
    randomizationFactor: 0.2,
  },
});
```

### Dead Letter Queue

```typescript
// Consumer avec DLQ
async function handleMessage(payload: EachMessagePayload) {
  try {
    await processMessage(payload.message);
  } catch (error) {
    console.error('Failed to process message:', error);

    // Envoyer vers DLQ après 3 tentatives
    if (payload.message.headers.retryCount >= 3) {
      await sendToDeadLetterQueue(payload);
    } else {
      // Retry avec backoff
      await retryMessage(payload);
    }
  }
}
```

## Monitoring et Observabilité

### Health Checks

```typescript
// Vérifier la connexion Kafka
export async function checkKafkaHealth(): Promise<HealthStatus> {
  try {
    await producer.send({
      topic: 'dreamscape.health.check',
      messages: [{ value: 'ping' }],
    });

    return { status: 'healthy', kafka: 'connected' };
  } catch (error) {
    return { status: 'unhealthy', kafka: 'disconnected', error };
  }
}
```

### Métriques

```typescript
// Métriques à collecter
interface KafkaMetrics {
  messagesPublished: number;
  messagesConsumed: number;
  publishErrors: number;
  consumerLag: number;
  avgProcessingTime: number;
}
```

## Graceful Shutdown

```typescript
// Fermeture propre du service
export async function shutdown() {
  console.log('🛑 Shutting down Kafka connections...');

  // Arrêter les consumers
  for (const [topic, consumer] of consumers.entries()) {
    console.log(`  Disconnecting consumer for ${topic}`);
    await consumer.disconnect();
  }

  // Arrêter le producer
  if (producer) {
    console.log('  Disconnecting producer');
    await producer.disconnect();
  }

  console.log('✅ Kafka shutdown complete');
}

// Écouter les signaux
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
```

## Best Practices

### 1. Partitionnement

```typescript
// Partitionner par userId pour ordre garanti
await producer.send({
  topic: 'dreamscape.user.updated',
  messages: [{
    key: userId,  // Même partition pour même userId
    value: JSON.stringify(event)
  }]
});
```

### 2. Idempotence

```typescript
// Activer l'idempotence pour éviter les doublons
const producer = kafka.producer({
  idempotent: true,
  maxInFlightRequests: 5,
  transactionalId: 'user-service-producer',
});
```

### 3. Schema Validation

```typescript
// Valider le schéma avant publication
import Ajv from 'ajv';

const ajv = new Ajv();
const validate = ajv.compile(userCreatedSchema);

export async function publishUserCreated(user: User) {
  const event = { /* ... */ };

  if (!validate(event)) {
    throw new Error('Invalid event schema');
  }

  await producer.send({ topic: 'dreamscape.user.created', messages: [event] });
}
```

### 4. Correlation ID

```typescript
// Traçabilité avec correlationId
export async function publishEvent(topic: string, payload: any, correlationId?: string) {
  await producer.send({
    topic,
    messages: [{
      value: JSON.stringify({
        eventId: generateUUID(),
        correlationId: correlationId || generateUUID(),
        timestamp: new Date().toISOString(),
        payload
      })
    }]
  });
}
```

## Troubleshooting

### Problèmes Courants

1. **Consumer Lag Élevé**
   - Augmenter le nombre d'instances
   - Optimiser le traitement des messages
   - Vérifier les requêtes DB lentes

2. **Messages Perdus**
   - Vérifier `acks=all` pour le producer
   - Activer `idempotent=true`
   - Utiliser les transactions si nécessaire

3. **Ordre des Messages**
   - Utiliser le même `key` pour les messages liés
   - Une seule partition par `key`
   - Éviter de paralléliser le traitement

## Documentation Liée

- [Infrastructure Kafka](../infrastructure/kafka.md)
- [Event-Driven Patterns](../architecture/event-driven.md)
- [Auth Events](../events/auth-events.md)
- [User Events](../events/user-events.md)
- [Payment Events](../events/payment-events.md)

---

**Version**: 1.0.0
**Dernière mise à jour**: 7 janvier 2026
**Auteurs**: Équipe DreamScape Backend
