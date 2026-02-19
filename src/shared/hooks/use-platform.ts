import { useState, useEffect } from "react";

type Platform = "electron" | "web" | "mobile-web";

export function usePlatform(): Platform {
  const [platform, setPlatform] = useState<Platform>("web");

  useEffect(() => {
    if (typeof window !== "undefined") {
      if ((window as any).electron || navigator.userAgent.includes("Electron")) {
        setPlatform("electron");
      } else if (/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
        setPlatform("mobile-web");
      }
    }
  }, []);

  return platform;
}
