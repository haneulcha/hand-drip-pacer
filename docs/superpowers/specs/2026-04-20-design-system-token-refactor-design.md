# Design System Token Refactor — Design

작성일: 2026-04-20

## 배경

현재 앱은 primitives → semantic → Tailwind 체계가 설계되어 있으나, 실제 코드에는 다음과 같은 애매함이 누적되어 "단일 디자인 시스템 위의 UI"라는 목표에서 벗어나 있다.

- **Typography 토큰 전무**: 폰트 크기 8종(9/10/11/13/22/26/72/96px)이 `text-[Npx]` arbitrary value로 분산. `brand.md`의 규정 스케일(본문 14~16, 라벨 12~13, 숫자 28~36)과도 괴리.
- **Shadow / Z-index 토큰 부재**: 문서는 "shadow 지양"이지만 실제 `shadow-sm/lg/xl` 3종 사용. Z-index도 `z-20/30` 하드코딩.
- **Stroke / Opacity 토큰 부재**: SVG stroke 0.8~2.2px, opacity 0.88/0.6 등 임의값.
- **Primitive 직접 참조 1건**: `StopConfirmDialog.tsx:13`의 `bg-[rgba(42,36,30,0.45)]` — `--neutral-900`을 semantic을 거치지 않고 변환.
- **Arbitrary layout value**: `top-[72px]`, `min-w-[180px]`, `h-[3px]`, `w-[calc(100%-56px)]`, `grid-cols-[44px_1fr]`.
- **Dark 토큰은 뼈대만**: 활성화 메커니즘 없음.
- **재발 방지 장치 없음**: 사람 리뷰에만 의존.

## Goals

- 모든 컴포넌트 스타일 값이 primitives → semantic → Tailwind 단일 출처를 통해서만 표현되도록 토큰 레이어를 완성한다.
- 현재의 arbitrary value / 하드코딩 / primitive 직접 참조를 전부 치환한다.
- 문서(`docs/design-tokens.md`, `docs/brand.md`)와 실제 구현을 정합하게 맞춘다.
- Lint 룰로 재발을 자동 차단한다.

## Non-Goals

- 공용 컴포넌트(`Button`, `Dialog`, `Popover`, `ScreenLayout`) 추출 — 다음 리팩토링 단계에서 다룬다.
- Dark mode 토글 UI 구현 — v2로 연기. 이번 범위에서는 추가되는 토큰의 dark 매핑 뼈대만 동기화.
- 의도적 시각 리디자인 — 토큰 값 스냅에 따른 미세 변화(예: 9→10, 26→24)는 허용하지만 디자인 의도 변경은 없다.

---

## 1. Typography 토큰

### 1.1 Primitive (`tokens/primitives.css`)

일관된 배수 7개 + 히어로 전용 2개.

```css
--font-size-2xs: 10px;
--font-size-xs:  12px;
--font-size-sm:  14px;
--font-size-md:  16px;   /* DEFAULT */
--font-size-lg:  20px;
--font-size-xl:  22px;
--font-size-2xl: 24px;
--font-size-hero-sm: 72px;   /* Complete 히어로 */
--font-size-hero-lg: 96px;   /* Brewing 타이머 */

--line-height-tight: 1;
--line-height-snug:  1.2;
--line-height-base:  1.5;

--letter-spacing-wide:   0.04em;
--letter-spacing-wider:  0.08em;
--letter-spacing-widest: 0.12em;
```

### 1.2 Tailwind 노출

의미 이름(`text-meta`, `text-label`) 대신 size-based naming으로 단순화. `text-md`(16px)가 본문/버튼의 표준 크기.

| 클래스 | 값 |
|--------|----|
| `text-2xs` | 10 |
| `text-xs`  | 12 |
| `text-sm`  | 14 |
| `text-md`  | 16 |
| `text-lg`  | 20 |
| `text-xl`  | 22 |
| `text-2xl` | 24 |
| `text-hero-sm` | 72 |
| `text-hero-lg` | 96 |

line-height와 letter-spacing은 primitive만 노출: `leading-tight/snug/base`, `tracking-wide/wider/widest`.

### 1.3 스냅 매핑

현재 사용 중인 값을 가장 가까운 보편 크기로 스냅한다.

| 현재 | 스냅 | 클래스 |
|------|------|-------|
| 9px  | 10 | `text-2xs` |
| 10px | 10 | `text-2xs` |
| 11px | 12 | `text-xs` |
| 13px | 14 | `text-sm` |
| 22px | 22 | `text-xl` |
| 26px | 24 | `text-2xl` |
| 72px | 72 | `text-hero-sm` |
| 96px | 96 | `text-hero-lg` |

시각 회귀가 발생할 수 있는 구간: 11→12, 13→14, 26→24. 4단계(Typography 치환) 커밋 전 각 화면 수동 확인.

---

## 2. Shadow 토큰

브랜드 톤(그림자 지양)은 유지하되, 부상(popover/dialog)은 semantic으로 허용한다.

### 2.1 Primitive (`tokens/primitives.css`)

```css
--shadow-soft: 0 1px 2px rgba(0, 0, 0, 0.04), 0 2px 6px rgba(0, 0, 0, 0.04);
--shadow-lift: 0 2px 8px rgba(0, 0, 0, 0.06), 0 6px 16px rgba(0, 0, 0, 0.06);
```

### 2.2 Semantic (`tokens/semantic.css`)

```css
--shadow-popover: var(--shadow-soft);
--shadow-dialog:  var(--shadow-lift);
```

### 2.3 Tailwind / 치환

- `shadow-popover` → `DripperPopover.tsx`
- `shadow-dialog`  → `StopConfirmDialog.tsx`
- Segmented의 `shadow-sm`은 제거(경계는 `bg-surface-inset` 톤 차이로 충분).

---

## 3. Z-index 토큰

### 3.1 Semantic

```css
--z-popover: 20;
--z-dialog:  30;
```

### 3.2 Tailwind / 치환

- `z-popover` → `DripperPopover.tsx` (현 `z-20`)
- `z-dialog`  → `StopConfirmDialog.tsx` (현 `z-30`)

---

## 4. Opacity 토큰

### 4.1 Semantic

```css
--opacity-dim:   0.6;   /* hover 약화 등 */
--opacity-muted: 0.88;  /* PourVerticalPreview bloom=false 등 */
```

### 4.2 Tailwind / 치환

- `opacity-dim`, `opacity-muted`를 `theme.extend.opacity`에 등록.
- `bg-surface-inset/60` 같은 Tailwind opacity modifier는 유지(Tailwind 기본). 0.88 같은 임의값만 semantic으로 치환.
- SVG `opacity={0.88}`은 JSX 속성 대신 `className="opacity-muted"`로 치환한다(SVG 요소도 className 허용). numeric prop을 유지해야 하는 경우에만 `style={{ opacity: "var(--opacity-muted)" }}`로 적용.

---

## 5. Overlay / 색상 정리

### 5.1 Semantic

```css
--color-overlay-scrim: rgba(44, 40, 35, 0.45);  /* neutral-900 @ 45% (light) */
```

### 5.2 Tailwind / 치환

- `bg-overlay-scrim` → `StopConfirmDialog.tsx:13`의 `bg-[rgba(42,36,30,0.45)]` 제거.

Primitive 직접 참조는 이 한 건뿐이며, 치환 후 `rgba(`, `bg-[#`, `bg-[rgba(` 패턴은 lint에서 차단된다.

---

## 6. Arbitrary Layout Value 정리

### 6.1 Tailwind spacing scale 스냅 (d-1)

| 현재 | 스냅 | 위치 |
|------|------|------|
| `top-[72px]` | `top-18` | `DripperPopover.tsx:35` |
| `w-[calc(100%-56px)]` | `mx-7 w-auto` | `StopConfirmDialog.tsx:19` |

### 6.2 Semantic size 확장 (d-2)

```css
--size-popover-min:   11rem;  /* 176px, 180 스냅 */
--size-progress-rail: 2px;
```

Tailwind 매핑:
- `min-w-popover` → `DripperPopover.tsx:35` (현 `min-w-[180px]`)
- `h-progress-rail` → `BrewingScreen.tsx:73` (현 `h-[3px]` — 3→2px 스냅 포함)

### 6.3 예외

`RecipeScreen.tsx:226`의 `grid-cols-[44px_1fr]`은 해당 화면 전용 레이아웃이고 semantic 추출 가치가 낮으므로 유지. 단, 기존 `44px` 리터럴 대신 `grid-cols-[2.75rem_1fr]`로 통일(rem 단위)하여 lint 예외에 `grid-cols-\[[\d.]+rem_`를 허용 패턴으로 둔다.

### 6.4 SVG stroke width

토큰화하지 않는다. 각 SVG 컴포넌트 상단에 로컬 상수를 두어 파일 내 중복을 제거한다.

```ts
// DripperIcon.tsx, PourVerticalPreview.tsx 등
const STROKE = { hairline: 0.8, thin: 1.2, base: 1.6, bold: 2.2 } as const;
```

---

## 7. Dark Mode 동기화

활성화 메커니즘은 v2. 이번 스코프에서는 추가된 토큰의 dark 매핑만 `[data-theme="dark"]` 블록에 동기화한다.

```css
[data-theme="dark"] {
  /* 기존 정의 유지 + 추가 */
  --shadow-popover: 0 1px 2px rgba(0, 0, 0, 0.4), 0 2px 6px rgba(0, 0, 0, 0.4);
  --shadow-dialog:  0 2px 8px rgba(0, 0, 0, 0.5), 0 6px 16px rgba(0, 0, 0, 0.5);
  --color-overlay-scrim: rgba(0, 0, 0, 0.6);
}
```

Typography / z-index / opacity / size-* 는 light-dark 공용이라 분기 불필요.

---

## 8. Lint 재발 방지

### 8.1 ESLint (`*.tsx`, `*.ts`)

`eslint-plugin-tailwindcss` + custom regex rule로 다음 패턴 차단(JSX/TSX의 `className` 문자열 대상):

- 폰트: `\btext-\[.*\]` (arbitrary). Tailwind 기본 `text-base`(16px)도 차단 — 우리 체계에서 16은 `text-md`.
- 색: `\bbg-\[#`, `\bbg-\[rgba?\(`, `\btext-\[#`, `\bborder-\[#`, `\bbg-\[hsl`
- Radius: Tailwind 기본 `\brounded-(xs|sm|md|lg|xl|2xl|full)\b`(semantic `rounded-control*`/`button`/`card`/`surface`/`pill`만 허용), 그리고 `\brounded-\[`
- Shadow: Tailwind 기본 `\bshadow-(sm|md|lg|xl|2xl|inner)\b`, `\bshadow-\[`
- Z-index: Tailwind 기본 `\bz-\d+\b`, `\bz-\[`
- Opacity: `\bopacity-\[`
- Line-height / letter-spacing arbitrary: `\bleading-\[`, `\btracking-\[`
- Layout arbitrary (픽셀 단위만 차단, rem 단위는 허용):
  - 차단: `\b(h|w|min-w|max-w|top|left|right|bottom)-\[\d+(\.\d+)?px\]`
  - 차단: `\bgrid-cols-\[[^\]]*\dpx`
  - 허용: rem 단위 (`grid-cols-[2.75rem_1fr]` 등)

### 8.2 Stylelint (`*.css`)

- `declaration-property-value-disallowed-list`로 `color` / `background-color` / `border-color`에 raw hex / `rgb()` / `rgba()` 금지.
- `src/ui/tokens/primitives.css`는 규칙 예외(raw 값의 유일한 허용 위치).

### 8.3 CI

`package.json`에 `lint` 스크립트 추가. `typecheck` / `test:run` / `build`와 같이 실행되어야 하며, 실패 시 빌드 실패.

---

## 9. 문서 정합

### 9.1 `docs/design-tokens.md`

다음 섹션 추가/수정:

- § Primitive Tokens에 **Typography** 하위 섹션 추가(primitive 스케일, line-height, letter-spacing).
- § Primitive Tokens § Spacing/shadow를 **Shadow** 전용 섹션으로 승격 — 정책을 "부상 레이어(popover/dialog)에 한해 허용, semantic 토큰만 사용"으로 개정.
- § Semantic Tokens에 Shadow / Z-index / Opacity / Overlay / Size 하위 섹션 추가.
- § Rules (enforcement)에 lint 규칙 요약 및 예외 파일 목록 명시.

### 9.2 `docs/brand.md`

- § 타이포그래피 스케일 문구를 실제 토큰 값(10/12/14/16/20/22/24/72/96)과 매핑 표로 개정.
- § 그림자 문구를 "부상 레이어에 한해 아주 옅은 그림자 허용"으로 개정.

---

## 10. Implementation Order

단계별 커밋으로 진행. 각 단계 끝에서 `bun run typecheck && bun run lint && bun run test:run && bun run build` 통과해야 다음 단계.

1. **Primitive 확장** — `tokens/primitives.css`에 font-size / line-height / letter-spacing / shadow primitives 추가. 시각 변경 0.
2. **Semantic 확장** — `tokens/semantic.css`에 shadow-popover/dialog, z-popover/dialog, opacity-dim/muted, color-overlay-scrim, size-popover-min, size-progress-rail 추가. Dark 블록 동기화. 시각 변경 0.
3. **Tailwind config 확장** — `theme.extend`에 fontSize / lineHeight / letterSpacing / boxShadow / zIndex / opacity / minWidth / height / colors.overlay 등록. 시각 변경 0.
4. **Typography 치환** — 전 feature 컴포넌트의 `text-[Npx]` 및 기본 Tailwind `text-*`를 semantic 키로 일괄 치환. 스냅(9→10, 11→12, 13→14, 26→24)으로 인한 미세 시각 변경 발생 예상. 각 화면 수동 확인 후 커밋.
5. **Shadow / z-index / opacity / overlay 치환** — Segmented의 `shadow-sm` 제거, Popover/Dialog에 shadow-popover/dialog / z-popover/dialog 적용, `bg-[rgba(...)]` → `bg-overlay-scrim`, 0.88 opacity → `opacity-muted`.
6. **Arbitrary layout 치환** — `min-w-[180px]` / `h-[3px]` / `top-[72px]` / `w-[calc(...)]` 치환, `grid-cols-[44px_1fr]`는 rem 단위로 통일.
7. **SVG stroke 로컬 상수화** — `DripperIcon.tsx`, `PourVerticalPreview.tsx` 파일당 `STROKE` 상수 추출.
8. **Lint 설정 적용** — ESLint / Stylelint 규칙 추가, 위반 0 상태 확인 후 CI에 편입.
9. **문서 정합** — `docs/design-tokens.md`, `docs/brand.md` 업데이트.

각 단계는 독립적으로 커밋 가능하고 롤백 가능하다. 단계 4에서 시각 회귀 가능성이 가장 높으며, 시각 확인이 통과하기 전에는 다음 단계로 이동하지 않는다.

---

## 11. 검증

- **시각 회귀**: 단계 4~6 각 단계에서 Recipe / Brewing / Complete / Wall 화면을 수동 확인(개발 서버로 브라우저 확인). 타이포 스냅 구간은 치환 전/후 스크린샷을 비교하고 어색한 곳이 없는지 확인.
- **테스트**: 기존 Vitest 테스트 스위트가 그대로 통과해야 한다(도메인 테스트는 영향받지 않음, 컴포넌트 테스트는 className 변경에 의한 실패가 없어야 함).
- **Lint 0**: 마지막 단계 후 `bun run lint`가 위반 0으로 통과.
- **빌드 0 경고**: `bun run build`가 경고 없이 성공.

## 12. 리스크 및 완화

| 리스크 | 완화 |
|--------|------|
| 타이포 스냅으로 인한 레이아웃 밀림(텍스트 길이·높이 증가) | 단계 4를 단일 커밋으로 묶고 각 화면 수동 확인. 회귀 시 개별 컴포넌트의 line-height로 보정. |
| Stylelint/ESLint 초기 설정 부담 | 이미 토큰이 단일 출처로 정리된 뒤 룰을 켜므로 위반 0에서 시작. 룰은 추가만 하고 기존 코드 수정 없음. |
| `grid-cols-[2.75rem_1fr]` 예외가 lint 우회의 빌미가 될 수 있음 | rem 단위만 허용하는 정규식으로 좁게 제한하고, 예외 사용 위치를 문서에 명시. |
| Dark 매핑을 같이 추가하지만 실사용 없음 | 향후 토글 추가 시 재방문하도록 `docs/design-tokens.md`에 "v2에서 확정 예정" 명시. |
