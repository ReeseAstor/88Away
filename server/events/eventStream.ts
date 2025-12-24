import { EventCategory, type BaseEvent, createBaseEvent } from "./eventSchema";

type StoredEvent = BaseEvent & { created_at: Date };

type StreamInfo = {
  category: EventCategory | string;
  totalEvents: number;
  firstEventAt: Date | null;
  lastEventAt: Date | null;
};

type EventHandler = (event: BaseEvent) => void | Promise<void>;

/**
 * Lightweight in-memory event stream implementation used to satisfy
 * server-side real-time APIs within this repository. The goal is to
 * provide a deterministic, dependency-free store that can be swapped
 * for a persistent implementation without touching the public surface.
 */
export class EventStreamService {
  private static instance: EventStreamService;
  private events: Map<string, StoredEvent[]> = new Map();
  private subscribers: Map<string, Set<EventHandler>> = new Map();

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

    // Fan out to subscribers for this category (best-effort; don't block publishing)
    const subs = this.subscribers.get(key);
    if (subs && subs.size > 0) {
      await Promise.allSettled(
        Array.from(subs).map(async (handler) => {
          await handler(storeEvent);
        })
      );
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
        const ts = event.timestamp ?? event.created_at;
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
      firstEventAt: first ? (first.timestamp ?? first.created_at) : null,
      lastEventAt: last ? (last.timestamp ?? last.created_at) : null,
    };
  }

  /**
   * Subscribe to a category stream.
   * Returns an unsubscribe function.
   */
  public async subscribe(category: string, handler: EventHandler): Promise<() => void> {
    if (!this.subscribers.has(category)) {
      this.subscribers.set(category, new Set());
    }
    this.subscribers.get(category)!.add(handler);

    return () => {
      const set = this.subscribers.get(category);
      if (!set) return;
      set.delete(handler);
      if (set.size === 0) {
        this.subscribers.delete(category);
      }
    };
  }

  /**
   * Clear all buffered events and reset the service.
   */
  public async destroy(): Promise<void> {
    this.events.clear();
    this.subscribers.clear();
  }
}
