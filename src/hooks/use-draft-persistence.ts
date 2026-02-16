"use client";

import { useState, useEffect, useCallback } from "react";

const DRAFT_KEY_PREFIX = "zent_draft_";

export function useDraftPersistence(channelId: string) {
  const key = `${DRAFT_KEY_PREFIX}${channelId}`;

  const [draft, setDraft] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(key) ?? "";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(key) ?? "";
    setDraft(saved);
  }, [key]);

  const saveDraft = useCallback(
    (value: string) => {
      setDraft(value);
      if (typeof window === "undefined") return;
      if (value) {
        localStorage.setItem(key, value);
      } else {
        localStorage.removeItem(key);
      }
    },
    [key]
  );

  const clearDraft = useCallback(() => {
    setDraft("");
    if (typeof window !== "undefined") {
      localStorage.removeItem(key);
    }
  }, [key]);

  return { draft, saveDraft, clearDraft };
}
