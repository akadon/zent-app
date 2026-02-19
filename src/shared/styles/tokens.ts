/** Elevation scale — maps to tailwind shadow-e-{n} and z-e-{n} */
export const elevation = {
  0: { shadow: "e-0", z: "e-0", use: "Message area, content" },
  1: { shadow: "e-1", z: "e-1", use: "Member panel, cards" },
  2: { shadow: "e-2", z: "e-2", use: "Channel panel, header" },
  3: { shadow: "e-3", z: "e-3", use: "Tooltips, dropdowns" },
  4: { shadow: "e-4", z: "e-4", use: "Mobile sheets" },
  5: { shadow: "e-5", z: "e-5", use: "Modals" },
} as const;

/** Panel width constraints */
export const panelWidths = {
  dock: 60,
  channelMin: 200,
  channelMax: 360,
  channelDefault: 240,
  memberMin: 200,
  memberMax: 320,
  memberDefault: 240,
} as const;

/** Color tokens for JS usage (mirrors tailwind.config) */
export const colors = {
  backgroundPrimary: "#0c1018",
  backgroundSecondary: "#111720",
  backgroundFloating: "#141c28",
  backgroundHover: "#1a2430",
  brand: "#00d4aa",
  brandLight: "#00f5c4",
  brandDark: "#008066",
} as const;

/** Breakpoints matching tailwind defaults */
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

/** Mobile detection threshold */
export const MOBILE_BREAKPOINT = 768;
