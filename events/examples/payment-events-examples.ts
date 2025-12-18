/**
 * Payment Events - Practical Examples
 * DR-382 / DR-384: US-INFRA-011.2 - Événements de paiement
 *
 * This file contains practical examples for consuming and producing payment events
 * in the DreamScape platform
 */

import {
  getKafkaClient,
  KAFKA_TOPICS,
  CONSUMER_GROUPS,
  type PaymentInitiatedPayload,
  type PaymentCompletedPayload,
  type PaymentFailedPayload,
  type PaymentRefundedPayload,
  type MessageHandler,
} from '@dreamscape/kafka';

// ============================================================================
// EXAMPLE 1: Voyage Service - Payment Status Integration
// ============================================================================

/**
 * Example: Voyage service listening to payment events to update booking status
 */
export class VoyagePaymentEventsConsumer {
  private kafkaClient: ReturnType<typeof getKafkaClient>;

  constructor() {
    this.kafkaClient = getKafkaClient('voyage-service');
  }

  async initialize() {
    await this.kafkaClient.connect();
    console.log('✅ Voyage Service Kafka client connected');

    // Subscribe to payment events
    await this.kafkaClient.subscribe(CONSUMER_GROUPS.VOYAGE_SERVICE, [
      {
        topic: KAFKA_TOPICS.PAYMENT_INITIATED,
        handler: this.handlePaymentInitiated.bind(this),
      },
      {
        topic: KAFKA_TOPICS.PAYMENT_COMPLETED,
        handler: this.handlePaymentCompleted.bind(this),
      },
      {
        topic: KAFKA_TOPICS.PAYMENT_FAILED,
        handler: this.handlePaymentFailed.bind(this),
      },
      {
        topic: KAFKA_TOPICS.PAYMENT_REFUNDED,
        handler: this.handlePaymentRefunded.bind(this),
      },
    ]);

    console.log('✅ Subscribed to payment events');
  }

  private handlePaymentInitiated: MessageHandler<PaymentInitiatedPayload> = async ({
    event,
  }) => {
    const { bookingId, paymentId, amount } = event.payload;

    console.log(`[Voyage] Payment ${paymentId} initiated for booking ${bookingId}`);

    // Update booking status to payment_pending
    await this.updateBookingStatus(bookingId, 'payment_pending', {
      paymentId,
      amount,
    });

    // Hold inventory for 15 minutes
    await this.holdInventory(bookingId, 15 * 60 * 1000);
  };

  private handlePaymentCompleted: MessageHandler<PaymentCompletedPayload> = async ({ event }) => {
    const { bookingId, paymentId, transactionId } = event.payload;

    console.log(`[Voyage] Payment ${paymentId} completed for booking ${bookingId}`);

    // Confirm the booking
    await this.confirmBooking(bookingId, {
      paymentId,
      transactionId,
      confirmedAt: event.timestamp,
    });

    // Generate confirmation number
    const confirmationNumber = await this.generateConfirmationNumber(bookingId);

    // Publish booking confirmed event
    await this.publishBookingConfirmed({
      bookingId,
      userId: event.payload.userId,
      confirmationNumber,
      paymentId,
      confirmedAt: event.timestamp,
    });

    console.log(`✅ Booking ${bookingId} confirmed with number ${confirmationNumber}`);
  };

  private handlePaymentFailed: MessageHandler<PaymentFailedPayload> = async ({ event }) => {
    const { bookingId, paymentId, errorCode, errorMessage } = event.payload;

    console.log(`[Voyage] Payment ${paymentId} failed for booking ${bookingId}: ${errorMessage}`);

    // Update booking status to payment_failed
    await this.updateBookingStatus(bookingId, 'payment_failed', {
      paymentId,
      errorCode,
      errorMessage,
    });

    // Release inventory hold
    await this.releaseInventoryHold(bookingId);

    // Track payment failure for analytics
    await this.trackPaymentFailure(bookingId, errorCode);
  };

  private handlePaymentRefunded: MessageHandler<PaymentRefundedPayload> = async ({ event }) => {
    const { bookingId, paymentId, refundAmount, reason } = event.payload;

    console.log(`[Voyage] Payment ${paymentId} refunded for booking ${bookingId}`);

    // Cancel the booking
    await this.cancelBooking(bookingId, {
      paymentId,
      refundAmount,
      reason,
      cancelledAt: event.timestamp,
    });

    console.log(`✅ Booking ${bookingId} cancelled with refund ${refundAmount}`);
  };

  // Helper methods
  private async updateBookingStatus(bookingId: string, status: string, data: any) {
    // Update booking status in database
  }

  private async holdInventory(bookingId: string, durationMs: number) {
    // Hold inventory (flight seats, hotel rooms, etc.)
  }

  private async confirmBooking(bookingId: string, data: any) {
    // Confirm booking in database
  }

  private async generateConfirmationNumber(bookingId: string): Promise<string> {
    // Generate unique confirmation number
    return `DREAM${Date.now().toString().slice(-8)}`;
  }

  private async publishBookingConfirmed(data: any) {
    // Publish booking.confirmed event
  }

  private async releaseInventoryHold(bookingId: string) {
    // Release inventory hold
  }

  private async trackPaymentFailure(bookingId: string, errorCode: string) {
    // Track payment failures for analytics
  }

  private async cancelBooking(bookingId: string, data: any) {
    // Cancel booking in database
  }
}

// ============================================================================
// EXAMPLE 2: Notification Service - Payment Notifications
// ============================================================================

/**
 * Example: Notification service sending payment-related emails
 */
export class NotificationPaymentEventsConsumer {
  private kafkaClient: ReturnType<typeof getKafkaClient>;

  constructor() {
    this.kafkaClient = getKafkaClient('notification-service');
  }

  async initialize() {
    await this.kafkaClient.connect();

    await this.kafkaClient.subscribe(CONSUMER_GROUPS.NOTIFICATION_SERVICE, [
      {
        topic: KAFKA_TOPICS.PAYMENT_COMPLETED,
        handler: this.handlePaymentCompleted.bind(this),
      },
      {
        topic: KAFKA_TOPICS.PAYMENT_FAILED,
        handler: this.handlePaymentFailed.bind(this),
      },
      {
        topic: KAFKA_TOPICS.PAYMENT_REFUNDED,
        handler: this.handlePaymentRefunded.bind(this),
      },
    ]);
  }

  private handlePaymentCompleted: MessageHandler<PaymentCompletedPayload> = async ({ event }) => {
    const { userId, amount, currency, bookingId } = event.payload;

    // Get user email and booking details
    const userEmail = await this.getUserEmail(userId);
    const booking = await this.getBookingDetails(bookingId);

    // Send payment receipt email
    await this.sendEmail({
      to: userEmail,
      template: 'payment-receipt',
      subject: `Payment Confirmation - ${booking.confirmationNumber}`,
      data: {
        amount,
        currency,
        bookingDetails: booking,
        transactionId: event.payload.transactionId,
        timestamp: event.timestamp,
      },
    });

    console.log(`✅ Payment receipt sent to ${userEmail}`);
  };

  private handlePaymentFailed: MessageHandler<PaymentFailedPayload> = async ({ event }) => {
    const { userId, errorMessage, bookingId } = event.payload;

    const userEmail = await this.getUserEmail(userId);

    // Send payment failed notification with retry link
    await this.sendEmail({
      to: userEmail,
      template: 'payment-failed',
      subject: 'Payment Failed - Action Required',
      data: {
        errorMessage,
        retryLink: `https://dreamscape.com/booking/${bookingId}/retry-payment`,
        supportLink: 'https://dreamscape.com/support',
      },
    });

    console.log(`✅ Payment failure notification sent to ${userEmail}`);
  };

  private handlePaymentRefunded: MessageHandler<PaymentRefundedPayload> = async ({ event }) => {
    const { userId, refundAmount, currency, reason } = event.payload;

    const userEmail = await this.getUserEmail(userId);

    // Send refund confirmation email
    await this.sendEmail({
      to: userEmail,
      template: 'payment-refund',
      subject: 'Refund Processed',
      data: {
        refundAmount,
        currency,
        reason,
        processingTime: '5-10 business days',
      },
    });

    console.log(`✅ Refund notification sent to ${userEmail}`);
  };

  private async getUserEmail(userId: string): Promise<string> {
    // Fetch user email from database
    return `user-${userId}@example.com`;
  }

  private async getBookingDetails(bookingId: string) {
    // Fetch booking details
    return { confirmationNumber: 'DREAM12345678' };
  }

  private async sendEmail(config: any) {
    // Send email via email service
  }
}

// ============================================================================
// EXAMPLE 3: Analytics Service - Payment Metrics
// ============================================================================

/**
 * Example: Analytics service tracking payment metrics and revenue
 */
export class AnalyticsPaymentMetrics {
  private kafkaClient: ReturnType<typeof getKafkaClient>;
  private dailyRevenue: Map<string, number> = new Map();
  private paymentMethodStats: Map<string, number> = new Map();

  constructor() {
    this.kafkaClient = getKafkaClient('analytics-service');
  }

  async initialize() {
    await this.kafkaClient.connect();

    await this.kafkaClient.subscribe(CONSUMER_GROUPS.ANALYTICS_SERVICE, [
      {
        topic: KAFKA_TOPICS.PAYMENT_INITIATED,
        handler: this.handlePaymentInitiated.bind(this),
      },
      {
        topic: KAFKA_TOPICS.PAYMENT_COMPLETED,
        handler: this.handlePaymentCompleted.bind(this),
      },
      {
        topic: KAFKA_TOPICS.PAYMENT_FAILED,
        handler: this.handlePaymentFailed.bind(this),
      },
    ]);
  }

  private handlePaymentInitiated: MessageHandler<PaymentInitiatedPayload> = async ({ event }) => {
    const { paymentMethod, amount, currency } = event.payload;

    // Track payment method distribution
    const count = this.paymentMethodStats.get(paymentMethod) || 0;
    this.paymentMethodStats.set(paymentMethod, count + 1);

    // Track initiated payment amount
    await this.trackMetric('payments.initiated', {
      amount,
      currency,
      method: paymentMethod,
    });
  };

  private handlePaymentCompleted: MessageHandler<PaymentCompletedPayload> = async ({ event }) => {
    const { amount, currency, userId } = event.payload;

    // Calculate daily revenue
    const date = new Date(event.timestamp).toISOString().split('T')[0];
    const currentRevenue = this.dailyRevenue.get(date) || 0;
    this.dailyRevenue.set(date, currentRevenue + amount);

    console.log(`[Analytics] Daily revenue for ${date}: ${this.dailyRevenue.get(date)} ${currency}`);

    // Track revenue metrics
    await this.trackRevenue(amount, currency, date);

    // Update user lifetime value
    await this.updateUserLTV(userId, amount);

    // Track payment success rate
    await this.incrementPaymentSuccessRate();
  };

  private handlePaymentFailed: MessageHandler<PaymentFailedPayload> = async ({ event }) => {
    const { errorCode, paymentId } = event.payload;

    // Track payment failure reasons
    await this.trackPaymentFailure(errorCode);

    // Alert if failure rate is high
    const failureRate = await this.calculateFailureRate();
    if (failureRate > 0.05) {
      // 5% threshold
      await this.sendAlert(`High payment failure rate: ${(failureRate * 100).toFixed(2)}%`);
    }
  };

  private async trackMetric(metric: string, data: any) {
    // Send to analytics platform (Mixpanel, Amplitude, etc.)
  }

  private async trackRevenue(amount: number, currency: string, date: string) {
    // Track revenue in analytics platform
  }

  private async updateUserLTV(userId: string, amount: number) {
    // Update user lifetime value
  }

  private async incrementPaymentSuccessRate() {
    // Track payment success rate metric
  }

  private async trackPaymentFailure(errorCode: string) {
    // Track failure reasons
  }

  private async calculateFailureRate(): Promise<number> {
    // Calculate current failure rate
    return 0.02; // 2%
  }

  private async sendAlert(message: string) {
    // Send alert to operations team
  }
}

// ============================================================================
// EXAMPLE 4: Payment Service - Publishing Events
// ============================================================================

/**
 * Example: Payment service publishing events from Stripe webhook
 */
export class PaymentEventPublisher {
  constructor(private paymentKafkaService: any, private stripe: any) {}

  /**
   * Handle Stripe webhook for payment events
   */
  async handleStripeWebhook(req: any, res: any) {
    const signature = req.headers['stripe-signature'];

    try {
      // Verify webhook signature
      const event = this.stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      switch (event.type) {
        case 'payment_intent.created':
          await this.handlePaymentIntentCreated(event);
          break;

        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event);
          break;

        case 'refund.created':
          await this.handleRefundCreated(event);
          break;
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error.message);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  }

  private async handlePaymentIntentCreated(stripeEvent: any) {
    const paymentIntent = stripeEvent.data.object;
    const metadata = paymentIntent.metadata;

    // Publish payment initiated event
    await this.paymentKafkaService.publishPaymentInitiated(
      {
        paymentId: metadata.paymentId,
        bookingId: metadata.bookingId,
        userId: metadata.userId,
        amount: paymentIntent.amount / 100, // Stripe uses cents
        currency: paymentIntent.currency.toUpperCase(),
        paymentMethod: this.mapStripePaymentMethod(paymentIntent.payment_method_types[0]),
        initiatedAt: new Date(paymentIntent.created * 1000).toISOString(),
      },
      metadata.correlationId
    );

    console.log(`✅ Published payment.initiated for ${metadata.paymentId}`);
  }

  private async handlePaymentIntentSucceeded(stripeEvent: any) {
    const paymentIntent = stripeEvent.data.object;
    const metadata = paymentIntent.metadata;

    // Publish payment completed event
    await this.paymentKafkaService.publishPaymentCompleted(
      {
        paymentId: metadata.paymentId,
        bookingId: metadata.bookingId,
        userId: metadata.userId,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        transactionId: paymentIntent.id,
        completedAt: new Date().toISOString(),
      },
      metadata.correlationId
    );

    console.log(`✅ Published payment.completed for ${metadata.paymentId}`);
  }

  private async handlePaymentIntentFailed(stripeEvent: any) {
    const paymentIntent = stripeEvent.data.object;
    const metadata = paymentIntent.metadata;
    const error = paymentIntent.last_payment_error;

    // Publish payment failed event
    await this.paymentKafkaService.publishPaymentFailed(
      {
        paymentId: metadata.paymentId,
        bookingId: metadata.bookingId,
        userId: metadata.userId,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        errorCode: error?.code || 'unknown',
        errorMessage: error?.message || 'Payment failed',
        failedAt: new Date().toISOString(),
      },
      metadata.correlationId
    );

    console.log(`✅ Published payment.failed for ${metadata.paymentId}`);
  }

  private async handleRefundCreated(stripeEvent: any) {
    const refund = stripeEvent.data.object;
    const metadata = refund.metadata;

    // Publish payment refunded event
    await this.paymentKafkaService.publishPaymentRefunded(
      {
        paymentId: metadata.paymentId,
        bookingId: metadata.bookingId,
        userId: metadata.userId,
        refundAmount: refund.amount / 100,
        currency: refund.currency.toUpperCase(),
        refundId: refund.id,
        reason: metadata.reason || 'Customer requested',
        refundedAt: new Date(refund.created * 1000).toISOString(),
      },
      metadata.correlationId
    );

    console.log(`✅ Published payment.refunded for ${metadata.paymentId}`);
  }

  private mapStripePaymentMethod(stripeMethod: string): string {
    const mapping: Record<string, string> = {
      card: 'credit_card',
      paypal: 'paypal',
      bank_transfer: 'bank_transfer',
    };
    return mapping[stripeMethod] || stripeMethod;
  }
}

// ============================================================================
// EXAMPLE 5: Integration Test Helper
// ============================================================================

/**
 * Example: Test helper for payment event integration tests
 */
export class PaymentEventsTestHelper {
  private receivedEvents: any[] = [];
  private kafkaClient: ReturnType<typeof getKafkaClient>;

  constructor() {
    this.kafkaClient = getKafkaClient('payment-test-helper');
  }

  async startCapturing() {
    await this.kafkaClient.connect();
    await this.kafkaClient.subscribe('payment-test-group', [
      {
        topic: KAFKA_TOPICS.PAYMENT_INITIATED,
        handler: this.captureEvent.bind(this),
      },
      {
        topic: KAFKA_TOPICS.PAYMENT_COMPLETED,
        handler: this.captureEvent.bind(this),
      },
      {
        topic: KAFKA_TOPICS.PAYMENT_FAILED,
        handler: this.captureEvent.bind(this),
      },
    ]);
  }

  private captureEvent: MessageHandler<any> = async ({ event }) => {
    this.receivedEvents.push(event);
  };

  async waitForPaymentCompletion(paymentId: string, timeoutMs = 10000): Promise<any> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const event = this.receivedEvents.find(
        e => e.eventType === 'payment.completed' && e.payload.paymentId === paymentId
      );

      if (event) return event;

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    throw new Error(`Timeout waiting for payment completion: ${paymentId}`);
  }

  clearEvents() {
    this.receivedEvents = [];
  }

  async stopCapturing() {
    await this.kafkaClient.disconnect();
  }
}

// ============================================================================
// EXAMPLE 6: Event Validation with JSON Schema
// ============================================================================

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import paymentEventsSchema from '../schemas/payment-events-schema.json';

/**
 * Example: Validating payment events against JSON Schema
 */
export class PaymentEventValidator {
  private ajv: Ajv;

  constructor() {
    this.ajv = new Ajv({ allErrors: true });
    addFormats(this.ajv);
    this.ajv.addSchema(paymentEventsSchema, 'payment-events');
  }

  validateEvent(event: any): { valid: boolean; errors?: string[] } {
    const valid = this.ajv.validate('payment-events', event);

    if (!valid) {
      const errors = this.ajv.errors?.map(e => `${e.instancePath} ${e.message}`) || [];
      return { valid: false, errors };
    }

    return { valid: true };
  }

  /**
   * Example: Validate a payment completed event
   */
  validatePaymentCompletedEvent() {
    const sampleEvent = {
      eventId: 'b2c3d4e5-f6a7-4b5c-9d8e-0f1a2b3c4d5e',
      eventType: 'payment.completed',
      timestamp: new Date().toISOString(),
      version: '1.0',
      source: 'payment-service',
      payload: {
        paymentId: 'pay_abc123xyz',
        bookingId: 'booking_456def',
        userId: 'usr_123456789',
        amount: 1250.0,
        currency: 'EUR',
        transactionId: 'stripe_ch_3NqY7L2eZvKYlo2C0XYZ1234',
        completedAt: new Date().toISOString(),
      },
    };

    const result = this.validateEvent(sampleEvent);
    console.log('Payment completed event validation:', result);
    return result;
  }
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

async function main() {
  // Example 1: Start voyage service consumer
  const voyageConsumer = new VoyagePaymentEventsConsumer();
  await voyageConsumer.initialize();

  // Example 2: Start analytics tracking
  const analyticsTracker = new AnalyticsPaymentMetrics();
  await analyticsTracker.initialize();

  // Example 3: Event validation
  const validator = new PaymentEventValidator();
  validator.validatePaymentCompletedEvent();

  console.log('Payment event consumers initialized');
}

// Uncomment to run examples
// main().catch(console.error);
