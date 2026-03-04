"use client";

import { useEffect } from "react";
import { App } from "@/App";

export default function Page() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    console.log("%cZent v0.1.0", "color:#7c6aef;font-weight:bold");
  }, []);

  return <App />;
}
