# Design Tokens

`design.md` § Architecture의 보조 문서. UI 리디자인 시 컴포넌트 코드를 건드리지 않기 위한 토큰 시스템 스펙.

## Principles

- **컴포넌트는 semantic 토큰만 참조**. primitive 직접 사용 금지.
- **Tailwind 클래스로 접근**하되, 내부적으로 CSS 변수를 가리켜 런타임 테마 교체 가능.
- **초기 값은 placeholder**. 중립 grey + 단일 accent로 시작하고 UI 디벨롭 단계에서 브랜드 컬러/타이포 확정.

## Layer Structure

```
primitives (raw)           semantic (role)              component (Tailwind)
────────────────           ────────────────             ────────────────────
--neutral-100         →    --color-surface        →    bg-surface
--accent-500          →    --color-accent         →    bg-accent
--red-500             →    --color-danger         →    bg-danger
```

## File Layout

```
src/ui/
├── tokens/
│   ├── primitives.css    # 모든 raw scale
│   └── semantic.css      # role-based aliases (light + [data-theme="dark"])
├── globals.css           # @tailwind + tokens import + base reset
└── theme.ts              # (선택) semantic key 상수 export
```

로드 순서: `globals.css`에서 `primitives.css` → `semantic.css` 순으로 import. semantic이 primitive를 참조해야 하므로 순서 중요.

## Primitive Tokens (placeholder 값)

### Neutral scale
```css
--neutral-0:   #ffffff;
--neutral-50:  #fafaf9;
--neutral-100: #f5f5f4;
--neutral-200: #e7e5e4;
--neutral-300: #d6d3d1;
--neutral-400: #a8a29e;
--neutral-500: #78716c;
--neutral-600: #57534e;
--neutral-700: #44403c;
--neutral-800: #292524;
--neutral-900: #1c1917;
--neutral-950: #0c0a09;
```

### Accent scale (coffee/amber 계열 placeholder)
```css
--accent-50:  #fef7ed;
--accent-100: #fdedd4;
--accent-200: #fad7a8;
--accent-300: #f6ba71;
--accent-400: #f19339;
--accent-500: #ed7614;  /* 주 accent */
--accent-600: #de5c0a;
--accent-700: #b8450b;
--accent-800: #933811;
--accent-900: #762f11;
```

### Signal
```css
--red-500:   #ef4444;
--amber-500: #f59e0b;
--green-500: #10b981;
```

### Spacing / radius / shadow
Tailwind 기본 스케일 사용. 필요 시 `tailwind.config.ts`의 `theme.extend`에서 확장.

## Semantic Tokens

### Light (default, `:root`)

```css
/* Surface */
--color-surface:         var(--neutral-0);
--color-surface-subtle:  var(--neutral-50);
--color-surface-inset:   var(--neutral-100);
--color-border:          var(--neutral-200);
--color-border-strong:   var(--neutral-300);

/* Text */
--color-text-primary:    var(--neutral-900);
--color-text-secondary:  var(--neutral-700);
--color-text-muted:      var(--neutral-500);
--color-text-on-accent:  var(--neutral-0);

/* Accent */
--color-accent:          var(--accent-500);
--color-accent-hover:    var(--accent-600);
--color-accent-active:   var(--accent-700);
--color-focus-ring:      var(--accent-400);

/* State */
--color-danger:   var(--red-500);
--color-warning:  var(--amber-500);
--color-success:  var(--green-500);

/* Domain */
--color-pour-bloom:     var(--accent-300);
--color-pour-main:      var(--accent-500);
--color-timeline-axis:  var(--neutral-300);
--color-timeline-grid:  var(--neutral-100);
```

### Dark (`[data-theme="dark"]`)

뼈대만 잡아두고 값은 UI 디벨롭 시 확정. 예시:

```css
[data-theme="dark"] {
  --color-surface:        var(--neutral-900);
  --color-surface-subtle: var(--neutral-800);
  --color-text-primary:   var(--neutral-50);
  /* ... 나머지도 매핑 ... */
}
```

## Tailwind Mapping

`tailwind.config.ts`:

```ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: 'var(--color-surface)',
          subtle:  'var(--color-surface-subtle)',
          inset:   'var(--color-surface-inset)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          strong:  'var(--color-border-strong)',
        },
        text: {
          primary:   'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted:     'var(--color-text-muted)',
          'on-accent': 'var(--color-text-on-accent)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover:   'var(--color-accent-hover)',
          active:  'var(--color-accent-active)',
        },
        focus: 'var(--color-focus-ring)',
        danger:  'var(--color-danger)',
        warning: 'var(--color-warning)',
        success: 'var(--color-success)',
        pour: {
          bloom: 'var(--color-pour-bloom)',
          main:  'var(--color-pour-main)',
        },
        timeline: {
          axis: 'var(--color-timeline-axis)',
          grid: 'var(--color-timeline-grid)',
        },
      },
    },
  },
} satisfies Config
```

사용 예: `<div className="bg-surface text-text-primary border border-border" />`.

## Rules (enforcement)

- 컴포넌트에서 raw hex, `rgb()`, `#...` 직접 사용 금지. 항상 Tailwind 토큰 클래스 또는 `var(--color-*)` 참조.
- 새 색이 필요하면 먼저 semantic 토큰을 추가하고 컴포넌트에서 그걸 참조. 컴포넌트 파일에 semantic 정의 금지.
- primitive 스케일은 semantic에서만 참조. 컴포넌트가 `--neutral-500` 직접 참조 금지.
