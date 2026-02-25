import { useState, useEffect, useCallback } from "react";
import { Volume2, VolumeX, Volume1 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VolumeControlProps {
  userId: string;
  username: string;
  onVolumeChange: (userId: string, volume: number) => void;
}

const STORAGE_KEY = "zent-user-volumes";

function loadVolumes(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveVolume(userId: string, volume: number) {
  const volumes = loadVolumes();
  volumes[userId] = volume;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(volumes));
}

export function VolumeControl({
  userId,
  username,
  onVolumeChange,
}: VolumeControlProps) {
  const [volume, setVolume] = useState(100);
  const [muted, setMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(100);

  useEffect(() => {
    const saved = loadVolumes()[userId];
    if (saved !== undefined) {
      setVolume(saved);
      setMuted(saved === 0);
    }
  }, [userId]);

  const handleVolumeChange = useCallback(
    (newVolume: number) => {
      setVolume(newVolume);
      setMuted(newVolume === 0);
      saveVolume(userId, newVolume);
      onVolumeChange(userId, newVolume);
    },
    [userId, onVolumeChange]
  );

  const toggleMute = useCallback(() => {
    if (muted) {
      const restored = previousVolume || 100;
      setVolume(restored);
      setMuted(false);
      saveVolume(userId, restored);
      onVolumeChange(userId, restored);
    } else {
      setPreviousVolume(volume);
      setVolume(0);
      setMuted(true);
      saveVolume(userId, 0);
      onVolumeChange(userId, 0);
    }
  }, [muted, volume, previousVolume, userId, onVolumeChange]);

  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 100 ? Volume1 : Volume2;
  const barPercent = Math.min(volume, 200);

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-zinc-800 transition-colors group">
      <button
        onClick={toggleMute}
        className={cn(
          "shrink-0 p-1 rounded transition-colors",
          muted
            ? "text-red-400 hover:text-red-300"
            : "text-zinc-400 hover:text-zinc-200"
        )}
        title={muted ? "Unmute" : "Mute"}
      >
        <VolumeIcon className="h-4 w-4" />
      </button>

      <span className="text-sm text-zinc-300 truncate min-w-0 w-20">
        {username}
      </span>

      <div className="flex items-center gap-2 flex-1">
        <input
          type="range"
          min={0}
          max={200}
          value={volume}
          onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
          className="w-full h-1.5 accent-indigo-500 cursor-pointer"
        />
        <span className="text-xs text-zinc-500 w-10 text-right tabular-nums">
          {volume}%
        </span>
      </div>

      <div className="w-16 h-1.5 rounded-full bg-zinc-700 overflow-hidden shrink-0">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            volume === 0
              ? "bg-red-500"
              : volume <= 100
                ? "bg-green-500"
                : "bg-yellow-500"
          )}
          style={{ width: `${(barPercent / 200) * 100}%` }}
        />
      </div>
    </div>
  );
}
