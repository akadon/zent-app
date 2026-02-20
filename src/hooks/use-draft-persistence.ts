"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const DRAFT_KEY_PREFIX = "zent_draft_";
const SAVE_DEBOUNCE_MS = 300;

export function useDraftPersistence(channelId: string) {
  const key = `${DRAFT_KEY_PREFIX}${channelId}`;
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [draft, setDraft] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(key) ?? "";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(key) ?? "";
    setDraft(saved);
  }, [key]);

  // Clean up pending timer on unmount or key change
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [key]);

  const saveDraft = useCallback(
    (value: string) => {
      setDraft(value);
      if (typeof window === "undefined") return;

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(() => {
        saveTimerRef.current = null;
        if (value) {
          localStorage.setItem(key, value);
        } else {
          localStorage.removeItem(key);
        }
      }, SAVE_DEBOUNCE_MS);
    },
    [key]
  );

  const clearDraft = useCallback(() => {
    setDraft("");
    if (typeof window !== "undefined") {
      // Clear any pending debounced save
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      localStorage.removeItem(key);
    }
  }, [key]);

  return { draft, saveDraft, clearDraft };
}
