/**
 * User Events - Practical Examples
 * DR-264: US-CORE-007 - Événements utilisateur
 *
 * This file contains practical examples for consuming and producing user events
 * in the DreamScape platform
 */

import {
  getKafkaClient,
  KAFKA_TOPICS,
  CONSUMER_GROUPS,
  type UserCreatedPayload,
  type UserUpdatedPayload,
  type UserProfileUpdatedPayload,
  type UserPreferencesUpdatedPayload,
  type MessageHandler,
} from '@dreamscape/kafka';

// ============================================================================
// EXAMPLE 1: Simple Consumer - AI Service
// ============================================================================

/**
 * Example: AI Service consuming user profile updates to improve recommendations
 */
export class AIServiceUserEventsConsumer {
  private kafkaClient: ReturnType<typeof getKafkaClient>;

  constructor() {
    this.kafkaClient = getKafkaClient('ai-service');
  }

  async initialize() {
    await this.kafkaClient.connect();
    console.log('✅ AI Service Kafka client connected');

    // Subscribe to user profile and preferences updates
    await this.kafkaClient.subscribe(CONSUMER_GROUPS.AI_SERVICE, [
      {
        topic: KAFKA_TOPICS.USER_PROFILE_UPDATED,
        handler: this.handleProfileUpdate.bind(this),
      },
      {
        topic: KAFKA_TOPICS.USER_PREFERENCES_UPDATED,
        handler: this.handlePreferencesUpdate.bind(this),
      },
    ]);

    console.log('✅ Subscribed to user events');
  }

  private handleProfileUpdate: MessageHandler<UserProfileUpdatedPayload> = async ({
    event,
    message,
  }) => {
    const { userId, profile } = event.payload;

    console.log(`[AI] User ${userId} updated profile`);

    // Update user profile in AI recommendation engine
    await this.updateUserVector(userId, {
      nationality: profile.nationality,
      ageGroup: this.calculateAgeGroup(profile.dateOfBirth),
    });

    // Trigger recommendation recalculation
    await this.recalculateRecommendations(userId);
  };

  private handlePreferencesUpdate: MessageHandler<UserPreferencesUpdatedPayload> = async ({
    event,
    message,
  }) => {
    const { userId, preferences } = event.payload;

    console.log(`[AI] User ${userId} updated preferences`);

    // Update travel preferences in recommendation model
    if (preferences.travelPreferences) {
      await this.updateTravelPreferences(userId, preferences.travelPreferences);
    }

    // Update language for personalized content
    if (preferences.language) {
      await this.setPreferredLanguage(userId, preferences.language);
    }
  };

  // Helper methods (implementation details)
  private async updateUserVector(userId: string, data: any) {
    // Update ML model user vector
  }

  private calculateAgeGroup(dateOfBirth?: string): string {
    if (!dateOfBirth) return 'unknown';
    const age = new Date().getFullYear() - new Date(dateOfBirth).getFullYear();
    if (age < 25) return '18-24';
    if (age < 35) return '25-34';
    if (age < 50) return '35-49';
    return '50+';
  }

  private async recalculateRecommendations(userId: string) {
    // Trigger AI recommendation engine
  }

  private async updateTravelPreferences(userId: string, prefs: any) {
    // Store travel preferences for recommendations
  }

  private async setPreferredLanguage(userId: string, language: string) {
    // Update language preference
  }
}

// ============================================================================
// EXAMPLE 2: Producer - User Service Integration
// ============================================================================

/**
 * Example: Publishing events from a custom service action
 */
export class CustomUserService {
  constructor(private kafkaService: any) {}

  /**
   * Bulk update user profiles with event publishing
   */
  async bulkUpdateProfiles(updates: Array<{ userId: string; data: any }>) {
    for (const update of updates) {
      try {
        // Update database
        await this.updateProfileInDatabase(update.userId, update.data);

        // Publish event
        await this.kafkaService.publishProfileUpdated({
          userId: update.userId,
          profile: update.data,
          updatedAt: new Date().toISOString(),
        });

        console.log(`✅ Published profile update for user ${update.userId}`);
      } catch (error) {
        console.error(`❌ Failed to update profile for ${update.userId}:`, error);
        // Handle error, maybe add to retry queue
      }
    }
  }

  private async updateProfileInDatabase(userId: string, data: any) {
    // Database update logic
  }
}

// ============================================================================
// EXAMPLE 3: Event Correlation - Tracking User Journey
// ============================================================================

/**
 * Example: Analytics service correlating user events
 */
export class AnalyticsUserJourneyTracker {
  private kafkaClient: ReturnType<typeof getKafkaClient>;
  private userJourneys: Map<string, any[]> = new Map();

  constructor() {
    this.kafkaClient = getKafkaClient('analytics-service');
  }

  async initialize() {
    await this.kafkaClient.connect();

    // Subscribe to all user events
    await this.kafkaClient.subscribe(CONSUMER_GROUPS.ANALYTICS_SERVICE, [
      {
        topic: KAFKA_TOPICS.USER_CREATED,
        handler: this.trackEvent.bind(this),
      },
      {
        topic: KAFKA_TOPICS.USER_PROFILE_UPDATED,
        handler: this.trackEvent.bind(this),
      },
      {
        topic: KAFKA_TOPICS.USER_PREFERENCES_UPDATED,
        handler: this.trackEvent.bind(this),
      },
    ]);
  }

  private trackEvent: MessageHandler<any> = async ({ event, message }) => {
    const userId = event.payload.userId;
    const correlationId = event.correlationId;

    // Initialize user journey if not exists
    if (!this.userJourneys.has(userId)) {
      this.userJourneys.set(userId, []);
    }

    // Add event to user journey
    const journey = this.userJourneys.get(userId)!;
    journey.push({
      eventType: event.eventType,
      timestamp: event.timestamp,
      correlationId,
      payload: event.payload,
    });

    console.log(`[Analytics] User ${userId} journey: ${journey.length} events`);

    // Analyze onboarding completion
    if (journey.length === 3) {
      await this.checkOnboardingCompletion(userId, journey);
    }
  };

  private async checkOnboardingCompletion(userId: string, journey: any[]) {
    const hasCreated = journey.some(e => e.eventType === 'user.created');
    const hasProfile = journey.some(e => e.eventType === 'user.profile.updated');
    const hasPreferences = journey.some(e => e.eventType === 'user.preferences.updated');

    if (hasCreated && hasProfile && hasPreferences) {
      console.log(`✅ User ${userId} completed onboarding!`);
      await this.sendOnboardingCompleteEvent(userId);
    }
  }

  private async sendOnboardingCompleteEvent(userId: string) {
    // Publish onboarding completed event
  }
}

// ============================================================================
// EXAMPLE 4: Dead Letter Queue Handler
// ============================================================================

/**
 * Example: Handling failed event processing with DLQ
 */
export class UserEventsDLQHandler {
  private kafkaClient: ReturnType<typeof getKafkaClient>;
  private readonly MAX_RETRIES = 3;

  constructor() {
    this.kafkaClient = getKafkaClient('dlq-handler');
  }

  async initialize() {
    await this.kafkaClient.connect();

    // Subscribe to DLQ topics
    await this.kafkaClient.subscribe('dlq-handler-group', [
      {
        topic: 'dreamscape.user.profile.updated.dlq',
        handler: this.handleDLQMessage.bind(this),
      },
    ]);
  }

  private handleDLQMessage: MessageHandler<any> = async ({ event, message }) => {
    console.log(`[DLQ] Processing failed event: ${event.eventId}`);

    const retryCount = this.getRetryCount(message);

    if (retryCount >= this.MAX_RETRIES) {
      // Max retries reached, log and alert
      await this.logFailedEvent(event);
      await this.sendAlert('Max retries reached for event', event);
      return;
    }

    try {
      // Retry processing
      await this.reprocessEvent(event);
      console.log(`✅ Successfully reprocessed event ${event.eventId}`);
    } catch (error) {
      // Failed again, increment retry count and put back to DLQ
      await this.sendToDLQ(event, retryCount + 1);
    }
  };

  private getRetryCount(message: any): number {
    const header = message.headers['retry-count'];
    return header ? parseInt(header.toString()) : 0;
  }

  private async reprocessEvent(event: any) {
    // Attempt to reprocess the event
  }

  private async sendToDLQ(event: any, retryCount: number) {
    // Send back to DLQ with incremented retry count
  }

  private async logFailedEvent(event: any) {
    // Log to monitoring system
  }

  private async sendAlert(message: string, event: any) {
    // Send alert to operations team
  }
}

// ============================================================================
// EXAMPLE 5: Event Validation with JSON Schema
// ============================================================================

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import userEventsSchema from '../schemas/user-events-schema.json';

/**
 * Example: Validating events against JSON Schema
 */
export class EventValidator {
  private ajv: Ajv;

  constructor() {
    this.ajv = new Ajv({ allErrors: true });
    addFormats(this.ajv);
    this.ajv.addSchema(userEventsSchema, 'user-events');
  }

  validateEvent(event: any): { valid: boolean; errors?: string[] } {
    const valid = this.ajv.validate('user-events', event);

    if (!valid) {
      const errors = this.ajv.errors?.map(e => `${e.instancePath} ${e.message}`) || [];
      return { valid: false, errors };
    }

    return { valid: true };
  }

  /**
   * Middleware to validate events before processing
   */
  createValidationMiddleware(): MessageHandler<any> {
    return async ({ event, message }) => {
      const validation = this.validateEvent(event);

      if (!validation.valid) {
        console.error(`❌ Invalid event ${event.eventId}:`, validation.errors);
        throw new Error(`Event validation failed: ${validation.errors?.join(', ')}`);
      }

      console.log(`✅ Event ${event.eventId} passed validation`);
    };
  }
}

// ============================================================================
// EXAMPLE 6: Integration Test Helper
// ============================================================================

/**
 * Example: Test helper for verifying events in integration tests
 */
export class UserEventsTestHelper {
  private receivedEvents: any[] = [];
  private kafkaClient: ReturnType<typeof getKafkaClient>;

  constructor() {
    this.kafkaClient = getKafkaClient('test-helper');
  }

  async startCapturing(topics: string[]) {
    await this.kafkaClient.connect();
    await this.kafkaClient.subscribe('test-helper-group', [
      ...topics.map(topic => ({
        topic,
        handler: this.captureEvent.bind(this),
      })),
    ]);
  }

  private captureEvent: MessageHandler<any> = async ({ event }) => {
    this.receivedEvents.push(event);
  };

  async waitForEvent(
    eventType: string,
    predicate: (event: any) => boolean,
    timeoutMs = 5000
  ): Promise<any> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const event = this.receivedEvents.find(
        e => e.eventType === eventType && predicate(e)
      );

      if (event) return event;

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    throw new Error(`Timeout waiting for event ${eventType}`);
  }

  clearEvents() {
    this.receivedEvents = [];
  }

  async stopCapturing() {
    await this.kafkaClient.disconnect();
  }
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

async function main() {
  // Example 1: Start AI Service consumer
  const aiConsumer = new AIServiceUserEventsConsumer();
  await aiConsumer.initialize();

  // Example 2: Analytics tracker
  const analyticsTracker = new AnalyticsUserJourneyTracker();
  await analyticsTracker.initialize();

  // Example 3: Event validation
  const validator = new EventValidator();
  const sampleEvent = {
    eventId: 'test-123',
    eventType: 'user.profile.updated',
    timestamp: new Date().toISOString(),
    version: '1.0',
    source: 'user-service',
    payload: {
      userId: 'usr_123',
      profile: {
        firstName: 'John',
        lastName: 'Doe',
      },
      updatedAt: new Date().toISOString(),
    },
  };

  const result = validator.validateEvent(sampleEvent);
  console.log('Validation result:', result);
}

// Uncomment to run examples
// main().catch(console.error);
