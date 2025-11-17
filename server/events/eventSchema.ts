import { randomUUID } from "crypto";

export enum EventCategory {
  WRITING = "writing",
  COLLABORATION = "collaboration",
  NOTIFICATION = "notification",
  SYSTEM = "system",
}

export enum WritingEventType {
  SESSION_STARTED = "writing.session_started",
  SESSION_RESUMED = "writing.session_resumed",
  SESSION_ENDED = "writing.session_ended",
  WORD_ADDED = "writing.word_added",
  FLOW_STATE_ENTERED = "writing.flow_state_entered",
  CURSOR_MOVED = "writing.cursor_moved",
}

export enum CollaborationEventType {
  PRESENCE_UPDATED = "collaboration.presence_updated",
  CURSOR_MOVED = "collaboration.cursor_moved",
  EDIT_APPLIED = "collaboration.edit_applied",
  COMMENT_ADDED = "collaboration.comment_added",
  CONFLICT_DETECTED = "collaboration.conflict_detected",
}

export type EventPayload = Record<string, unknown>;

export interface BaseEvent<TType extends string = string> {
  id: string;
  category: EventCategory;
  event_type: TType;
  timestamp: Date;
  user_id?: string;
  project_id?: string;
  document_id?: string;
  payload: EventPayload;
}

type EventMetadata = {
  projectId?: string;
  documentId?: string;
  sessionId?: string;
};

const now = () => new Date();

const withMetadata = <T extends BaseEvent, K extends keyof BaseEvent>(
  event: T,
  metadata?: EventMetadata,
  fields: K[] = ["project_id", "document_id"]
) => {
  if (!metadata) return event;

  if (metadata.projectId) {
    (event as BaseEvent).project_id = metadata.projectId;
  }
  if (metadata.documentId) {
    (event as BaseEvent).document_id = metadata.documentId;
  }
  if ("session_id" in event.payload && metadata.sessionId) {
    (event.payload as Record<string, unknown>).session_id = metadata.sessionId;
  }

  return event;
};

export const createBaseEvent = <TType extends string>(
  category: EventCategory,
  eventType: TType,
  payload: EventPayload,
  userId?: string
): BaseEvent<TType> => ({
  id: randomUUID(),
  category,
  event_type: eventType,
  timestamp: now(),
  user_id: userId,
  payload,
});

export const createWritingEvent = (
  eventType: WritingEventType,
  userId: string,
  payload: EventPayload,
  metadata?: EventMetadata
): BaseEvent<WritingEventType> =>
  withMetadata(
    createBaseEvent(EventCategory.WRITING, eventType, payload, userId),
    metadata,
    ["project_id", "document_id"]
  );

export const createCollaborationEvent = (
  eventType: CollaborationEventType,
  userId: string,
  payload: EventPayload,
  metadata?: EventMetadata
): BaseEvent<CollaborationEventType> =>
  withMetadata(
    createBaseEvent(EventCategory.COLLABORATION, eventType, payload, userId),
    metadata,
    ["project_id", "document_id"]
  );
