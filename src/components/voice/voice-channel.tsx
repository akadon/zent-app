"use client";

import { useMemo, useEffect, useRef, useCallback, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Mic,
  MicOff,
  Headphones,
  VolumeX,
  PhoneOff,
  Volume2,
  Video,
  MonitorUp,
  Radio,
  Hand,
  UserPlus,
  Shield,
  MoreVertical,
} from "lucide-react";
import { Track, type RemoteTrackPublication } from "livekit-client";
import { ChannelType } from "@yxc/types";
import { useGuildStore } from "@/stores/guild";
import { useAuthStore } from "@/stores/auth";
import { gateway } from "@/gateway/client";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { VolumeControl } from "./volume-control";

interface VoiceChannelProps {
  channelId: string;
  guildId: string;
  channelName: string;
  channelType?: number;
}

/**
 * Attaches a LiveKit video track to a <video> element ref.
 */
function VideoTile({
  track,
  participantName,
  isScreenShare,
}: {
  track: { attach: () => HTMLMediaElement; detach: () => HTMLMediaElement[] };
  participantName: string;
  isScreenShare?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    const el = track.attach();
    if (el instanceof HTMLVideoElement) {
      // Copy the srcObject to our ref
      videoRef.current.srcObject = el.srcObject;
    }
    return () => {
      track.detach();
    };
  }, [track]);

  return (
    <div
      className={cn(
        "relative rounded-lg overflow-hidden bg-black",
        isScreenShare ? "col-span-full aspect-video" : "aspect-video"
      )}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="h-full w-full object-contain"
      />
      <div className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
        {participantName}
        {isScreenShare && " (Screen)"}
      </div>
    </div>
  );
}

/**
 * Hidden audio element that auto-plays a remote participant's audio track.
 */
function AudioTrackPlayer({
  track,
  deafened,
  volume,
}: {
  track: { attach: () => HTMLMediaElement; detach: () => HTMLMediaElement[]; setVolume?: (v: number) => void };
  deafened: boolean;
  volume: number;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const el = track.attach();
    if (el instanceof HTMLAudioElement && audioRef.current) {
      audioRef.current.srcObject = el.srcObject;
    }
    return () => {
      track.detach();
    };
  }, [track]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = deafened ? 0 : Math.min(volume / 100, 2);
      audioRef.current.muted = deafened;
    }
  }, [deafened, volume]);

  return <audio ref={audioRef} autoPlay />;
}

export function VoiceChannel({ channelId, guildId, channelName, channelType }: VoiceChannelProps) {
  const voiceStates = useGuildStore((s) => s.voiceStates.get(channelId) ?? []);
  const voiceConnection = useGuildStore((s) => s.voiceConnection);
  const members = useGuildStore((s) => s.members.get(guildId) ?? []);
  const user = useAuthStore((s) => s.user);
  const {
    setVoiceConnection,
    toggleSelfMute,
    toggleSelfDeaf,
    disconnectVoice,
  } = useGuildStore();

  const connected = voiceConnection?.channelId === channelId;
  const selfMute = voiceConnection?.selfMute ?? false;
  const selfDeaf = voiceConnection?.selfDeaf ?? false;
  const livekitRoom = voiceConnection?.livekitRoom ?? null;
  const isStage = channelType === ChannelType.GUILD_STAGE_VOICE;

  // Per-user volume state (userId -> 0-200)
  const userVolumes = useRef<Map<string, number>>(new Map());

  // Context menu state for moderator actions
  const [contextMenu, setContextMenu] = useState<{
    userId: string;
    x: number;
    y: number;
  } | null>(null);

  // Stage API mutations
  const requestToSpeak = useMutation({
    mutationFn: () =>
      api.post(`/stage-instances/${channelId}/request-to-speak`, {
        userId: user?.id,
        guildId,
      }),
  });

  const inviteToSpeak = useMutation({
    mutationFn: (targetUserId: string) =>
      api.post(`/stage-instances/${channelId}/speakers/${targetUserId}`, {
        guildId,
      }),
  });

  const moveToAudience = useMutation({
    mutationFn: (targetUserId: string) =>
      api.delete(`/stage-instances/${channelId}/speakers/${targetUserId}`, {
        guildId,
      }),
  });

  // Server mute/deafen mutations
  const serverMute = useMutation({
    mutationFn: ({ targetUserId, mute }: { targetUserId: string; mute: boolean }) =>
      api.patch(`/voice/${guildId}/${targetUserId}/server`, { mute }),
  });

  const serverDeafen = useMutation({
    mutationFn: ({ targetUserId, deaf }: { targetUserId: string; deaf: boolean }) =>
      api.patch(`/voice/${guildId}/${targetUserId}/server`, { deaf }),
  });

  // Build a userId -> display name lookup from guild members
  const userNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of members) {
      const name = m.nickname ?? m.user?.displayName ?? m.user?.username ?? "User";
      map.set(m.userId, name);
    }
    return map;
  }, [members]);

  const handleConnect = () => {
    gateway.updateVoiceState(guildId, channelId, false, false);
    setVoiceConnection({
      guildId,
      channelId,
      selfMute: false,
      selfDeaf: false,
      selfVideo: false,
      selfStream: false,
      livekitRoom: null,
      livekitToken: null,
    });
  };

  const handleDisconnect = () => {
    disconnectVoice();
  };

  const handleVolumeChange = useCallback((userId: string, volume: number) => {
    userVolumes.current.set(userId, volume);
  }, []);

  // Collect video/screen share tracks from LiveKit room participants
  const videoTiles: Array<{
    participantName: string;
    track: { attach: () => HTMLMediaElement; detach: () => HTMLMediaElement[] };
    isScreenShare: boolean;
    participantId: string;
  }> = [];

  const audioTracks: Array<{
    participantId: string;
    track: { attach: () => HTMLMediaElement; detach: () => HTMLMediaElement[]; setVolume?: (v: number) => void };
  }> = [];

  if (livekitRoom && connected) {
    // Remote participants
    for (const [, participant] of livekitRoom.remoteParticipants) {
      for (const [, pub] of participant.trackPublications) {
        if (!pub.track || !pub.isSubscribed) continue;
        if (pub.source === Track.Source.Camera || pub.source === Track.Source.ScreenShare) {
          videoTiles.push({
            participantName: participant.identity || participant.sid,
            track: pub.track,
            isScreenShare: pub.source === Track.Source.ScreenShare,
            participantId: participant.identity || participant.sid,
          });
        }
        if (pub.source === Track.Source.Microphone) {
          audioTracks.push({
            participantId: participant.identity || participant.sid,
            track: pub.track,
          });
        }
      }
    }

    // Local participant video tracks (so you see yourself)
    const local = livekitRoom.localParticipant;
    for (const [, pub] of local.trackPublications) {
      if (!pub.track) continue;
      if (pub.source === Track.Source.Camera || pub.source === Track.Source.ScreenShare) {
        videoTiles.push({
          participantName: local.identity || "You",
          track: pub.track,
          isScreenShare: pub.source === Track.Source.ScreenShare,
          participantId: local.identity || local.sid,
        });
      }
    }
  }

  const hasVideo = videoTiles.length > 0;

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
        {isStage ? <Radio className="h-4 w-4 shrink-0" /> : <Volume2 className="h-4 w-4 shrink-0" />}
        <span className="truncate">{channelName}</span>
        {voiceStates.length > 0 && (
          <span className="ml-auto text-xs text-muted-foreground">
            {voiceStates.length}
          </span>
        )}
      </button>

      {/* Video grid — shown above user list when any participant has video */}
      {connected && hasVideo && (
        <div
          className={cn(
            "mx-2 mb-1 grid gap-1 rounded-lg overflow-hidden",
            videoTiles.length === 1
              ? "grid-cols-1"
              : videoTiles.length <= 4
                ? "grid-cols-2"
                : "grid-cols-3"
          )}
        >
          {videoTiles.map((tile) => (
            <VideoTile
              key={`${tile.participantId}-${tile.isScreenShare ? "screen" : "cam"}`}
              track={tile.track}
              participantName={tile.participantName}
              isScreenShare={tile.isScreenShare}
            />
          ))}
        </div>
      )}

      {/* Hidden audio elements for remote participants */}
      {connected &&
        audioTracks.map((at) => (
          <AudioTrackPlayer
            key={at.participantId}
            track={at.track}
            deafened={selfDeaf}
            volume={userVolumes.current.get(at.participantId) ?? 100}
          />
        ))}

      {/* Connected users list */}
      {voiceStates.length > 0 && isStage ? (
        <StageUserList
          voiceStates={voiceStates}
          userNameMap={userNameMap}
          livekitRoom={livekitRoom}
          connected={connected}
          currentUserId={user?.id ?? null}
          channelId={channelId}
          guildId={guildId}
          onRequestToSpeak={() => requestToSpeak.mutate()}
          onInviteToSpeak={(uid) => inviteToSpeak.mutate(uid)}
          onMoveToAudience={(uid) => moveToAudience.mutate(uid)}
          onContextMenu={(userId, x, y) => setContextMenu({ userId, x, y })}
        />
      ) : voiceStates.length > 0 ? (
        <div className="ml-6 flex flex-col gap-0.5 pb-1">
          {voiceStates.map((vs) => {
            // Check if this participant has audio activity in LiveKit
            let hasSpeaking = false;
            if (livekitRoom && connected) {
              const remote = livekitRoom.remoteParticipants.get(vs.userId);
              if (remote) {
                hasSpeaking = remote.isSpeaking;
              } else if (livekitRoom.localParticipant.identity === vs.userId) {
                hasSpeaking = livekitRoom.localParticipant.isSpeaking;
              }
            }

            return (
              <div
                key={vs.userId}
                className="group flex items-center gap-1.5 rounded px-2 py-0.5 text-xs text-muted-foreground"
                onContextMenu={(e) => {
                  if (connected && vs.userId !== user?.id) {
                    e.preventDefault();
                    setContextMenu({ userId: vs.userId, x: e.clientX, y: e.clientY });
                  }
                }}
              >
                {/* Connection indicator — green ring when speaking */}
                <div
                  className={cn(
                    "h-1.5 w-1.5 rounded-full shrink-0 transition-colors",
                    hasSpeaking
                      ? "bg-emerald-400 ring-2 ring-emerald-400/40"
                      : vs.suppress
                        ? "bg-yellow-500"
                        : "bg-emerald-500"
                  )}
                />
                <span className="truncate">{userNameMap.get(vs.userId) ?? "User"}</span>
                {/* Voice status icons */}
                {(vs.selfMute || vs.mute) && (
                  <MicOff className="h-3 w-3 shrink-0 text-red-400" />
                )}
                {(vs.selfDeaf || vs.deaf) && (
                  <VolumeX className="h-3 w-3 shrink-0 text-red-400" />
                )}
                {vs.mute && (
                  <Shield className="h-3 w-3 shrink-0 text-orange-400" title="Server muted" />
                )}
                {vs.deaf && !vs.selfDeaf && (
                  <Shield className="h-3 w-3 shrink-0 text-orange-400" title="Server deafened" />
                )}
                {/* Per-user volume control on hover */}
                {connected && vs.userId !== livekitRoom?.localParticipant?.identity && (
                  <div className="ml-auto hidden group-hover:block">
                    <VolumeControl
                      userId={vs.userId}
                      username={userNameMap.get(vs.userId) ?? "User"}
                      onVolumeChange={handleVolumeChange}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Moderator context menu */}
      {contextMenu && connected && (
        <VoiceUserContextMenu
          userId={contextMenu.userId}
          userName={userNameMap.get(contextMenu.userId) ?? "User"}
          x={contextMenu.x}
          y={contextMenu.y}
          guildId={guildId}
          voiceState={voiceStates.find((vs) => vs.userId === contextMenu.userId)}
          onServerMute={(mute) =>
            serverMute.mutate({ targetUserId: contextMenu.userId, mute })
          }
          onServerDeafen={(deaf) =>
            serverDeafen.mutate({ targetUserId: contextMenu.userId, deaf })
          }
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Voice connection panel at bottom when connected */}
      {connected && (
        <div className="mt-auto border-t border-border bg-background/80 p-2">
          <div className="flex items-center gap-1 mb-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-emerald-400">
              {livekitRoom ? "Voice Connected" : "Connecting..."}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground truncate mb-2">
            {channelName}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleSelfMute}
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
              onClick={toggleSelfDeaf}
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

/**
 * Stage channel user list: splits users into Speakers (suppress=false)
 * and Audience (suppress=true).
 */
function StageUserList({
  voiceStates,
  userNameMap,
  livekitRoom,
  connected,
  currentUserId,
  channelId,
  guildId,
  onRequestToSpeak,
  onInviteToSpeak,
  onMoveToAudience,
  onContextMenu,
}: {
  voiceStates: any[];
  userNameMap: Map<string, string>;
  livekitRoom: any;
  connected: boolean;
  currentUserId: string | null;
  channelId: string;
  guildId: string;
  onRequestToSpeak: () => void;
  onInviteToSpeak: (userId: string) => void;
  onMoveToAudience: (userId: string) => void;
  onContextMenu: (userId: string, x: number, y: number) => void;
}) {
  const speakers = voiceStates.filter((vs) => !vs.suppress);
  const audience = voiceStates.filter((vs) => vs.suppress);
  const currentIsAudience = audience.some((vs) => vs.userId === currentUserId);
  const currentIsSpeaker = speakers.some((vs) => vs.userId === currentUserId);

  return (
    <div className="ml-4 pb-1">
      {/* Speakers section */}
      <div className="mb-2">
        <div className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
          <Radio className="h-3 w-3" />
          Speakers — {speakers.length}
        </div>
        <div className="flex flex-col gap-0.5">
          {speakers.map((vs) => (
            <div
              key={vs.userId}
              className="group flex items-center gap-1.5 rounded px-2 py-0.5 text-xs text-muted-foreground"
              onContextMenu={(e) => {
                if (connected && vs.userId !== currentUserId) {
                  e.preventDefault();
                  onContextMenu(vs.userId, e.clientX, e.clientY);
                }
              }}
            >
              <div className="h-1.5 w-1.5 rounded-full shrink-0 bg-emerald-500" />
              <span className="truncate">{userNameMap.get(vs.userId) ?? "User"}</span>
              {(vs.selfMute || vs.mute) && (
                <MicOff className="h-3 w-3 shrink-0 text-red-400" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Audience section */}
      <div>
        <div className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
          Audience — {audience.length}
        </div>
        <div className="flex flex-col gap-0.5">
          {audience.map((vs) => (
            <div
              key={vs.userId}
              className="group flex items-center gap-1.5 rounded px-2 py-0.5 text-xs text-muted-foreground"
              onContextMenu={(e) => {
                if (connected && vs.userId !== currentUserId) {
                  e.preventDefault();
                  onContextMenu(vs.userId, e.clientX, e.clientY);
                }
              }}
            >
              <div className="h-1.5 w-1.5 rounded-full shrink-0 bg-yellow-500" />
              <span className="truncate">{userNameMap.get(vs.userId) ?? "User"}</span>
              {/* Invite to speak button for speakers/moderators */}
              {connected && currentIsSpeaker && vs.userId !== currentUserId && (
                <button
                  onClick={() => onInviteToSpeak(vs.userId)}
                  className="ml-auto hidden group-hover:block text-text-muted hover:text-emerald-400 transition-colors"
                  title="Invite to Speak"
                >
                  <UserPlus className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Request to Speak button for audience members */}
      {connected && currentIsAudience && (
        <button
          onClick={onRequestToSpeak}
          className={cn(
            "flex items-center gap-1.5 mx-2 mt-2 px-3 py-1.5 rounded-md text-xs font-medium",
            "bg-brand/15 text-brand-light hover:bg-brand/25 transition-colors",
            "active:scale-95"
          )}
        >
          <Hand className="h-3 w-3" />
          Request to Speak
        </button>
      )}
    </div>
  );
}

/**
 * Right-click context menu for moderator actions on voice users.
 */
function VoiceUserContextMenu({
  userId,
  userName,
  x,
  y,
  guildId,
  voiceState,
  onServerMute,
  onServerDeafen,
  onClose,
}: {
  userId: string;
  userName: string;
  x: number;
  y: number;
  guildId: string;
  voiceState?: any;
  onServerMute: (mute: boolean) => void;
  onServerDeafen: (deaf: boolean) => void;
  onClose: () => void;
}) {
  const isMuted = voiceState?.mute ?? false;
  const isDeafened = voiceState?.deaf ?? false;

  useEffect(() => {
    const handler = () => onClose();
    window.addEventListener("click", handler);
    window.addEventListener("contextmenu", handler);
    return () => {
      window.removeEventListener("click", handler);
      window.removeEventListener("contextmenu", handler);
    };
  }, [onClose]);

  return (
    <div
      className={cn(
        "fixed z-50 min-w-[180px] rounded-lg py-1.5",
        "bg-background-secondary border border-surface-border/50",
        "shadow-lg animate-fade-in"
      )}
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-3 py-1.5 text-xs font-semibold text-header-primary truncate border-b border-surface-border/30 mb-1">
        {userName}
      </div>
      <button
        onClick={() => {
          onServerMute(!isMuted);
          onClose();
        }}
        className={cn(
          "flex items-center gap-2 w-full px-3 py-1.5 text-xs text-text-normal",
          "hover:bg-background-hover/50 transition-colors"
        )}
      >
        {isMuted ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
        {isMuted ? "Remove Server Mute" : "Server Mute"}
      </button>
      <button
        onClick={() => {
          onServerDeafen(!isDeafened);
          onClose();
        }}
        className={cn(
          "flex items-center gap-2 w-full px-3 py-1.5 text-xs text-text-normal",
          "hover:bg-background-hover/50 transition-colors"
        )}
      >
        {isDeafened ? <Headphones className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
        {isDeafened ? "Remove Server Deafen" : "Server Deafen"}
      </button>
    </div>
  );
}
