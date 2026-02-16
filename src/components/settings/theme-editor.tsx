"use client";

import { useState, useEffect } from "react";

const THEME_KEY = "zent_custom_theme";

interface ThemeVars {
  [key: string]: string;
}

const DEFAULT_THEME: ThemeVars = {
  "--background-primary": "#313338",
  "--background-secondary": "#2b2d31",
  "--background-tertiary": "#1e1f22",
  "--background-floating": "#111214",
  "--text-normal": "#dbdee1",
  "--text-muted": "#949ba4",
  "--brand": "#5865f2",
  "--header-primary": "#f2f3f5",
};

const PRESETS: Record<string, ThemeVars> = {
  Default: DEFAULT_THEME,
  Midnight: {
    "--background-primary": "#0d1117",
    "--background-secondary": "#161b22",
    "--background-tertiary": "#010409",
    "--background-floating": "#010409",
    "--text-normal": "#c9d1d9",
    "--text-muted": "#8b949e",
    "--brand": "#58a6ff",
    "--header-primary": "#f0f6fc",
  },
  Forest: {
    "--background-primary": "#1a2e1a",
    "--background-secondary": "#152415",
    "--background-tertiary": "#0d1a0d",
    "--background-floating": "#091209",
    "--text-normal": "#c8dcc8",
    "--text-muted": "#7a9a7a",
    "--brand": "#4caf50",
    "--header-primary": "#e8f5e8",
  },
  Sunset: {
    "--background-primary": "#2d1b2e",
    "--background-secondary": "#241624",
    "--background-tertiary": "#1a0e1a",
    "--background-floating": "#120912",
    "--text-normal": "#e0c8e0",
    "--text-muted": "#a07aa0",
    "--brand": "#e91e63",
    "--header-primary": "#f5e0f5",
  },
};

function loadTheme(): ThemeVars {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

function applyTheme(vars: ThemeVars) {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
}

export function ThemeEditor() {
  const [theme, setTheme] = useState<ThemeVars>(DEFAULT_THEME);
  const [activePreset, setActivePreset] = useState("Default");

  useEffect(() => {
    const saved = loadTheme();
    setTheme(saved);
    applyTheme(saved);
  }, []);

  const updateVar = (key: string, value: string) => {
    const next = { ...theme, [key]: value };
    setTheme(next);
    applyTheme(next);
    localStorage.setItem(THEME_KEY, JSON.stringify(next));
    setActivePreset("");
  };

  const applyPreset = (name: string) => {
    const preset = PRESETS[name];
    if (!preset) return;
    setTheme(preset);
    applyTheme(preset);
    localStorage.setItem(THEME_KEY, JSON.stringify(preset));
    setActivePreset(name);
  };

  const exportTheme = () => {
    const blob = new Blob([JSON.stringify(theme, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "zent-theme.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importTheme = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        setTheme(parsed);
        applyTheme(parsed);
        localStorage.setItem(THEME_KEY, JSON.stringify(parsed));
        setActivePreset("");
      } catch {}
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase text-text-muted">Presets</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(PRESETS).map(([name, vars]) => (
            <button
              key={name}
              onClick={() => applyPreset(name)}
              className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                activePreset === name
                  ? "border-brand text-brand"
                  : "border-background-tertiary text-text-normal hover:border-text-muted"
              }`}
            >
              <div
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: vars["--brand"] }}
              />
              {name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase text-text-muted">Custom Colors</h3>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(theme).map(([key, value]) => (
            <label key={key} className="flex items-center gap-2">
              <input
                type="color"
                value={value}
                onChange={(e) => updateVar(key, e.target.value)}
                className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent"
              />
              <span className="text-xs text-text-muted">
                {key.replace("--", "").replace(/-/g, " ")}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={exportTheme}
          className="rounded bg-background-tertiary px-3 py-1.5 text-sm text-text-normal hover:bg-background-primary"
        >
          Export Theme
        </button>
        <button
          onClick={importTheme}
          className="rounded bg-background-tertiary px-3 py-1.5 text-sm text-text-normal hover:bg-background-primary"
        >
          Import Theme
        </button>
      </div>
    </div>
  );
}
