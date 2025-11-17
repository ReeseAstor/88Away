import { randomUUID } from "crypto";
import { EventStreamService } from "./eventStream";
import { createWritingEvent, WritingEventType } from "./eventSchema";

type CursorPosition = { line: number; column: number };
type SessionStatus = "active" | "paused" | "ended";

export interface WritingSession {
  id: string;
  userId: string;
  projectId?: string;
  documentId?: string;
  sessionType: string;
  status: SessionStatus;
  startedAt: Date;
  updatedAt: Date;
  endedAt?: Date;
  wordCount: number;
  totalKeystrokes: number;
  cursorPosition: CursorPosition;
}

/**
 * Lightweight in-memory writing tracker that powers the real-time API.
 * It intentionally keeps the implementation simple and dependency-free
 * while preserving enough behavior to support analytics and event
 * ingestion workflows.
 */
export class WritingTracker {
  private static instance: WritingTracker;
  private sessions: Map<string, WritingSession> = new Map();
  private eventStream: EventStreamService;

  private constructor() {
    this.eventStream = EventStreamService.getInstance();
  }

  public static getInstance(): WritingTracker {
    if (!WritingTracker.instance) {
      WritingTracker.instance = new WritingTracker();
    }
    return WritingTracker.instance;
  }

  public async startSession(
    userId: string,
    projectId?: string,
    documentId?: string,
    sessionType = "writing"
  ): Promise<WritingSession> {
    const session: WritingSession = {
      id: randomUUID(),
      userId,
      projectId,
      documentId,
      sessionType,
      status: "active",
      startedAt: new Date(),
      updatedAt: new Date(),
      wordCount: 0,
      totalKeystrokes: 0,
      cursorPosition: { line: 0, column: 0 },
    };

    this.sessions.set(session.id, session);

    await this.eventStream.publishEvent(
      createWritingEvent(
        WritingEventType.SESSION_STARTED,
        userId,
        {
          session_id: session.id,
          session_type: sessionType,
        },
        { projectId, documentId, sessionId: session.id }
      )
    );

    return session;
  }

  public async trackKeystroke(
    sessionId: string,
    wordCountDelta: number,
    cursorPosition: CursorPosition
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== "active") {
      return;
    }

    session.wordCount += wordCountDelta;
    session.wordCount = Math.max(0, session.wordCount);
    session.totalKeystrokes += Math.abs(wordCountDelta);
    session.cursorPosition = cursorPosition;
    session.updatedAt = new Date();

    await this.eventStream.publishEvent(
      createWritingEvent(
        WritingEventType.WORD_ADDED,
        session.userId,
        {
          session_id: session.id,
          word_count_delta: wordCountDelta,
          cursor_position: cursorPosition,
          total_word_count: session.wordCount,
        },
        {
          projectId: session.projectId,
          documentId: session.documentId,
          sessionId: session.id,
        }
      )
    );

    // Simple heuristic: if user adds more than 50 words in a single action,
    // mark the session as "flow state".
    if (wordCountDelta >= 50) {
      await this.eventStream.publishEvent(
        createWritingEvent(
          WritingEventType.FLOW_STATE_ENTERED,
          session.userId,
          {
            session_id: session.id,
            velocity: wordCountDelta,
          },
          {
            projectId: session.projectId,
            documentId: session.documentId,
            sessionId: session.id,
          }
        )
      );
    }
  }

  public async endSession(sessionId: string): Promise<WritingSession | null> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    session.status = "ended";
    session.endedAt = new Date();
    session.updatedAt = session.endedAt;

    await this.eventStream.publishEvent(
      createWritingEvent(
        WritingEventType.SESSION_ENDED,
        session.userId,
        {
          session_id: session.id,
          total_word_count: session.wordCount,
          total_keystrokes: session.totalKeystrokes,
          duration_ms: session.endedAt.getTime() - session.startedAt.getTime(),
        },
        {
          projectId: session.projectId,
          documentId: session.documentId,
          sessionId: session.id,
        }
      )
    );

    return session;
  }

  public async resumeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || session.status === "ended") {
      return;
    }

    session.status = "active";
    session.updatedAt = new Date();

    await this.eventStream.publishEvent(
      createWritingEvent(
        WritingEventType.SESSION_RESUMED,
        session.userId,
        {
          session_id: session.id,
        },
        {
          projectId: session.projectId,
          documentId: session.documentId,
          sessionId: session.id,
        }
      )
    );
  }

  public getSessionMetrics(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    const endTime = session.endedAt ?? new Date();
    const durationMs = endTime.getTime() - session.startedAt.getTime();

    return {
      sessionId: session.id,
      status: session.status,
      wordCount: session.wordCount,
      totalKeystrokes: session.totalKeystrokes,
      cursorPosition: session.cursorPosition,
      startedAt: session.startedAt,
      updatedAt: session.updatedAt,
      endedAt: session.endedAt,
      durationMs,
      wordsPerMinute: durationMs > 0 ? (session.wordCount / durationMs) * 60000 : 0,
    };
  }

  public getActiveSessions(userId: string): WritingSession[] {
    return Array.from(this.sessions.values()).filter(
      (session) => session.userId === userId && session.status === "active"
    );
  }
}
