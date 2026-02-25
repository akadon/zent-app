import { useState } from "react";
import { Timer, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DisappearingMessagesSettingsProps {
  channelId: string;
  currentRetention?: number | null;
  onSave: (seconds: number | null) => void;
}

const PRESETS = [
  { label: "Off", value: null },
  { label: "1 hour", value: 3600 },
  { label: "24 hours", value: 86400 },
  { label: "7 days", value: 604800 },
  { label: "30 days", value: 2592000 },
] as const;

function formatDuration(seconds: number | null): string {
  if (seconds === null) return "Off";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`;
  return `${Math.floor(seconds / 86400)} days`;
}

export function DisappearingMessagesSettings({
  channelId: _channelId,
  currentRetention,
  onSave,
}: DisappearingMessagesSettingsProps) {
  const [selected, setSelected] = useState<number | null>(currentRetention ?? null);
  const [customValue, setCustomValue] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const handleSave = () => {
    if (showCustom && customValue) {
      const parsed = parseInt(customValue, 10);
      if (!isNaN(parsed) && parsed > 0) {
        onSave(parsed);
        return;
      }
    }
    onSave(selected);
  };

  const isChanged =
    showCustom
      ? customValue !== ""
      : selected !== (currentRetention ?? null);

  return (
    <div className="w-72 rounded-lg border border-background-tertiary bg-background-secondary p-3 shadow-lg">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-text-muted" />
          <span className="text-sm font-semibold text-text-primary">Disappearing Messages</span>
        </div>
      </div>

      {currentRetention !== undefined && (
        <div className="mb-3 flex items-center gap-1.5 text-xs text-text-muted">
          <Clock className="h-3 w-3" />
          <span>Current: {formatDuration(currentRetention)}</span>
        </div>
      )}

      <div className="mb-3 flex flex-col gap-1">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => {
              setSelected(preset.value);
              setShowCustom(false);
            }}
            className={cn(
              "rounded px-3 py-1.5 text-left text-sm transition-colors",
              !showCustom && selected === preset.value
                ? "bg-brand-primary text-white"
                : "text-text-secondary hover:bg-background-tertiary"
            )}
          >
            {preset.label}
          </button>
        ))}

        <button
          onClick={() => {
            setShowCustom(true);
            setSelected(null);
          }}
          className={cn(
            "rounded px-3 py-1.5 text-left text-sm transition-colors",
            showCustom
              ? "bg-brand-primary text-white"
              : "text-text-secondary hover:bg-background-tertiary"
          )}
        >
          Custom
        </button>
      </div>

      {showCustom && (
        <div className="mb-3 flex items-center gap-2">
          <input
            type="number"
            min={1}
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            placeholder="Seconds"
            className="w-full rounded border border-background-tertiary bg-background-primary px-2 py-1 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-primary focus:outline-none"
          />
          <button onClick={() => setShowCustom(false)}>
            <X className="h-4 w-4 text-text-muted hover:text-text-primary" />
          </button>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={!isChanged}
        className={cn(
          "w-full rounded py-1.5 text-sm font-medium transition-colors",
          isChanged
            ? "bg-brand-primary text-white hover:bg-brand-primary/90"
            : "cursor-not-allowed bg-background-tertiary text-text-muted"
        )}
      >
        Save
      </button>
    </div>
  );
}
