import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Eye, Type, Contrast, Zap, Move } from "lucide-react";

const STORAGE_KEY = "accessibility-settings";

interface AccessibilityConfig {
  fontFamily: string;
  fontSize: number;
  highContrast: boolean;
  reducedMotion: boolean;
  messageSpacing: "compact" | "cozy" | "roomy";
  saturation: number;
}

const DEFAULT_CONFIG: AccessibilityConfig = {
  fontFamily: "default",
  fontSize: 16,
  highContrast: false,
  reducedMotion: false,
  messageSpacing: "cozy",
  saturation: 100,
};

const FONT_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "OpenDyslexic", label: "OpenDyslexic" },
  { value: "Lexend", label: "Lexend" },
  { value: "Atkinson Hyperlegible", label: "Atkinson Hyperlegible" },
];

const SPACING_OPTIONS = [
  { value: "compact" as const, label: "Compact" },
  { value: "cozy" as const, label: "Cozy" },
  { value: "roomy" as const, label: "Roomy" },
];

function applySettings(config: AccessibilityConfig) {
  const body = document.body;

  // Font family
  FONT_OPTIONS.forEach((f) => body.classList.remove(`font-${f.value.toLowerCase().replace(/\s+/g, "-")}`));
  if (config.fontFamily !== "default") {
    body.classList.add(`font-${config.fontFamily.toLowerCase().replace(/\s+/g, "-")}`);
    body.style.fontFamily = `"${config.fontFamily}", sans-serif`;
  } else {
    body.style.fontFamily = "";
  }

  // Font size
  document.documentElement.style.setProperty("--font-size-base", `${config.fontSize}px`);

  // High contrast
  body.classList.toggle("high-contrast", config.highContrast);

  // Reduced motion
  body.classList.toggle("reduce-motion", config.reducedMotion);

  // Message spacing
  body.classList.remove("spacing-compact", "spacing-cozy", "spacing-roomy");
  body.classList.add(`spacing-${config.messageSpacing}`);

  // Saturation
  if (config.saturation !== 100) {
    body.style.filter = `saturate(${config.saturation}%)`;
  } else {
    body.style.filter = "";
  }
}

export function AccessibilitySettings() {
  const [config, setConfig] = useState<AccessibilityConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
        setConfig(parsed);
        applySettings(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  const update = useCallback(
    (partial: Partial<AccessibilityConfig>) => {
      const next = { ...config, ...partial };
      setConfig(next);
      applySettings(next);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    },
    [config]
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Eye className="h-5 w-5 text-violet-400" />
        <h2 className="text-lg font-semibold text-zinc-100">Accessibility</h2>
      </div>

      {/* Font Family */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Type className="h-4 w-4 text-zinc-400" />
          <label className="text-sm font-medium text-zinc-200">Font</label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {FONT_OPTIONS.map((font) => (
            <button
              key={font.value}
              onClick={() => update({ fontFamily: font.value })}
              className={cn(
                "rounded-md border px-3 py-2 text-sm transition-colors",
                config.fontFamily === font.value
                  ? "border-violet-500 bg-violet-500/10 text-violet-300"
                  : "border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              )}
            >
              {font.label}
            </button>
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-zinc-200">Font Size</label>
          <span className="text-sm text-zinc-400">{config.fontSize}px</span>
        </div>
        <input
          type="range"
          min={12}
          max={20}
          step={1}
          value={config.fontSize}
          onChange={(e) => update({ fontSize: Number(e.target.value) })}
          className="w-full accent-violet-500"
        />
        <div className="flex justify-between text-xs text-zinc-500">
          <span>12px</span>
          <span>20px</span>
        </div>
      </div>

      {/* High Contrast */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Contrast className="h-4 w-4 text-zinc-400" />
          <div>
            <p className="text-sm font-medium text-zinc-200">High Contrast</p>
            <p className="text-xs text-zinc-500">Increase contrast for better readability</p>
          </div>
        </div>
        <button
          onClick={() => update({ highContrast: !config.highContrast })}
          className={cn(
            "relative h-6 w-11 rounded-full transition-colors",
            config.highContrast ? "bg-violet-500" : "bg-zinc-600"
          )}
        >
          <span
            className={cn(
              "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
              config.highContrast && "translate-x-5"
            )}
          />
        </button>
      </div>

      {/* Reduced Motion */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-zinc-400" />
          <div>
            <p className="text-sm font-medium text-zinc-200">Reduced Motion</p>
            <p className="text-xs text-zinc-500">Minimize animations and transitions</p>
          </div>
        </div>
        <button
          onClick={() => update({ reducedMotion: !config.reducedMotion })}
          className={cn(
            "relative h-6 w-11 rounded-full transition-colors",
            config.reducedMotion ? "bg-violet-500" : "bg-zinc-600"
          )}
        >
          <span
            className={cn(
              "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
              config.reducedMotion && "translate-x-5"
            )}
          />
        </button>
      </div>

      {/* Message Spacing */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Move className="h-4 w-4 text-zinc-400" />
          <label className="text-sm font-medium text-zinc-200">Message Spacing</label>
        </div>
        <div className="flex gap-2">
          {SPACING_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => update({ messageSpacing: opt.value })}
              className={cn(
                "flex-1 rounded-md border px-3 py-2 text-sm transition-colors",
                config.messageSpacing === opt.value
                  ? "border-violet-500 bg-violet-500/10 text-violet-300"
                  : "border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Saturation */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-zinc-200">Saturation</label>
          <span className="text-sm text-zinc-400">{config.saturation}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={config.saturation}
          onChange={(e) => update({ saturation: Number(e.target.value) })}
          className="w-full accent-violet-500"
        />
        <div className="flex justify-between text-xs text-zinc-500">
          <span>Grayscale</span>
          <span>Full Color</span>
        </div>
      </div>
    </div>
  );
}
