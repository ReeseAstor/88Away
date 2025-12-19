import { EventStreamService } from './eventStream';
import { WebSocketGateway } from './websocketGateway';
import type { BaseEvent } from './eventSchema';
import { EventCategory } from './eventSchema';
import Redis from 'ioredis';
import type { User } from '@shared/schema';
import { sendEmail } from '../brevoService';
import { sendSms } from '../brevoSmsService';

/**
 * Real-Time Notification System
 * Priority-based alert delivery with multiple channels and user preferences
 */

export enum NotificationPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
}

export enum NotificationCategory {
  SYSTEM_HEALTH = 'system_health',
  PUBLISHING_MILESTONE = 'publishing_milestone',
  COLLABORATION = 'collaboration',
  ANALYTICS_INSIGHT = 'analytics_insight',
  REVENUE_EVENT = 'revenue_event',
  WORKFLOW = 'workflow',
}

export interface Notification {
  id: string;
  userId: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  data?: Record<string, any>;
  channels: NotificationChannel[];
  createdAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
  actionUrl?: string;
  actionLabel?: string;
}

export interface UserNotificationPreferences {
  userId: string;
  channels: {
    [key in NotificationCategory]: NotificationChannel[];
  };
  frequency: {
    [key in NotificationCategory]: 'real_time' | 'hourly' | 'daily' | 'weekly';
  };
  quietHours?: {
    start: string; // HH:mm format
    end: string;
  };
  alertThreshold: {
    [key in NotificationCategory]: NotificationPriority;
  };
  autoMuteDuration: number; // minutes
}

export interface AlertRule {
  id: string;
  name: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  condition: (event: BaseEvent) => boolean;
  createNotification: (event: BaseEvent) => Omit<Notification, 'id' | 'createdAt' | 'deliveredAt' | 'readAt'>;
}

export class NotificationService {
  private static instance: NotificationService;
  private eventStream: EventStreamService;
  private wsGateway: WebSocketGateway;
  private redis: Redis;
  private alertRules: Map<string, AlertRule> = new Map();
  private digestQueues: Map<string, Notification[]> = new Map(); // key: userId:category:frequency
  private mutedAlerts: Map<string, Date> = new Map(); // key: userId:category

  private constructor() {
    this.eventStream = EventStreamService.getInstance();
    this.wsGateway = WebSocketGateway.getInstance();
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    // Use lazyConnect so we can attach error handlers before connecting.
    this.redis = new Redis(redisUrl, { lazyConnect: true });
    this.redis.on('error', (error) => {
      console.warn('[NotificationService] Redis error:', error?.message || error);
    });
    this.redis.connect().catch((error) => {
      console.warn('[NotificationService] Redis connect failed:', error?.message || error);
    });
    
    this.setupDefaultAlertRules();
    this.setupDigestProcessing();
    this.subscribeToEvents();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Send a notification to a user
   */
  public async sendNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> {
    const fullNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };

    // Get user preferences
    const preferences = await this.getUserPreferences(notification.userId);

    // Check if in quiet hours
    if (this.isInQuietHours(preferences) && notification.priority !== NotificationPriority.CRITICAL) {
      await this.queueForDigest(fullNotification, preferences);
      return fullNotification;
    }

    // Check if alert is muted
    const muteKey = `${notification.userId}:${notification.category}`;
    const mutedUntil = this.mutedAlerts.get(muteKey);
    if (mutedUntil && mutedUntil > new Date() && notification.priority !== NotificationPriority.CRITICAL) {
      await this.queueForDigest(fullNotification, preferences);
      return fullNotification;
    }

    // Determine delivery channels based on priority and preferences
    const deliveryChannels = this.selectDeliveryChannels(
      notification.priority,
      notification.category,
      preferences
    );

    // Deliver to each channel
    await Promise.all(
      deliveryChannels.map(channel => this.deliverToChannel(channel, fullNotification))
    );

    // Store notification
    await this.storeNotification(fullNotification);

    // Auto-mute similar alerts if configured
    if (preferences.autoMuteDuration > 0) {
      const muteUntil = new Date(Date.now() + preferences.autoMuteDuration * 60 * 1000);
      this.mutedAlerts.set(muteKey, muteUntil);
    }

    return {
      ...fullNotification,
      deliveredAt: new Date(),
    };
  }

  /**
   * Deliver notification to specific channel
   */
  private async deliverToChannel(
    channel: NotificationChannel,
    notification: Notification
  ): Promise<void> {
    try {
      switch (channel) {
        case NotificationChannel.IN_APP:
          await this.deliverInApp(notification);
          break;

        case NotificationChannel.EMAIL:
          await this.deliverEmail(notification);
          break;

        case NotificationChannel.SMS:
          await this.deliverSMS(notification);
          break;

        case NotificationChannel.PUSH:
          // TODO: Implement push notification delivery
          break;
      }
    } catch (error) {
      console.error(`Error delivering notification via ${channel}:`, error);
    }
  }

  /**
   * Deliver in-app notification via WebSocket
   */
  private async deliverInApp(notification: Notification): Promise<void> {
    await this.wsGateway.sendToUser(notification.userId, {
      type: 'notification',
      payload: notification,
    });
  }

  /**
   * Deliver email notification
   */
  private async deliverEmail(notification: Notification): Promise<void> {
    // Get user email
    const userKey = await this.redis.get(`user:${notification.userId}:email`);
    if (!userKey) return;

    const priorityColors = {
      [NotificationPriority.CRITICAL]: '#dc2626',
      [NotificationPriority.HIGH]: '#ea580c',
      [NotificationPriority.MEDIUM]: '#ca8a04',
      [NotificationPriority.LOW]: '#65a30d',
    };

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: ${priorityColors[notification.priority]}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">${notification.title}</h2>
        </div>
        <div style="padding: 20px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; line-height: 1.5; color: #374151;">${notification.message}</p>
          ${notification.actionUrl ? `
            <div style="margin-top: 20px;">
              <a href="${notification.actionUrl}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                ${notification.actionLabel || 'View Details'}
              </a>
            </div>
          ` : ''}
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
            <p>Priority: ${notification.priority.toUpperCase()}</p>
            <p>Category: ${notification.category}</p>
            <p>Time: ${notification.createdAt.toLocaleString()}</p>
          </div>
        </div>
      </div>
    `;

    await sendEmail({
      to: [userKey],
      subject: `[${notification.priority.toUpperCase()}] ${notification.title}`,
      htmlContent,
    });
  }

  /**
   * Deliver SMS notification
   */
  private async deliverSMS(notification: Notification): Promise<void> {
    // Get user phone
    const userPhone = await this.redis.get(`user:${notification.userId}:phone`);
    if (!userPhone) return;

    const smsContent = `[${notification.priority.toUpperCase()}] ${notification.title}\n\n${notification.message}`;

    await sendSms({
      recipient: userPhone,
      message: smsContent.substring(0, 160), // SMS character limit
    });
  }

  /**
   * Queue notification for digest delivery
   */
  private async queueForDigest(
    notification: Notification,
    preferences: UserNotificationPreferences
  ): Promise<void> {
    const frequency = preferences.frequency[notification.category];
    const queueKey = `${notification.userId}:${notification.category}:${frequency}`;

    if (!this.digestQueues.has(queueKey)) {
      this.digestQueues.set(queueKey, []);
    }

    this.digestQueues.get(queueKey)!.push(notification);

    // Store in Redis for persistence
    await this.redis.lpush(
      `notification:digest:${queueKey}`,
      JSON.stringify(notification)
    );
    await this.redis.expire(`notification:digest:${queueKey}`, 7 * 24 * 60 * 60); // 7 days
  }

  /**
   * Select delivery channels based on priority and preferences
   */
  private selectDeliveryChannels(
    priority: NotificationPriority,
    category: NotificationCategory,
    preferences: UserNotificationPreferences
  ): NotificationChannel[] {
    const userChannels = preferences.channels[category] || [];
    const threshold = preferences.alertThreshold[category] || NotificationPriority.MEDIUM;

    // Priority mapping
    const priorityOrder = {
      [NotificationPriority.CRITICAL]: 4,
      [NotificationPriority.HIGH]: 3,
      [NotificationPriority.MEDIUM]: 2,
      [NotificationPriority.LOW]: 1,
    };

    // Only deliver if priority meets threshold
    if (priorityOrder[priority] < priorityOrder[threshold]) {
      return [NotificationChannel.IN_APP]; // Always show in-app
    }

    // For critical, use all configured channels
    if (priority === NotificationPriority.CRITICAL) {
      return Array.from(new Set([...userChannels, NotificationChannel.IN_APP]));
    }

    // For high priority, use in-app and email
    if (priority === NotificationPriority.HIGH) {
      const channels = [NotificationChannel.IN_APP];
      if (userChannels.includes(NotificationChannel.EMAIL)) {
        channels.push(NotificationChannel.EMAIL);
      }
      return channels;
    }

    // For medium and low, respect user preferences
    return userChannels.length > 0 ? userChannels : [NotificationChannel.IN_APP];
  }

  /**
   * Check if current time is within user's quiet hours
   */
  private isInQuietHours(preferences: UserNotificationPreferences): boolean {
    if (!preferences.quietHours) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const { start, end } = preferences.quietHours;

    if (start < end) {
      return currentTime >= start && currentTime <= end;
    } else {
      // Quiet hours span midnight
      return currentTime >= start || currentTime <= end;
    }
  }

  /**
   * Get user notification preferences
   */
  private async getUserPreferences(userId: string): Promise<UserNotificationPreferences> {
    const stored = await this.redis.get(`notification:preferences:${userId}`);
    
    if (stored) {
      return JSON.parse(stored);
    }

    // Default preferences
    const defaults: UserNotificationPreferences = {
      userId,
      channels: {
        [NotificationCategory.SYSTEM_HEALTH]: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        [NotificationCategory.PUBLISHING_MILESTONE]: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        [NotificationCategory.COLLABORATION]: [NotificationChannel.IN_APP],
        [NotificationCategory.ANALYTICS_INSIGHT]: [NotificationChannel.IN_APP],
        [NotificationCategory.REVENUE_EVENT]: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        [NotificationCategory.WORKFLOW]: [NotificationChannel.IN_APP],
      },
      frequency: {
        [NotificationCategory.SYSTEM_HEALTH]: 'real_time',
        [NotificationCategory.PUBLISHING_MILESTONE]: 'real_time',
        [NotificationCategory.COLLABORATION]: 'real_time',
        [NotificationCategory.ANALYTICS_INSIGHT]: 'daily',
        [NotificationCategory.REVENUE_EVENT]: 'real_time',
        [NotificationCategory.WORKFLOW]: 'real_time',
      },
      quietHours: {
        start: '22:00',
        end: '08:00',
      },
      alertThreshold: {
        [NotificationCategory.SYSTEM_HEALTH]: NotificationPriority.MEDIUM,
        [NotificationCategory.PUBLISHING_MILESTONE]: NotificationPriority.HIGH,
        [NotificationCategory.COLLABORATION]: NotificationPriority.MEDIUM,
        [NotificationCategory.ANALYTICS_INSIGHT]: NotificationPriority.LOW,
        [NotificationCategory.REVENUE_EVENT]: NotificationPriority.HIGH,
        [NotificationCategory.WORKFLOW]: NotificationPriority.MEDIUM,
      },
      autoMuteDuration: 60, // 1 hour
    };

    await this.redis.setex(
      `notification:preferences:${userId}`,
      30 * 24 * 60 * 60, // 30 days
      JSON.stringify(defaults)
    );

    return defaults;
  }

  /**
   * Store notification in database
   */
  private async storeNotification(notification: Notification): Promise<void> {
    await this.redis.lpush(
      `notifications:user:${notification.userId}`,
      JSON.stringify(notification)
    );
    
    // Keep last 100 notifications per user
    await this.redis.ltrim(`notifications:user:${notification.userId}`, 0, 99);
    await this.redis.expire(`notifications:user:${notification.userId}`, 30 * 24 * 60 * 60);
  }

  /**
   * Get user notifications
   */
  public async getUserNotifications(
    userId: string,
    limit: number = 20,
    unreadOnly: boolean = false
  ): Promise<Notification[]> {
    const notifications = await this.redis.lrange(`notifications:user:${userId}`, 0, limit - 1);
    
    const parsed = notifications.map(n => JSON.parse(n) as Notification);
    
    if (unreadOnly) {
      return parsed.filter(n => !n.readAt);
    }
    
    return parsed;
  }

  /**
   * Mark notification as read
   */
  public async markAsRead(userId: string, notificationId: string): Promise<void> {
    const notifications = await this.getUserNotifications(userId, 100);
    const notification = notifications.find(n => n.id === notificationId);
    
    if (notification) {
      notification.readAt = new Date();
      await this.storeNotification(notification);
    }
  }

  /**
   * Setup default alert rules
   */
  private setupDefaultAlertRules(): void {
    // System health alerts
    this.alertRules.set('system_error', {
      id: 'system_error',
      name: 'System Error Alert',
      category: NotificationCategory.SYSTEM_HEALTH,
      priority: NotificationPriority.CRITICAL,
      condition: (event) => event.category === EventCategory.SYSTEM && event.event_type.includes('error'),
      createNotification: (event) => ({
        userId: event.user_id,
        category: NotificationCategory.SYSTEM_HEALTH,
        priority: NotificationPriority.CRITICAL,
        title: 'System Error Detected',
        message: `An error occurred: ${event.payload.error_message || 'Unknown error'}`,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        data: event.payload,
      }),
    });

    // Publishing milestones
    this.alertRules.set('book_published', {
      id: 'book_published',
      name: 'Book Published',
      category: NotificationCategory.PUBLISHING_MILESTONE,
      priority: NotificationPriority.HIGH,
      condition: (event) => event.event_type === 'publishing.book_published',
      createNotification: (event) => ({
        userId: event.user_id,
        category: NotificationCategory.PUBLISHING_MILESTONE,
        priority: NotificationPriority.HIGH,
        title: '🎉 Book Published!',
        message: 'Your book has been successfully published on Amazon KDP!',
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        data: event.payload,
      }),
    });

    // Flow state achievement
    this.alertRules.set('flow_state_entered', {
      id: 'flow_state_entered',
      name: 'Flow State Achieved',
      category: NotificationCategory.ANALYTICS_INSIGHT,
      priority: NotificationPriority.LOW,
      condition: (event) => event.event_type === 'writing.flow_state_entered',
      createNotification: (event) => ({
        userId: event.user_id,
        category: NotificationCategory.ANALYTICS_INSIGHT,
        priority: NotificationPriority.LOW,
        title: '🔥 Flow State Activated!',
        message: `You're in the zone! Writing at ${event.payload.words_per_minute} words per minute.`,
        channels: [NotificationChannel.IN_APP],
        data: event.payload,
      }),
    });
  }

  /**
   * Subscribe to event stream and process alerts
   */
  private async subscribeToEvents(): void {
    // Subscribe to all categories
    for (const category of Object.values(EventCategory)) {
      await this.eventStream.subscribe(category, async (event) => {
        await this.processEventForAlerts(event);
      });
    }
  }

  /**
   * Process event against alert rules
   */
  private async processEventForAlerts(event: BaseEvent): Promise<void> {
    for (const rule of this.alertRules.values()) {
      if (rule.condition(event)) {
        const notification = rule.createNotification(event);
        await this.sendNotification(notification);
      }
    }
  }

  /**
   * Setup digest processing
   */
  private setupDigestProcessing(): void {
    // Process hourly digests
    setInterval(() => this.processDigests('hourly'), 60 * 60 * 1000);
    
    // Process daily digests (at 9 AM)
    setInterval(() => {
      const now = new Date();
      if (now.getHours() === 9) {
        this.processDigests('daily');
      }
    }, 60 * 60 * 1000);
    
    // Process weekly digests (Monday at 9 AM)
    setInterval(() => {
      const now = new Date();
      if (now.getDay() === 1 && now.getHours() === 9) {
        this.processDigests('weekly');
      }
    }, 60 * 60 * 1000);
  }

  /**
   * Process digest notifications
   */
  private async processDigests(frequency: 'hourly' | 'daily' | 'weekly'): Promise<void> {
    const keysToProcess: string[] = [];
    
    for (const key of this.digestQueues.keys()) {
      if (key.endsWith(`:${frequency}`)) {
        keysToProcess.push(key);
      }
    }

    for (const key of keysToProcess) {
      const notifications = this.digestQueues.get(key) || [];
      if (notifications.length === 0) continue;

      const [userId, category] = key.split(':');
      
      await this.sendDigestNotification(userId, category as NotificationCategory, notifications, frequency);
      
      // Clear the queue
      this.digestQueues.delete(key);
      await this.redis.del(`notification:digest:${key}`);
    }
  }

  /**
   * Send digest notification
   */
  private async sendDigestNotification(
    userId: string,
    category: NotificationCategory,
    notifications: Notification[],
    frequency: string
  ): Promise<void> {
    const summary = `You have ${notifications.length} ${category} updates from the last ${frequency} period.`;
    
    await this.sendNotification({
      userId,
      category,
      priority: NotificationPriority.LOW,
      title: `${frequency.charAt(0).toUpperCase() + frequency.slice(1)} Digest: ${category}`,
      message: summary,
      channels: [NotificationChannel.EMAIL],
      data: { notifications, count: notifications.length },
    });
  }

  /**
   * Clean up resources
   */
  public async destroy(): Promise<void> {
    this.digestQueues.clear();
    this.mutedAlerts.clear();
    this.alertRules.clear();
    await this.redis.quit();
  }
}
