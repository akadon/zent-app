"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import type { GuildEvent } from "@yxc/types";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EventListProps {
  guildId: string;
}

export function EventList({ guildId }: EventListProps) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    location: "",
  });

  const { data: events = [], isLoading } = useQuery<GuildEvent[]>({
    queryKey: ["events", guildId],
    queryFn: () => api.get(`/guilds/${guildId}/events`),
  });

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api.post(`/guilds/${guildId}/events`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", guildId] });
      setShowCreateForm(false);
      setFormData({
        title: "",
        description: "",
        startTime: "",
        endTime: "",
        location: "",
      });
    },
  });

  const interestMutation = useMutation({
    mutationFn: (eventId: string) =>
      api.post(`/guilds/${guildId}/events/${eventId}/interest`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", guildId] });
    },
  });

  function handleCreate() {
    const body: Record<string, unknown> = {
      title: formData.title,
      description: formData.description,
      startTime: new Date(formData.startTime).toISOString(),
    };
    if (formData.endTime) {
      body.endTime = new Date(formData.endTime).toISOString();
    }
    if (formData.location) {
      body.location = formData.location;
    }
    createMutation.mutate(body);
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  function formatTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Events
        </h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-1 rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Event
        </button>
      </div>

      {showCreateForm && (
        <div className="rounded-lg bg-zinc-800 p-4 space-y-3 border border-zinc-700">
          <input
            type="text"
            placeholder="Event title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm text-zinc-100 border border-zinc-700 focus:border-indigo-500 focus:outline-none"
          />
          <textarea
            placeholder="Description (optional)"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm text-zinc-100 border border-zinc-700 focus:border-indigo-500 focus:outline-none resize-none"
            rows={2}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                Start Time
              </label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) =>
                  setFormData({ ...formData, startTime: e.target.value })
                }
                className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm text-zinc-100 border border-zinc-700 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                End Time (optional)
              </label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) =>
                  setFormData({ ...formData, endTime: e.target.value })
                }
                className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm text-zinc-100 border border-zinc-700 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
          <input
            type="text"
            placeholder="Location (optional)"
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
            className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm text-zinc-100 border border-zinc-700 focus:border-indigo-500 focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowCreateForm(false)}
              className="rounded-md px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!formData.title || !formData.startTime || createMutation.isPending}
              className="rounded-md bg-indigo-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {createMutation.isPending ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 rounded-lg bg-zinc-800 animate-pulse"
            />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
          <Calendar className="h-12 w-12 mb-3 opacity-50" />
          <p className="text-sm">No upcoming events</p>
          <p className="text-xs mt-1">Create one to get started!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <div
              key={event.id}
              className="rounded-lg bg-zinc-800 p-4 border border-zinc-700 hover:border-zinc-600 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-zinc-100 truncate">
                    {event.title}
                  </h3>
                  {event.description && (
                    <p className="text-sm text-zinc-400 mt-1 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(event.startTime)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatTime(event.startTime)}
                      {event.endTime && ` - ${formatTime(event.endTime)}`}
                    </span>
                    {event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {event.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {event.interested.length} interested
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => interestMutation.mutate(event.id)}
                  disabled={interestMutation.isPending}
                  className={cn(
                    "flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ml-3 shrink-0",
                    event.interested.includes(user?.id ?? "")
                      ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30"
                      : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                  )}
                >
                  <Star className="h-4 w-4" />
                  Interested
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
