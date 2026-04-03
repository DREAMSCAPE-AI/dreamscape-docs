# Événements Kafka

DreamScape utilise Apache Kafka pour la communication asynchrone entre services.

## Architecture

```
Auth Service  ──publish──▶  dreamscape.auth.*
User Service  ──publish──▶  dreamscape.user.*
                         ◀──consume──  dreamscape.auth.*

Voyage Service ──publish──▶  dreamscape.voyage.*
                          ◀──consume──  dreamscape.payment.*

Payment Service ──publish──▶  dreamscape.payment.*
                           ◀──consume──  (N/A)

AI Service     ──consume──  dreamscape.user.*
               ──consume──  dreamscape.voyage.*
```

## Convention de nommage des topics

```
dreamscape.<domain>.<event>[.<sub-event>]
```

**Exemples :**
- `dreamscape.auth.user.login`
- `dreamscape.user.created`
- `dreamscape.voyage.booking.confirmed`
- `dreamscape.payment.completed`

## Package partagé

Tous les services utilisent `@dreamscape/kafka` (`dreamscape-services/shared/kafka/`) :

```typescript
import { kafkaClient, TOPICS, createEvent } from '@dreamscape/kafka';

// Publier un événement
await kafkaService.publish(TOPICS.USER_CREATED, createEvent({
  userId: '...',
  email: '...',
  createdAt: new Date().toISOString()
}));
```

> Après modification de `@dreamscape/kafka`, lancer `npm run build` dans `shared/kafka/src/` avant de redémarrer les services consommateurs.

## Dégradation gracieuse

Les services démarrent **même si Kafka est indisponible**. Les événements non publiés sont loggés en console mais ne bloquent pas les réponses HTTP.

```typescript
// Pattern obligatoire pour les publications non-critiques
kafkaService.publishLogin(data)
  .catch(err => console.error('[Login] Failed to publish Kafka event:', err));
```

## Configuration

| Variable | Défaut | Description |
|----------|--------|-------------|
| `KAFKA_BROKERS` | `localhost:9092` | Adresses des brokers |
| `KAFKA_CLIENT_ID` | Nom du service | Identifiant client Kafka |
| `KAFKA_GROUP_ID` | `dreamscape-<service>` | Groupe de consommateurs |

## Référence par service

| Document | Topics |
|----------|--------|
| [auth-events.md](auth-events.md) | `dreamscape.auth.*` |
| [user-events.md](user-events.md) | `dreamscape.user.*` |
| [payment-events.md](payment-events.md) | `dreamscape.payment.*` |
| [voyage-events.md](voyage-events.md) | `dreamscape.voyage.*` |
| [ai-events.md](ai-events.md) | Consomme tous les domaines |

## Infrastructure Kafka

Voir [infrastructure/kafka.md](../infrastructure/kafka.md) pour la configuration du cluster, les partitions, et le monitoring.
