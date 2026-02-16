"use client";

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Shield, AlertTriangle, Link, AtSign, Zap, Save } from "lucide-react";

interface AutoModConfig {
  keywordFilter: {
    enabled: boolean;
    words: string;
  };
  spamProtection: {
    enabled: boolean;
    maxMessages: number;
  };
  antiRaid: {
    enabled: boolean;
    minAccountAgeDays: number;
    maxJoinsPerMinute: number;
  };
  linkFilter: {
    enabled: boolean;
    whitelistDomains: string;
  };
  mentionSpam: {
    enabled: boolean;
    maxMentions: number;
  };
  action: "delete" | "warn" | "mute" | "kick" | "ban";
}

const DEFAULT_CONFIG: AutoModConfig = {
  keywordFilter: { enabled: false, words: "" },
  spamProtection: { enabled: false, maxMessages: 5 },
  antiRaid: { enabled: false, minAccountAgeDays: 7, maxJoinsPerMinute: 10 },
  linkFilter: { enabled: false, whitelistDomains: "" },
  mentionSpam: { enabled: false, maxMentions: 10 },
  action: "delete",
};

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

export function AutoModSettings({ guildId }: { guildId: string }) {
  const [config, setConfig] = useState<AutoModConfig>(DEFAULT_CONFIG);
  const [saved, setSaved] = useState(false);

  const saveMutation = useMutation({
    mutationFn: () =>
      api.post(`/guilds/${guildId}/automod`, {
        keywordFilter: {
          enabled: config.keywordFilter.enabled,
          words: config.keywordFilter.words
            .split("\n")
            .map((w) => w.trim())
            .filter(Boolean),
        },
        spamProtection: config.spamProtection,
        antiRaid: config.antiRaid,
        linkFilter: {
          enabled: config.linkFilter.enabled,
          whitelistDomains: config.linkFilter.whitelistDomains
            .split("\n")
            .map((d) => d.trim())
            .filter(Boolean),
        },
        mentionSpam: config.mentionSpam,
        action: config.action,
      }),
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const update = <K extends keyof AutoModConfig>(
    key: K,
    value: Partial<AutoModConfig[K]>
  ) => {
    setConfig((prev) => ({
      ...prev,
      [key]: typeof prev[key] === "object" ? { ...prev[key], ...value } : value,
    }));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Shield className="h-5 w-5 text-blue-400" />
        <h2 className="text-lg font-semibold text-zinc-100">AutoMod Configuration</h2>
      </div>

      {/* Keyword Filter */}
      <section className="space-y-3 rounded-md border border-zinc-700 bg-zinc-800/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-medium text-zinc-200">Keyword Filter</h3>
          </div>
          <Toggle
            enabled={config.keywordFilter.enabled}
            onToggle={() =>
              update("keywordFilter", { enabled: !config.keywordFilter.enabled })
            }
          />
        </div>
        {config.keywordFilter.enabled && (
          <div className="space-y-2">
            <label className="text-xs text-zinc-400">Blocked words (one per line)</label>
            <textarea
              value={config.keywordFilter.words}
              onChange={(e) => update("keywordFilter", { words: e.target.value })}
              rows={5}
              className="w-full rounded-md bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
              placeholder="badword1&#10;badword2&#10;badword3"
            />
          </div>
        )}
      </section>

      {/* Spam Protection */}
      <section className="space-y-3 rounded-md border border-zinc-700 bg-zinc-800/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-400" />
            <h3 className="text-sm font-medium text-zinc-200">Spam Protection</h3>
          </div>
          <Toggle
            enabled={config.spamProtection.enabled}
            onToggle={() =>
              update("spamProtection", { enabled: !config.spamProtection.enabled })
            }
          />
        </div>
        {config.spamProtection.enabled && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-zinc-400">Max messages per 10 seconds</label>
              <span className="text-sm text-zinc-300">{config.spamProtection.maxMessages}</span>
            </div>
            <input
              type="range"
              min={2}
              max={20}
              value={config.spamProtection.maxMessages}
              onChange={(e) =>
                update("spamProtection", { maxMessages: Number(e.target.value) })
              }
              className="w-full accent-blue-500"
            />
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
            enabled={config.antiRaid.enabled}
            onToggle={() => update("antiRaid", { enabled: !config.antiRaid.enabled })}
          />
        </div>
        {config.antiRaid.enabled && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-zinc-400">Minimum account age (days)</label>
                <span className="text-sm text-zinc-300">
                  {config.antiRaid.minAccountAgeDays}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={90}
                value={config.antiRaid.minAccountAgeDays}
                onChange={(e) =>
                  update("antiRaid", { minAccountAgeDays: Number(e.target.value) })
                }
                className="w-full accent-blue-500"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-zinc-400">Max joins per minute</label>
                <span className="text-sm text-zinc-300">
                  {config.antiRaid.maxJoinsPerMinute}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={50}
                value={config.antiRaid.maxJoinsPerMinute}
                onChange={(e) =>
                  update("antiRaid", { maxJoinsPerMinute: Number(e.target.value) })
                }
                className="w-full accent-blue-500"
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
            enabled={config.linkFilter.enabled}
            onToggle={() =>
              update("linkFilter", { enabled: !config.linkFilter.enabled })
            }
          />
        </div>
        {config.linkFilter.enabled && (
          <div className="space-y-2">
            <label className="text-xs text-zinc-400">
              Whitelisted domains (one per line, links to other domains will be blocked)
            </label>
            <textarea
              value={config.linkFilter.whitelistDomains}
              onChange={(e) => update("linkFilter", { whitelistDomains: e.target.value })}
              rows={4}
              className="w-full rounded-md bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
              placeholder="youtube.com&#10;github.com&#10;twitter.com"
            />
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
            enabled={config.mentionSpam.enabled}
            onToggle={() =>
              update("mentionSpam", { enabled: !config.mentionSpam.enabled })
            }
          />
        </div>
        {config.mentionSpam.enabled && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-zinc-400">Max mentions per message</label>
              <span className="text-sm text-zinc-300">{config.mentionSpam.maxMentions}</span>
            </div>
            <input
              type="range"
              min={1}
              max={30}
              value={config.mentionSpam.maxMentions}
              onChange={(e) =>
                update("mentionSpam", { maxMentions: Number(e.target.value) })
              }
              className="w-full accent-blue-500"
            />
          </div>
        )}
      </section>

      {/* Action on Violation */}
      <section className="space-y-3">
        <label className="text-sm font-medium text-zinc-200">Action on Violation</label>
        <select
          value={config.action}
          onChange={(e) =>
            setConfig((prev) => ({
              ...prev,
              action: e.target.value as AutoModConfig["action"],
            }))
          }
          className="w-full rounded-md bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          <option value="delete">Delete Message</option>
          <option value="warn">Warn User</option>
          <option value="mute">Mute User</option>
          <option value="kick">Kick User</option>
          <option value="ban">Ban User</option>
        </select>
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
