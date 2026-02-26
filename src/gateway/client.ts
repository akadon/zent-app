/**
 * Socket.IO gateway client for real-time events.
 */
import { io, Socket } from "socket.io-client";

type EventHandler = (data: unknown) => void;

export class GatewayClient {
  private socket: Socket | null = null;
  private handlers = new Map<string, Set<EventHandler>>();
  private token: string | null = null;

  connect(token: string) {
    this.token = token;
    if (this.socket?.connected) return;

    const wsUrl = import.meta.env.VITE_WS_URL || window.location.origin;
    this.socket = io(wsUrl, {
      path: "/gateway",
      transports: ["websocket"],
      autoConnect: false,
    });

    this.socket.on("connect", () => {
      // Send IDENTIFY
      this.socket?.emit("message", {
        op: 2,
        d: { token: this.token, intents: 0x1FFFF },
      });
    });

    this.socket.on("message", (payload: { op: number; t?: string; d?: any }) => {
      // op 0 = DISPATCH
      if (payload.op === 0 && payload.t) {
        const handlers = this.handlers.get(payload.t);
        if (handlers) {
          for (const handler of handlers) {
            handler(payload.d);
          }
        }
      }
      // op 1 = HELLO — start heartbeat
      if (payload.op === 1 && payload.d?.heartbeatInterval) {
        this.startHeartbeat(payload.d.heartbeatInterval);
      }
    });

    this.socket.on("disconnect", () => {
      this.stopHeartbeat();
    });

    this.socket.connect();
  }

  disconnect() {
    this.stopHeartbeat();
    this.socket?.disconnect();
    this.socket = null;
  }

  on(event: string, handler: EventHandler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  off(event: string, handler: EventHandler) {
    this.handlers.get(event)?.delete(handler);
  }

  updatePresence(status: string, customStatus?: any) {
    this.socket?.emit("message", {
      op: 3,
      d: { status, customStatus, activities: [] },
    });
  }

  updateVoiceState(guildId: string, channelId: string | null, selfMute?: boolean, selfDeaf?: boolean) {
    this.socket?.emit("message", {
      op: 4,
      d: { guildId, channelId, selfMute: selfMute ?? false, selfDeaf: selfDeaf ?? false },
    });
  }

  requestGuildMembers(guildId: string, query?: string, userIds?: string[]) {
    this.socket?.emit("message", {
      op: 8,
      d: { guildId, query, userIds, limit: 100 },
    });
  }

  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  private startHeartbeat(interval: number) {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      this.socket?.emit("message", { op: 11, d: null });
    }, interval);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

export const gateway = new GatewayClient();
