import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "../app/globals.css";

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}

console.log("%cZent v0.1.0", "color:#7c6aef;font-weight:bold");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
