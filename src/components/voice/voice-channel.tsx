"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Mic,
  MicOff,
  Headphones,
  VolumeX,
  PhoneOff,
  Phone,
  Volume2,
} from "lucide-react";
import type { VoiceState } from "@yxc/types";
import { gateway } from "@/gateway/client";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface VoiceChannelProps {
  channelId: string;
  guildId: string;
  channelName: string;
}

interface VoiceUser {
  userId: string;
  selfMute: boolean;
  selfDeaf: boolean;
  mute: boolean;
  deaf: boolean;
  suppress: boolean;
}

export function VoiceChannel({ channelId, guildId, channelName }: VoiceChannelProps) {
  const [connected, setConnected] = useState(false);
  const [selfMute, setSelfMute] = useState(false);
  const [selfDeaf, setSelfDeaf] = useState(false);
  const [voiceUsers, setVoiceUsers] = useState<VoiceUser[]>([]);

  // Fetch current voice states for this channel
  const fetchVoiceStates = useCallback(async () => {
    try {
      const states = await api.get<VoiceState[]>(
        `/guilds/${guildId}/voice-states`
      );
      const channelUsers = states
        .filter((s) => s.channelId === channelId)
        .map((s) => ({
          userId: s.userId,
          selfMute: s.selfMute,
          selfDeaf: s.selfDeaf,
          mute: s.mute,
          deaf: s.deaf,
          suppress: s.suppress,
        }));
      setVoiceUsers(channelUsers);
    } catch {
      // Voice states endpoint may not exist yet
    }
  }, [guildId, channelId]);

  useEffect(() => {
    fetchVoiceStates();
  }, [fetchVoiceStates]);

  // Listen for voice state updates
  useEffect(() => {
    const unsubState = gateway.on("VOICE_STATE_UPDATE", (data: unknown) => {
      const state = data as VoiceState;
      if (state.guildId !== guildId) return;

      setVoiceUsers((prev) => {
        // User left the channel or disconnected
        if (state.channelId === null || state.channelId !== channelId) {
          return prev.filter((u) => u.userId !== state.userId);
        }

        // User joined or updated
        const existing = prev.find((u) => u.userId === state.userId);
        const user: VoiceUser = {
          userId: state.userId,
          selfMute: state.selfMute,
          selfDeaf: state.selfDeaf,
          mute: state.mute,
          deaf: state.deaf,
          suppress: state.suppress,
        };

        if (existing) {
          return prev.map((u) => (u.userId === state.userId ? user : u));
        }
        return [...prev, user];
      });
    });

    return () => {
      unsubState();
    };
  }, [guildId, channelId]);

  const handleConnect = () => {
    gateway.updateVoiceState(guildId, channelId, selfMute, selfDeaf);
    setConnected(true);
  };

  const handleDisconnect = () => {
    gateway.updateVoiceState(guildId, null);
    setConnected(false);
    setSelfMute(false);
    setSelfDeaf(false);
  };

  const toggleMute = () => {
    const newMute = !selfMute;
    setSelfMute(newMute);
    if (connected) {
      gateway.updateVoiceState(guildId, channelId, newMute, selfDeaf);
    }
  };

  const toggleDeaf = () => {
    const newDeaf = !selfDeaf;
    setSelfDeaf(newDeaf);
    // Deafening also mutes
    const newMute = newDeaf ? true : selfMute;
    setSelfMute(newMute);
    if (connected) {
      gateway.updateVoiceState(guildId, channelId, newMute, newDeaf);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Channel header with user count */}
      <button
        onClick={connected ? undefined : handleConnect}
        className={cn(
          "flex items-center gap-1.5 rounded px-2 py-1.5 text-sm font-medium",
          "text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors",
          connected && "text-emerald-400"
        )}
      >
        <Volume2 className="h-4 w-4 shrink-0" />
        <span className="truncate">{channelName}</span>
        {voiceUsers.length > 0 && (
          <span className="ml-auto text-xs text-muted-foreground">
            {voiceUsers.length}
          </span>
        )}
      </button>

      {/* Connected users list */}
      {voiceUsers.length > 0 && (
        <div className="ml-6 flex flex-col gap-0.5 pb-1">
          {voiceUsers.map((user) => (
            <div
              key={user.userId}
              className="flex items-center gap-1.5 rounded px-2 py-0.5 text-xs text-muted-foreground"
            >
              {/* Connection indicator */}
              <div
                className={cn(
                  "h-1.5 w-1.5 rounded-full shrink-0",
                  user.suppress ? "bg-yellow-500" : "bg-emerald-500"
                )}
              />
              <span className="truncate">{user.userId}</span>
              {/* Voice status icons */}
              {(user.selfMute || user.mute) && (
                <MicOff className="h-3 w-3 shrink-0 text-red-400" />
              )}
              {(user.selfDeaf || user.deaf) && (
                <VolumeX className="h-3 w-3 shrink-0 text-red-400" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Voice connection panel at bottom when connected */}
      {connected && (
        <div className="mt-auto border-t border-border bg-background/80 p-2">
          <div className="flex items-center gap-1 mb-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-emerald-400">
              Voice Connected
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground truncate mb-2">
            {channelName}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleMute}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                selfMute
                  ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  : "bg-accent hover:bg-accent/80 text-foreground"
              )}
              title={selfMute ? "Unmute" : "Mute"}
            >
              {selfMute ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={toggleDeaf}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                selfDeaf
                  ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  : "bg-accent hover:bg-accent/80 text-foreground"
              )}
              title={selfDeaf ? "Undeafen" : "Deafen"}
            >
              {selfDeaf ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Headphones className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={handleDisconnect}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors ml-auto"
              title="Disconnect"
            >
              <PhoneOff className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
