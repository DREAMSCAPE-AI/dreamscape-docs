# Payment Events Documentation

**Ticket**: DR-382 / DR-384 - US-INFRA-011.2
**Service**: payment-service (Business Pod)
**Version**: 1.0
**Last Updated**: 2025-12-18

## Overview

This document describes the Kafka events published by the `payment-service` when payment transactions occur. These events enable other services in the DreamScape ecosystem to track payment lifecycle, financial transactions, and booking confirmations in real-time.

## Event Topics

All payment events follow the naming convention: `dreamscape.payment.<event>`

| Topic | Event Type | Description |
|-------|------------|-------------|
| `dreamscape.payment.initiated` | payment.initiated | Published when a payment is initiated by a user |
| `dreamscape.payment.completed` | payment.completed | Published when a payment is successfully completed |
| `dreamscape.payment.failed` | payment.failed | Published when a payment fails |
| `dreamscape.payment.refunded` | payment.refunded | Published when a payment is refunded |

## Event Structure

All events follow the standard DreamScape event structure:

```typescript
interface BaseEvent<T> {
  eventId: string;           // Unique event identifier (UUID v4)
  eventType: string;          // Event type (e.g., "payment.initiated")
  timestamp: string;          // ISO 8601 timestamp
  version: string;            // Event schema version (e.g., "1.0")
  source: string;             // Source service (e.g., "payment-service")
  correlationId?: string;     // Optional correlation ID for tracing
  causationId?: string;       // Optional ID of the event that caused this one
  metadata?: Record<string, unknown>; // Optional metadata
  payload: T;                 // Event-specific payload
}
```

## Event Payloads

### 1. payment.initiated

**Topic**: `dreamscape.payment.initiated`
**Published by**: payment-service
**Consumed by**: voyage-service, notification-service, analytics-service

```typescript
interface PaymentInitiatedPayload {
  paymentId: string;                    // Payment unique identifier
  bookingId: string;                    // Associated booking ID
  userId: string;                       // User unique identifier
  amount: number;                       // Payment amount
  currency: string;                     // Currency code (ISO 4217)
  paymentMethod: 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer' | 'crypto'; // Payment method
  initiatedAt: string;                  // ISO 8601 timestamp
}
```

**Example**:
```json
{
  "eventId": "a1b2c3d4-e5f6-4a5b-8c7d-9e8f7a6b5c4d",
  "eventType": "payment.initiated",
  "timestamp": "2025-12-18T10:30:00.000Z",
  "version": "1.0",
  "source": "payment-service",
  "correlationId": "booking-123-payment-flow",
  "payload": {
    "paymentId": "pay_abc123xyz",
    "bookingId": "booking_456def",
    "userId": "usr_123456789",
    "amount": 1250.00,
    "currency": "EUR",
    "paymentMethod": "credit_card",
    "initiatedAt": "2025-12-18T10:30:00.000Z"
  }
}
```

**Use Cases**:
- Track payment attempts
- Lock inventory while payment is processing
- Create pending transaction records
- Analytics on payment methods
- Detect payment abandonment

### 2. payment.completed

**Topic**: `dreamscape.payment.completed`
**Published by**: payment-service
**Consumed by**: voyage-service, user-service, notification-service, analytics-service

```typescript
interface PaymentCompletedPayload {
  paymentId: string;                    // Payment unique identifier
  bookingId: string;                    // Associated booking ID
  userId: string;                       // User unique identifier
  amount: number;                       // Payment amount
  currency: string;                     // Currency code (ISO 4217)
  transactionId: string;                // External payment gateway transaction ID
  completedAt: string;                  // ISO 8601 timestamp
}
```

**Example**:
```json
{
  "eventId": "b2c3d4e5-f6a7-4b5c-9d8e-0f1a2b3c4d5e",
  "eventType": "payment.completed",
  "timestamp": "2025-12-18T10:32:15.000Z",
  "version": "1.0",
  "source": "payment-service",
  "correlationId": "booking-123-payment-flow",
  "causationId": "a1b2c3d4-e5f6-4a5b-8c7d-9e8f7a6b5c4d",
  "payload": {
    "paymentId": "pay_abc123xyz",
    "bookingId": "booking_456def",
    "userId": "usr_123456789",
    "amount": 1250.00,
    "currency": "EUR",
    "transactionId": "stripe_ch_3NqY7L2eZvKYlo2C0XYZ1234",
    "completedAt": "2025-12-18T10:32:15.000Z"
  }
}
```

**Use Cases**:
- Confirm booking reservations
- Send payment confirmation emails
- Update user payment history
- Release inventory hold
- Generate invoices
- Revenue analytics

### 3. payment.failed

**Topic**: `dreamscape.payment.failed`
**Published by**: payment-service
**Consumed by**: voyage-service, notification-service, analytics-service, fraud-detection-service

```typescript
interface PaymentFailedPayload {
  paymentId: string;                    // Payment unique identifier
  bookingId: string;                    // Associated booking ID
  userId: string;                       // User unique identifier
  amount: number;                       // Payment amount
  currency: string;                     // Currency code (ISO 4217)
  errorCode: string;                    // Error code from payment gateway
  errorMessage: string;                 // Human-readable error message
  failedAt: string;                     // ISO 8601 timestamp
}
```

**Example**:
```json
{
  "eventId": "c3d4e5f6-a7b8-4c5d-0e9f-1a2b3c4d5e6f",
  "eventType": "payment.failed",
  "timestamp": "2025-12-18T10:31:45.000Z",
  "version": "1.0",
  "source": "payment-service",
  "correlationId": "booking-123-payment-flow",
  "causationId": "a1b2c3d4-e5f6-4a5b-8c7d-9e8f7a6b5c4d",
  "payload": {
    "paymentId": "pay_abc123xyz",
    "bookingId": "booking_456def",
    "userId": "usr_123456789",
    "amount": 1250.00,
    "currency": "EUR",
    "errorCode": "card_declined",
    "errorMessage": "Your card was declined. Please try another payment method.",
    "failedAt": "2025-12-18T10:31:45.000Z"
  }
}
```

**Use Cases**:
- Notify user of payment failure
- Release inventory hold
- Track failed payment patterns
- Fraud detection
- Payment retry logic
- Analytics on failure reasons

### 4. payment.refunded

**Topic**: `dreamscape.payment.refunded`
**Published by**: payment-service
**Consumed by**: voyage-service, user-service, notification-service, analytics-service

```typescript
interface PaymentRefundedPayload {
  paymentId: string;                    // Original payment unique identifier
  bookingId: string;                    // Associated booking ID
  userId: string;                       // User unique identifier
  refundAmount: number;                 // Refund amount (may be partial)
  currency: string;                     // Currency code (ISO 4217)
  refundId: string;                     // Refund transaction ID
  reason: string;                       // Reason for refund
  refundedAt: string;                   // ISO 8601 timestamp
}
```

**Example**:
```json
{
  "eventId": "d4e5f6a7-b8c9-4d5e-1f0a-2b3c4d5e6f7a",
  "eventType": "payment.refunded",
  "timestamp": "2025-12-20T14:15:00.000Z",
  "version": "1.0",
  "source": "payment-service",
  "correlationId": "booking-123-refund-flow",
  "payload": {
    "paymentId": "pay_abc123xyz",
    "bookingId": "booking_456def",
    "userId": "usr_123456789",
    "refundAmount": 1250.00,
    "currency": "EUR",
    "refundId": "refund_xyz789abc",
    "reason": "Customer requested cancellation",
    "refundedAt": "2025-12-20T14:15:00.000Z"
  }
}
```

**Use Cases**:
- Update booking status to cancelled
- Send refund confirmation emails
- Update user transaction history
- Track refund metrics
- Financial reconciliation
- Customer service analytics

## Triggering Events

### Payment Initiation
**Route**: `POST /api/v1/payments` (future implementation)

Publishes:
- `payment.initiated` (on payment start)

### Payment Completion
**Trigger**: Payment gateway webhook callback (e.g., Stripe webhook)

Publishes:
- `payment.completed` (on successful payment)
- `payment.failed` (on failed payment)

### Payment Refund
**Route**: `POST /api/v1/payments/:paymentId/refund` (future implementation)

Publishes:
- `payment.refunded` (on successful refund)

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
  type PaymentInitiatedPayload,
  type PaymentCompletedPayload,
  type PaymentFailedPayload,
  type PaymentRefundedPayload,
  type BaseEvent
} from '@dreamscape/kafka';

// Initialize Kafka client
const kafka = getKafkaClient('my-service');
await kafka.connect();

// Subscribe to payment events
await kafka.subscribe(CONSUMER_GROUPS.VOYAGE_SERVICE, [
  {
    topic: KAFKA_TOPICS.PAYMENT_INITIATED,
    handler: async (message: BaseEvent<PaymentInitiatedPayload>) => {
      console.log(`Payment initiated: ${message.payload.paymentId}`);

      // Mark booking as payment pending
      await updateBookingStatus(message.payload.bookingId, 'payment_pending');
    },
  },
  {
    topic: KAFKA_TOPICS.PAYMENT_COMPLETED,
    handler: async (message: BaseEvent<PaymentCompletedPayload>) => {
      console.log(`Payment completed: ${message.payload.paymentId}`);

      // Confirm the booking
      await confirmBooking({
        bookingId: message.payload.bookingId,
        paymentId: message.payload.paymentId,
        transactionId: message.payload.transactionId,
      });
    },
  },
  {
    topic: KAFKA_TOPICS.PAYMENT_FAILED,
    handler: async (message: BaseEvent<PaymentFailedPayload>) => {
      console.log(`Payment failed: ${message.payload.paymentId}`);

      // Mark booking as payment failed
      await updateBookingStatus(message.payload.bookingId, 'payment_failed');

      // Release inventory hold
      await releaseInventoryHold(message.payload.bookingId);
    },
  },
  {
    topic: KAFKA_TOPICS.PAYMENT_REFUNDED,
    handler: async (message: BaseEvent<PaymentRefundedPayload>) => {
      console.log(`Payment refunded: ${message.payload.paymentId}`);

      // Cancel the booking
      await cancelBooking({
        bookingId: message.payload.bookingId,
        reason: message.payload.reason,
        refundAmount: message.payload.refundAmount,
      });
    },
  },
]);

console.log('Subscribed to payment events');
```

### Error Handling

```typescript
await kafka.subscribe(CONSUMER_GROUPS.MY_SERVICE, [
  {
    topic: KAFKA_TOPICS.PAYMENT_COMPLETED,
    handler: async (message) => {
      try {
        await processPaymentCompletion(message);
      } catch (error) {
        console.error('Failed to process payment completion:', error);

        // Implement dead letter queue or retry logic
        await sendToDeadLetterQueue(message, error);
      }
    },
  },
]);
```

## Producer Integration Guide

### Publishing Events from Payment Service

```typescript
import paymentKafkaService from './services/KafkaService';

// Initialize Kafka on service startup
await paymentKafkaService.initialize();

// Publish payment initiated event
await paymentKafkaService.publishPaymentInitiated(
  {
    paymentId: payment.id,
    bookingId: payment.bookingId,
    userId: payment.userId,
    amount: payment.amount,
    currency: payment.currency,
    paymentMethod: payment.method,
    initiatedAt: new Date().toISOString(),
  },
  correlationId // Optional correlation ID for tracing
);

// Publish payment completed event
await paymentKafkaService.publishPaymentCompleted(
  {
    paymentId: payment.id,
    bookingId: payment.bookingId,
    userId: payment.userId,
    amount: payment.amount,
    currency: payment.currency,
    transactionId: stripeCharge.id,
    completedAt: new Date().toISOString(),
  },
  correlationId
);

// Publish payment failed event
await paymentKafkaService.publishPaymentFailed(
  {
    paymentId: payment.id,
    bookingId: payment.bookingId,
    userId: payment.userId,
    amount: payment.amount,
    currency: payment.currency,
    errorCode: error.code,
    errorMessage: error.message,
    failedAt: new Date().toISOString(),
  },
  correlationId
);

// Publish payment refunded event
await paymentKafkaService.publishPaymentRefunded(
  {
    paymentId: payment.id,
    bookingId: payment.bookingId,
    userId: payment.userId,
    refundAmount: refund.amount,
    currency: payment.currency,
    refundId: refund.id,
    reason: refund.reason,
    refundedAt: new Date().toISOString(),
  },
  correlationId
);
```

## Event Flow Examples

### Successful Payment Flow

```
1. User submits payment → payment-service
2. payment-service initiates payment with gateway (Stripe)
3. payment-service publishes payment.initiated → Kafka
4. voyage-service consumes event → marks booking as "payment_pending"
5. Payment gateway processes payment
6. Payment gateway webhook → payment-service
7. payment-service publishes payment.completed → Kafka
8. Consumers react:
   - voyage-service: Confirms booking, sends confirmation number
   - notification-service: Sends payment receipt email
   - user-service: Updates user payment history
   - analytics-service: Tracks successful payment
```

### Failed Payment Flow

```
1. User submits payment → payment-service
2. payment-service initiates payment with gateway
3. payment-service publishes payment.initiated → Kafka
4. voyage-service consumes event → marks booking as "payment_pending"
5. Payment gateway rejects payment (e.g., card declined)
6. Payment gateway webhook → payment-service
7. payment-service publishes payment.failed → Kafka
8. Consumers react:
   - voyage-service: Updates booking status to "payment_failed"
   - voyage-service: Releases inventory hold
   - notification-service: Sends payment failed email with retry link
   - analytics-service: Tracks payment failure reason
```

### Refund Flow

```
1. User requests cancellation → voyage-service
2. voyage-service creates cancellation request
3. voyage-service calls payment-service refund API
4. payment-service initiates refund with gateway
5. payment-service publishes payment.refunded → Kafka
6. Consumers react:
   - voyage-service: Updates booking status to "cancelled"
   - notification-service: Sends refund confirmation email
   - user-service: Updates user transaction history
   - analytics-service: Tracks refund metrics
```

## Partitioning Strategy

All payment events are partitioned by `paymentId` to ensure:
- Ordered processing of events for the same payment
- Even distribution across Kafka partitions
- Scalability for high-volume scenarios

Alternative partitioning by `bookingId` ensures ordering of all payment events related to a specific booking.

## Security Considerations

1. **Sensitive Data**: Credit card details are NEVER included in events - only tokenized references
2. **PCI Compliance**: Payment gateway tokens and transaction IDs are stored securely
3. **Amount Validation**: Always validate amounts match between events and database
4. **Idempotency**: Event consumers must handle duplicate events gracefully
5. **Encryption**: Consider encrypting sensitive event payloads at rest in Kafka

## Financial Reconciliation

### Daily Reconciliation Process

1. **Event Sourcing**: All payment events are stored for audit trail
2. **Reconciliation**: Daily job compares Kafka events with payment gateway reports
3. **Discrepancy Detection**: Alert on mismatches between events and gateway
4. **Compliance**: Maintain events for required retention period (7 years for financial data)

### Key Metrics

- **payment.initiated**: Payment initiation rate, average amount
- **payment.completed**: Success rate, revenue by payment method
- **payment.failed**: Failure rate, failure reasons distribution
- **payment.refunded**: Refund rate, refund amount vs original payment

## Monitoring & Observability

### Key Metrics

- **Payment Success Rate**: (completed / initiated) * 100
- **Average Payment Amount**: Mean and median across all completed payments
- **Payment Method Distribution**: Breakdown by credit_card, paypal, etc.
- **Time to Complete**: Duration from initiated to completed
- **Failed Payment Rate**: Percentage and reasons for failures
- **Refund Rate**: Percentage of completed payments that get refunded
- **Revenue**: Total completed payment amounts by currency

### Alerting

- High payment failure rate (> 5%)
- Payment gateway unavailable
- Unusual payment amounts (potential fraud)
- High refund rate (> 10%)
- Payment processing delays (> 2 minutes)
- Discrepancies in reconciliation

## Integration with Payment Gateways

### Stripe Integration

```typescript
// Webhook endpoint for Stripe events
app.post('/webhooks/stripe', async (req, res) => {
  const signature = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
      case 'payment_intent.succeeded':
        await paymentKafkaService.publishPaymentCompleted({
          paymentId: event.data.object.metadata.paymentId,
          bookingId: event.data.object.metadata.bookingId,
          userId: event.data.object.metadata.userId,
          amount: event.data.object.amount / 100,
          currency: event.data.object.currency.toUpperCase(),
          transactionId: event.data.object.id,
          completedAt: new Date().toISOString(),
        });
        break;

      case 'payment_intent.payment_failed':
        await paymentKafkaService.publishPaymentFailed({
          paymentId: event.data.object.metadata.paymentId,
          bookingId: event.data.object.metadata.bookingId,
          userId: event.data.object.metadata.userId,
          amount: event.data.object.amount / 100,
          currency: event.data.object.currency.toUpperCase(),
          errorCode: event.data.object.last_payment_error?.code || 'unknown',
          errorMessage: event.data.object.last_payment_error?.message || 'Payment failed',
          failedAt: new Date().toISOString(),
        });
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send('Webhook error');
  }
});
```

## Schema Version History

| Version | Date | Changes |
|---------|------|------------|
| 1.0 | 2025-12-18 | Initial release |

## Related Documentation

- [User Events Documentation](./user-events.md)
- [Auth Events Documentation](./auth-events.md)
- [Voyage Events Documentation](./voyage-events.md)
- [Event-Driven Architecture Guide](../architecture/event-driven.md)
- [Kafka Configuration Guide](../infrastructure/kafka.md)
- [Payment Gateway Integration](../integrations/payment-gateways.md)

## Support

For questions or issues:
- **Slack**: #dreamscape-backend-events
- **Email**: backend-team@dreamscape.com
- **Jira**: DR-382 / DR-384
