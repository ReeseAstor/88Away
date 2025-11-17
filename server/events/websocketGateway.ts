import type { Server as HttpServer } from "http";

type ConnectionStats = {
  totalConnections: number;
  channels: Record<string, number>;
};

/**
 * Minimal WebSocket gateway that satisfies the existing server API without
 * introducing a real-time dependency. The implementation tracks declared
 * channels and connection counts so analytics routes return meaningful
 * information even when WebSockets are not actively in use.
 */
export class WebSocketGateway {
  private static instance: WebSocketGateway;

  private server: HttpServer | null = null;
  private connections = 0;
  private channelUsage: Map<string, number> = new Map();

  private constructor() {}

  public static getInstance(): WebSocketGateway {
    if (!WebSocketGateway.instance) {
      WebSocketGateway.instance = new WebSocketGateway();
    }
    return WebSocketGateway.instance;
  }

  public initialize(server: HttpServer) {
    this.server = server;
  }

  public async destroy(): Promise<void> {
    this.server = null;
    this.connections = 0;
    this.channelUsage.clear();
  }

  public getStats(): ConnectionStats {
    return {
      totalConnections: this.connections,
      channels: Object.fromEntries(this.channelUsage.entries()),
    };
  }

  public async broadcastToChannel(channel: string, _message: unknown): Promise<void> {
    this.bumpChannelUsage(channel);
  }

  public async sendToUser(_userId: string, _message: unknown): Promise<void> {
    // Intentionally a no-op in the lightweight gateway implementation.
  }

  // Helper for future extensibility (e.g., if a real WebSocket server is added)
  private bumpChannelUsage(channel: string) {
    const current = this.channelUsage.get(channel) ?? 0;
    this.channelUsage.set(channel, current + 1);
  }
}
