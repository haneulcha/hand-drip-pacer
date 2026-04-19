import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      transitionDuration: {
        DEFAULT: 'var(--motion-duration-base)',
        long: 'var(--motion-duration-long)',
      },
      transitionTimingFunction: {
        DEFAULT: 'var(--motion-easing)',
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(0.75rem)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'slide-up': 'slide-up var(--motion-duration-base) var(--motion-easing) both',
      },
      colors: {
        surface: {
          DEFAULT: 'var(--color-surface)',
          subtle: 'var(--color-surface-subtle)',
          inset: 'var(--color-surface-inset)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          strong: 'var(--color-border-strong)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
          'on-accent': 'var(--color-text-on-accent)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent-hover)',
          active: 'var(--color-accent-active)',
        },
        focus: 'var(--color-focus-ring)',
        danger: 'var(--color-danger)',
        warning: 'var(--color-warning)',
        success: 'var(--color-success)',
        pour: {
          bloom: 'var(--color-pour-bloom)',
          main: 'var(--color-pour-main)',
        },
        timeline: {
          axis: 'var(--color-timeline-axis)',
          grid: 'var(--color-timeline-grid)',
        },
        wall: 'var(--color-wall)',
      },
    },
  },
} satisfies Config
