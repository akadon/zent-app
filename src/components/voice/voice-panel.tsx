"use client";

import { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Headphones,
  VolumeX,
  PhoneOff,
  Signal,
  SignalHigh,
  SignalLow,
  SignalMedium,
  Settings,
} from "lucide-react";
import { gateway } from "@/gateway/client";
import { cn } from "@/lib/utils";

interface VoicePanelProps {
  channelName: string;
  guildName: string;
  guildId: string;
  channelId: string;
  onDisconnect: () => void;
}

type SignalQuality = "excellent" | "good" | "fair" | "poor";

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function SignalIcon({ quality }: { quality: SignalQuality }) {
  const iconClass = cn(
    "h-3.5 w-3.5",
    quality === "excellent" && "text-green-light",
    quality === "good" && "text-green-light",
    quality === "fair" && "text-yellow-light",
    quality === "poor" && "text-red-light"
  );

  switch (quality) {
    case "excellent":
      return <Signal className={iconClass} />;
    case "good":
      return <SignalHigh className={iconClass} />;
    case "fair":
      return <SignalMedium className={iconClass} />;
    case "poor":
      return <SignalLow className={iconClass} />;
  }
}

export function VoicePanel({
  channelName,
  guildName,
  guildId,
  channelId,
  onDisconnect,
}: VoicePanelProps) {
  const [selfMute, setSelfMute] = useState(false);
  const [selfDeaf, setSelfDeaf] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [signalQuality] = useState<SignalQuality>("excellent");
  const startTime = useRef(Date.now());

  // Duration timer
  useEffect(() => {
    startTime.current = Date.now();
    setElapsed(0);

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const toggleMute = () => {
    const newMute = !selfMute;
    setSelfMute(newMute);
    gateway.updateVoiceState(guildId, channelId, newMute, selfDeaf);
  };

  const toggleDeaf = () => {
    const newDeaf = !selfDeaf;
    setSelfDeaf(newDeaf);
    const newMute = newDeaf ? true : selfMute;
    setSelfMute(newMute);
    gateway.updateVoiceState(guildId, channelId, newMute, newDeaf);
  };

  const handleDisconnect = () => {
    gateway.updateVoiceState(guildId, null);
    onDisconnect();
  };

  return (
    <div className={cn(
      "border-t border-surface-border/50 px-3 py-3",
      "bg-gradient-to-t from-background-tertiary/80 to-background-secondary"
    )}>
      {/* Status row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Pulsing indicator */}
          <div className="relative">
            <div className="h-2.5 w-2.5 rounded-full bg-green shrink-0" />
            <div className="absolute inset-0 h-2.5 w-2.5 rounded-full bg-green animate-ping opacity-50" />
          </div>
          <span className="text-xs font-semibold text-green-light truncate">
            Voice Connected
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <SignalIcon quality={signalQuality} />
          <span className="text-2xs text-text-muted tabular-nums font-medium">
            {formatDuration(elapsed)}
          </span>
        </div>
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
          onClick={toggleMute}
          icon={selfMute ? <MicOff size={16} /> : <Mic size={16} />}
          tooltip={selfMute ? "Unmute" : "Mute"}
          danger={selfMute}
        />
        <VoiceButton
          active={selfDeaf}
          onClick={toggleDeaf}
          icon={selfDeaf ? <VolumeX size={16} /> : <Headphones size={16} />}
          tooltip={selfDeaf ? "Undeafen" : "Deafen"}
          danger={selfDeaf}
        />
        <VoiceButton
          onClick={() => {}}
          icon={<Settings size={16} />}
          tooltip="Voice Settings"
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
            : "bg-background-hover text-text-normal hover:bg-interactive-muted hover:text-header-primary"
      )}
      title={tooltip}
    >
      {icon}
    </button>
  );
}
