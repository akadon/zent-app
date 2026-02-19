/** Spring physics presets for CSS transitions */
export const springs = {
  /** Snappy panel collapse/expand */
  snappy: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  /** Smooth panel slide */
  smooth: "cubic-bezier(0.16, 1, 0.3, 1)",
  /** Quick interaction feedback */
  swift: "cubic-bezier(0.55, 0, 0.1, 1)",
  /** Bouncy entrance */
  bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
} as const;

/** Duration presets in ms */
export const durations = {
  instant: 100,
  fast: 200,
  normal: 300,
  slow: 400,
  panel: 400,
  modal: 250,
  sheet: 300,
} as const;

/** Parallax offset amounts in px */
export const parallax = {
  /** Messages shift when sidebar opens */
  sidebarShift: 8,
  /** Header subtle parallax */
  headerShift: 4,
} as const;

/** Returns CSS transition string */
export function transition(
  property: string,
  duration: keyof typeof durations = "normal",
  easing: keyof typeof springs = "smooth"
): string {
  return `${property} ${durations[duration]}ms ${springs[easing]}`;
}
