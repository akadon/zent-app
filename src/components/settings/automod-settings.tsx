"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Shield, AlertTriangle, Link, AtSign, Zap, Save } from "lucide-react";

interface AutoModConfig {
  enabled: boolean;
  keywordFilters: {
    enabled: boolean;
    blockedWords: string[];
    action: string;
  };
  mentionSpam: {
    enabled: boolean;
    maxMentions: number;
    action: string;
  };
  linkFilter: {
    enabled: boolean;
    blockAllLinks: boolean;
    whitelist: string[];
    action: string;
  };
  antiRaid: {
    enabled: boolean;
    joinRateLimit: number;
    joinRateWindow: number;
    action: string;
  };
}

// Local form state uses strings for textarea inputs
interface AutoModForm {
  enabled: boolean;
  keywordFilters: {
    enabled: boolean;
    blockedWords: string;
    action: string;
  };
  mentionSpam: {
    enabled: boolean;
    maxMentions: number;
    action: string;
  };
  linkFilter: {
    enabled: boolean;
    blockAllLinks: boolean;
    whitelist: string;
    action: string;
  };
  antiRaid: {
    enabled: boolean;
    joinRateLimit: number;
    joinRateWindow: number;
    action: string;
  };
}

const DEFAULT_FORM: AutoModForm = {
  enabled: false,
  keywordFilters: { enabled: false, blockedWords: "", action: "delete" },
  mentionSpam: { enabled: false, maxMentions: 10, action: "delete" },
  linkFilter: { enabled: false, blockAllLinks: false, whitelist: "", action: "delete" },
  antiRaid: { enabled: false, joinRateLimit: 10, joinRateWindow: 60, action: "kick" },
};

function configToForm(config: AutoModConfig): AutoModForm {
  return {
    enabled: config.enabled,
    keywordFilters: {
      enabled: config.keywordFilters.enabled,
      blockedWords: (config.keywordFilters.blockedWords ?? []).join("\n"),
      action: config.keywordFilters.action ?? "delete",
    },
    mentionSpam: {
      enabled: config.mentionSpam.enabled,
      maxMentions: config.mentionSpam.maxMentions ?? 10,
      action: config.mentionSpam.action ?? "delete",
    },
    linkFilter: {
      enabled: config.linkFilter.enabled,
      blockAllLinks: config.linkFilter.blockAllLinks ?? false,
      whitelist: (config.linkFilter.whitelist ?? []).join("\n"),
      action: config.linkFilter.action ?? "delete",
    },
    antiRaid: {
      enabled: config.antiRaid.enabled,
      joinRateLimit: config.antiRaid.joinRateLimit ?? 10,
      joinRateWindow: config.antiRaid.joinRateWindow ?? 60,
      action: config.antiRaid.action ?? "kick",
    },
  };
}

function formToConfig(form: AutoModForm): AutoModConfig {
  return {
    enabled: form.enabled,
    keywordFilters: {
      enabled: form.keywordFilters.enabled,
      blockedWords: form.keywordFilters.blockedWords.split("\n").map((w) => w.trim()).filter(Boolean),
      action: form.keywordFilters.action,
    },
    mentionSpam: {
      enabled: form.mentionSpam.enabled,
      maxMentions: form.mentionSpam.maxMentions,
      action: form.mentionSpam.action,
    },
    linkFilter: {
      enabled: form.linkFilter.enabled,
      blockAllLinks: form.linkFilter.blockAllLinks,
      whitelist: form.linkFilter.whitelist.split("\n").map((d) => d.trim()).filter(Boolean),
      action: form.linkFilter.action,
    },
    antiRaid: {
      enabled: form.antiRaid.enabled,
      joinRateLimit: form.antiRaid.joinRateLimit,
      joinRateWindow: form.antiRaid.joinRateWindow,
      action: form.antiRaid.action,
    },
  };
}

const ACTION_OPTIONS = [
  { value: "delete", label: "Delete Message" },
  { value: "warn", label: "Warn User" },
  { value: "mute", label: "Mute User" },
  { value: "kick", label: "Kick User" },
  { value: "ban", label: "Ban User" },
];

function Toggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
        enabled ? "bg-emerald-500" : "bg-zinc-600"
      )}
    >
      <span
        className={cn(
          "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
          enabled && "translate-x-5"
        )}
      />
    </button>
  );
}

function ActionSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md bg-zinc-900 border border-zinc-700 px-2 py-1 text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
    >
      {ACTION_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

export function AutoModSettings({ guildId }: { guildId: string }) {
  const [form, setForm] = useState<AutoModForm>(DEFAULT_FORM);
  const [saved, setSaved] = useState(false);

  const { data: existingConfig, isLoading } = useQuery({
    queryKey: ["automod", guildId],
    queryFn: () => api.get<AutoModConfig>(`/guilds/${guildId}/automod`),
  });

  useEffect(() => {
    if (existingConfig) {
      setForm(configToForm(existingConfig));
    }
  }, [existingConfig]);

  const saveMutation = useMutation({
    mutationFn: () => api.put(`/guilds/${guildId}/automod`, formToConfig(form)),
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const update = <K extends keyof AutoModForm>(
    key: K,
    value: Partial<AutoModForm[K]>
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: typeof prev[key] === "object" ? { ...prev[key], ...value } : value,
    }));
  };

  if (isLoading) {
    return <div className="py-8 text-center text-sm text-zinc-400">Loading configuration...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-zinc-100">AutoMod Configuration</h2>
        </div>
        <Toggle
          enabled={form.enabled}
          onToggle={() => setForm((prev) => ({ ...prev, enabled: !prev.enabled }))}
        />
      </div>

      {/* Keyword Filter */}
      <section className="space-y-3 rounded-md border border-zinc-700 bg-zinc-800/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-medium text-zinc-200">Keyword Filter</h3>
          </div>
          <Toggle
            enabled={form.keywordFilters.enabled}
            onToggle={() =>
              update("keywordFilters", { enabled: !form.keywordFilters.enabled })
            }
          />
        </div>
        {form.keywordFilters.enabled && (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-zinc-400">Blocked words (one per line)</label>
              <textarea
                value={form.keywordFilters.blockedWords}
                onChange={(e) => update("keywordFilters", { blockedWords: e.target.value })}
                rows={5}
                className="mt-1 w-full rounded-md bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                placeholder="badword1&#10;badword2&#10;badword3"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-xs text-zinc-400">Action</label>
              <ActionSelect
                value={form.keywordFilters.action}
                onChange={(v) => update("keywordFilters", { action: v })}
              />
            </div>
          </div>
        )}
      </section>

      {/* Anti-Raid */}
      <section className="space-y-3 rounded-md border border-zinc-700 bg-zinc-800/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-red-400" />
            <h3 className="text-sm font-medium text-zinc-200">Anti-Raid</h3>
          </div>
          <Toggle
            enabled={form.antiRaid.enabled}
            onToggle={() => update("antiRaid", { enabled: !form.antiRaid.enabled })}
          />
        </div>
        {form.antiRaid.enabled && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-zinc-400">Join rate limit (max joins)</label>
                <span className="text-sm text-zinc-300">{form.antiRaid.joinRateLimit}</span>
              </div>
              <input
                type="range"
                min={1}
                max={50}
                value={form.antiRaid.joinRateLimit}
                onChange={(e) =>
                  update("antiRaid", { joinRateLimit: Number(e.target.value) })
                }
                className="w-full accent-blue-500"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-zinc-400">Rate window (seconds)</label>
                <span className="text-sm text-zinc-300">{form.antiRaid.joinRateWindow}</span>
              </div>
              <input
                type="range"
                min={10}
                max={300}
                step={10}
                value={form.antiRaid.joinRateWindow}
                onChange={(e) =>
                  update("antiRaid", { joinRateWindow: Number(e.target.value) })
                }
                className="w-full accent-blue-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-xs text-zinc-400">Action</label>
              <ActionSelect
                value={form.antiRaid.action}
                onChange={(v) => update("antiRaid", { action: v })}
              />
            </div>
          </div>
        )}
      </section>

      {/* Link Filter */}
      <section className="space-y-3 rounded-md border border-zinc-700 bg-zinc-800/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-medium text-zinc-200">Link Filter</h3>
          </div>
          <Toggle
            enabled={form.linkFilter.enabled}
            onToggle={() =>
              update("linkFilter", { enabled: !form.linkFilter.enabled })
            }
          />
        </div>
        {form.linkFilter.enabled && (
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs text-zinc-400">
              <input
                type="checkbox"
                checked={form.linkFilter.blockAllLinks}
                onChange={(e) => update("linkFilter", { blockAllLinks: e.target.checked })}
                className="h-4 w-4 accent-blue-500"
              />
              Block all links
            </label>
            {!form.linkFilter.blockAllLinks && (
              <div>
                <label className="text-xs text-zinc-400">
                  Whitelisted domains (one per line, links to other domains will be blocked)
                </label>
                <textarea
                  value={form.linkFilter.whitelist}
                  onChange={(e) => update("linkFilter", { whitelist: e.target.value })}
                  rows={4}
                  className="mt-1 w-full rounded-md bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                  placeholder="youtube.com&#10;github.com&#10;twitter.com"
                />
              </div>
            )}
            <div className="flex items-center justify-between">
              <label className="text-xs text-zinc-400">Action</label>
              <ActionSelect
                value={form.linkFilter.action}
                onChange={(v) => update("linkFilter", { action: v })}
              />
            </div>
          </div>
        )}
      </section>

      {/* Mention Spam */}
      <section className="space-y-3 rounded-md border border-zinc-700 bg-zinc-800/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AtSign className="h-4 w-4 text-purple-400" />
            <h3 className="text-sm font-medium text-zinc-200">Mention Spam</h3>
          </div>
          <Toggle
            enabled={form.mentionSpam.enabled}
            onToggle={() =>
              update("mentionSpam", { enabled: !form.mentionSpam.enabled })
            }
          />
        </div>
        {form.mentionSpam.enabled && (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-zinc-400">Max mentions per message</label>
                <span className="text-sm text-zinc-300">{form.mentionSpam.maxMentions}</span>
              </div>
              <input
                type="range"
                min={1}
                max={30}
                value={form.mentionSpam.maxMentions}
                onChange={(e) =>
                  update("mentionSpam", { maxMentions: Number(e.target.value) })
                }
                className="w-full accent-blue-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-xs text-zinc-400">Action</label>
              <ActionSelect
                value={form.mentionSpam.action}
                onChange={(v) => update("mentionSpam", { action: v })}
              />
            </div>
          </div>
        )}
      </section>

      {/* Save Button */}
      <button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
        className={cn(
          "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors",
          saved
            ? "bg-emerald-600"
            : "bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
        )}
      >
        <Save className="h-4 w-4" />
        {saveMutation.isPending ? "Saving..." : saved ? "Saved!" : "Save Configuration"}
      </button>

      {saveMutation.isError && (
        <div className="flex items-center gap-2 rounded-md bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Failed to save configuration. The automod endpoint may not be available yet.
        </div>
      )}
    </div>
  );
}
