/**
 * Typed wrapper around gateway/client.ts singleton.
 * Feature services use this instead of importing gateway directly.
 */
import { gateway } from "@/gateway/client";
import type { GatewayEvent } from "@yxc/gateway-types";

type EventHandler<T = unknown> = (data: T) => void;

/** All gateway events that features can subscribe to */
export type GatewayEventName =
  | "READY"
  | "RESUMED"
  | GatewayEvent;

class GatewayService {
  private cleanupFns: (() => void)[] = [];

  /** Connect with token */
  connect(token: string) {
    gateway.connect(token);
  }

  /** Disconnect */
  disconnect() {
    this.unsubscribeAll();
    gateway.disconnect();
  }

  /** Subscribe to a gateway event. Returns unsubscribe function. */
  on<T = unknown>(event: GatewayEventName, handler: EventHandler<T>): () => void {
    const unsub = gateway.on(event as any, handler as EventHandler);
    this.cleanupFns.push(unsub);
    return unsub;
  }

  /** Remove all subscriptions */
  unsubscribeAll() {
    this.cleanupFns.forEach((fn) => fn());
    this.cleanupFns = [];
  }

  /** Update presence */
  updatePresence(status: "online" | "idle" | "dnd" | "invisible", customStatus?: { text?: string; emoji?: string } | null) {
    gateway.updatePresence(status, customStatus);
  }

  /** Update voice state */
  updateVoiceState(guildId: string, channelId: string | null, selfMute?: boolean, selfDeaf?: boolean) {
    gateway.updateVoiceState(guildId, channelId, selfMute, selfDeaf);
  }
}

/** Singleton gateway service */
export const gatewayService = new GatewayService();
