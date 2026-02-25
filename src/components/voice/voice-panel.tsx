import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Mic,
  MicOff,
  Headphones,
  VolumeX,
  PhoneOff,
  Video,
  VideoOff,
  MonitorUp,
  MonitorOff,
  Music,
  Play,
  Star,
  StarOff,
  X,
} from "lucide-react";
import { useGuildStore } from "@/stores/guild";
import { useAuthStore } from "@/stores/auth";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface SoundboardSound {
  id: string;
  guildId: string;
  name: string;
  soundUrl: string;
  volume?: number;
  emojiId?: string | null;
  emojiName?: string | null;
  userId: string;
  available: boolean;
}

interface VoicePanelProps {
  channelName: string;
  guildName: string;
  guildId: string;
  channelId: string;
  onDisconnect: () => void;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function VoicePanel({
  channelName,
  guildName,
  guildId,
  channelId,
  onDisconnect,
}: VoicePanelProps) {
  const voiceConnection = useGuildStore((s) => s.voiceConnection);
  const { toggleSelfMute, toggleSelfDeaf, toggleSelfVideo, toggleSelfStream, disconnectVoice } = useGuildStore();
  const [elapsed, setElapsed] = useState(0);
  const [soundboardOpen, setSoundboardOpen] = useState(false);
  const startTime = useRef(Date.now());

  const selfMute = voiceConnection?.selfMute ?? false;
  const selfDeaf = voiceConnection?.selfDeaf ?? false;
  const selfVideo = voiceConnection?.selfVideo ?? false;
  const selfStream = voiceConnection?.selfStream ?? false;
  const hasLiveKit = voiceConnection?.livekitRoom != null;

  // Duration timer
  useEffect(() => {
    startTime.current = Date.now();
    setElapsed(0);

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleDisconnect = () => {
    disconnectVoice();
    onDisconnect();
  };

  return (
    <div className={cn(
      "border-t border-surface-border/50 px-3 py-3",
      "bg-gradient-to-t from-background-tertiary/80 to-background-secondary"
    )}>
      {/* Soundboard panel */}
      {soundboardOpen && (
        <SoundboardPanel
          guildId={guildId}
          channelId={channelId}
          onClose={() => setSoundboardOpen(false)}
        />
      )}

      {/* Status row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Pulsing indicator */}
          <div className="relative">
            <div className="h-2.5 w-2.5 rounded-full bg-green shrink-0" />
            <div className="absolute inset-0 h-2.5 w-2.5 rounded-full bg-green animate-ping opacity-50" />
          </div>
          <span className="text-xs font-semibold text-green-light truncate">
            Connected
          </span>
        </div>
        <span className="text-2xs text-text-muted tabular-nums font-medium shrink-0">
          {formatDuration(elapsed)}
        </span>
      </div>

      {/* Channel info */}
      <div className="mb-3 px-0.5">
        <p className="text-sm font-medium text-header-primary truncate">
          {channelName}
        </p>
        <p className="text-xs text-text-muted truncate">
          {guildName}
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <VoiceButton
          active={selfMute}
          onClick={toggleSelfMute}
          icon={selfMute ? <MicOff size={16} /> : <Mic size={16} />}
          tooltip={selfMute ? "Unmute" : "Mute"}
          danger={selfMute}
        />
        <VoiceButton
          active={selfDeaf}
          onClick={toggleSelfDeaf}
          icon={selfDeaf ? <VolumeX size={16} /> : <Headphones size={16} />}
          tooltip={selfDeaf ? "Undeafen" : "Deafen"}
          danger={selfDeaf}
        />
        {hasLiveKit && (
          <>
            <VoiceButton
              active={selfVideo}
              onClick={toggleSelfVideo}
              icon={selfVideo ? <VideoOff size={16} /> : <Video size={16} />}
              tooltip={selfVideo ? "Turn Off Camera" : "Turn On Camera"}
              danger={selfVideo}
            />
            <VoiceButton
              active={selfStream}
              onClick={toggleSelfStream}
              icon={selfStream ? <MonitorOff size={16} /> : <MonitorUp size={16} />}
              tooltip={selfStream ? "Stop Sharing" : "Share Screen"}
              danger={selfStream}
            />
          </>
        )}
        <VoiceButton
          active={soundboardOpen}
          onClick={() => setSoundboardOpen(!soundboardOpen)}
          icon={<Music size={16} />}
          tooltip="Soundboard"
        />
        <div className="flex-1" />
        <VoiceButton
          onClick={handleDisconnect}
          icon={<PhoneOff size={16} />}
          tooltip="Disconnect"
          danger
          alwaysDanger
        />
      </div>
    </div>
  );
}

function VoiceButton({
  icon,
  tooltip,
  onClick,
  active = false,
  danger = false,
  alwaysDanger = false,
}: {
  icon: React.ReactNode;
  tooltip: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  alwaysDanger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full",
        "transition-all duration-200 ease-out",
        "active:scale-90",
        alwaysDanger
          ? "bg-red/10 text-red-light hover:bg-red/20"
          : danger
            ? "bg-red/10 text-red-light hover:bg-red/20"
            : active
              ? "bg-brand/15 text-brand-light hover:bg-brand/25"
              : "bg-background-hover text-text-normal hover:bg-interactive-muted hover:text-header-primary"
      )}
      title={tooltip}
    >
      {icon}
    </button>
  );
}

function SoundboardPanel({
  guildId,
  channelId,
  onClose,
}: {
  guildId: string;
  channelId: string;
  onClose: () => void;
}) {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;

  const { data: soundsData } = useQuery({
    queryKey: ["soundboard", guildId],
    queryFn: () =>
      api.get<{ items: SoundboardSound[] }>(
        `/guilds/${guildId}/soundboard-sounds`
      ),
    enabled: !!guildId,
  });

  const { data: favoritesData } = useQuery({
    queryKey: ["soundboard-favorites", userId],
    queryFn: () =>
      api.get<{ items: SoundboardSound[] }>(
        `/users/${userId}/soundboard-sounds`
      ),
    enabled: !!userId,
  });

  const sounds = soundsData?.items ?? [];
  const favoriteIds = new Set(
    (favoritesData?.items ?? []).map((s) => s.id)
  );

  const playSound = useMutation({
    mutationFn: (soundId: string) =>
      api.post(`/channels/${channelId}/send-soundboard-sound`, {
        soundId,
        userId,
        guildId,
      }),
  });

  const addFavorite = useMutation({
    mutationFn: (soundId: string) =>
      api.put(`/users/${userId}/soundboard-sounds/${soundId}`),
  });

  const removeFavorite = useMutation({
    mutationFn: (soundId: string) =>
      api.delete(`/users/${userId}/soundboard-sounds/${soundId}`),
  });

  return (
    <div className="mb-3 rounded-lg bg-background-tertiary/80 border border-surface-border/50 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-surface-border/30">
        <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
          Soundboard
        </span>
        <button
          onClick={onClose}
          className="text-text-muted hover:text-text-normal transition-colors"
        >
          <X size={14} />
        </button>
      </div>
      <div className="max-h-[200px] overflow-y-auto p-1.5 scrollbar-thin">
        {sounds.length === 0 ? (
          <p className="text-xs text-text-muted text-center py-4">
            No sounds available
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-0.5">
            {sounds.map((sound) => {
              const isFav = favoriteIds.has(sound.id);
              return (
                <div
                  key={sound.id}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-md",
                    "hover:bg-background-hover/50 transition-colors group"
                  )}
                >
                  <button
                    onClick={() => playSound.mutate(sound.id)}
                    disabled={playSound.isPending}
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                      "bg-brand/15 text-brand-light hover:bg-brand/25",
                      "transition-colors active:scale-90"
                    )}
                  >
                    <Play size={12} />
                  </button>
                  <span className="text-xs text-text-normal truncate flex-1">
                    {sound.emojiName ? `${sound.emojiName} ` : ""}
                    {sound.name}
                  </span>
                  <button
                    onClick={() =>
                      isFav
                        ? removeFavorite.mutate(sound.id)
                        : addFavorite.mutate(sound.id)
                    }
                    className={cn(
                      "shrink-0 transition-colors",
                      isFav
                        ? "text-yellow-400 hover:text-yellow-300"
                        : "text-text-muted/40 hover:text-yellow-400 opacity-0 group-hover:opacity-100"
                    )}
                  >
                    {isFav ? <Star size={12} /> : <StarOff size={12} />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
