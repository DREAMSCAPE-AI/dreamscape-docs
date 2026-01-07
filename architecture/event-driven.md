---
id: event-driven-patterns
title: Event-Driven Architecture Patterns
description: Patterns et bonnes pratiques d'architecture événementielle dans DreamScape
sidebar_label: Event-Driven Patterns
sidebar_position: 5
tags: [architecture, events, kafka, patterns, microservices]
---

# Event-Driven Architecture Patterns

## Vue d'Ensemble

DreamScape utilise une architecture événementielle (Event-Driven Architecture - EDA) pour la communication asynchrone entre microservices. Cette approche offre un couplage faible, une scalabilité élevée et une résilience accrue.

## Principes Fondamentaux

### 1. Couplage Faible (Loose Coupling)

Les services communiquent via des événements sans se connaître directement.

```
❌ Couplage Fort (Synchrone)
┌──────────────┐     HTTP      ┌──────────────┐
│ User Service │──────────────▶│ Auth Service │
└──────────────┘               └──────────────┘
   (Attend une réponse immédiate)

✅ Couplage Faible (Asynchrone)
┌──────────────┐    Event      ┌───────┐    Event    ┌──────────────┐
│ User Service │──────────────▶│ Kafka │─────────────▶│ Auth Service │
└──────────────┘               └───────┘              └──────────────┘
   (Continue sans attendre)
```

### 2. Événements Immuables

Les événements sont des faits qui se sont produits et ne peuvent pas être modifiés.

```typescript
// ❌ Mauvais: État mutable
const userEvent = {
  userId: '123',
  status: 'active'  // Peut changer
};

// ✅ Bon: Fait immuable
const userCreatedEvent = {
  eventId: '550e8400-e29b-41d4-a716-446655440000',
  eventType: 'user.created',
  timestamp: '2024-01-15T10:30:00.000Z',
  payload: {
    userId: '123',
    email: 'john@example.com',
    createdAt: '2024-01-15T10:30:00.000Z'
  }
};
```

### 3. Event Sourcing (Optionnel)

L'état d'une entité peut être reconstruit en rejouant ses événements.

```typescript
// Événements d'un utilisateur
const events = [
  { type: 'user.created', payload: { email: 'john@example.com' } },
  { type: 'user.profile.updated', payload: { firstName: 'John' } },
  { type: 'user.preferences.updated', payload: { language: 'fr' } }
];

// Reconstruction de l'état actuel
const currentState = events.reduce((state, event) => {
  return { ...state, ...event.payload };
}, {});
```

## Patterns d'Architecture

### 1. Event Notification

**Utilisation**: Notifier d'autres services qu'un événement s'est produit.

**Exemple**: User Service notifie qu'un utilisateur a été créé.

```typescript
// user-service: Publier l'événement
await userKafkaService.publish('dreamscape.user.created', {
  eventId: generateUUID(),
  eventType: 'user.created',
  timestamp: new Date().toISOString(),
  version: '1.0',
  source: 'user-service',
  payload: {
    userId: user.id,
    email: user.email,
    createdAt: user.createdAt
  }
});

// auth-service: Réagir à l'événement
await authKafkaService.subscribe('dreamscape.user.created', async (event) => {
  // Créer une session initiale pour le nouvel utilisateur
  await createInitialSession(event.payload.userId);
});

// ai-service: Réagir à l'événement
await aiKafkaService.subscribe('dreamscape.user.created', async (event) => {
  // Initialiser le profil de recommandations
  await initializeRecommendationProfile(event.payload.userId);
});
```

**Avantages**:
- Plusieurs services peuvent réagir indépendamment
- Ajout de nouveaux consumers sans modifier le producteur
- Scalabilité horizontale

**Inconvénients**:
- Pas de réponse immédiate
- Complexité du débogage
- Gestion de la cohérence éventuelle

### 2. Event-Carried State Transfer

**Utilisation**: Inclure toutes les données nécessaires dans l'événement pour éviter les appels de suivi.

```typescript
// ❌ Mauvais: Données minimales (force les consumers à faire des appels)
await publish('dreamscape.user.profile.updated', {
  payload: {
    userId: '123'  // Le consumer doit appeler user-service pour obtenir le profil
  }
});

// ✅ Bon: Toutes les données pertinentes incluses
await publish('dreamscape.user.profile.updated', {
  payload: {
    userId: '123',
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+33612345678',
    avatar: 'https://...',
    updatedAt: '2024-01-15T10:30:00.000Z'
  }
});
```

**Avantages**:
- Pas d'appels synchrones entre services
- Meilleure performance (pas de latence réseau)
- Résilience (service source peut être down)

**Inconvénients**:
- Messages plus gros
- Duplication des données
- Risque de désynchronisation

### 3. SAGA Pattern

**Utilisation**: Orchestrer des transactions distribuées avec compensation en cas d'échec.

#### SAGA Chorégraphiée (Recommandée pour DreamScape)

Chaque service réagit aux événements et publie ses propres événements.

```typescript
// Exemple: Processus de réservation

// 1. Voyage Service: Créer réservation
async function createBooking(bookingData) {
  const booking = await db.booking.create({ data: bookingData, status: 'PENDING' });

  await voyageKafkaService.publish('dreamscape.voyage.booking.created', {
    payload: { bookingId: booking.id, userId: booking.userId, amount: booking.amount }
  });

  return booking;
}

// 2. Payment Service: Réagir et traiter le paiement
await paymentKafkaService.subscribe('dreamscape.voyage.booking.created', async (event) => {
  try {
    const payment = await processPayment(event.payload);

    // Succès: Publier payment.completed
    await paymentKafkaService.publish('dreamscape.payment.completed', {
      payload: { transactionId: payment.id, bookingId: event.payload.bookingId }
    });
  } catch (error) {
    // Échec: Publier payment.failed
    await paymentKafkaService.publish('dreamscape.payment.failed', {
      payload: { bookingId: event.payload.bookingId, reason: error.message }
    });
  }
});

// 3. Voyage Service: Réagir au résultat du paiement
await voyageKafkaService.subscribe('dreamscape.payment.completed', async (event) => {
  // Confirmer la réservation
  await db.booking.update({
    where: { id: event.payload.bookingId },
    data: { status: 'CONFIRMED' }
  });

  await voyageKafkaService.publish('dreamscape.voyage.booking.confirmed', {
    payload: { bookingId: event.payload.bookingId }
  });
});

await voyageKafkaService.subscribe('dreamscape.payment.failed', async (event) => {
  // Compensation: Annuler la réservation
  await db.booking.update({
    where: { id: event.payload.bookingId },
    data: { status: 'CANCELLED', cancelReason: 'PAYMENT_FAILED' }
  });

  await voyageKafkaService.publish('dreamscape.voyage.booking.cancelled', {
    payload: { bookingId: event.payload.bookingId, reason: 'PAYMENT_FAILED' }
  });
});
```

**Avantages**:
- Pas de coordinateur central (point de défaillance unique)
- Chaque service est autonome
- Scalable et résilient

**Inconvénients**:
- Complexité de compréhension du flux global
- Débogage plus difficile
- Risque de cycles infinis

#### SAGA Orchestrée (Alternative)

Un service coordonne la transaction.

```typescript
// Booking Orchestrator Service
class BookingSaga {
  async execute(bookingData) {
    const sagaId = generateUUID();
    let currentStep = 'START';

    try {
      // Étape 1: Créer réservation
      currentStep = 'CREATE_BOOKING';
      const booking = await this.createBooking(bookingData);

      // Étape 2: Traiter paiement
      currentStep = 'PROCESS_PAYMENT';
      const payment = await this.processPayment(booking);

      // Étape 3: Confirmer réservation
      currentStep = 'CONFIRM_BOOKING';
      await this.confirmBooking(booking.id);

      return { success: true, bookingId: booking.id };

    } catch (error) {
      // Compensation selon l'étape échouée
      await this.compensate(currentStep, sagaId);
      throw error;
    }
  }

  async compensate(failedStep, sagaId) {
    switch (failedStep) {
      case 'CONFIRM_BOOKING':
        await this.refundPayment(sagaId);
        // fall through
      case 'PROCESS_PAYMENT':
        await this.cancelBooking(sagaId);
        break;
    }
  }
}
```

**Avantages**:
- Flux explicite et facile à comprendre
- Centralisation de la logique de compensation
- Débogage simplifié

**Inconvénients**:
- Point de défaillance unique (orchestrateur)
- Couplage plus fort
- Moins scalable

### 4. CQRS (Command Query Responsibility Segregation)

**Utilisation**: Séparer les opérations de lecture et d'écriture.

```typescript
// Write Model (Commands)
class UserCommandHandler {
  async createUser(command: CreateUserCommand) {
    const user = await db.user.create({ data: command });

    // Publier événement
    await publish('dreamscape.user.created', { payload: user });

    return user.id;
  }

  async updateUserProfile(command: UpdateProfileCommand) {
    await db.userProfile.update({
      where: { userId: command.userId },
      data: command.profileData
    });

    await publish('dreamscape.user.profile.updated', {
      payload: { userId: command.userId, ...command.profileData }
    });
  }
}

// Read Model (Queries) - Vue matérialisée optimisée
class UserQueryHandler {
  async getUserWithStats(userId: string) {
    // Lecture depuis une vue matérialisée mise à jour par les événements
    return await redis.get(`user:${userId}:stats`);
  }
}

// Event Handler: Mettre à jour le Read Model
await subscribe('dreamscape.user.profile.updated', async (event) => {
  // Mettre à jour la vue matérialisée
  const stats = await calculateUserStats(event.payload.userId);
  await redis.set(`user:${event.payload.userId}:stats`, JSON.stringify(stats));
});
```

**Avantages**:
- Optimisation indépendante lecture/écriture
- Scalabilité (read replicas)
- Performance améliorée

**Inconvénients**:
- Cohérence éventuelle
- Complexité accrue
- Duplication des données

### 5. Event Sourcing Complet

**Utilisation**: Stocker tous les changements d'état comme une séquence d'événements.

```typescript
// Event Store
const userEvents = [
  { seq: 1, type: 'user.created', payload: { email: 'john@example.com' } },
  { seq: 2, type: 'user.profile.updated', payload: { firstName: 'John' } },
  { seq: 3, type: 'user.preferences.updated', payload: { language: 'fr' } }
];

// Reconstruction de l'état
function rehydrateUser(userId: string): User {
  const events = eventStore.getEvents(`user:${userId}`);

  return events.reduce((user, event) => {
    switch (event.type) {
      case 'user.created':
        return new User(event.payload);
      case 'user.profile.updated':
        user.updateProfile(event.payload);
        return user;
      case 'user.preferences.updated':
        user.updatePreferences(event.payload);
        return user;
      default:
        return user;
    }
  }, null);
}

// Snapshot pour performance
function getUserCurrentState(userId: string): User {
  // Charger le dernier snapshot
  const snapshot = snapshotStore.get(`user:${userId}`);

  // Rejouer uniquement les événements après le snapshot
  const recentEvents = eventStore.getEventsSince(`user:${userId}`, snapshot.seq);

  return recentEvents.reduce((user, event) => applyEvent(user, event), snapshot.user);
}
```

**Avantages**:
- Audit trail complet
- Time travel (état à n'importe quel moment)
- Debugging facilité
- Reconstruction possible

**Inconvénients**:
- Complexité importante
- Snapshots nécessaires pour performance
- Difficulté de migration du schéma d'événements

## Patterns de Messaging

### 1. Publish-Subscribe

Un événement peut être consommé par plusieurs services.

```
Publisher                Kafka Topic               Subscribers
┌──────────┐           ┌──────────────┐          ┌──────────┐
│  User    │──────────▶│  user.       │─────────▶│  Auth    │
│ Service  │           │  created     │          │ Service  │
└──────────┘           └──────────────┘          └──────────┘
                              │                   ┌──────────┐
                              └──────────────────▶│   AI     │
                                                  │ Service  │
                                                  └──────────┘
```

### 2. Competing Consumers

Plusieurs instances d'un même service consomment en parallèle (load balancing).

```
Publisher              Kafka Topic                Consumer Group
┌──────────┐         ┌──────────────┐           ┌──────────────┐
│  Voyage  │────────▶│  voyage.     │──────────▶│ AI Service   │
│ Service  │         │  search      │           │ Instance 1   │
└──────────┘         │              │           └──────────────┘
                     │  Partition 0 │           ┌──────────────┐
                     │  Partition 1 │──────────▶│ AI Service   │
                     │  Partition 2 │           │ Instance 2   │
                     └──────────────┘           └──────────────┘
```

### 3. Message Routing

Router les messages selon leur contenu.

```typescript
// Routage basé sur le type d'événement
await subscribe('dreamscape.payment.*', async (event) => {
  switch (event.eventType) {
    case 'payment.completed':
      await handlePaymentCompleted(event);
      break;
    case 'payment.failed':
      await handlePaymentFailed(event);
      break;
    case 'payment.refunded':
      await handlePaymentRefunded(event);
      break;
  }
});
```

## Patterns de Fiabilité

### 1. At-Least-Once Delivery

Le message est délivré au moins une fois (peut être dupliqué).

```typescript
// Producer: Configurer retry
const producer = kafka.producer({
  retry: {
    retries: 8,
    initialRetryTime: 100,
  },
  idempotent: false,  // Permet les doublons
});

// Consumer: Traitement idempotent
await subscribe('dreamscape.user.created', async (event) => {
  // Vérifier si déjà traité
  const processed = await redis.get(`event:${event.eventId}`);
  if (processed) {
    console.log('Event already processed, skipping');
    return;
  }

  // Traiter l'événement
  await processEvent(event);

  // Marquer comme traité
  await redis.set(`event:${event.eventId}`, 'true', 'EX', 86400);
});
```

### 2. Exactly-Once Semantics

Le message est délivré exactement une fois (coûteux en performance).

```typescript
// Producer: Activer idempotence + transactions
const producer = kafka.producer({
  idempotent: true,
  transactionalId: 'user-service-tx',
  maxInFlightRequests: 1,
});

// Publier dans une transaction
await producer.transaction(async (tx) => {
  await tx.send({
    topic: 'dreamscape.user.created',
    messages: [{ value: JSON.stringify(event) }],
  });
});

// Consumer: Transactions avec offset management
await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    const transaction = await producer.transaction();

    try {
      // Traiter le message
      await processMessage(message);

      // Commit offset dans la transaction
      await transaction.sendOffsets({
        consumerGroupId: 'my-group',
        topics: [{ topic, partitions: [{ partition, offset: message.offset }] }],
      });

      await transaction.commit();
    } catch (error) {
      await transaction.abort();
      throw error;
    }
  },
});
```

### 3. Dead Letter Queue (DLQ)

Messages en échec sont envoyés vers une queue spéciale.

```typescript
async function handleMessage(message: Message) {
  const maxRetries = 3;
  const retryCount = Number(message.headers.retryCount || 0);

  try {
    await processMessage(message);
  } catch (error) {
    if (retryCount < maxRetries) {
      // Retry avec backoff
      await publish('dreamscape.retry.queue', {
        ...message,
        headers: {
          ...message.headers,
          retryCount: retryCount + 1,
          retryDelay: Math.pow(2, retryCount) * 1000,
        },
      });
    } else {
      // Envoyer vers DLQ après max retries
      await publish('dreamscape.dead.letter.queue', {
        ...message,
        headers: {
          ...message.headers,
          failedAt: new Date().toISOString(),
          error: error.message,
        },
      });
    }
  }
}
```

## Anti-Patterns à Éviter

### ❌ 1. Event Chaining Excessif

```typescript
// Mauvais: Chaîne d'événements trop longue
A → B → C → D → E → F
```

**Problème**: Difficile à déboguer, latence cumulée, risque d'échec en cascade.

**Solution**: Utiliser l'orchestration (SAGA) ou réduire la granularité.

### ❌ 2. Événements Trop Gros

```typescript
// Mauvais: Inclure des données binaires ou de gros objets
await publish('user.profile.updated', {
  payload: {
    userId: '123',
    avatar: '<base64 de 5MB>',  // ❌ Trop gros
    documents: [/* 100 documents */]  // ❌ Trop gros
  }
});
```

**Solution**: Stocker dans un blob store et inclure uniquement l'URL.

### ❌ 3. Synchronisation Stricte via Événements

```typescript
// Mauvais: Attendre une réponse via événement
await publish('user.validate');
const response = await waitForEvent('user.validation.result');  // ❌
```

**Solution**: Utiliser HTTP pour les communications synchrones requises.

### ❌ 4. Pas de Versioning des Événements

```typescript
// Mauvais: Changer le schéma sans versioning
// V1
{ userId: '123', name: 'John' }

// V2 (breaking change)
{ userId: '123', firstName: 'John', lastName: 'Doe' }  // ❌ V1 consumers cassés
```

**Solution**: Versioning explicite + rétrocompatibilité.

```typescript
// Bon
{
  version: '2.0',
  payload: {
    userId: '123',
    firstName: 'John',
    lastName: 'Doe',
    name: 'John Doe'  // Rétrocompatibilité
  }
}
```

## Best Practices DreamScape

### 1. Nommage des Événements

```
dreamscape.<domain>.<entity>.<action>
```

Exemples:
- `dreamscape.user.created`
- `dreamscape.voyage.booking.confirmed`
- `dreamscape.payment.completed`

### 2. Structure des Événements

```typescript
interface BaseEvent<T> {
  eventId: string;          // UUID unique
  eventType: string;        // Type d'événement
  timestamp: string;        // ISO 8601
  version: string;          // Version du schéma
  source: string;           // Service émetteur
  correlationId?: string;   // Traçabilité
  causationId?: string;     // Événement déclencheur
  metadata?: object;        // Métadonnées additionnelles
  payload: T;               // Données spécifiques
}
```

### 3. Gestion des Erreurs

- Retry avec backoff exponentiel
- Dead Letter Queue après 3 tentatives
- Logging détaillé avec correlationId
- Alerting sur taux d'erreur élevé

### 4. Monitoring

Métriques clés:
- Nombre d'événements publiés/consommés
- Latence de traitement
- Consumer lag
- Taux d'erreur
- Taille des messages

### 5. Testing

```typescript
// Test unitaire avec mock
jest.mock('@dreamscape/kafka');

test('publishUserCreated sends correct event', async () => {
  const mockPublish = jest.fn();
  (userKafkaService.publish as jest.Mock) = mockPublish;

  await createUser({ email: 'test@example.com' });

  expect(mockPublish).toHaveBeenCalledWith(
    'dreamscape.user.created',
    expect.objectContaining({
      eventType: 'user.created',
      payload: expect.objectContaining({ email: 'test@example.com' })
    })
  );
});

// Test d'intégration avec Kafka réel
test('user creation triggers auth session creation', async () => {
  const user = await createUser({ email: 'test@example.com' });

  // Attendre que l'événement soit consommé
  await waitFor(() => {
    expect(sessionExists(user.id)).toBe(true);
  });
});
```

## Documentation Liée

- [Infrastructure Kafka](../infrastructure/kafka.md)
- [Kafka Architecture (Services)](../services/kafka-architecture.md)
- [Auth Events](../events/auth-events.md)
- [User Events](../events/user-events.md)
- [Payment Events](../events/payment-events.md)

## Références

- [Martin Fowler - Event-Driven Architecture](https://martinfowler.com/articles/201701-event-driven.html)
- [Microservices Patterns (Chris Richardson)](https://microservices.io/patterns/data/event-driven-architecture.html)
- [SAGA Pattern](https://microservices.io/patterns/data/saga.html)
- [CQRS Pattern](https://martinfowler.com/bliki/CQRS.html)

---

**Version**: 1.0.0
**Dernière mise à jour**: 7 janvier 2026
**Auteurs**: Équipe DreamScape Architecture
