import { EventStreamService } from './eventStream';
import {
  createCollaborationEvent,
  CollaborationEventType,
  type BaseEvent,
} from './eventSchema';
import Redis from 'ioredis';
import type { User } from '@shared/schema';

/**
 * Enhanced Collaboration Tracker
 * Advanced presence tracking, conflict prevention, and team productivity metrics
 */

export interface UserPresence {
  userId: string;
  userName: string;
  color: string;
  documentId: string;
  projectId: string;
  status: PresenceStatus;
  cursorPosition?: { line: number; column: number };
  selectionRange?: { start: number; end: number };
  scrollPosition?: { line: number };
  viewport?: { startLine: number; endLine: number };
  mode: EditMode;
  lastActivity: Date;
  isTyping: boolean;
  typingVelocity: number; // Characters per second
}

export enum PresenceStatus {
  ONLINE = 'online',
  AWAY = 'away',
  BUSY = 'busy',
  DO_NOT_DISTURB = 'do_not_disturb',
  OFFLINE = 'offline',
}

export enum EditMode {
  EDIT = 'edit',
  REVIEW = 'review',
  COMMENT = 'comment',
  NAVIGATE = 'navigate',
}

export interface ConflictPrediction {
  userId1: string;
  userId2: string;
  documentId: string;
  conflictType: 'same_paragraph' | 'adjacent_paragraphs' | 'overlapping_selection';
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
  timestamp: Date;
}

export interface TeamProductivityMetrics {
  projectId: string;
  documentId: string;
  timeRange: { start: Date; end: Date };
  collaborators: {
    userId: string;
    userName: string;
    editsCount: number;
    wordsAdded: number;
    commentsAdded: number;
    conflictsInvolved: number;
    averageResponseTime: number; // in minutes
    contributionPercentage: number;
  }[];
  totalEdits: number;
  totalConflicts: number;
  conflictResolutionTime: number; // average in minutes
  collaborationEfficiency: number; // 0-100 score
}

export class CollaborationTracker {
  private static instance: CollaborationTracker;
  private eventStream: EventStreamService;
  private redis: Redis;
  private presenceMap: Map<string, UserPresence> = new Map(); // key: userId:documentId
  private conflictPredictions: Map<string, ConflictPrediction[]> = new Map(); // key: documentId
  private readonly TYPING_TIMEOUT = 3000; // 3 seconds
  private readonly AWAY_TIMEOUT = 5 * 60 * 1000; // 5 minutes
  private readonly CONFLICT_PROXIMITY_LINES = 5; // Lines to consider for conflict detection

  private constructor() {
    this.eventStream = EventStreamService.getInstance();
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.redis = new Redis(redisUrl);
    this.setupPresenceMonitoring();
    this.setupConflictDetection();
  }

  public static getInstance(): CollaborationTracker {
    if (!CollaborationTracker.instance) {
      CollaborationTracker.instance = new CollaborationTracker();
    }
    return CollaborationTracker.instance;
  }

  /**
   * Update user presence
   */
  public async updatePresence(
    user: User,
    documentId: string,
    projectId: string,
    presenceData: Partial<UserPresence>
  ): Promise<void> {
    const presenceKey = `${user.id}:${documentId}`;
    const existing = this.presenceMap.get(presenceKey);

    const presence: UserPresence = {
      userId: user.id,
      userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown',
      color: existing?.color || this.generateUserColor(user.id),
      documentId,
      projectId,
      status: presenceData.status || existing?.status || PresenceStatus.ONLINE,
      cursorPosition: presenceData.cursorPosition || existing?.cursorPosition,
      selectionRange: presenceData.selectionRange || existing?.selectionRange,
      scrollPosition: presenceData.scrollPosition || existing?.scrollPosition,
      viewport: presenceData.viewport || existing?.viewport,
      mode: presenceData.mode || existing?.mode || EditMode.NAVIGATE,
      lastActivity: new Date(),
      isTyping: presenceData.isTyping ?? existing?.isTyping ?? false,
      typingVelocity: presenceData.typingVelocity || existing?.typingVelocity || 0,
    };

    this.presenceMap.set(presenceKey, presence);

    // Store in Redis with TTL
    await this.redis.setex(
      `presence:${presenceKey}`,
      60 * 60, // 1 hour TTL
      JSON.stringify(presence)
    );

    // Publish presence update event
    await this.eventStream.publishEvent(
      createCollaborationEvent(
        CollaborationEventType.PRESENCE_UPDATED,
        user.id,
        {
          user_presence: {
            user_id: presence.userId,
            user_name: presence.userName,
            color: presence.color,
          },
          cursor_position: presence.cursorPosition,
          viewport: presence.viewport,
          mode: presence.mode,
          status: presence.status,
        },
        { projectId, documentId }
      )
    );

    // Check for potential conflicts
    await this.detectPotentialConflicts(documentId, presence);
  }

  /**
   * Track cursor movement
   */
  public async trackCursorMove(
    userId: string,
    documentId: string,
    projectId: string,
    cursorPosition: { line: number; column: number },
    viewport?: { startLine: number; endLine: number }
  ): Promise<void> {
    const presenceKey = `${userId}:${documentId}`;
    const presence = this.presenceMap.get(presenceKey);

    if (presence) {
      presence.cursorPosition = cursorPosition;
      presence.viewport = viewport;
      presence.lastActivity = new Date();

      // Publish cursor moved event (throttled)
      await this.eventStream.publishEvent(
        createCollaborationEvent(
          CollaborationEventType.CURSOR_MOVED,
          userId,
          {
            user_presence: {
              user_id: presence.userId,
              user_name: presence.userName,
              color: presence.color,
            },
            cursor_position: cursorPosition,
            viewport,
          },
          { projectId, documentId }
        )
      );
    }
  }

  /**
   * Track edit activity
   */
  public async trackEdit(
    userId: string,
    documentId: string,
    projectId: string,
    editRange: { start: number; end: number },
    contentAdded: string,
    contentRemoved: string
  ): Promise<void> {
    const presenceKey = `${userId}:${documentId}`;
    const presence = this.presenceMap.get(presenceKey);

    if (presence) {
      presence.lastActivity = new Date();
      presence.isTyping = contentAdded.length > 0;
      presence.typingVelocity = contentAdded.length / 1; // chars per second (simplified)
    }

    // Publish edit applied event
    await this.eventStream.publishEvent(
      createCollaborationEvent(
        CollaborationEventType.EDIT_APPLIED,
        userId,
        {
          edit_range: editRange,
          content_added: contentAdded,
          content_removed: contentRemoved,
          user_id: userId,
        },
        { projectId, documentId }
      )
    );

    // Update edit statistics
    await this.updateEditStatistics(userId, projectId, documentId, contentAdded.length);
  }

  /**
   * Track comment activity
   */
  public async trackComment(
    userId: string,
    documentId: string,
    projectId: string,
    commentId: string,
    commentContent: string,
    commentRange?: { start: number; end: number },
    threadId?: string
  ): Promise<void> {
    await this.eventStream.publishEvent(
      createCollaborationEvent(
        CollaborationEventType.COMMENT_ADDED,
        userId,
        {
          comment_id: commentId,
          comment_content: commentContent,
          comment_range: commentRange,
          thread_id: threadId,
        },
        { projectId, documentId }
      )
    );

    // Update comment statistics
    await this.updateCommentStatistics(userId, projectId, documentId);
  }

  /**
   * Detect potential conflicts before they occur
   */
  private async detectPotentialConflicts(
    documentId: string,
    currentPresence: UserPresence
  ): Promise<void> {
    if (!currentPresence.cursorPosition || currentPresence.mode !== EditMode.EDIT) {
      return;
    }

    const conflicts: ConflictPrediction[] = [];
    const allPresences = Array.from(this.presenceMap.values())
      .filter(p => 
        p.documentId === documentId && 
        p.userId !== currentPresence.userId &&
        p.status === PresenceStatus.ONLINE
      );

    for (const otherPresence of allPresences) {
      if (!otherPresence.cursorPosition) continue;

      const currentLine = currentPresence.cursorPosition.line;
      const otherLine = otherPresence.cursorPosition.line;
      const lineDiff = Math.abs(currentLine - otherLine);

      let conflictType: ConflictPrediction['conflictType'] | null = null;
      let severity: ConflictPrediction['severity'] = 'low';
      let suggestion = '';

      // Same paragraph detection
      if (lineDiff === 0) {
        conflictType = 'same_paragraph';
        severity = 'high';
        suggestion = `${otherPresence.userName} is editing the same line. Consider coordinating your changes.`;
      }
      // Adjacent paragraphs
      else if (lineDiff <= this.CONFLICT_PROXIMITY_LINES) {
        conflictType = 'adjacent_paragraphs';
        severity = 'medium';
        suggestion = `${otherPresence.userName} is editing nearby (${lineDiff} lines away). Be aware of potential conflicts.`;
      }

      // Check for overlapping selections
      if (currentPresence.selectionRange && otherPresence.selectionRange) {
        const overlap = this.checkRangeOverlap(
          currentPresence.selectionRange,
          otherPresence.selectionRange
        );
        if (overlap) {
          conflictType = 'overlapping_selection';
          severity = 'high';
          suggestion = `${otherPresence.userName} has selected overlapping text. Coordinate before making changes.`;
        }
      }

      if (conflictType) {
        conflicts.push({
          userId1: currentPresence.userId,
          userId2: otherPresence.userId,
          documentId,
          conflictType,
          severity,
          suggestion,
          timestamp: new Date(),
        });

        // Publish conflict detection event
        await this.eventStream.publishEvent(
          createCollaborationEvent(
            CollaborationEventType.CONFLICT_DETECTED,
            currentPresence.userId,
            {
              conflict_type: conflictType,
              severity,
              other_user_id: otherPresence.userId,
              other_user_name: otherPresence.userName,
              suggestion,
            },
            { projectId: currentPresence.projectId, documentId }
          )
        );
      }
    }

    if (conflicts.length > 0) {
      this.conflictPredictions.set(documentId, conflicts);
    }
  }

  /**
   * Check if two ranges overlap
   */
  private checkRangeOverlap(
    range1: { start: number; end: number },
    range2: { start: number; end: number }
  ): boolean {
    return (
      (range1.start <= range2.end && range1.end >= range2.start) ||
      (range2.start <= range1.end && range2.end >= range1.start)
    );
  }

  /**
   * Get all active collaborators for a document
   */
  public async getDocumentCollaborators(documentId: string): Promise<UserPresence[]> {
    const collaborators = Array.from(this.presenceMap.values())
      .filter(p => p.documentId === documentId && p.status !== PresenceStatus.OFFLINE);

    return collaborators;
  }

  /**
   * Get conflict predictions for a document
   */
  public getConflictPredictions(documentId: string): ConflictPrediction[] {
    return this.conflictPredictions.get(documentId) || [];
  }

  /**
   * Calculate team productivity metrics
   */
  public async getTeamProductivityMetrics(
    projectId: string,
    documentId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<TeamProductivityMetrics> {
    // Get events from the time range
    const events = await this.eventStream.getEventsByTimeRange(
      'collaboration',
      timeRange.start,
      timeRange.end,
      10000
    );

    const documentEvents = events.filter(e => e.document_id === documentId);

    // Aggregate by user
    const userMetrics = new Map<string, any>();

    for (const event of documentEvents) {
      if (!userMetrics.has(event.user_id)) {
        userMetrics.set(event.user_id, {
          userId: event.user_id,
          userName: 'Unknown',
          editsCount: 0,
          wordsAdded: 0,
          commentsAdded: 0,
          conflictsInvolved: 0,
          responseTimes: [],
        });
      }

      const metrics = userMetrics.get(event.user_id);

      if (event.event_type === CollaborationEventType.EDIT_APPLIED) {
        metrics.editsCount++;
        metrics.wordsAdded += (event.payload.content_added?.split(' ').length || 0);
      } else if (event.event_type === CollaborationEventType.COMMENT_ADDED) {
        metrics.commentsAdded++;
      } else if (event.event_type === CollaborationEventType.CONFLICT_DETECTED) {
        metrics.conflictsInvolved++;
      }
    }

    const collaborators = Array.from(userMetrics.values());
    const totalEdits = collaborators.reduce((sum, c) => sum + c.editsCount, 0);
    const totalWords = collaborators.reduce((sum, c) => sum + c.wordsAdded, 0);

    // Calculate contribution percentages
    collaborators.forEach(c => {
      c.contributionPercentage = totalWords > 0 ? (c.wordsAdded / totalWords) * 100 : 0;
      c.averageResponseTime = c.responseTimes.length > 0
        ? c.responseTimes.reduce((a: number, b: number) => a + b, 0) / c.responseTimes.length
        : 0;
      delete c.responseTimes;
    });

    const totalConflicts = collaborators.reduce((sum, c) => sum + c.conflictsInvolved, 0);
    const conflictRate = totalEdits > 0 ? totalConflicts / totalEdits : 0;
    const collaborationEfficiency = Math.max(0, Math.min(100, (1 - conflictRate) * 100));

    return {
      projectId,
      documentId,
      timeRange,
      collaborators,
      totalEdits,
      totalConflicts,
      conflictResolutionTime: 0, // TODO: Calculate from resolved conflict events
      collaborationEfficiency,
    };
  }

  /**
   * Update edit statistics in Redis
   */
  private async updateEditStatistics(
    userId: string,
    projectId: string,
    documentId: string,
    charsAdded: number
  ): Promise<void> {
    const key = `collaboration:stats:${projectId}:${documentId}:${userId}`;
    
    await this.redis.hincrby(key, 'edits', 1);
    await this.redis.hincrby(key, 'chars_added', charsAdded);
    await this.redis.expire(key, 30 * 24 * 60 * 60); // 30 days
  }

  /**
   * Update comment statistics in Redis
   */
  private async updateCommentStatistics(
    userId: string,
    projectId: string,
    documentId: string
  ): Promise<void> {
    const key = `collaboration:stats:${projectId}:${documentId}:${userId}`;
    
    await this.redis.hincrby(key, 'comments', 1);
    await this.redis.expire(key, 30 * 24 * 60 * 60); // 30 days
  }

  /**
   * Generate consistent color for user
   */
  private generateUserColor(userId: string): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
      '#48C9B0', '#F8B739', '#6C5CE7', '#A29BFE', '#FD79A8',
    ];
    
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }

  /**
   * Set up presence monitoring
   */
  private setupPresenceMonitoring(): void {
    // Check for away/offline users every 30 seconds
    setInterval(() => {
      const now = Date.now();

      for (const [key, presence] of this.presenceMap.entries()) {
        const inactiveTime = now - presence.lastActivity.getTime();

        // Mark as away after 5 minutes
        if (inactiveTime > this.AWAY_TIMEOUT && presence.status === PresenceStatus.ONLINE) {
          presence.status = PresenceStatus.AWAY;
          this.publishPresenceUpdate(presence);
        }

        // Mark as offline after 15 minutes
        if (inactiveTime > this.AWAY_TIMEOUT * 3) {
          presence.status = PresenceStatus.OFFLINE;
          this.publishPresenceUpdate(presence);
          this.presenceMap.delete(key);
        }

        // Clear typing indicator after timeout
        if (inactiveTime > this.TYPING_TIMEOUT && presence.isTyping) {
          presence.isTyping = false;
        }
      }
    }, 30000);
  }

  /**
   * Set up conflict detection monitoring
   */
  private setupConflictDetection(): void {
    // Clean up old conflict predictions every minute
    setInterval(() => {
      const now = Date.now();
      const staleThreshold = 5 * 60 * 1000; // 5 minutes

      for (const [documentId, conflicts] of this.conflictPredictions.entries()) {
        const activeConflicts = conflicts.filter(
          c => now - c.timestamp.getTime() < staleThreshold
        );

        if (activeConflicts.length === 0) {
          this.conflictPredictions.delete(documentId);
        } else {
          this.conflictPredictions.set(documentId, activeConflicts);
        }
      }
    }, 60000);
  }

  /**
   * Publish presence update
   */
  private async publishPresenceUpdate(presence: UserPresence): Promise<void> {
    await this.eventStream.publishEvent(
      createCollaborationEvent(
        CollaborationEventType.PRESENCE_UPDATED,
        presence.userId,
        {
          user_presence: {
            user_id: presence.userId,
            user_name: presence.userName,
            color: presence.color,
          },
          status: presence.status,
        },
        { projectId: presence.projectId, documentId: presence.documentId }
      )
    );
  }

  /**
   * Clean up resources
   */
  public async destroy(): Promise<void> {
    this.presenceMap.clear();
    this.conflictPredictions.clear();
    await this.redis.quit();
  }
}
