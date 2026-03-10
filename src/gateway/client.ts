/**
 * Native WebSocket gateway client for real-time events.
 *
 * Reconnection: jittered exponential backoff (1-2s base, 30s max).
 * Session resume: sends op 6 RESUME with sessionId + lastSequence on reconnect.
 * ~1KB per connection vs Socket.IO's ~15-20KB.
 */

type EventHandler = (data: unknown) => void;

export class GatewayClient {
  private ws: WebSocket | null = null;
  private handlers = new Map<string, Set<EventHandler>>();
  private token: string | null = null;
  private sessionId: string | null = null;
  private lastSequence: number = 0;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private heartbeatTimeout: ReturnType<typeof setTimeout> | null = null;
  private heartbeatAcked = true;
  private sendQueue: unknown[] = [];

  connect(token: string) {
    this.token = token;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;
    this.createSocket();
  }

  private createSocket() {
    const base = import.meta.env.VITE_WS_URL || window.location.origin;
    const wsUrl = base.replace(/^http/, "ws") + "/gateway";

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      const wasReconnect = this.reconnectAttempt > 0 || this.sessionId !== null;
      this.reconnectAttempt = 0;
      if (wasReconnect) {
        this.emit("__reconnected", null);
      }
      if (this.sessionId) {
        // Resume existing session
        this.send({ op: 6, d: { sessionId: this.sessionId, seq: this.lastSequence } });
      } else {
        // Fresh identify
        this.send({ op: 2, d: { token: this.token, intents: 0x1FFFF } });
      }
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as { op: number; t?: string; s?: number; d?: any };

        // Track sequence number for resume
        if (payload.s !== undefined && payload.s !== null) {
          this.lastSequence = payload.s;
        }

        // op 0 = DISPATCH — route to event handlers
        if (payload.op === 0 && payload.t) {
          const handlers = this.handlers.get(payload.t);
          if (handlers) {
            for (const handler of handlers) {
              handler(payload.d);
            }
          }
        }
        // op 10 = HELLO — start heartbeat
        if (payload.op === 10 && payload.d?.heartbeatInterval) {
          this.startHeartbeat(payload.d.heartbeatInterval);
        }
        // op 7 = RECONNECT — server requests reconnect
        if (payload.op === 7) {
          this.ws?.close();
        }
        // op 9 = INVALID_SESSION — must re-identify
        if (payload.op === 9) {
          this.sessionId = null;
          this.lastSequence = 0;
          this.ws?.close();
        }
        // op 11 = HEARTBEAT_ACK — connection alive
        if (payload.op === 11) {
          this.heartbeatAcked = true;
        }

        // Store sessionId from READY event
        if (payload.op === 0 && payload.t === "READY" && payload.d?.sessionId) {
          this.sessionId = payload.d.sessionId;
          this.drainQueue();
        }
        // Drain queued messages after successful resume
        if (payload.op === 0 && payload.t === "RESUMED") {
          this.drainQueue();
        }
      } catch {
        // Ignore malformed messages
      }
    };

    this.ws.onclose = () => {
      this.stopHeartbeat();
      if (this.token) {
        this.emit("__disconnect", null);
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      // Error always precedes close; cleanup happens in onclose
    };
  }

  disconnect() {
    this.stopHeartbeat();
    this.cancelReconnect();
    this.sessionId = null;
    this.lastSequence = 0;
    this.reconnectAttempt = 0;
    this.token = null;
    this.sendQueue.length = 0;
    if (this.ws) {
      this.ws.onclose = null; // Prevent reconnect on intentional disconnect
      this.ws.close();
      this.ws = null;
    }
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

  private send(data: unknown, queue = true) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else if (queue) {
      this.sendQueue.push(data);
    }
  }

  private drainQueue() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const queued = this.sendQueue.splice(0);
    for (const data of queued) {
      this.ws.send(JSON.stringify(data));
    }
  }

  updatePresence(status: string, customStatus?: any) {
    this.send({ op: 3, d: { status, customStatus, activities: [] } });
  }

  updateVoiceState(guildId: string, channelId: string | null, selfMute?: boolean, selfDeaf?: boolean) {
    this.send({ op: 4, d: { guildId, channelId, selfMute: selfMute ?? false, selfDeaf: selfDeaf ?? false } });
  }

  requestGuildMembers(guildId: string, query?: string, userIds?: string[]) {
    this.send({ op: 8, d: { guildId, query, userIds, limit: 100 } });
  }

  private startHeartbeat(interval: number) {
    this.stopHeartbeat();
    this.heartbeatAcked = true;
    // Add jitter to first heartbeat to avoid thundering herd
    const jitter = Math.random() * interval;
    this.heartbeatTimeout = setTimeout(() => {
      this.heartbeatTimeout = null;
      this.sendHeartbeat();
      this.heartbeatInterval = setInterval(() => {
        this.sendHeartbeat();
      }, interval);
    }, jitter);
  }

  private sendHeartbeat() {
    if (!this.heartbeatAcked) {
      // No ACK received since last heartbeat — zombie connection, reconnect
      this.ws?.close();
      return;
    }
    this.heartbeatAcked = false;
    this.send({ op: 1, d: null }, false); // HEARTBEAT opcode = 1, never queue
  }

  private stopHeartbeat() {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
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
      if (this.token) {
        this.createSocket();
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
