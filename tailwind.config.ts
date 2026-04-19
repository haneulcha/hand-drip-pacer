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
        pour: {
          bloom: "var(--color-pour-bloom)",
          main: "var(--color-pour-main)",
        },
        timeline: {
          axis: "var(--color-timeline-axis)",
          grid: "var(--color-timeline-grid)",
        },
        wall: "var(--color-wall)",
      },
    },
  },
} satisfies Config;
