# Design System Token Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 앱 전체를 단일 디자인 토큰 시스템 위에 그려지도록, 누락된 토큰(Typography / Shadow / Z-index / Opacity / Overlay / Size)을 추가하고 모든 arbitrary value·하드코딩을 semantic 토큰 참조로 치환한다. 재발은 ESLint/Stylelint 룰로 차단한다.

**Architecture:** Primitive → Semantic → Tailwind 3계층 구조를 그대로 두고, 현재 구조에서 빠져 있는 영역(폰트·그림자·z-index·opacity·오버레이 스크림·일부 사이즈)만 채운다. 컴포넌트 구조나 공용 컴포넌트 추출은 범위 밖. 시각 변경은 폰트 크기 스냅으로 인한 미세 조정(9→10, 11→12, 13→14, 26→24)만 허용한다.

**Tech Stack:** Bun · Vite 6 · React 19 · Tailwind 3 · CSS variables · TypeScript · Vitest · ESLint · Stylelint

**Spec 출처:** [docs/superpowers/specs/2026-04-20-design-system-token-refactor-design.md](../specs/2026-04-20-design-system-token-refactor-design.md)

---

## 파일 구조

### Modify

- `src/ui/tokens/primitives.css` — 토큰 raw scale. 여기에 typography primitives와 shadow primitives를 추가한다.
- `src/ui/tokens/semantic.css` — role 기반 alias. 여기에 shadow / z-index / opacity / overlay / size semantic을 추가하고 dark 블록을 동기화한다.
- `tailwind.config.ts` — 추가된 토큰들을 Tailwind 클래스로 노출.
- `src/ui/Segmented.tsx` — `shadow-sm` 제거.
- `src/ui/Slider.tsx` — 해당 없음(검증만). `text-sm`이 쓰이지만 유지(semantic 이름 체계에 포함됨).
- `src/ui/DripperIcon.tsx` — stroke width를 로컬 상수(`STROKE`)로 추출.
- `src/features/recipe/RecipeScreen.tsx` — typography `text-[Npx]` 및 기본 Tailwind `text-*` 치환.
- `src/features/recipe/DripperPopover.tsx` — typography, `top-[72px]`, `min-w-[180px]`, `shadow-lg`, `z-20` 치환.
- `src/features/recipe/PourVerticalPreview.tsx` — SVG 내 opacity 0.88 및 stroke 로컬 상수.
- `src/features/brewing/BrewingScreen.tsx` — typography, `h-[3px]` 치환.
- `src/features/brewing/StopConfirmDialog.tsx` — typography, `z-30`, `shadow-xl`, `bg-[rgba(...)]`, `w-[calc(...)]` 치환.
- `src/features/complete/CompleteScreen.tsx` — typography 치환.
- `src/features/wall/WallScreen.tsx` — `text-base` → `text-md` 치환. 나머지(`text-2xl`, `text-sm`, `text-xs`)는 semantic 키와 이름이 같아 유지.
- `docs/design-tokens.md` — typography / shadow / z-index / opacity / overlay / size 섹션 추가, rules 섹션에 lint 요약.
- `docs/brand.md` — § 타이포그래피 스케일, § 그림자 방침 업데이트.
- `package.json` — lint 스크립트, devDependencies 추가.

### Create

- `.eslintrc.cjs` — ESLint 설정. `no-restricted-syntax` 규칙으로 JSX `className` 내 금지 패턴 차단.
- `.stylelintrc.json` — Stylelint 설정. CSS에서 raw 색상값 차단(primitives.css 예외).

---

## 구현 원칙

- 각 단계는 독립 커밋. 문제 생기면 해당 커밋만 revert.
- 각 단계 종료 시 **반드시** `bun run typecheck && bun run test:run && bun run build` 통과 확인.
- 4단계(Typography 치환) 및 5·6단계는 `bun run dev`로 Recipe / Brewing / Complete / Wall 화면을 수동 확인.
- TDD가 자연스럽게 적용되지 않는 리팩토링(기존 테스트가 그대로 통과해야 함)이므로, 각 단계의 "verify"가 테스트 대신 역할을 한다.

---

## Task 1: Typography & Shadow Primitives 추가

**Files:**
- Modify: `src/ui/tokens/primitives.css`

토큰 스케일만 추가. 아직 Tailwind에 노출하지 않으므로 시각 변경 0.

- [ ] **Step 1: primitives.css에 Typography 스케일 추가**

`src/ui/tokens/primitives.css`의 `:root { ... }` 블록 내부 끝(closing `}` 직전)에 다음 블록을 추가한다:

```css
  /* Typography — 일관된 배수 스케일 + 히어로 전용 2개 */
  --font-size-2xs: 10px;
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-md: 16px;
  --font-size-lg: 20px;
  --font-size-xl: 22px;
  --font-size-2xl: 24px;
  --font-size-hero-sm: 72px;
  --font-size-hero-lg: 96px;

  --line-height-tight: 1;
  --line-height-snug: 1.2;
  --line-height-base: 1.5;

  --letter-spacing-wide: 0.04em;
  --letter-spacing-wider: 0.08em;
  --letter-spacing-widest: 0.12em;
```

- [ ] **Step 2: primitives.css에 Shadow 스케일 추가**

같은 `:root { ... }` 블록 내부, Typography 블록 다음에 추가:

```css
  /* Shadow — 부상 레이어(popover/dialog) 전용, 매우 옅게 */
  --shadow-soft: 0 1px 2px rgba(0, 0, 0, 0.04), 0 2px 6px rgba(0, 0, 0, 0.04);
  --shadow-lift: 0 2px 8px rgba(0, 0, 0, 0.06), 0 6px 16px rgba(0, 0, 0, 0.06);
```

- [ ] **Step 3: 검증**

Run:
```bash
bun run typecheck && bun run test:run && bun run build
```
Expected: 모두 성공. 시각 변경 없음(토큰만 추가).

- [ ] **Step 4: 커밋**

```bash
git add src/ui/tokens/primitives.css
git commit -m "feat(tokens): add typography and shadow primitives"
```

---

## Task 2: Shadow / Z-index / Opacity / Overlay / Size Semantic 토큰 추가

**Files:**
- Modify: `src/ui/tokens/semantic.css`

light/dark 블록 둘 다 동기화. 아직 Tailwind에 노출하지 않으므로 시각 변경 0.

- [ ] **Step 1: Light(`:root`) 블록에 shadow / z-index / opacity / overlay / size 추가**

`src/ui/tokens/semantic.css`의 `:root { ... }` 블록 내부, 기존 radius 섹션 다음(`--radius-surface: ...;` 라인 뒤)에 다음 블록을 추가한다:

```css
  /* Shadow — 부상 레이어 전용 */
  --shadow-popover: var(--shadow-soft);
  --shadow-dialog: var(--shadow-lift);

  /* Z-index — 부상 레이어 순서 */
  --z-popover: 20;
  --z-dialog: 30;

  /* Opacity — 의미 있는 감쇠 값 */
  --opacity-dim: 0.6;
  --opacity-muted: 0.88;

  /* Overlay */
  --color-overlay-scrim: rgba(44, 40, 35, 0.45);

  /* Size */
  --size-popover-min: 11rem;
  --size-progress-rail: 2px;
```

- [ ] **Step 2: Dark 블록에 shadow / overlay 추가**

`src/ui/tokens/semantic.css`의 `[data-theme="dark"] { ... }` 블록 내부 끝(closing `}` 직전)에 다음 블록을 추가한다. 다른 토큰(typography / z-index / opacity / size)은 dark 분기가 불필요하므로 추가하지 않는다.

```css
  /* Shadow — dark는 배경이 어두우므로 더 진한 그림자 */
  --shadow-popover: 0 1px 2px rgba(0, 0, 0, 0.4), 0 2px 6px rgba(0, 0, 0, 0.4);
  --shadow-dialog: 0 2px 8px rgba(0, 0, 0, 0.5), 0 6px 16px rgba(0, 0, 0, 0.5);

  /* Overlay */
  --color-overlay-scrim: rgba(0, 0, 0, 0.6);
```

- [ ] **Step 3: 검증**

Run:
```bash
bun run typecheck && bun run test:run && bun run build
```
Expected: 모두 성공. 시각 변경 없음.

- [ ] **Step 4: 커밋**

```bash
git add src/ui/tokens/semantic.css
git commit -m "feat(tokens): add shadow/z-index/opacity/overlay/size semantics with dark sync"
```

---

## Task 3: Tailwind Config 확장

**Files:**
- Modify: `tailwind.config.ts`

새 토큰을 Tailwind 유틸리티 클래스로 노출한다. 이 단계 이후 `text-md`, `shadow-popover`, `z-dialog`, `bg-overlay-scrim` 등을 사용할 수 있게 된다. 아직 치환은 하지 않았으므로 시각 변경 0.

- [ ] **Step 1: `theme.extend`에 fontSize / lineHeight / letterSpacing 추가**

`tailwind.config.ts`의 `theme.extend` 내부, `borderRadius` 블록 다음에 추가:

```ts
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
```

주의: Tailwind 3의 `theme.extend.fontSize`는 기본 fontSize 스케일(`text-base`, `text-lg` 등)을 **덮어쓰지 않고 머지**한다. 위 정의는 같은 key(`sm`, `md`, `lg`, `xl`, `2xl`, `xs`)를 덮어쓰는 방식이므로, 기존 `text-sm` / `text-lg` / `text-xl` / `text-2xl` / `text-xs`는 **값이 우리 토큰으로 변경된다**. Tailwind 기본 `text-base`는 우리가 재정의하지 않으므로 ESLint로 차단해야 한다(Task 8).

- [ ] **Step 2: `theme.extend`에 boxShadow / zIndex / opacity 추가**

같은 위치(위 블록 다음)에 추가:

```ts
      boxShadow: {
        popover: "var(--shadow-popover)",
        dialog: "var(--shadow-dialog)",
      },
      zIndex: {
        popover: "var(--z-popover)",
        dialog: "var(--z-dialog)",
      },
      opacity: {
        dim: "var(--opacity-dim)",
        muted: "var(--opacity-muted)",
      },
```

- [ ] **Step 3: `theme.extend`에 minWidth / height / colors.overlay 추가**

같은 위치에 추가:

```ts
      minWidth: {
        popover: "var(--size-popover-min)",
      },
      height: {
        "progress-rail": "var(--size-progress-rail)",
      },
```

그리고 기존 `colors` 블록 내부에 `overlay` 키를 추가한다. `wall: "var(--color-wall)",` 라인 다음에:

```ts
        overlay: {
          scrim: "var(--color-overlay-scrim)",
        },
```

- [ ] **Step 4: 검증**

Run:
```bash
bun run typecheck && bun run build
```
Expected: 빌드 성공. `tailwind.config.ts`가 타입 에러 없이 컴파일되고 Tailwind가 새 유틸리티를 생성해야 한다.

주의: 이 시점에서 **기존 `text-sm`/`text-lg` 등의 픽셀 값이 바뀌었다**. 아직 아무 컴포넌트도 수정하지 않았으므로, dev 서버에서 확인하면 시각이 살짝 달라 보일 수 있다(예: `text-sm`이 기본 14px에서 우리 토큰의 14px로 — 같은 값이라 변화 없음, `text-xl`은 Tailwind 기본 20px에서 우리 토큰의 22px로 커짐). Task 4에서 모든 텍스트를 semantic으로 치환하므로 중간 상태는 허용된다.

- [ ] **Step 5: dev로 시각 확인(옵션)**

Run:
```bash
bun run dev
```
Recipe / Brewing / Complete / Wall 화면을 한 번씩 열어 눈에 띄는 깨짐이 있는지 확인한다. 살짝 큰/작은 정도는 Task 4에서 정리되므로 허용.

`Ctrl+C`로 dev 서버 종료.

- [ ] **Step 6: 커밋**

```bash
git add tailwind.config.ts
git commit -m "feat(tailwind): expose new tokens as utilities (fontSize/shadow/z/opacity/size/overlay)"
```

---

## Task 4: Typography 치환

**Files:**
- Modify: `src/features/recipe/RecipeScreen.tsx`
- Modify: `src/features/recipe/DripperPopover.tsx`
- Modify: `src/features/brewing/BrewingScreen.tsx`
- Modify: `src/features/brewing/StopConfirmDialog.tsx`
- Modify: `src/features/complete/CompleteScreen.tsx`

모든 `text-[Npx]` arbitrary value와 Tailwind 기본 `text-base`를 semantic 키로 치환한다. 스냅 규칙:

| 현재 | 스냅 클래스 |
|------|------------|
| `text-[9px]` | `text-2xs` |
| `text-[10px]` | `text-2xs` |
| `text-[11px]` | `text-xs` |
| `text-[13px]` | `text-sm` |
| `text-[22px]` | `text-xl` |
| `text-[26px]` | `text-2xl` |
| `text-[72px]` | `text-hero-sm` |
| `text-[96px]` | `text-hero-lg` |
| `text-base` (Tailwind 기본 16px) | `text-md` |
| `text-3xl` (Tailwind 기본 30px) | 유지 후 재검토(해당 위치: BrewingScreen.tsx:108, 메인 숫자 단위 `g`) |

기존 `text-sm` / `text-lg` / `text-xl` / `text-2xl` / `text-xs`는 semantic 키와 이름이 같고 값은 위에서 재정의됐으므로 그대로 둔다(단, 의미적으로 스냅 매핑과 충돌하지 않는지 각 위치에서 확인).

`text-3xl`은 우리 scale에 없다. `BrewingScreen.tsx:108`의 `text-3xl` 단위 "g" 라벨은 메인 숫자(96px) 옆 작은 라벨이며, 주변과의 크기 비례를 유지하기 위해 `text-2xl`(24px)로 스냅한다.

- [ ] **Step 1: RecipeScreen.tsx 치환**

다음 위치를 수정한다:

- `src/features/recipe/RecipeScreen.tsx:80` — `text-[11px]` → `text-xs`
- `src/features/recipe/RecipeScreen.tsx:85` — `text-[11px]` → `text-xs`
- `src/features/recipe/RecipeScreen.tsx:159` — `text-[10px]` → `text-2xs`
- `src/features/recipe/RecipeScreen.tsx:172` — `text-[11px]` → `text-xs`
- `src/features/recipe/RecipeScreen.tsx:227` — `text-[11px]` → `text-xs`

기존 `text-lg font-medium`(라인 77, 194)과 `text-xs text-text-muted tabular-nums`(라인 175)은 semantic과 이름이 같으므로 유지. 라인 175의 `text-xs`는 12px, 라인 77·194의 `text-lg`는 20px로 반영됨(기존 Tailwind 기본 18px→20px). 시각 미세 상향.

- [ ] **Step 2: DripperPopover.tsx 치환**

- `src/features/recipe/DripperPopover.tsx:61` — `text-[10px]` → `text-2xs`

기존 `text-sm`(라인 55)은 유지(14px).

- [ ] **Step 3: BrewingScreen.tsx 치환**

- `src/features/brewing/BrewingScreen.tsx:50` — `text-[10px]` → `text-2xs`
- `src/features/brewing/BrewingScreen.tsx:51` — `text-[26px]` → `text-2xl`
- `src/features/brewing/BrewingScreen.tsx:58` — `text-[11px]` → `text-xs`
- `src/features/brewing/BrewingScreen.tsx:83` — `text-[9px]` → `text-2xs`
- `src/features/brewing/BrewingScreen.tsx:97` — `text-[11px]` → `text-xs`
- `src/features/brewing/BrewingScreen.tsx:100` — `text-[11px]` → `text-xs`
- `src/features/brewing/BrewingScreen.tsx:104` — `text-[96px]` → `text-hero-lg`
- `src/features/brewing/BrewingScreen.tsx:108` — `text-3xl` → `text-2xl`
- `src/features/brewing/BrewingScreen.tsx:110` — `text-base` → `text-md`
- `src/features/brewing/BrewingScreen.tsx:117` — `text-[10px]` → `text-2xs`
- `src/features/brewing/BrewingScreen.tsx:118` — `text-[22px]` → `text-xl`
- `src/features/brewing/BrewingScreen.tsx:130` — `text-[13px]` → `text-sm`
- `src/features/brewing/BrewingScreen.tsx:143` — `text-[10px]` → `text-2xs`
- `src/features/brewing/BrewingScreen.tsx:146` — `text-[13px]` → `text-sm`
- `src/features/brewing/BrewingScreen.tsx:152` — `text-[11px]` → `text-xs`

기존 `text-lg font-medium`(라인 150)은 유지(20px, 기존 18→20 상향).

- [ ] **Step 4: StopConfirmDialog.tsx 치환**

이 파일은 arbitrary value가 없고 Tailwind 기본 `text-lg`, `text-sm`만 사용한다. 둘 다 semantic 키와 이름이 같으므로 변경 없음. 이 단계에서는 건드리지 않는다.

- [ ] **Step 5: CompleteScreen.tsx 치환**

- `src/features/complete/CompleteScreen.tsx:38` — `text-[11px]` → `text-xs`
- `src/features/complete/CompleteScreen.tsx:41` — `text-[11px]` → `text-xs`
- `src/features/complete/CompleteScreen.tsx:48` — `text-[11px]` → `text-xs`
- `src/features/complete/CompleteScreen.tsx:49` — `text-[72px]` → `text-hero-sm`
- `src/features/complete/CompleteScreen.tsx:147` — `text-[13px]` → `text-sm`
- `src/features/complete/CompleteScreen.tsx:147` — 같은 삼항 내 `text-base` → `text-md` (`small ? "text-[13px] text-text-secondary" : "text-base"` 구조)

기존 `text-sm`, `text-xs`는 이름이 같으므로 유지.

- [ ] **Step 6: WallScreen.tsx 치환**

- `src/features/wall/WallScreen.tsx:19` — `text-base` → `text-md`

기존 `text-2xl`(라인 16), `text-sm`(라인 46), `text-xs`(라인 58)는 이름이 같으므로 유지.

- [ ] **Step 7: 타입·테스트·빌드 검증**

Run:
```bash
bun run typecheck && bun run test:run && bun run build
```
Expected: 모두 성공.

- [ ] **Step 8: dev로 시각 확인**

Run:
```bash
bun run dev
```
Recipe / Brewing / Complete / Wall 네 화면을 전부 열어 다음을 확인:

- 라벨 텍스트가 약간 커진 것이 어색하지 않은지(11→12, 13→14 스냅)
- 메인 히어로 타이머(96px)와 Complete 히어로(72px)가 동일하게 보이는지
- BrewingScreen의 `26px → 24px`, `22px → 22px` 변화가 레이아웃을 깨지 않는지
- WallScreen의 부제(`text-base` → `text-md`, 16px 유지)가 정상

깨진 곳이 있으면 해당 위치의 스냅을 조정하기보다는 **line-height 또는 letter-spacing으로 보정**한다(토큰을 왜곡하지 않음).

`Ctrl+C`로 종료.

- [ ] **Step 9: 커밋**

```bash
git add src/features
git commit -m "refactor(typography): migrate arbitrary text sizes to semantic tokens"
```

---

## Task 5: Shadow / Z-index / Opacity / Overlay 치환

**Files:**
- Modify: `src/ui/Segmented.tsx`
- Modify: `src/features/recipe/DripperPopover.tsx`
- Modify: `src/features/brewing/StopConfirmDialog.tsx`
- Modify: `src/features/recipe/PourVerticalPreview.tsx`

- [ ] **Step 1: Segmented.tsx에서 `shadow-sm` 제거**

`src/ui/Segmented.tsx:38`의 `shadow-sm` 클래스 토큰을 className 문자열에서 제거한다. 제거 후 클래스:
```tsx
selected
  ? "bg-surface text-text-primary"
  : "text-text-muted hover:text-text-secondary",
```

선택된 세그먼트의 경계는 `bg-surface`와 컨테이너 `bg-surface-inset`의 톤 차이로 유지된다.

- [ ] **Step 2: DripperPopover.tsx에서 `shadow-lg` → `shadow-popover`, `z-20` → `z-popover`**

`src/features/recipe/DripperPopover.tsx:25` — `z-20` → `z-popover`
`src/features/recipe/DripperPopover.tsx:35` — `shadow-lg` → `shadow-popover`

- [ ] **Step 3: StopConfirmDialog.tsx 치환 (shadow / z / overlay)**

`src/features/brewing/StopConfirmDialog.tsx:8` — `z-30` → `z-dialog`
`src/features/brewing/StopConfirmDialog.tsx:13` — `bg-[rgba(42,36,30,0.45)]` → `bg-overlay-scrim`
`src/features/brewing/StopConfirmDialog.tsx:19` — `shadow-xl` → `shadow-dialog`

- [ ] **Step 4: PourVerticalPreview.tsx에서 opacity 0.88 치환**

`src/features/recipe/PourVerticalPreview.tsx:87`의 SVG `<line>` 속성 `opacity={bloom ? 1 : 0.88}`를 다음과 같이 바꾼다:

```tsx
opacity={bloom ? 1 : "var(--opacity-muted)"}
```

주의: SVG `opacity` 속성은 string도 허용한다. TypeScript에서 number | string 혼재가 문제되면 style prop으로 분리한다:

```tsx
// 기존:
//   strokeLinecap="round"
//   opacity={bloom ? 1 : 0.88}
// 변경 후:
strokeLinecap="round"
style={bloom ? undefined : { opacity: "var(--opacity-muted)" }}
```

타입 에러가 나지 않는 쪽을 선택. `style` 쪽이 안전하므로 기본 선택.

`src/features/recipe/PourVerticalPreview.tsx`의 다른 `opacity={opacity * 0.5}`(DripperIcon쪽 아님) — 이 파일에는 없으므로 해당 없음.

- [ ] **Step 5: 타입·테스트·빌드 검증**

Run:
```bash
bun run typecheck && bun run test:run && bun run build
```
Expected: 모두 성공.

- [ ] **Step 6: dev로 시각 확인**

Run:
```bash
bun run dev
```

- Segmented: 선택 세그먼트에 그림자가 빠졌지만 배경 톤 차이로 경계가 보이는지 확인
- DripperPopover / StopConfirmDialog: 그림자가 살짝 더 옅어진(또는 비슷한) 부상감
- StopConfirmDialog: 오버레이 스크림 톤이 기존과 동일하게 보이는지(45% neutral)
- PourVerticalPreview: bloom이 아닌 pour 막대의 감쇠가 기존과 유사

`Ctrl+C`로 종료.

- [ ] **Step 7: 커밋**

```bash
git add src/ui/Segmented.tsx src/features
git commit -m "refactor(tokens): migrate shadow/z-index/opacity/overlay to semantic tokens"
```

---

## Task 6: Arbitrary Layout Value 치환

**Files:**
- Modify: `src/features/recipe/DripperPopover.tsx`
- Modify: `src/features/brewing/BrewingScreen.tsx`
- Modify: `src/features/brewing/StopConfirmDialog.tsx`
- Modify: `src/features/recipe/RecipeScreen.tsx`

- [ ] **Step 1: DripperPopover의 `top-[72px]` 및 `min-w-[180px]` 치환**

`src/features/recipe/DripperPopover.tsx:35`의 클래스 문자열에서:
- `top-[72px]` → `top-18` (Tailwind 기본 spacing scale: `18` = 4.5rem = 72px)
- `min-w-[180px]` → `min-w-popover`

변경 후:
```tsx
className="absolute right-4 top-18 min-w-popover rounded-card border border-border bg-surface p-1 shadow-popover"
```

주의: 이 전 Task 5에서 `shadow-lg` → `shadow-popover`를 이미 바꿨으므로 shadow는 건드리지 않는다.

- [ ] **Step 2: BrewingScreen의 `h-[3px]` → `h-progress-rail` 치환**

`src/features/brewing/BrewingScreen.tsx:73`의 클래스 문자열에서 `h-[3px]` → `h-progress-rail`.

주의: 토큰 값은 2px(3→2 스냅)이다. 시각적으로 레일이 1px 얇아진다.

- [ ] **Step 3: StopConfirmDialog의 `w-[calc(100%-56px)]` 치환**

`src/features/brewing/StopConfirmDialog.tsx:19`에서 `w-[calc(100%-56px)]`와 `left-1/2` + `-translate-x-1/2` 조합이 있다. 56px = 28px × 2 = spacing `mx-7`(28px each side)에 해당하므로 다음과 같이 단순화한다.

변경 전:
```tsx
className="absolute left-1/2 top-1/2 w-[calc(100%-56px)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-surface bg-surface p-6 shadow-dialog"
```

변경 후:
```tsx
className="absolute left-1/2 top-1/2 mx-7 w-[calc(100%-3.5rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-surface bg-surface p-6 shadow-dialog"
```

즉, `56px` 리터럴을 `3.5rem`으로 바꿔 lint에서 허용되는 rem 단위 arbitrary로 만든다. `mx-7`는 중복이므로 제거한다:

최종:
```tsx
className="absolute left-1/2 top-1/2 w-[calc(100%-3.5rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-surface bg-surface p-6 shadow-dialog"
```

- [ ] **Step 4: RecipeScreen의 `grid-cols-[44px_1fr]` → rem 단위로 정규화**

`src/features/recipe/RecipeScreen.tsx:226`에서 `grid-cols-[44px_1fr]` → `grid-cols-[2.75rem_1fr]`.

- [ ] **Step 5: 타입·테스트·빌드 검증**

Run:
```bash
bun run typecheck && bun run test:run && bun run build
```
Expected: 모두 성공.

- [ ] **Step 6: dev로 시각 확인**

Run:
```bash
bun run dev
```

- BrewingScreen 프로그레스 레일이 약간 얇아진 것(3→2px)이 어색하지 않은지 확인
- StopConfirmDialog가 기존과 동일한 위치·크기인지 확인
- DripperPopover 위치가 동일한지 확인(`top-[72px]` ≡ `top-18`)
- RecipeScreen `Row` 레이아웃이 동일한지 확인(44px ≡ 2.75rem, root font 16px 기준)

`Ctrl+C`로 종료.

- [ ] **Step 7: 커밋**

```bash
git add src/features
git commit -m "refactor(layout): snap arbitrary layout values to spacing scale and semantic tokens"
```

---

## Task 7: SVG Stroke Width 로컬 상수화

**Files:**
- Modify: `src/ui/DripperIcon.tsx`
- Modify: `src/features/recipe/PourVerticalPreview.tsx`

SVG stroke width는 토큰화하지 않고 **파일당 로컬 상수**로 묶는다. 중복 제거만 목적.

- [ ] **Step 1: DripperIcon.tsx에 `STROKE` 상수 추출**

`src/ui/DripperIcon.tsx` 상단, import 다음에 상수를 추가한다:

```ts
const STROKE = {
  hairline: 0.8,
  thin: 1.2,
  base: 1.6,
} as const;
```

그리고 본문에서 다음과 같이 치환:
- `const strokeWidth = selected ? 1.6 : 1.2;` → `const strokeWidth = selected ? STROKE.base : STROKE.thin;`
- v60의 장식 라인 `strokeWidth={0.8}` → `strokeWidth={STROKE.hairline}`
- kalita_wave의 장식 라인 `strokeWidth={0.8}` → `strokeWidth={STROKE.hairline}`

- [ ] **Step 2: PourVerticalPreview.tsx에 `STROKE` 상수 추출**

`src/features/recipe/PourVerticalPreview.tsx` 상단, import 다음에 상수를 추가한다:

```ts
const STROKE = {
  hairline: 0.8,
  base: 2,
  bold: 2.2,
} as const;
```

본문에서 다음과 같이 치환:
- 축 선 `strokeWidth={0.8}` → `strokeWidth={STROKE.hairline}`
- bar `strokeWidth={bloom ? 2.2 : 2}` → `strokeWidth={bloom ? STROKE.bold : STROKE.base}`

- [ ] **Step 3: 타입·테스트·빌드 검증**

Run:
```bash
bun run typecheck && bun run test:run && bun run build
```
Expected: 모두 성공.

- [ ] **Step 4: dev로 시각 확인**

Run:
```bash
bun run dev
```
DripperIcon(Wall, Recipe 상단, Popover)과 PourVerticalPreview(Recipe)가 기존과 동일하게 보이는지 확인. 숫자만 바뀌었으므로 시각 변경 없어야 함.

`Ctrl+C`로 종료.

- [ ] **Step 5: 커밋**

```bash
git add src/ui/DripperIcon.tsx src/features/recipe/PourVerticalPreview.tsx
git commit -m "refactor(svg): extract stroke widths to local STROKE constants"
```

---

## Task 8: ESLint / Stylelint 설정 및 lint 스크립트 도입

**Files:**
- Create: `.eslintrc.cjs`
- Create: `.stylelintrc.json`
- Modify: `package.json`

ESLint와 Stylelint를 새로 도입한다. ESLint는 JSX `className` 문자열 내 금지 패턴을 정규식으로 차단하고, Stylelint는 CSS에서 primitives.css 외 파일의 raw 색상값을 차단한다.

- [ ] **Step 1: 의존성 설치**

Run:
```bash
bun add -d eslint@^9 @eslint/js@^9 typescript-eslint@^8 eslint-plugin-react@^7 eslint-plugin-react-hooks@^5 stylelint@^16 stylelint-config-standard@^36
```

Expected: `devDependencies`에 위 패키지들이 추가되고 설치 성공.

- [ ] **Step 2: `.eslintrc.cjs` 작성**

프로젝트 루트에 `.eslintrc.cjs`를 생성한다:

```js
/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  plugins: ["@typescript-eslint", "react", "react-hooks"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
  ],
  settings: { react: { version: "detect" } },
  ignorePatterns: ["dist", "node_modules", "*.config.ts", "*.config.js"],
  rules: {
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",

    // Design token enforcement: ban disallowed className patterns in JSX string literals.
    "no-restricted-syntax": [
      "error",
      // Typography arbitrary values
      {
        selector: "JSXAttribute[name.name='className'] Literal[value=/\\btext-\\[/]",
        message: "Use a semantic text-* token (text-2xs/xs/sm/md/lg/xl/2xl/hero-sm/hero-lg). Arbitrary text-[Npx] is banned.",
      },
      // Typography: Tailwind default text-base (16px) is not in our scale; use text-md.
      {
        selector: "JSXAttribute[name.name='className'] Literal[value=/\\btext-base\\b/]",
        message: "Use text-md instead of text-base (our scale defines 16px as md).",
      },
      // leading-* / tracking-* arbitrary
      {
        selector: "JSXAttribute[name.name='className'] Literal[value=/\\b(leading|tracking)-\\[/]",
        message: "Use semantic leading-tight/snug/base or tracking-wide/wider/widest; arbitrary values are banned.",
      },
      // Raw color hex / rgb / hsl in arbitrary classes
      {
        selector: "JSXAttribute[name.name='className'] Literal[value=/\\b(bg|text|border|fill|stroke|ring)-\\[(#|rgb|hsl)/]",
        message: "Use a semantic color token. Raw hex/rgb/hsl in arbitrary classes is banned.",
      },
      // Tailwind default radius size classes (we only allow semantic aliases)
      {
        selector: "JSXAttribute[name.name='className'] Literal[value=/\\brounded-(xs|sm|md|lg|xl|2xl|3xl|full)\\b/]",
        message: "Use semantic rounded-* alias (rounded-control-compact/control/control-group/button/card/surface/pill). Size-named rounded-* is banned.",
      },
      {
        selector: "JSXAttribute[name.name='className'] Literal[value=/\\brounded-\\[/]",
        message: "Use a semantic rounded-* alias. Arbitrary rounded-[...] is banned.",
      },
      // Tailwind default shadow classes
      {
        selector: "JSXAttribute[name.name='className'] Literal[value=/\\bshadow-(sm|md|lg|xl|2xl|inner)\\b/]",
        message: "Use semantic shadow-popover or shadow-dialog. Size-named shadow-* is banned.",
      },
      {
        selector: "JSXAttribute[name.name='className'] Literal[value=/\\bshadow-\\[/]",
        message: "Use semantic shadow-popover or shadow-dialog. Arbitrary shadow-[...] is banned.",
      },
      // z-index: Tailwind default numeric and arbitrary
      {
        selector: "JSXAttribute[name.name='className'] Literal[value=/\\bz-(0|10|20|30|40|50|auto)\\b/]",
        message: "Use semantic z-popover or z-dialog. Tailwind default z-* is banned.",
      },
      {
        selector: "JSXAttribute[name.name='className'] Literal[value=/\\bz-\\[/]",
        message: "Use semantic z-popover or z-dialog. Arbitrary z-[...] is banned.",
      },
      // Opacity arbitrary
      {
        selector: "JSXAttribute[name.name='className'] Literal[value=/\\bopacity-\\[/]",
        message: "Use opacity-dim / opacity-muted or Tailwind percent (opacity-40, opacity-60, etc). Arbitrary opacity-[...] is banned.",
      },
      // Layout arbitrary px values (rem is allowed)
      {
        selector: "JSXAttribute[name.name='className'] Literal[value=/\\b(h|w|min-w|max-w|min-h|max-h|top|left|right|bottom)-\\[[0-9.]+px\\]/]",
        message: "Use spacing scale or a semantic size token. Arbitrary px layout values are banned (rem arbitrary values are allowed).",
      },
      // grid-cols with px values
      {
        selector: "JSXAttribute[name.name='className'] Literal[value=/\\bgrid-cols-\\[[^\\]]*[0-9]+px/]",
        message: "Use rem units in grid-cols-[...] arbitrary values.",
      },
    ],
  },
};
```

- [ ] **Step 3: `.stylelintrc.json` 작성**

프로젝트 루트에 `.stylelintrc.json`을 생성한다. CSS에서 색상을 하드코딩하는 것을 금지하되, `primitives.css`만 예외로 둔다.

```json
{
  "extends": ["stylelint-config-standard"],
  "rules": {
    "color-no-hex": true,
    "color-function-notation": null,
    "custom-property-empty-line-before": null,
    "declaration-empty-line-before": null
  },
  "overrides": [
    {
      "files": ["src/ui/tokens/primitives.css"],
      "rules": {
        "color-no-hex": null
      }
    }
  ]
}
```

- [ ] **Step 4: `package.json`에 lint 스크립트 추가**

`package.json`의 `scripts` 블록에 다음을 추가한다(`format:check` 다음 라인):

```json
    "lint": "eslint \"src/**/*.{ts,tsx}\" && stylelint \"src/**/*.css\"",
    "lint:fix": "eslint \"src/**/*.{ts,tsx}\" --fix && stylelint \"src/**/*.css\" --fix"
```

- [ ] **Step 5: 초기 lint 실행 및 0 위반 확인**

Run:
```bash
bun run lint
```
Expected: ESLint / Stylelint 둘 다 0 위반으로 통과.

위반이 있으면 원인을 확인하고 (a) 규칙 정규식이 과도하게 차단하는지, (b) 우리가 놓친 치환 위치가 있는지 판단한다. (a)의 경우 규칙을 좁히고, (b)의 경우 해당 컴포넌트를 이전 단계와 같은 방식으로 치환한다.

특히 예상되는 예외:
- `RecipeScreen.tsx:226`의 `grid-cols-[2.75rem_1fr]`은 허용(rem 단위)
- `StopConfirmDialog.tsx:19`의 `w-[calc(100%-3.5rem)]`은 허용(rem 단위)
- PourVerticalPreview의 `style={{ opacity: "var(--opacity-muted)" }}`은 className이 아니므로 규칙 대상 아님

- [ ] **Step 6: 타입·테스트·빌드 검증**

Run:
```bash
bun run typecheck && bun run test:run && bun run build
```
Expected: 모두 성공.

- [ ] **Step 7: 커밋**

```bash
git add .eslintrc.cjs .stylelintrc.json package.json bun.lockb
git commit -m "chore(lint): add eslint + stylelint rules enforcing design token usage"
```

주의: `bun.lockb`가 없으면(bun이 `package.json`만 수정했으면) 그 파일은 제외한다. `git status`로 실제 수정된 파일을 확인 후 add.

---

## Task 9: 문서 정합 — `docs/design-tokens.md` 업데이트

**Files:**
- Modify: `docs/design-tokens.md`

새로 추가된 토큰(typography, shadow 역할 변경, z-index, opacity, overlay, size)을 문서에 반영하고, rules 섹션에 lint 규칙을 명시한다.

- [ ] **Step 1: § Primitive Tokens에 Typography 하위 섹션 추가**

`## Primitive Tokens` 블록 내부, 기존 `### Neutral scale` 위에 `### Typography` 섹션을 추가한다. 내용:

```markdown
### Typography

폰트 크기 스케일은 일관된 배수 기반 7단계(`2xs`~`2xl`) + 히어로 전용 2단계(`hero-sm`, `hero-lg`)로 구성. Semantic alias 없이 size-based naming을 Tailwind에 그대로 노출한다.

```css
--font-size-2xs: 10px;
--font-size-xs:  12px;
--font-size-sm:  14px;
--font-size-md:  16px;
--font-size-lg:  20px;
--font-size-xl:  22px;
--font-size-2xl: 24px;
--font-size-hero-sm: 72px;  /* Complete 히어로 */
--font-size-hero-lg: 96px;  /* Brewing 타이머 */

--line-height-tight: 1;
--line-height-snug:  1.2;
--line-height-base:  1.5;

--letter-spacing-wide:   0.04em;
--letter-spacing-wider:  0.08em;
--letter-spacing-widest: 0.12em;
```

Tailwind 클래스: `text-2xs` / `text-xs` / `text-sm` / `text-md` / `text-lg` / `text-xl` / `text-2xl` / `text-hero-sm` / `text-hero-lg`, `leading-tight/snug/base`, `tracking-wide/wider/widest`.

**금지**: `text-[Npx]` arbitrary, Tailwind 기본 `text-base`(우리 체계에서 16은 `text-md`), `leading-[...]` / `tracking-[...]` arbitrary.
```

- [ ] **Step 2: § Spacing / shadow 섹션 재작성**

기존 `### Spacing / shadow` 섹션(100줄 전후)의 "shadow는 지양" 문구를 수정한다. 대체 내용:

```markdown
### Spacing

Tailwind 기본 스케일 사용. Semantic 별칭은 꼭 필요한 layout size(예: `--size-popover-min`, `--size-progress-rail`)에 한해 추가한다.

### Shadow

부상 레이어(popover/dialog)에 한해 **매우 옅은** 그림자를 허용한다. 일반 UI 요소(버튼, 카드, 입력)는 그림자를 쓰지 않고 톤 차이로 경계를 낸다.

**Primitives** (`tokens/primitives.css`)

```css
--shadow-soft: 0 1px 2px rgba(0, 0, 0, 0.04), 0 2px 6px rgba(0, 0, 0, 0.04);
--shadow-lift: 0 2px 8px rgba(0, 0, 0, 0.06), 0 6px 16px rgba(0, 0, 0, 0.06);
```

**Semantic** (`tokens/semantic.css`)

| 별칭 | 매핑 | 용도 |
|------|------|------|
| `--shadow-popover` | soft | 드롭다운/팝오버 |
| `--shadow-dialog`  | lift | 모달 다이얼로그 |

Tailwind 클래스: `shadow-popover`, `shadow-dialog`.

**금지**: Tailwind 기본 `shadow-sm/md/lg/xl/2xl/inner`, `shadow-[...]` arbitrary.
```

- [ ] **Step 3: § Semantic Tokens에 Z-index / Opacity / Overlay / Size 하위 섹션 추가**

기존 `### Light (default, :root)` 블록 아래, `### Dark (...)` 위에 다음 섹션들을 추가:

```markdown
### Z-index

```css
--z-popover: 20;
--z-dialog:  30;
```

Tailwind: `z-popover`, `z-dialog`. **금지**: Tailwind 기본 `z-0/10/20/.../50/auto`, `z-[...]` arbitrary.

### Opacity

```css
--opacity-dim:   0.6;
--opacity-muted: 0.88;
```

Tailwind: `opacity-dim`, `opacity-muted`. Tailwind 기본 percent 클래스(`opacity-40` 등)는 여전히 사용 가능. **금지**: `opacity-[...]` arbitrary.

### Overlay

```css
--color-overlay-scrim: rgba(44, 40, 35, 0.45);  /* neutral-900 @ 45% (light) */
```

Tailwind: `bg-overlay-scrim`.

### Size (의미 있는 레이아웃 상수)

```css
--size-popover-min:   11rem;  /* 176px */
--size-progress-rail: 2px;
```

Tailwind: `min-w-popover`, `h-progress-rail`.
```

- [ ] **Step 4: § Dark 블록에 shadow / overlay 업데이트 반영**

기존 `### Dark ([data-theme="dark"])` 섹션의 뼈대 예시에 shadow/overlay를 추가한다:

```css
[data-theme="dark"] {
  /* 기존 매핑 ... */

  --shadow-popover: 0 1px 2px rgba(0, 0, 0, 0.4), 0 2px 6px rgba(0, 0, 0, 0.4);
  --shadow-dialog:  0 2px 8px rgba(0, 0, 0, 0.5), 0 6px 16px rgba(0, 0, 0, 0.5);
  --color-overlay-scrim: rgba(0, 0, 0, 0.6);
}
```

주석: "Typography / z-index / opacity / size 토큰은 light/dark 공용이라 분기하지 않음."

- [ ] **Step 5: § Rules (enforcement) 섹션 재작성**

기존 섹션을 다음으로 교체:

```markdown
## Rules (enforcement)

- 컴포넌트 스타일 값은 Tailwind 토큰 클래스 또는 `var(--color-*)` 등 semantic CSS 변수 참조를 통해서만 표현한다.
- Primitive 스케일은 `semantic.css`와 `tailwind.config.ts`에서만 참조한다. 컴포넌트에서 `var(--neutral-*)`나 `var(--accent-*)` 직접 참조 금지.
- 새 디자인 값이 필요하면 먼저 semantic 토큰을 추가하고 컴포넌트에서 그걸 참조한다.

### Lint 자동 차단

ESLint 규칙(`.eslintrc.cjs`의 `no-restricted-syntax`)이 JSX `className`에서 다음을 차단한다:

- `text-[Npx]`, `text-base`, `leading-[...]`, `tracking-[...]`
- `bg-[#...]` / `bg-[rgb...]` / `bg-[hsl...]` (color arbitrary with raw value)
- `rounded-(xs|sm|md|lg|xl|2xl|3xl|full)`, `rounded-[...]`
- `shadow-(sm|md|lg|xl|2xl|inner)`, `shadow-[...]`
- `z-(0|10|20|30|40|50|auto)`, `z-[...]`
- `opacity-[...]`
- 픽셀 단위 layout arbitrary: `(h|w|min-w|max-w|top|left|right|bottom)-[Npx]`, `grid-cols-[...Npx...]`

rem 단위 arbitrary(예: `grid-cols-[2.75rem_1fr]`)는 허용.

Stylelint 규칙(`.stylelintrc.json`)이 CSS에서 raw hex 색상을 금지한다. `src/ui/tokens/primitives.css`만 예외.

SVG stroke width / text fontSize 등 SVG 내부 속성은 각 컴포넌트의 로컬 `STROKE` 상수로만 관리하고 토큰화하지 않는다.
```

- [ ] **Step 6: 검증**

Run:
```bash
bun run lint && bun run typecheck && bun run test:run && bun run build
```
Expected: 모두 성공.

- [ ] **Step 7: 커밋**

```bash
git add docs/design-tokens.md
git commit -m "docs(design-tokens): document typography/shadow/z/opacity/overlay/size + lint rules"
```

---

## Task 10: 문서 정합 — `docs/brand.md` 업데이트

**Files:**
- Modify: `docs/brand.md`

브랜드 문서의 타이포그래피 스케일과 그림자 방침을 실제 구현에 맞춘다.

- [ ] **Step 1: § 타이포그래피 스케일 업데이트**

`docs/brand.md`의 § 타이포그래피 섹션에서 "레시피 숫자 28~36px", "본문 14~16px", "라벨 12~13px" 같은 값 제시를 다음과 같이 교체한다:

```markdown
### 스케일

| Role             | 클래스         | 값    | 용도 |
|------------------|---------------|-------|------|
| Meta             | `text-2xs`    | 10px  | 유닛·인디케이터·아주 작은 캡션 |
| Label (narrow)   | `text-xs`     | 12px  | 좁은 라벨·세그먼트 |
| Label / Body     | `text-sm`     | 14px  | 표준 라벨·본문·버튼 내부 |
| Body (emphasis)  | `text-md`     | 16px  | 강조 본문·다이얼로그 타이틀 보조 |
| Title            | `text-lg`     | 20px  | 섹션 헤더 |
| Metric (small)   | `text-xl`     | 22px  | 시점·다음 푸어 프리뷰 |
| Metric (medium)  | `text-2xl`    | 24px  | 경과 타이머·Wall 타이틀 |
| Hero (complete)  | `text-hero-sm`| 72px  | Complete 화면 총 시간 |
| Hero (timer)     | `text-hero-lg`| 96px  | Brewing 화면 저울 목표 |

- `tabular-nums` 필수 (값 변경 시 레이아웃 흔들림 방지)
- 글꼴: Pretendard Variable → Inter → system sans
```

- [ ] **Step 2: § 그림자 방침 업데이트**

기존 "그림자: 아주 옅게, 혹은 쓰지 않음" 문구를 다음으로 교체:

```markdown
### 그림자

일반 UI 요소(버튼, 카드, 입력, 세그먼트)는 그림자를 사용하지 않는다. 경계는 배경 톤 차이(`bg-surface-inset` 등)로 낸다.

부상 레이어(popover, dialog)에 한해 매우 옅은 그림자를 허용하며, 이 경우 `shadow-popover` / `shadow-dialog` semantic 토큰만 사용한다.
```

- [ ] **Step 3: 검증**

Run:
```bash
bun run typecheck && bun run test:run && bun run build
```
Expected: 모두 성공(문서 변경은 빌드에 영향 없지만 관례상 실행).

- [ ] **Step 4: 커밋**

```bash
git add docs/brand.md
git commit -m "docs(brand): align typography scale and shadow policy with implementation"
```

---

## Task 11: 최종 검증

**Files:** 없음(명령만 실행)

모든 Task가 완료된 후 전체 파이프라인을 한 번 더 돌려 회귀가 없는지 확인한다.

- [ ] **Step 1: 전체 파이프라인 실행**

Run:
```bash
bun run lint && bun run typecheck && bun run test:run && bun run build
```
Expected: 모두 성공, lint 위반 0.

- [ ] **Step 2: dev 서버로 네 화면 최종 확인**

Run:
```bash
bun run dev
```

확인 항목:
1. **Wall 화면**: 드리퍼 선택 상호작용, 타이틀(`text-2xl`) 크기 적절
2. **Recipe 화면**: 모든 입력(`Slider`, `Segmented`) 정상 작동, 권장 라인(`text-2xs`)과 푸어 스케줄 미리보기 정상
3. **Brewing 화면**: 타이머(`text-hero-lg` 96px), 프로그레스 레일(2px), `건너뛰기` 버튼(`text-sm`), `중단` 다이얼로그(스크림 + `shadow-dialog`)
4. **Complete 화면**: 총 시간(`text-hero-sm` 72px), 레시피 요약(`text-md`), feeling 선택, "처음으로"/"공유" 버튼

각 화면에서 기존과 비교해 어색한 레이아웃/크기 깨짐이 없는지 확인.

`Ctrl+C`로 종료.

- [ ] **Step 3: git log로 커밋 체인 확인**

Run:
```bash
git log --oneline -15
```

기대 커밋 순서(최신 위):
```
docs(brand): align typography scale and shadow policy with implementation
docs(design-tokens): document typography/shadow/z/opacity/overlay/size + lint rules
chore(lint): add eslint + stylelint rules enforcing design token usage
refactor(svg): extract stroke widths to local STROKE constants
refactor(layout): snap arbitrary layout values to spacing scale and semantic tokens
refactor(tokens): migrate shadow/z-index/opacity/overlay to semantic tokens
refactor(typography): migrate arbitrary text sizes to semantic tokens
feat(tailwind): expose new tokens as utilities (fontSize/shadow/z/opacity/size/overlay)
feat(tokens): add shadow/z-index/opacity/overlay/size semantics with dark sync
feat(tokens): add typography and shadow primitives
```

- [ ] **Step 4: 최종 커밋 없음, 플랜 종료**

모든 변경은 이전 단계들에 이미 커밋되어 있다. 이 단계는 검증만.

---

## 회귀 리스크 및 대응

| 리스크 | 증상 | 대응 |
|--------|------|------|
| Typography 스냅으로 레이아웃 밀림 | 라벨 한 줄 → 두 줄 넘어감, 히어로 숫자 잘림 | 해당 위치에 `leading-snug`이나 `tracking-wide` 적용. 토큰 값 자체는 건드리지 않는다. |
| Tailwind 기본 `text-xl`이 20→22px로 상향 | 기존 `text-xl` 사용 위치의 텍스트가 살짝 커짐 | Task 4 Step 7에서 해당 위치 확인. 문제 없으면 유지, 문제 있으면 `text-lg`로 스냅. |
| Segmented `shadow-sm` 제거 후 선택 세그먼트 경계가 희미 | 선택/비선택 구분이 어려움 | `bg-surface`와 `bg-surface-inset`의 명도 차이만으로 충분한지 확인. 부족하면 `ring-1 ring-border-strong`로 보강(semantic 사용). |
| `h-[3px]` → 2px로 얇아진 프로그레스 레일이 너무 얇게 보임 | BrewingScreen의 진행 표시가 약함 | `--size-progress-rail`을 2→3px로 조정(semantic 값만 변경, 코드는 `h-progress-rail`로 그대로). |
| Lint 규칙이 너무 좁아 정당한 사용까지 차단 | `bun run lint`에서 의외의 위반 | 규칙 정규식을 필요한 범위로 좁힌다(예: 특정 유틸만 허용). 규칙 상향(error → warn)은 최후 수단. |
| SVG `style={{ opacity: "var(--opacity-muted)" }}`가 JSDOM 테스트에서 다르게 렌더링 | PourVerticalPreview 관련 테스트 실패 | `opacity="var(...)"` 대신 `opacity={0.88 as number}`를 유지하고 해당 라인에 `// eslint-disable-next-line`로 국지 예외 처리. 단, 이 예외는 `docs/design-tokens.md`의 "SVG 내부 속성 예외"에 명시해야 한다. |

---

## Self-Review 체크포인트

이 플랜 실행 중 각 Task 종료 시 다음을 확인:

1. **커밋 메시지가 변경 범위를 정확히 표현하는가?** `feat(tokens):` / `refactor(typography):` / `docs(brand):` 등 프리픽스 사용.
2. **시각 회귀가 있는가?** Task 4, 5, 6, 7 종료 시 dev 서버로 네 화면 모두 확인.
3. **lint 통과인가?** Task 8 이후 각 Task 종료 시 `bun run lint`도 포함해 검증.
4. **unused token이 있는가?** Task 11 Step 1 후, `grep -r "shadow-popover" src/`처럼 각 새 semantic이 실제로 사용되는지 샘플 확인. 사용처 0인 토큰은 리뷰 대상.
