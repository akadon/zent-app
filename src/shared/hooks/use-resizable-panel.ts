import { useState, useCallback, useRef, useEffect } from "react";

interface UseResizablePanelOptions {
  /** localStorage key for persistence */
  storageKey: string;
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
  /** Side the resize handle is on */
  side: "left" | "right";
}

interface ResizablePanelState {
  width: number;
  collapsed: boolean;
  isDragging: boolean;
  handleProps: {
    onMouseDown: (e: React.MouseEvent) => void;
    onDoubleClick: () => void;
  };
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
}

export function useResizablePanel(options: UseResizablePanelOptions): ResizablePanelState {
  const { storageKey, defaultWidth, minWidth, maxWidth, side } = options;

  const [width, setWidth] = useState(() => {
    if (typeof window === "undefined") return defaultWidth;
    const saved = localStorage.getItem(`panel-${storageKey}`);
    return saved ? Math.min(maxWidth, Math.max(minWidth, parseInt(saved, 10))) : defaultWidth;
  });

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(`panel-${storageKey}-collapsed`) === "true";
  });

  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  // Persist width
  useEffect(() => {
    localStorage.setItem(`panel-${storageKey}`, String(width));
  }, [width, storageKey]);

  // Persist collapsed
  useEffect(() => {
    localStorage.setItem(`panel-${storageKey}-collapsed`, String(collapsed));
  }, [collapsed, storageKey]);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      startX.current = e.clientX;
      startWidth.current = width;
      setIsDragging(true);
    },
    [width]
  );

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => {
      const delta = side === "right"
        ? e.clientX - startX.current
        : startX.current - e.clientX;
      const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidth.current + delta));
      setWidth(newWidth);
    };

    const onMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging, minWidth, maxWidth, side]);

  const onDoubleClick = useCallback(() => {
    setCollapsed((c) => !c);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => !c);
  }, []);

  return {
    width: collapsed ? 0 : width,
    collapsed,
    isDragging,
    handleProps: { onMouseDown, onDoubleClick },
    setCollapsed,
    toggleCollapsed,
  };
}
