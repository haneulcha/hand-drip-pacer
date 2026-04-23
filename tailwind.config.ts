import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      transitionDuration: {
        DEFAULT: "var(--motion-duration-base)",
        long: "var(--motion-duration-long)",
      },
      transitionTimingFunction: {
        DEFAULT: "var(--motion-easing)",
      },
      borderRadius: {
        none: "0",
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius-control)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        full: "var(--radius-pill)",
        "control-compact": "var(--radius-control-compact)",
        control: "var(--radius-control)",
        "control-group": "var(--radius-control-group)",
        button: "var(--radius-button)",
        card: "var(--radius-card)",
        surface: "var(--radius-surface)",
        pill: "var(--radius-pill)",
      },
      fontSize: {
        "2xs": ["var(--font-size-2xs)", { lineHeight: "var(--line-height-base)" }],
        xs: ["var(--font-size-xs)", { lineHeight: "var(--line-height-base)" }],
        sm: ["var(--font-size-sm)", { lineHeight: "var(--line-height-base)" }],
        md: ["var(--font-size-md)", { lineHeight: "var(--line-height-base)" }],
        lg: ["var(--font-size-lg)", { lineHeight: "var(--line-height-snug)" }],
        xl: ["var(--font-size-xl)", { lineHeight: "var(--line-height-snug)" }],
        "2xl": ["var(--font-size-2xl)", { lineHeight: "var(--line-height-snug)" }],
        "hero-sm": ["var(--font-size-hero-sm)", { lineHeight: "var(--line-height-tight)" }],
        "hero-lg": ["var(--font-size-hero-lg)", { lineHeight: "var(--line-height-tight)" }],
        "brewing-hero": ["var(--font-size-brewing-hero)", { lineHeight: "var(--line-height-tight)" }],
      },
      lineHeight: {
        tight: "var(--line-height-tight)",
        snug: "var(--line-height-snug)",
        base: "var(--line-height-base)",
      },
      letterSpacing: {
        wide: "var(--letter-spacing-wide)",
        wider: "var(--letter-spacing-wider)",
        widest: "var(--letter-spacing-widest)",
      },
      boxShadow: {
        raised: "var(--shadow-control-raised)",
        popover: "var(--shadow-popover)",
        dialog: "var(--shadow-dialog)",
        "rim-inset": "var(--shadow-rim-inset)",
        "cup-inset": "var(--shadow-cup-inset)",
      },
      keyframes: {
        "popover-in": {
          "0%": { opacity: "0", transform: "translateY(-4px) scale(0.96)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "overlay-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "popover-in":
          "popover-in var(--motion-duration-base) var(--motion-easing) both",
        "overlay-in":
          "overlay-in var(--motion-duration-base) var(--motion-easing) both",
      },
      zIndex: {
        popover: "var(--z-popover)",
        dialog: "var(--z-dialog)",
      },
      opacity: {
        disabled: "var(--opacity-disabled)",
        dim: "var(--opacity-dim)",
        muted: "var(--opacity-muted)",
      },
      minWidth: {
        popover: "var(--size-popover-min)",
      },
      height: {
        "progress-rail": "var(--size-progress-rail)",
        "brewing-rim": "var(--brewing-rim-height)",
      },
      colors: {
        surface: {
          DEFAULT: "var(--color-surface)",
          subtle: "var(--color-surface-subtle)",
          inset: "var(--color-surface-inset)",
        },
        border: {
          DEFAULT: "var(--color-border)",
          strong: "var(--color-border-strong)",
        },
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          muted: "var(--color-text-muted)",
          "on-accent": "var(--color-text-on-accent)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          hover: "var(--color-accent-hover)",
          active: "var(--color-accent-active)",
        },
        focus: "var(--color-focus-ring)",
        danger: "var(--color-danger)",
        warning: "var(--color-warning)",
        success: "var(--color-success)",
        brewing: {
          "liquid-top": "var(--color-brewing-liquid-top)",
          "liquid-mid": "var(--color-brewing-liquid-mid)",
          "liquid-deep": "var(--color-brewing-liquid-deep)",
          "liquid-bottom": "var(--color-brewing-liquid-bottom)",
        },
        pour: {
          bloom: "var(--color-pour-bloom)",
          main: "var(--color-pour-main)",
        },
        ring: {
          future: "var(--color-ring-future)",
          "on-liquid": "var(--color-ring-on-liquid)",
        },
        timeline: {
          axis: "var(--color-timeline-axis)",
          grid: "var(--color-timeline-grid)",
        },
        wall: "var(--color-wall)",
        overlay: {
          scrim: "var(--color-overlay-scrim)",
        },
      },
    },
  },
} satisfies Config;
