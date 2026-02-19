/**
 * Voice gateway handler registration.
 * Handles VOICE_STATE_UPDATE and VOICE_SERVER_UPDATE events.
 */
import { gateway } from "@/gateway/client";
import { useGuildStore } from "@/stores/guild";
import type { VoiceState } from "@yxc/types";

export function initVoiceHandlers(): () => void {
  const unsubs: (() => void)[] = [];
  const store = useGuildStore;

  unsubs.push(
    gateway.on("VOICE_SERVER_UPDATE", (data: unknown) => {
      const { guildId, token, endpoint } = data as {
        guildId: string; token: string; endpoint: string;
      };
      store.setState({ pendingVoiceServer: { guildId, token, endpoint } });
      store.getState().connectToLiveKit(token, endpoint);
    })
  );

  unsubs.push(
    gateway.on("VOICE_STATE_UPDATE", (data: unknown) => {
      const state = data as VoiceState;
      store.setState((s) => {
        const newMap = new Map(s.voiceStates);

        // Remove user from any previous channel
        for (const [chId, states] of newMap) {
          const filtered = states.filter((vs) => vs.userId !== state.userId);
          if (filtered.length !== states.length) {
            if (filtered.length === 0) {
              newMap.delete(chId);
            } else {
              newMap.set(chId, filtered);
            }
          }
        }

        // Add to new channel if not disconnecting
        if (state.channelId) {
          const existing = newMap.get(state.channelId) ?? [];
          newMap.set(state.channelId, [...existing, state]);
        }

        return { voiceStates: newMap };
      });
    })
  );

  return () => unsubs.forEach((fn) => fn());
}
