import { io, Socket } from "socket.io-client";
import { GatewayOp } from "@yxc/gateway-types";
import type {
  GatewayPayload,
  GatewayEvent,
  HelloPayload,
  ReadyPayload,
} from "@yxc/gateway-types";

type EventHandler = (data: unknown) => void;

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || (typeof window !== "undefined" ? window.location.origin : "http://localhost:4000");

export class GatewayClient {
  private socket: Socket | null = null;
  private token: string | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private heartbeatJitterTimeout: ReturnType<typeof setTimeout> | null = null;
  private lastSequence: number | null = null;
  private sessionId: string | null = null;
  private handlers = new Map<string, Set<EventHandler>>();
  private resuming = false;
  private heartbeatIntervalMs = 41250;

  connect(token: string) {
    this.token = token;

    this.socket = io(WS_URL, {
      path: "/gateway",
      transports: ["websocket"],
      autoConnect: true,
    });

    this.socket.on("message", (payload: GatewayPayload) => {
      this.handlePayload(payload);
    });

    this.socket.on("disconnect", () => {
      this.stopHeartbeat();
      // Attempt reconnect with resume
      if (this.sessionId && this.token) {
        this.resuming = true;
        setTimeout(() => {
          if (this.token && !this.socket?.connected) {
            this.socket?.connect();
          }
        }, 1000 + Math.random() * 3000);
      }
    });

    this.socket.on("connect_error", (err) => {
      console.error("Gateway connection error:", err.message);
    });
  }

  disconnect() {
    this.resuming = false;
    this.stopHeartbeat();
    this.socket?.disconnect();
    this.socket = null;
    this.sessionId = null;
    this.lastSequence = null;
  }

  on(event: GatewayEvent | "READY" | "RESUMED", handler: EventHandler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);

    return () => {
      this.handlers.get(event)?.delete(handler);
    };
  }

  off(event: string, handler: EventHandler) {
    this.handlers.get(event)?.delete(handler);
  }

  /** Update presence status */
  updatePresence(status: "online" | "idle" | "dnd" | "invisible", customStatus?: { text?: string; emoji?: string } | null) {
    this.send({
      op: GatewayOp.PRESENCE_UPDATE,
      d: { status, customStatus: customStatus ?? null },
    });
  }

  /** Update voice state (join/leave/mute) */
  updateVoiceState(guildId: string, channelId: string | null, selfMute?: boolean, selfDeaf?: boolean) {
    this.send({
      op: GatewayOp.VOICE_STATE_UPDATE,
      d: { guildId, channelId, selfMute, selfDeaf },
    });
  }

  private handlePayload(payload: GatewayPayload) {
    switch (payload.op) {
      case GatewayOp.HELLO: {
        const hello = payload.d as HelloPayload;
        this.heartbeatIntervalMs = hello.heartbeatInterval;
        this.startHeartbeat(hello.heartbeatInterval);

        // Resume if we have a session, otherwise identify
        if (this.resuming && this.sessionId && this.token) {
          this.resume();
        } else {
          this.identify();
        }
        this.resuming = false;
        break;
      }

      case GatewayOp.HEARTBEAT_ACK:
        // Connection is alive
        break;

      case GatewayOp.DISPATCH: {
        if (payload.s != null) {
          this.lastSequence = payload.s;
        }

        if (payload.t === "READY") {
          const ready = payload.d as ReadyPayload;
          this.sessionId = ready.sessionId;
        }

        if (payload.t) {
          const eventHandlers = this.handlers.get(payload.t);
          eventHandlers?.forEach((handler) => handler(payload.d));
        }
        break;
      }

      case GatewayOp.RECONNECT:
        this.resuming = true;
        this.socket?.disconnect();
        this.socket?.connect();
        break;

      case GatewayOp.INVALID_SESSION: {
        const canResume = payload.d as boolean;
        if (!canResume) {
          this.sessionId = null;
          this.lastSequence = null;
        }
        // Re-identify after a short delay
        setTimeout(() => {
          if (canResume && this.sessionId) {
            this.resume();
          } else {
            this.identify();
          }
        }, 1000 + Math.random() * 4000);
        break;
      }
    }
  }

  private identify() {
    this.send({
      op: GatewayOp.IDENTIFY,
      d: { token: this.token! },
    });
  }

  private resume() {
    this.send({
      op: GatewayOp.RESUME,
      d: {
        token: this.token!,
        sessionId: this.sessionId!,
        seq: this.lastSequence ?? 0,
      },
    });
  }

  private startHeartbeat(interval: number) {
    this.stopHeartbeat();
    // First heartbeat with jitter
    const jitter = Math.random() * interval;
    this.heartbeatJitterTimeout = setTimeout(() => {
      this.heartbeatJitterTimeout = null;
      this.sendHeartbeat();
      this.heartbeatInterval = setInterval(() => {
        this.sendHeartbeat();
      }, interval);
    }, jitter);
  }

  private stopHeartbeat() {
    if (this.heartbeatJitterTimeout) {
      clearTimeout(this.heartbeatJitterTimeout);
      this.heartbeatJitterTimeout = null;
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private sendHeartbeat() {
    this.send({
      op: GatewayOp.HEARTBEAT,
      d: { lastSequence: this.lastSequence },
    });
  }

  private send(payload: GatewayPayload) {
    this.socket?.emit("message", payload);
  }
}

// Singleton gateway client
export const gateway = new GatewayClient();
