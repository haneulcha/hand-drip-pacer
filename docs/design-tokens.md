# Design Tokens

`design.md` § Architecture의 보조 문서. 색/타이포/모션의 의미·선택 근거는 `brand.md`, 실제 값과 레이어 구조는 이 문서.

## Principles

- **컴포넌트는 semantic 토큰만 참조**. primitive 직접 사용 금지.
- **Tailwind 클래스로 접근**하되, 내부적으로 CSS 변수를 가리켜 런타임 테마 교체 가능.
- 현재 값은 `brand.md` 1차 반영본. 브랜드 팔레트 범위(`#FBF7EF~#F5EFE4` / `#2A241E~#3A2F26` / `#B8843F~#A86832`)를 양끝 앵커로 삼고 중간을 인터폴레이션.

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

## Primitive Tokens

### Neutral scale (ivory → espresso)

```css
--neutral-0: #fbf7ef; /* brand bg 밝은 한계 */
--neutral-50: #f5efe4; /* brand bg 어두운 한계 */
--neutral-100: #ede5d5;
--neutral-200: #ddd2bd;
--neutral-300: #c4b59d;
--neutral-400: #a3927c;
--neutral-500: #7d6f5e;
--neutral-600: #5d5244;
--neutral-700: #4a4036;
--neutral-800: #3a2f26; /* brand ink 밝은 한계 */
--neutral-900: #2a241e; /* brand ink 어두운 한계 */
--neutral-950: #1c1914;
```

### Accent scale (muted ochre)

```css
--accent-50: #faf1e0;
--accent-100: #f2deb8;
--accent-200: #e5c289;
--accent-300: #d4a25c;
--accent-400: #c48f46;
--accent-500: #b8843f; /* brand 포인트 밝은 한계 · 주 accent */
--accent-600: #a86832; /* brand 포인트 어두운 한계 */
--accent-700: #8a5528;
--accent-800: #6e4420;
--accent-900: #543319;
```

### Signal (warm-adjusted)

```css
--red-500: #c45a4d;
--amber-500: #d49a3c;
--green-500: #6b9360;
```

### Motion

```css
--motion-duration-base: 320ms; /* 기본 트랜지션 (브랜드: 한 템포 늦게) */
--motion-duration-long: 450ms; /* 덜 중요한 전환 */
--motion-easing: cubic-bezier(
  0.2,
  0.8,
  0.2,
  1
); /* ease-out 계열, spring/bounce 금지 */
```

Tailwind에서 `theme.transitionDuration.DEFAULT` / `transitionTimingFunction.DEFAULT`를 이 변수에 매핑했으므로, 기존 `transition-colors` 등은 자동으로 320ms / 브랜드 easing 적용됨.

### Typography (외부 로드)

- **Pretendard Variable** (CDN: jsdelivr) — 한글/Latin 통합 sans, 숫자 가독성
- **Inter** (Google Fonts) — Latin 전용 fallback / 특정 숫자 강조용
- `index.html`의 `<link rel="stylesheet">` 로 로드, `globals.css`의 `body { font-family }`에서 Pretendard → Inter → system 스택 지정
- 숫자는 `tabular-nums` 필수 (값 변경 시 레이아웃 흔들림 방지)

### Spacing / shadow

Tailwind 기본 스케일 사용. shadow는 지양. 필요 시 `tailwind.config.ts`의 `theme.extend`에서 확장.

### Radius

브랜드 톤(따뜻하고 후한 곡률)에 맞춘 단일 출처. 컴포넌트는 반드시 semantic 별칭만 사용.

**Primitives** (`tokens/primitives.css`)

| 토큰            | 값     |
| --------------- | ------ |
| `--radius-xs`   | 4px    |
| `--radius-sm`   | 6px    |
| `--radius-md`   | 10px   |
| `--radius-lg`   | 14px   |
| `--radius-xl`   | 20px   |
| `--radius-pill` | 9999px |

**Semantic** (`tokens/semantic.css`) — 역할 기반 별칭. Tailwind 클래스: `rounded-control-compact`, `rounded-control`, `rounded-control-group`, `rounded-button`, `rounded-card`, `rounded-surface`, `rounded-pill`.

| 별칭                       | 매핑 | 용도                             |
| -------------------------- | ---- | -------------------------------- |
| `--radius-control-compact` | xs   | 숫자 입력 등 미세 컨트롤         |
| `--radius-control`         | sm   | 세그먼트 옵션, 작은 칩           |
| `--radius-control-group`   | md   | 세그먼트 컨테이너, 리스트 아이템 |
| `--radius-button`          | lg   | CTA 버튼, 다이얼로그 푸터 버튼   |
| `--radius-card`            | lg   | 팝오버, 선택 카드                |
| `--radius-surface`         | xl   | 다이얼로그, 시트                 |
| `--radius-pill`            | pill | 프로그레스 바                    |

**금지**: 컴포넌트에서 `rounded-xl` 같은 size 클래스나 `rounded-[12px]` 직접 지정. 새 역할이 필요하면 semantic 별칭을 먼저 추가.

### Border width

분수 픽셀(`border-[1.6px]` 등)은 retina에서 보더가 번져 보이므로 사용 금지. 정수 픽셀 (`border`, `border`)만 사용.

## Semantic Tokens

### Light (default, `:root`)

```css
/* Surface */
--color-surface: var(--neutral-0);
--color-surface-subtle: var(--neutral-50);
--color-surface-inset: var(--neutral-100);
--color-border: var(--neutral-200);
--color-border-strong: var(--neutral-300);

/* Text */
--color-text-primary: var(--neutral-900);
--color-text-secondary: var(--neutral-700);
--color-text-muted: var(--neutral-500);
--color-text-on-accent: var(--neutral-0);

/* Accent */
--color-accent: var(--accent-500);
--color-accent-hover: var(--accent-600);
--color-accent-active: var(--accent-700);
--color-focus-ring: var(--accent-400);

/* State */
--color-danger: var(--red-500);
--color-warning: var(--amber-500);
--color-success: var(--green-500);

/* Domain */
--color-pour-bloom: var(--accent-300);
--color-pour-main: var(--accent-500);
--color-timeline-axis: var(--neutral-300);
--color-timeline-grid: var(--neutral-100);
```

### Dark (`[data-theme="dark"]`)

뼈대만 잡아두고 값은 UI 디벨롭 시 확정. 예시:

```css
[data-theme="dark"] {
  --color-surface: var(--neutral-900);
  --color-surface-subtle: var(--neutral-800);
  --color-text-primary: var(--neutral-50);
  /* ... 나머지도 매핑 ... */
}
```

## Tailwind Mapping

`tailwind.config.ts`:

```ts
import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
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
      },
    },
  },
} satisfies Config;
```

사용 예: `<div className="bg-surface text-text-primary border border-border" />`.

## Rules (enforcement)

- 컴포넌트에서 raw hex, `rgb()`, `#...` 직접 사용 금지. 항상 Tailwind 토큰 클래스 또는 `var(--color-*)` 참조.
- 새 색이 필요하면 먼저 semantic 토큰을 추가하고 컴포넌트에서 그걸 참조. 컴포넌트 파일에 semantic 정의 금지.
- primitive 스케일은 semantic에서만 참조. 컴포넌트가 `--neutral-500` 직접 참조 금지.
