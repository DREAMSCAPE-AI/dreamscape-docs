/**
 * Auth Events - Practical Examples
 * DR-382 / DR-383: US-INFRA-011.1 - Événements d'authentification
 *
 * This file contains practical examples for consuming and producing auth events
 * in the DreamScape platform
 */

import {
  getKafkaClient,
  KAFKA_TOPICS,
  CONSUMER_GROUPS,
  type AuthLoginPayload,
  type AuthLogoutPayload,
  type AuthPasswordChangedPayload,
  type AuthAccountLockedPayload,
  type MessageHandler,
} from '@dreamscape/kafka';

// ============================================================================
// EXAMPLE 1: Security Service - Login Monitoring
// ============================================================================

/**
 * Example: Security service monitoring authentication patterns
 */
export class SecurityAuthEventsConsumer {
  private kafkaClient: ReturnType<typeof getKafkaClient>;
  private failedLoginAttempts: Map<string, number> = new Map();

  constructor() {
    this.kafkaClient = getKafkaClient('security-service');
  }

  async initialize() {
    await this.kafkaClient.connect();
    console.log('✅ Security Service Kafka client connected');

    // Subscribe to auth events
    await this.kafkaClient.subscribe(CONSUMER_GROUPS.SECURITY_SERVICE, [
      {
        topic: KAFKA_TOPICS.AUTH_LOGIN,
        handler: this.handleLogin.bind(this),
      },
      {
        topic: KAFKA_TOPICS.AUTH_ACCOUNT_LOCKED,
        handler: this.handleAccountLocked.bind(this),
      },
      {
        topic: KAFKA_TOPICS.AUTH_PASSWORD_CHANGED,
        handler: this.handlePasswordChanged.bind(this),
      },
    ]);

    console.log('✅ Subscribed to auth events');
  }

  private handleLogin: MessageHandler<AuthLoginPayload> = async ({ event }) => {
    const { userId, ipAddress, userAgent, method } = event.payload;

    console.log(`[Security] User ${userId} logged in from ${ipAddress}`);

    // Detect suspicious login patterns
    await this.checkSuspiciousActivity(userId, ipAddress, userAgent);

    // Track login method distribution
    await this.trackLoginMethod(method);

    // Geo-location anomaly detection
    await this.checkLocationAnomaly(userId, ipAddress);
  };

  private handleAccountLocked: MessageHandler<AuthAccountLockedPayload> = async ({ event }) => {
    const { userId, reason, lockedAt } = event.payload;

    console.log(`[Security] Account ${userId} locked: ${reason}`);

    // Alert security team
    await this.sendSecurityAlert({
      type: 'account_locked',
      userId,
      reason,
      timestamp: lockedAt,
    });

    // Log to security audit trail
    await this.logSecurityEvent('account_lock', { userId, reason });
  };

  private handlePasswordChanged: MessageHandler<AuthPasswordChangedPayload> = async ({
    event,
  }) => {
    const { userId, method } = event.payload;

    console.log(`[Security] Password changed for ${userId} via ${method}`);

    // If admin reset, audit it
    if (method === 'admin_reset') {
      await this.auditAdminAction('password_reset', userId);
    }
  };

  // Helper methods
  private async checkSuspiciousActivity(userId: string, ip: string, userAgent: string) {
    // Detect impossible travel, unusual devices, etc.
  }

  private async trackLoginMethod(method: string) {
    // Analytics on login methods
  }

  private async checkLocationAnomaly(userId: string, ip: string) {
    // Geo-location based anomaly detection
  }

  private async sendSecurityAlert(alert: any) {
    // Send alert to security operations
  }

  private async logSecurityEvent(type: string, data: any) {
    // Log to security audit trail
  }

  private async auditAdminAction(action: string, targetUserId: string) {
    // Audit admin actions
  }
}

// ============================================================================
// EXAMPLE 2: Analytics Service - Session Tracking
// ============================================================================

/**
 * Example: Analytics service tracking user sessions
 */
export class AnalyticsSessionTracker {
  private kafkaClient: ReturnType<typeof getKafkaClient>;
  private activeSessions: Map<string, any> = new Map();

  constructor() {
    this.kafkaClient = getKafkaClient('analytics-service');
  }

  async initialize() {
    await this.kafkaClient.connect();

    await this.kafkaClient.subscribe(CONSUMER_GROUPS.ANALYTICS_SERVICE, [
      {
        topic: KAFKA_TOPICS.AUTH_LOGIN,
        handler: this.handleLogin.bind(this),
      },
      {
        topic: KAFKA_TOPICS.AUTH_LOGOUT,
        handler: this.handleLogout.bind(this),
      },
    ]);
  }

  private handleLogin: MessageHandler<AuthLoginPayload> = async ({ event }) => {
    const { userId, sessionId, loginAt } = event.payload;

    // Track session start
    this.activeSessions.set(sessionId, {
      userId,
      startTime: loginAt,
      events: [],
    });

    console.log(`[Analytics] Session ${sessionId} started for user ${userId}`);

    // Track daily active users
    await this.incrementDAU(userId, loginAt);
  };

  private handleLogout: MessageHandler<AuthLogoutPayload> = async ({ event }) => {
    const { userId, sessionId, logoutAt, reason } = event.payload;

    const session = this.activeSessions.get(sessionId);

    if (session) {
      const duration = new Date(logoutAt).getTime() - new Date(session.startTime).getTime();

      console.log(`[Analytics] Session ${sessionId} ended. Duration: ${duration}ms`);

      // Track session duration metrics
      await this.trackSessionDuration(userId, duration);

      // Track logout reasons
      await this.trackLogoutReason(reason || 'unknown');

      this.activeSessions.delete(sessionId);
    }
  };

  private async incrementDAU(userId: string, date: string) {
    // Increment daily active users metric
  }

  private async trackSessionDuration(userId: string, duration: number) {
    // Track average session duration
  }

  private async trackLogoutReason(reason: string) {
    // Analytics on why users logout
  }
}

// ============================================================================
// EXAMPLE 3: Notification Service - Password Events
// ============================================================================

/**
 * Example: Notification service sending alerts on password changes
 */
export class NotificationPasswordEventsConsumer {
  private kafkaClient: ReturnType<typeof getKafkaClient>;

  constructor() {
    this.kafkaClient = getKafkaClient('notification-service');
  }

  async initialize() {
    await this.kafkaClient.connect();

    await this.kafkaClient.subscribe(CONSUMER_GROUPS.NOTIFICATION_SERVICE, [
      {
        topic: KAFKA_TOPICS.AUTH_PASSWORD_CHANGED,
        handler: this.handlePasswordChanged.bind(this),
      },
      {
        topic: KAFKA_TOPICS.AUTH_PASSWORD_RESET_REQUESTED,
        handler: this.handlePasswordResetRequested.bind(this),
      },
      {
        topic: KAFKA_TOPICS.AUTH_ACCOUNT_LOCKED,
        handler: this.handleAccountLocked.bind(this),
      },
    ]);
  }

  private handlePasswordChanged: MessageHandler<AuthPasswordChangedPayload> = async ({
    event,
  }) => {
    const { userId, method } = event.payload;

    // Get user email
    const userEmail = await this.getUserEmail(userId);

    // Send confirmation email
    await this.sendEmail({
      to: userEmail,
      template: 'password-changed',
      data: {
        method,
        timestamp: event.timestamp,
        supportLink: 'https://dreamscape.com/support',
      },
    });

    console.log(`✅ Password change notification sent to ${userEmail}`);
  };

  private handlePasswordResetRequested: MessageHandler<any> = async ({ event }) => {
    const { userId, email, resetToken, expiresAt } = event.payload;

    // Send password reset email with link
    await this.sendEmail({
      to: email,
      template: 'password-reset',
      data: {
        resetLink: `https://dreamscape.com/reset-password?token=${resetToken}`,
        expiresAt,
      },
    });

    console.log(`✅ Password reset email sent to ${email}`);
  };

  private handleAccountLocked: MessageHandler<AuthAccountLockedPayload> = async ({ event }) => {
    const { userId, reason, unlockAt } = event.payload;

    const userEmail = await this.getUserEmail(userId);

    // Send account locked notification
    await this.sendEmail({
      to: userEmail,
      template: 'account-locked',
      data: {
        reason,
        unlockAt: unlockAt || 'Contact support to unlock',
        supportLink: 'https://dreamscape.com/support',
      },
    });

    console.log(`✅ Account locked notification sent to ${userEmail}`);
  };

  private async getUserEmail(userId: string): Promise<string> {
    // Fetch user email from database
    return `user-${userId}@example.com`;
  }

  private async sendEmail(config: any) {
    // Send email via email service (SendGrid, SES, etc.)
  }
}

// ============================================================================
// EXAMPLE 4: Auth Service - Publishing Events
// ============================================================================

/**
 * Example: Publishing auth events from auth-service routes
 */
export class AuthEventPublisher {
  constructor(private authKafkaService: any) {}

  /**
   * Handle user login and publish event
   */
  async handleUserLogin(req: any, res: any) {
    const { email, password } = req.body;

    try {
      // Validate credentials
      const user = await this.validateCredentials(email, password);

      // Create session
      const session = await this.createSession(user.id);

      // Generate JWT token
      const token = await this.generateJWT(user, session);

      // Publish login event
      await this.authKafkaService.publishLogin({
        userId: user.id,
        sessionId: session.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        loginAt: new Date().toISOString(),
        method: 'password',
      });

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
        },
      });
    } catch (error: any) {
      // Track failed login attempt
      await this.trackFailedLogin(email, req.ip);

      res.status(401).json({ error: 'Invalid credentials' });
    }
  }

  /**
   * Handle password change and publish event
   */
  async handlePasswordChange(req: any, res: any) {
    const { userId } = req.user;
    const { currentPassword, newPassword } = req.body;

    try {
      // Verify current password
      await this.verifyPassword(userId, currentPassword);

      // Update password
      await this.updatePassword(userId, newPassword);

      // Invalidate all sessions except current
      await this.invalidateOtherSessions(userId, req.sessionId);

      // Publish password changed event
      await this.authKafkaService.publishPasswordChanged({
        userId,
        changedAt: new Date().toISOString(),
        method: 'user_initiated',
      });

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      res.status(400).json({ error: 'Failed to change password' });
    }
  }

  // Helper methods
  private async validateCredentials(email: string, password: string) {
    // Validate user credentials
    return { id: 'usr_123', email };
  }

  private async createSession(userId: string) {
    // Create user session
    return { id: 'sess_abc123' };
  }

  private async generateJWT(user: any, session: any) {
    // Generate JWT token
    return 'jwt_token';
  }

  private async trackFailedLogin(email: string, ip: string) {
    // Track failed login attempts
  }

  private async verifyPassword(userId: string, password: string) {
    // Verify password
  }

  private async updatePassword(userId: string, newPassword: string) {
    // Update password in database
  }

  private async invalidateOtherSessions(userId: string, currentSessionId: string) {
    // Invalidate all other sessions
  }
}

// ============================================================================
// EXAMPLE 5: Integration Test Helper
// ============================================================================

/**
 * Example: Test helper for auth event integration tests
 */
export class AuthEventsTestHelper {
  private receivedEvents: any[] = [];
  private kafkaClient: ReturnType<typeof getKafkaClient>;

  constructor() {
    this.kafkaClient = getKafkaClient('auth-test-helper');
  }

  async startCapturing() {
    await this.kafkaClient.connect();
    await this.kafkaClient.subscribe('auth-test-group', [
      {
        topic: KAFKA_TOPICS.AUTH_LOGIN,
        handler: this.captureEvent.bind(this),
      },
      {
        topic: KAFKA_TOPICS.AUTH_LOGOUT,
        handler: this.captureEvent.bind(this),
      },
      {
        topic: KAFKA_TOPICS.AUTH_PASSWORD_CHANGED,
        handler: this.captureEvent.bind(this),
      },
    ]);
  }

  private captureEvent: MessageHandler<any> = async ({ event }) => {
    this.receivedEvents.push(event);
  };

  async waitForLoginEvent(userId: string, timeoutMs = 5000): Promise<any> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const event = this.receivedEvents.find(
        e => e.eventType === 'auth.login' && e.payload.userId === userId
      );

      if (event) return event;

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    throw new Error(`Timeout waiting for login event for user ${userId}`);
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
import authEventsSchema from '../schemas/auth-events-schema.json';

/**
 * Example: Validating auth events against JSON Schema
 */
export class AuthEventValidator {
  private ajv: Ajv;

  constructor() {
    this.ajv = new Ajv({ allErrors: true });
    addFormats(this.ajv);
    this.ajv.addSchema(authEventsSchema, 'auth-events');
  }

  validateEvent(event: any): { valid: boolean; errors?: string[] } {
    const valid = this.ajv.validate('auth-events', event);

    if (!valid) {
      const errors = this.ajv.errors?.map(e => `${e.instancePath} ${e.message}`) || [];
      return { valid: false, errors };
    }

    return { valid: true };
  }

  /**
   * Example: Validate a login event
   */
  validateLoginEvent(event: any) {
    // Example login event
    const sampleEvent = {
      eventId: 'a1b2c3d4-e5f6-4a5b-8c7d-9e8f7a6b5c4d',
      eventType: 'auth.login',
      timestamp: new Date().toISOString(),
      version: '1.0',
      source: 'auth-service',
      payload: {
        userId: 'usr_123456789',
        sessionId: 'sess_abc123xyz',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        loginAt: new Date().toISOString(),
        method: 'password',
      },
    };

    const result = this.validateEvent(sampleEvent);
    console.log('Login event validation:', result);
    return result;
  }
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

async function main() {
  // Example 1: Start security monitoring
  const securityConsumer = new SecurityAuthEventsConsumer();
  await securityConsumer.initialize();

  // Example 2: Start session analytics
  const analyticsTracker = new AnalyticsSessionTracker();
  await analyticsTracker.initialize();

  // Example 3: Event validation
  const validator = new AuthEventValidator();
  validator.validateLoginEvent({});

  console.log('Auth event consumers initialized');
}

// Uncomment to run examples
// main().catch(console.error);
