import { useState, useCallback, useRef } from "react";

export function useNavigationHistory() {
  const historyRef = useRef<string[]>([]);
  const indexRef = useRef(-1);

  const push = useCallback((channelId: string) => {
    const history = historyRef.current;
    const idx = indexRef.current;
    // Trim forward history
    historyRef.current = history.slice(0, idx + 1);
    historyRef.current.push(channelId);
    indexRef.current = historyRef.current.length - 1;
  }, []);

  const canGoBack = useCallback(() => indexRef.current > 0, []);
  const canGoForward = useCallback(
    () => indexRef.current < historyRef.current.length - 1,
    []
  );

  const goBack = useCallback((): string | null => {
    if (indexRef.current > 0) {
      indexRef.current--;
      return historyRef.current[indexRef.current] ?? null;
    }
    return null;
  }, []);

  const goForward = useCallback((): string | null => {
    if (indexRef.current < historyRef.current.length - 1) {
      indexRef.current++;
      return historyRef.current[indexRef.current] ?? null;
    }
    return null;
  }, []);

  return { push, goBack, goForward, canGoBack, canGoForward };
}
