/**
 * Socket.IO gateway client for real-time events.
 *
 * Reconnection: jittered exponential backoff (1-2s base, 30s max).
 * Session resume: sends op 6 RESUME with sessionId + lastSequence on reconnect.
 */
import { io, Socket } from "socket.io-client";

type EventHandler = (data: unknown) => void;

export class GatewayClient {
  private socket: Socket | null = null;
  private handlers = new Map<string, Set<EventHandler>>();
  private token: string | null = null;
  private sessionId: string | null = null;
  private lastSequence: number = 0;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  connect(token: string) {
    this.token = token;
    if (this.socket?.connected) return;

    const wsUrl = import.meta.env.VITE_WS_URL || window.location.origin;
    this.socket = io(wsUrl, {
      path: "/gateway",
      transports: ["websocket"],
      autoConnect: false,
      reconnection: false, // we handle reconnection ourselves for jitter + resume
    });

    this.socket.on("connect", () => {
      const wasReconnect = this.reconnectAttempt > 0 || this.sessionId !== null;
      this.reconnectAttempt = 0;
      if (wasReconnect) {
        this.emit("__reconnected", null);
      }
      if (this.sessionId) {
        // Resume existing session
        this.socket?.emit("message", {
          op: 6,
          d: { token: this.token, sessionId: this.sessionId, seq: this.lastSequence },
        });
      } else {
        // Fresh identify
        this.socket?.emit("message", {
          op: 2,
          d: { token: this.token, intents: 0x1FFFF },
        });
      }
    });

    this.socket.on("message", (payload: { op: number; t?: string; s?: number; d?: any }) => {
      // Track sequence number for resume
      if (payload.s !== undefined && payload.s !== null) {
        this.lastSequence = payload.s;
      }

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
      // op 7 = RECONNECT — server requests reconnect
      if (payload.op === 7) {
        this.socket?.disconnect();
      }
      // op 9 = INVALID_SESSION — must re-identify
      if (payload.op === 9) {
        this.sessionId = null;
        this.lastSequence = 0;
        this.socket?.disconnect();
      }
      // op 10 = RESUMED — session successfully resumed
      if (payload.op === 10) {
        // resume succeeded, nothing extra needed
      }
      // Store sessionId from READY
      if (payload.op === 0 && payload.t === "READY" && payload.d?.sessionId) {
        this.sessionId = payload.d.sessionId;
      }
    });

    this.socket.on("disconnect", () => {
      this.stopHeartbeat();
      if (this.token) {
        this.emit("__disconnect", null);
        this.scheduleReconnect();
      }
    });

    this.socket.connect();
  }

  disconnect() {
    this.stopHeartbeat();
    this.cancelReconnect();
    this.sessionId = null;
    this.lastSequence = 0;
    this.reconnectAttempt = 0;
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

  /** Fire internal event to registered handlers */
  private emit(event: string, data: unknown) {
    const handlers = this.handlers.get(event);
    if (handlers) {
      for (const handler of handlers) handler(data);
    }
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

  /** Jittered exponential backoff: base 1-2s, max 30s, full jitter */
  private getReconnectDelay(): number {
    const base = 1000;
    const max = 30_000;
    const exp = Math.min(max, base * Math.pow(2, this.reconnectAttempt));
    return Math.random() * exp; // full jitter
  }

  private scheduleReconnect() {
    this.cancelReconnect();
    const delay = this.getReconnectDelay();
    this.reconnectAttempt++;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.token && !this.socket?.connected) {
        this.socket?.connect();
      }
    }, delay);
  }

  private cancelReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

export const gateway = new GatewayClient();
