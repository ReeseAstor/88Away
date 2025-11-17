import { Router, type Request, type Response } from 'express';
import { WritingTracker } from './events/writingTracker';
import { CollaborationTracker } from './events/collaborationTracker';
import { NotificationService } from './events/notificationService';
import { EventStreamService } from './events/eventStream';
import { WebSocketGateway } from './events/websocketGateway';
import { 
  createWritingEvent,
  WritingEventType,
  EventCategory
} from './events/eventSchema';

/**
 * Real-Time API Routes
 * Endpoints for real-time tracking and event management
 */

export const realtimeRouter = Router();
const writingTracker = WritingTracker.getInstance();
const collaborationTracker = CollaborationTracker.getInstance();
const notificationService = NotificationService.getInstance();
const eventStream = EventStreamService.getInstance();
const wsGateway = WebSocketGateway.getInstance();

/**
 * Writing Session Endpoints
 */

// Start a new writing session
realtimeRouter.post('/api/realtime/writing/sessions/start', async (req: Request, res: Response) => {
  try {
    const { projectId, documentId, sessionType } = req.body;
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const session = await writingTracker.startSession(
      user.id,
      projectId,
      documentId,
      sessionType || 'writing'
    );

    res.json(session);
  } catch (error: any) {
    console.error('Error starting writing session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Track keystroke activity
realtimeRouter.post('/api/realtime/writing/sessions/:sessionId/keystroke', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { wordCountDelta, cursorPosition } = req.body;

    await writingTracker.trackKeystroke(
      sessionId,
      wordCountDelta || 0,
      cursorPosition || { line: 0, column: 0 }
    );

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error tracking keystroke:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get session metrics
realtimeRouter.get('/api/realtime/writing/sessions/:sessionId/metrics', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const metrics = await writingTracker.getSessionMetrics(sessionId);
    
    if (!metrics) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(metrics);
  } catch (error: any) {
    console.error('Error getting session metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

// End a writing session
realtimeRouter.post('/api/realtime/writing/sessions/:sessionId/end', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const session = await writingTracker.endSession(sessionId);

    res.json(session);
  } catch (error: any) {
    console.error('Error ending session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Resume a paused session
realtimeRouter.post('/api/realtime/writing/sessions/:sessionId/resume', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    await writingTracker.resumeSession(sessionId);

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error resuming session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get active sessions for user
realtimeRouter.get('/api/realtime/writing/sessions/active', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const sessions = writingTracker.getActiveSessions(user.id);

    res.json(sessions);
  } catch (error: any) {
    console.error('Error getting active sessions:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Event Stream Endpoints
 */

// Publish a custom event
realtimeRouter.post('/api/realtime/events/publish', async (req: Request, res: Response) => {
  try {
    const { event } = req.body;
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Ensure user_id matches authenticated user
    event.user_id = user.id;

    const messageId = await eventStream.publishEvent(event);

    res.json({ messageId, success: true });
  } catch (error: any) {
    console.error('Error publishing event:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get events by time range
realtimeRouter.get('/api/realtime/events/:category', async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const { startTime, endTime, limit } = req.query;

    const events = await eventStream.getEventsByTimeRange(
      category,
      new Date(startTime as string),
      new Date(endTime as string),
      limit ? parseInt(limit as string) : 100
    );

    res.json(events);
  } catch (error: any) {
    console.error('Error getting events:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get stream statistics
realtimeRouter.get('/api/realtime/events/:category/info', async (req: Request, res: Response) => {
  try {
    const { category } = req.params;

    const info = await eventStream.getStreamInfo(category);

    res.json(info);
  } catch (error: any) {
    console.error('Error getting stream info:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * WebSocket Gateway Endpoints
 */

// Get WebSocket connection statistics
realtimeRouter.get('/api/realtime/websocket/stats', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const stats = wsGateway.getStats();

    res.json(stats);
  } catch (error: any) {
    console.error('Error getting WebSocket stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Broadcast message to a channel (admin only)
realtimeRouter.post('/api/realtime/websocket/broadcast', async (req: Request, res: Response) => {
  try {
    const { channel, message } = req.body;
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // TODO: Add admin permission check

    await wsGateway.broadcastToChannel(channel, message);

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error broadcasting message:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send message to specific user
realtimeRouter.post('/api/realtime/websocket/send-to-user', async (req: Request, res: Response) => {
  try {
    const { userId, message } = req.body;
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // TODO: Add permission check (can only send to self or if admin/collaborator)

    await wsGateway.sendToUser(userId, message);

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error sending message to user:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Real-Time Analytics Endpoints
 */

// Get live writing metrics for a project
realtimeRouter.get('/api/realtime/analytics/project/:projectId/writing', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // TODO: Check user has access to project

    // Get recent writing events for the project
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const events = await eventStream.getEventsByTimeRange(
      EventCategory.WRITING,
      oneHourAgo,
      now,
      1000
    );

    // Filter by project
    const projectEvents = events.filter(e => e.project_id === projectId);

    // Calculate aggregate metrics
    const totalWords = projectEvents
      .filter(e => e.event_type === WritingEventType.WORD_ADDED)
      .reduce((sum, e) => sum + (e.payload.word_count_delta || 0), 0);

    const activeSessions = new Set(
      projectEvents
        .filter(e => e.event_type === WritingEventType.SESSION_STARTED)
        .map(e => e.payload.session_id)
    ).size;

    const flowStateEntries = projectEvents
      .filter(e => e.event_type === WritingEventType.FLOW_STATE_ENTERED)
      .length;

    res.json({
      timeRange: {
        start: oneHourAgo,
        end: now,
      },
      metrics: {
        totalWords,
        activeSessions,
        flowStateEntries,
        totalEvents: projectEvents.length,
      },
      recentEvents: projectEvents.slice(-10), // Last 10 events
    });
  } catch (error: any) {
    console.error('Error getting project writing analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Collaboration Endpoints
 */

// Update user presence
realtimeRouter.post('/api/realtime/collaboration/presence', async (req: Request, res: Response) => {
  try {
    const { documentId, projectId, presenceData } = req.body;
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await collaborationTracker.updatePresence(user, documentId, projectId, presenceData);

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating presence:', error);
    res.status(500).json({ error: error.message });
  }
});

// Track cursor movement
realtimeRouter.post('/api/realtime/collaboration/cursor', async (req: Request, res: Response) => {
  try {
    const { documentId, projectId, cursorPosition, viewport } = req.body;
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await collaborationTracker.trackCursorMove(
      user.id,
      documentId,
      projectId,
      cursorPosition,
      viewport
    );

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error tracking cursor:', error);
    res.status(500).json({ error: error.message });
  }
});

// Track edit
realtimeRouter.post('/api/realtime/collaboration/edit', async (req: Request, res: Response) => {
  try {
    const { documentId, projectId, editRange, contentAdded, contentRemoved } = req.body;
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await collaborationTracker.trackEdit(
      user.id,
      documentId,
      projectId,
      editRange,
      contentAdded,
      contentRemoved
    );

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error tracking edit:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get document collaborators
realtimeRouter.get('/api/realtime/collaboration/document/:documentId/collaborators', async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const collaborators = await collaborationTracker.getDocumentCollaborators(documentId);

    res.json(collaborators);
  } catch (error: any) {
    console.error('Error getting collaborators:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get conflict predictions
realtimeRouter.get('/api/realtime/collaboration/document/:documentId/conflicts', async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const conflicts = collaborationTracker.getConflictPredictions(documentId);

    res.json(conflicts);
  } catch (error: any) {
    console.error('Error getting conflicts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get team productivity metrics
realtimeRouter.get('/api/realtime/collaboration/project/:projectId/document/:documentId/metrics', async (req: Request, res: Response) => {
  try {
    const { projectId, documentId } = req.params;
    const { startTime, endTime } = req.query;
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const timeRange = {
      start: startTime ? new Date(startTime as string) : new Date(Date.now() - 24 * 60 * 60 * 1000),
      end: endTime ? new Date(endTime as string) : new Date(),
    };

    const metrics = await collaborationTracker.getTeamProductivityMetrics(
      projectId,
      documentId,
      timeRange
    );

    res.json(metrics);
  } catch (error: any) {
    console.error('Error getting team metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Notification Endpoints
 */

// Get user notifications
realtimeRouter.get('/api/realtime/notifications', async (req: Request, res: Response) => {
  try {
    const { limit, unreadOnly } = req.query;
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const notifications = await notificationService.getUserNotifications(
      user.id,
      limit ? parseInt(limit as string) : 20,
      unreadOnly === 'true'
    );

    res.json(notifications);
  } catch (error: any) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
realtimeRouter.post('/api/realtime/notifications/:notificationId/read', async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await notificationService.markAsRead(user.id, notificationId);

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send custom notification (admin only)
realtimeRouter.post('/api/realtime/notifications/send', async (req: Request, res: Response) => {
  try {
    const notification = req.body;
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // TODO: Add admin check

    const sent = await notificationService.sendNotification(notification);

    res.json(sent);
  } catch (error: any) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: error.message });
  }
});

export default realtimeRouter;
