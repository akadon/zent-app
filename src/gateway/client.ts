/**
 * Gateway client — DEPRECATED.
 * The app now uses REST polling instead of WebSocket for chat events.
 * This file is kept as a stub so existing imports don't break.
 * Voice uses REST + LiveKit directly (no gateway needed).
 */

type EventHandler = (data: unknown) => void;

export class GatewayClient {
  connect(_token: string) {
    // No-op — polling replaces gateway
  }

  disconnect() {
    // No-op
  }

  on(_event: string, _handler: EventHandler) {
    // No-op — returns cleanup function
    return () => {};
  }

  off(_event: string, _handler: EventHandler) {
    // No-op
  }

  updatePresence(_status: string, _customStatus?: any) {
    // No-op — presence derived from activity
  }

  updateVoiceState(_guildId: string, _channelId: string | null, _selfMute?: boolean, _selfDeaf?: boolean) {
    // No-op — voice uses REST via voice-service.ts
  }
}

export const gateway = new GatewayClient();
