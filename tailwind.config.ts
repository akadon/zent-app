import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Zent - Spatial/layered aesthetic with warmer dark tones
        background: {
          primary: "#0c1018",      // Warm midnight (was #0a0f1a)
          secondary: "#111720",    // Slightly lighter (was #0e1525)
          tertiary: "#080c14",     // Darkest
          floating: "#141c28",     // Modals - elevated (was #121c2e)
          hover: "#1a2430",        // Hover (was #162035)
          active: "#1e2a38",       // Active/pressed
        },
        // Surface colors
        surface: {
          DEFAULT: "#0e1525",
          light: "#162035",
          border: "rgba(99, 179, 237, 0.15)", // Subtle cyan border
        },
        // Headers
        header: {
          primary: "#e8f4fc",      // Cool white with blue tint
          secondary: "#8ba4bd",    // Muted blue-gray
        },
        // Text colors
        text: {
          normal: "#b8d4e8",       // Light blue-gray
          muted: "#7a9bb5",        // Muted blue (WCAG AA compliant)
          link: "#38bdf8",         // Sky blue links
          inverse: "#0a0f1a",
        },
        // Channel colors
        channel: {
          default: "#7a9bb5",
          hover: "#9fc5e0",
          selected: "#e8f4fc",
        },
        // Interactive
        interactive: {
          normal: "#6a8da8",
          hover: "#9fc5e0",
          active: "#e8f4fc",
          muted: "#2a3f55",
        },
        // Brand - Electric cyan/mint gradient
        brand: {
          DEFAULT: "#00d4aa",      // Electric mint
          hover: "#00b894",
          active: "#009d7d",
          light: "#00f5c4",
          dark: "#008066",
          subtle: "rgba(0, 212, 170, 0.12)",
        },
        // Accent colors - Neon palette
        accent: {
          purple: "#c084fc",       // Neon purple
          pink: "#f472b6",         // Neon pink
          blue: "#38bdf8",         // Sky blue
          orange: "#fb923c",       // Neon orange
          yellow: "#fbbf24",       // Electric yellow
          cyan: "#22d3ee",         // Cyan
        },
        // Status colors
        green: {
          DEFAULT: "#00d4aa",
          hover: "#00b894",
          light: "#00f5c4",
        },
        red: {
          DEFAULT: "#f87171",
          hover: "#ef4444",
          light: "#fca5a5",
        },
        yellow: {
          DEFAULT: "#fbbf24",
          light: "#fcd34d",
        },
        // Status indicators
        status: {
          online: "#00f5c4",       // Bright mint
          idle: "#fbbf24",
          dnd: "#f87171",
          offline: "#7a9bb5",
          streaming: "#c084fc",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "SF Pro Display",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "monospace",
        ],
        display: [
          "Cal Sans",
          "Inter",
          "sans-serif",
        ],
      },
      fontSize: {
        "2xs": ["10px", { lineHeight: "14px" }],
        "channel": ["14px", { lineHeight: "18px", fontWeight: "500" }],
      },
      borderRadius: {
        "xl": "12px",
        "2xl": "16px",
        "3xl": "24px",
        "4xl": "32px",
      },
      boxShadow: {
        "glow": "0 0 30px rgba(0, 212, 170, 0.25)",
        "glow-sm": "0 0 15px rgba(0, 212, 170, 0.15)",
        "glow-lg": "0 0 50px rgba(0, 212, 170, 0.35)",
        "neon": "0 0 10px rgba(0, 212, 170, 0.5), 0 0 20px rgba(0, 212, 170, 0.3), 0 0 30px rgba(0, 212, 170, 0.2)",
        "elevated": "0 8px 32px rgba(0, 0, 0, 0.5)",
        "card": "0 4px 20px rgba(0, 0, 0, 0.3)",
        "inner-glow": "inset 0 1px 0 rgba(255, 255, 255, 0.04)",
        "border-glow": "0 0 0 1px rgba(0, 212, 170, 0.2)",
        // Elevation scale (spatial depth)
        "e-0": "none",
        "e-1": "0 2px 8px rgba(0,0,0,0.3)",
        "e-2": "0 4px 16px rgba(0,0,0,0.4), 0 0 12px rgba(0,212,170,0.04)",
        "e-3": "0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(0,212,170,0.06)",
        "e-4": "0 16px 48px rgba(0,0,0,0.6)",
        "e-5": "0 24px 64px rgba(0,0,0,0.7), 0 0 30px rgba(0,212,170,0.05)",
      },
      zIndex: {
        "e-0": "0",
        "e-1": "10",
        "e-2": "20",
        "e-3": "30",
        "e-4": "40",
        "e-5": "50",
      },
      backdropBlur: {
        xs: "2px",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "mesh": "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300d4aa' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      },
      animation: {
        "fade-in": "fadeIn 0.25s ease-out",
        "fade-in-up": "fadeInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in-down": "fadeInDown 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-out": "fadeOut 0.2s ease-out",
        "slide-in-right": "slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in-left": "slideInLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in-up": "slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in-down": "slideInDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "scale-in": "scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        "scale-out": "scaleOut 0.15s ease-in",
        "bounce-in": "bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "shimmer": "shimmer 2.5s infinite linear",
        "pulse-soft": "pulseSoft 3s infinite ease-in-out",
        "float": "float 4s infinite ease-in-out",
        "glow-pulse": "glowPulse 2.5s infinite ease-in-out",
        "spin-slow": "spin 4s linear infinite",
        "wiggle": "wiggle 0.6s ease-in-out",
        "pop": "pop 0.35s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "border-flow": "borderFlow 3s linear infinite",
        "gradient-shift": "gradientShift 8s ease infinite",
        // Spatial animations
        "spring-in": "springIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "spring-out": "springOut 0.3s cubic-bezier(0.55, 0, 0.1, 1)",
        "slide-up-sheet": "slideUpSheet 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "badge-pulse": "badgePulse 2s infinite ease-in-out",
        "mention-glow": "mentionGlow 0.5s ease-out forwards",
        "confetti-pop": "confettiPop 0.35s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeInDown: {
          "0%": { opacity: "0", transform: "translateY(-12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeOut: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(24px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-24px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideInUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInDown: {
          "0%": { opacity: "0", transform: "translateY(-24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.92)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        scaleOut: {
          "0%": { opacity: "1", transform: "scale(1)" },
          "100%": { opacity: "0", transform: "scale(0.92)" },
        },
        bounceIn: {
          "0%": { opacity: "0", transform: "scale(0.3)" },
          "50%": { transform: "scale(1.08)" },
          "70%": { transform: "scale(0.92)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(0, 212, 170, 0.2), 0 0 40px rgba(0, 212, 170, 0.1)" },
          "50%": { boxShadow: "0 0 30px rgba(0, 212, 170, 0.4), 0 0 60px rgba(0, 212, 170, 0.2)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        pop: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.12)" },
          "100%": { transform: "scale(1)" },
        },
        borderFlow: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        springIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "60%": { opacity: "1", transform: "scale(1.02)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        springOut: {
          "0%": { opacity: "1", transform: "scale(1)" },
          "100%": { opacity: "0", transform: "scale(0.95)" },
        },
        slideUpSheet: {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        badgePulse: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.1)", opacity: "0.8" },
        },
        mentionGlow: {
          "0%": { borderLeftColor: "transparent", boxShadow: "none" },
          "100%": { borderLeftColor: "#00d4aa", boxShadow: "-4px 0 12px rgba(0,212,170,0.15)" },
        },
        confettiPop: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.15)" },
          "100%": { transform: "scale(1)" },
        },
      },
      transitionTimingFunction: {
        "bounce-out": "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "smooth": "cubic-bezier(0.16, 1, 0.3, 1)",
        "swift": "cubic-bezier(0.55, 0, 0.1, 1)",
      },
      transitionDuration: {
        "250": "250ms",
        "350": "350ms",
        "400": "400ms",
      },
    },
  },
  plugins: [
    function ({ addUtilities }: { addUtilities: (utilities: Record<string, Record<string, string>>) => void }) {
      addUtilities({
        ".scrollbar-thin": {
          "scrollbar-width": "thin",
          "scrollbar-color": "#2a3f55 transparent",
        },
        ".scrollbar-none": {
          "scrollbar-width": "none",
          "-ms-overflow-style": "none",
        },
        // Glass morphism
        ".glass": {
          "background": "rgba(14, 21, 37, 0.85)",
          "backdrop-filter": "blur(16px) saturate(180%)",
          "border": "1px solid rgba(99, 179, 237, 0.1)",
        },
        ".glass-light": {
          "background": "rgba(22, 32, 53, 0.7)",
          "backdrop-filter": "blur(12px) saturate(150%)",
          "border": "1px solid rgba(99, 179, 237, 0.05)",
        },
        // Gradient text
        ".gradient-text": {
          "background": "linear-gradient(135deg, #00d4aa 0%, #38bdf8 50%, #c084fc 100%)",
          "-webkit-background-clip": "text",
          "-webkit-text-fill-color": "transparent",
          "background-clip": "text",
        },
        ".gradient-text-brand": {
          "background": "linear-gradient(135deg, #00f5c4 0%, #00d4aa 50%, #00b894 100%)",
          "-webkit-background-clip": "text",
          "-webkit-text-fill-color": "transparent",
          "background-clip": "text",
        },
        // Neon borders
        ".neon-border": {
          "border": "1px solid rgba(0, 212, 170, 0.3)",
          "box-shadow": "0 0 10px rgba(0, 212, 170, 0.1), inset 0 0 10px rgba(0, 212, 170, 0.05)",
        },
        // Hover effects
        ".hover-glow": {
          "transition": "box-shadow 0.3s ease, transform 0.3s ease",
        },
        ".hover-glow:hover": {
          "box-shadow": "0 0 25px rgba(0, 212, 170, 0.25)",
          "transform": "translateY(-2px)",
        },
        // Mesh pattern overlay
        ".mesh-overlay": {
          "position": "relative",
        },
        ".mesh-overlay::before": {
          "content": "''",
          "position": "absolute",
          "inset": "0",
          "background-image": "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300d4aa' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          "pointer-events": "none",
        },
      });
    },
  ],
};

export default config;
