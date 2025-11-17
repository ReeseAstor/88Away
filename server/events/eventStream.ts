import { EventCategory, type BaseEvent, createBaseEvent } from "./eventSchema";

type StoredEvent = BaseEvent & { created_at: Date };

type StreamInfo = {
  category: EventCategory | string;
  totalEvents: number;
  firstEventAt: Date | null;
  lastEventAt: Date | null;
};

/**
 * Lightweight in-memory event stream implementation used to satisfy
 * server-side real-time APIs within this repository. The goal is to
 * provide a deterministic, dependency-free store that can be swapped
 * for a persistent implementation without touching the public surface.
 */
export class EventStreamService {
  private static instance: EventStreamService;
  private events: Map<string, StoredEvent[]> = new Map();

  private constructor() {}

  public static getInstance(): EventStreamService {
    if (!EventStreamService.instance) {
      EventStreamService.instance = new EventStreamService();
    }
    return EventStreamService.instance;
  }

  /**
   * Publish a new event into the stream. Events are kept in-memory only
   * and retained in FIFO order per category.
   */
  public async publishEvent(event: BaseEvent): Promise<string> {
    const storeEvent: StoredEvent = {
      ...event,
      created_at: event.timestamp ?? new Date(),
    };

    const key = storeEvent.category;
    if (!this.events.has(key)) {
      this.events.set(key, []);
    }

    const bucket = this.events.get(key)!;
    bucket.push(storeEvent);

    // Keep a rolling window to avoid unbounded memory usage (10k events/category)
    if (bucket.length > 10_000) {
      bucket.splice(0, bucket.length - 10_000);
    }

    return storeEvent.id;
  }

  /**
   * Convenience helper to publish a simple system log.
   */
  public async logSystemEvent(message: string, context: Record<string, unknown> = {}) {
    await this.publishEvent(
      createBaseEvent(EventCategory.SYSTEM, "system.log", { message, context })
    );
  }

  /**
   * Fetch events for a category within a time range.
   */
  public async getEventsByTimeRange(
    category: string,
    startTime: Date,
    endTime: Date,
    limit = 100
  ): Promise<BaseEvent[]> {
    const bucket = this.events.get(category) ?? [];

    return bucket
      .filter((event) => {
        const ts = event.timestamp;
        return ts >= startTime && ts <= endTime;
      })
      .slice(-limit);
  }

  /**
   * Retrieve aggregate information about a stream.
   */
  public async getStreamInfo(category: string): Promise<StreamInfo> {
    const bucket = this.events.get(category) ?? [];
    const first = bucket[0] ?? null;
    const last = bucket[bucket.length - 1] ?? null;

    return {
      category,
      totalEvents: bucket.length,
      firstEventAt: first ? first.timestamp : null,
      lastEventAt: last ? last.timestamp : null,
    };
  }

  /**
   * Clear all buffered events and reset the service.
   */
  public async destroy(): Promise<void> {
    this.events.clear();
  }
}
