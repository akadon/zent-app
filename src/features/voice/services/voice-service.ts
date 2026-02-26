/**
 * Voice service — REST-based.
 * Voice join/leave via REST API (no gateway).
 * LiveKit Room handles real-time participant events directly.
 */
import { api } from "@/lib/api";
import { useGuildStore } from "@/stores/guild";

export async function joinVoice(
  guildId: string,
  channelId: string,
  options?: { username?: string; channelType?: number; selfMute?: boolean; selfDeaf?: boolean }
) {
  const result = await api.post<{
    voiceState: any;
    livekitToken: string;
    livekitUrl: string;
  }>(`/voice/${guildId}/${channelId}/join`, {
    username: options?.username ?? "User",
    channelType: options?.channelType ?? 2,
    selfMute: options?.selfMute ?? false,
    selfDeaf: options?.selfDeaf ?? false,
  });

  useGuildStore.setState({
    voiceConnection: {
      guildId,
      channelId,
      selfMute: options?.selfMute ?? false,
      selfDeaf: options?.selfDeaf ?? false,
      selfVideo: false,
      selfStream: false,
      livekitRoom: null,
      livekitToken: result.livekitToken,
    },
  });

  await useGuildStore.getState().connectToLiveKit(result.livekitToken, result.livekitUrl);

  return result;
}

export async function leaveVoice(guildId: string) {
  const conn = useGuildStore.getState().voiceConnection;
  if (conn?.livekitRoom) {
    conn.livekitRoom.disconnect();
  }

  try {
    await api.post(`/voice/${guildId}/leave`);
  } catch {
    // Best effort
  }

  useGuildStore.setState({ voiceConnection: null, pendingVoiceServer: null });
}

// Kept for backward compat — voice state events handled in guild-service.ts via gateway
export function initVoiceHandlers(): () => void {
  return () => {};
}
