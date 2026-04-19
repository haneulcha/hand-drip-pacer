# Brewing Flow Phase 3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wall 스크린을 도입해 앱의 정식 진입점으로 삼고, Brewing 완료·중단 후 Wall로 돌아가는 리추얼 루프를 연결.

**Architecture:** `src/features/wall/WallScreen.tsx`는 상단 브랜드 마크 + 중앙 breathing + 하단 shelf 2-드리퍼 레이아웃. `AppRoot`의 `loadInitialState`가 URL 쿼리 있으면 recipe 바로 진입, 없으면 wall. `DEFAULT_STATE.screen`을 `'wall'`로 변경. `handleExit`는 wall로 복귀, wall의 `onPickDripper`는 `{ dripper, screen: 'recipe' }` 패치. Wall → Recipe 전이는 간단한 `slide-up` Tailwind 애니메이션 (320ms / ease-out — 기존 motion 토큰 재사용).

**Tech Stack:** React 19, TS strict, Tailwind 3 (새 `wall` 시맨틱 토큰 + `slide-up` 키프레임 추가), Vitest 2 + @testing-library/react. 새 외부 의존성 없음.

**Spec:** `docs/superpowers/specs/2026-04-19-brewing-flow-design.md` Screen Specs § Wall + Architecture § URL sync.
**Handoff reference:** `docs/design_handoff/README.md` § 1. Wall, `docs/design_handoff/reference/wall-flow.jsx` `WallScreen` (line 137~).
**Prior state:** HEAD `fda53de`. Phase 0+1+2 완료 — Recipe 스크린 + Brewing 타이머 + screen 상태 머신. 99 tests green.

---

## Scope Notes

### Phase 3 대상 (Included)

- `WallScreen` 컴포넌트 — 브랜드 마크 `뜸` + 부제 `오늘 한 잔` + 하단 2-드리퍼 shelf + 희미한 힌트 `도구를 집어듭니다.`
- `AppRoot` 초기 진입 로직 변경: URL 쿼리 → recipe, 없으면 wall. `DEFAULT_STATE.screen` → `'wall'`.
- `handleExit` 목적지 wall로 교체 (Phase 2의 `recipe` 복귀 경로 수정).
- `handlePickDripper` 추가: dripper 갱신 + screen recipe 전이.
- Wall → Recipe 간단 `slide-up` 애니메이션 (Tailwind 커스텀 keyframe + animation 등록).
- 새 시맨틱 토큰 `--color-wall` 매핑 (이미 있는 `--neutral-100`에 alias).

### Phase 3 **비포함** (Deferred)

- **View Transitions API** — Wall ↔ Recipe morph 애니메이션 (스펙의 Non-Goals, Phase 5).
- **`레시피 먼저 보기 ›` escape link** — 스펙 § Wall에서 `숨김` 결정. 히스토리 화면이 없으므로 링크 목적지도 없음.
- **Complete 스크린** — 완료 후 여전히 Brewing 내부 `완료` 상태를 잠깐 거쳐 `처음으로` 탭 시 Wall로. Phase 4에서 Complete 스크린이 이 경로를 가로챔.
- **Share / PNG 카드** — Phase 5.
- **Dark mode 값 확정** — Wall 배경의 dark 값은 `--neutral-100` dark 매핑을 그대로 사용 (상속) — 별도 디자인 결정 없이 스켈레톤 유지.

### 스펙 해석

- 핸드오프의 `필기체 오늘 한 잔 (16pt, soft)` / `필기체 도구를 집어듭니다. (very faint)` — 브랜드 2차 원칙에 따라 **필기체는 프로덕션에 넣지 않고** `italic` + `text-text-secondary` / `text-text-muted`로 대체.
- 핸드오프의 `벽 banding` 장식 — Phase 3에선 스킵 (단색 배경). 필요 시 Phase 5 visual polish에서 노이즈 레이어나 subtle bg pattern으로 재검토.
- 핸드오프의 morph 전이는 "구현 난이도 높으면 slide-up으로 대체 가능" 명시됨 — slide-up으로 구현.

---

## File Structure

### 신규 파일

| 경로 | 책임 |
|---|---|
| `src/features/wall/WallScreen.tsx` | 벽 + 브랜드 마크 + shelf 레이아웃, `onPickDripper(id)` 콜백 노출 |
| `src/features/wall/WallScreen.test.tsx` | 브랜드 마크·부제 렌더, 2 드리퍼 라벨, 탭 콜백 검증 |

### 수정

| 경로 | 변경 |
|---|---|
| `src/ui/tokens/semantic.css` | `:root` + `[data-theme='dark']`에 `--color-wall: var(--neutral-100)` 추가 (dark는 동일하게 상속 — 스켈레톤) |
| `tailwind.config.ts` | `colors.wall: 'var(--color-wall)'` + `keyframes['slide-up']` + `animation['slide-up']` 추가 |
| `src/features/app/state.ts` | `DEFAULT_STATE.screen`을 `'wall'`로 변경 |
| `src/features/app/state.test.ts` | "DEFAULT_STATE has screen = 'recipe'" 테스트 → `'wall'`로 수정 |
| `src/features/app/AppRoot.tsx` | `loadInitialState`에 URL 감지 시 `screen: 'recipe'` 강제, wall 브랜치 추가, `handleExit` → `'wall'`, `handlePickDripper` 추가 |
| `src/features/recipe/RecipeScreen.tsx` | root container에 `animate-slide-up` 클래스 추가 (재진입마다 slide-up) |

### 변경 없음

- `src/domain/**` — 불변
- `src/features/brewing/**` — 불변
- `src/features/share/**` — 불변
- `src/ui/tokens/primitives.css` — 이미 `--neutral-100`이 존재

---

## Conventions (기존과 동일)

- TDD: 도메인·컴포넌트 behavior는 실패 테스트 먼저.
- 커밋 단위: Phase 3 = 단일 커밋 (Task 3.5에서).
- 토큰 단일 출처: Tailwind semantic utility(`bg-wall`, `text-text-primary`). 하드코딩 색 금지.
- 브랜드 카피: `뜸`, `오늘 한 잔`, `V60`, `Kalita Wave`, `도구를 집어듭니다.` — brand.md 준수.
- Path alias: `@/domain/...`, `@/features/...`, `@/ui/...`.

---

# Phase 3 Tasks

## Task 3.1: 시맨틱 토큰 `--color-wall` + Tailwind `wall` 유틸 + `slide-up` 애니메이션

**Files:**
- Modify: `src/ui/tokens/semantic.css`
- Modify: `tailwind.config.ts`

- [ ] **Step 1: `semantic.css`에 `--color-wall` 추가**

File: `/Users/haneul/Projects/bloom-coffee/src/ui/tokens/semantic.css`

`:root` 블록 안 `/* Surface */` 섹션 말미에 추가:

```css
  --color-wall: var(--neutral-100);
```

`[data-theme='dark']` 블록 안 surface 섹션 말미에도 추가 (스켈레톤 — 실제 값은 Dark mode 확정 시 재평가):

```css
  --color-wall: var(--neutral-800);
```

최종 `:root` 섹션 발췌 예:
```css
  /* Surface */
  --color-surface: var(--neutral-0);
  --color-surface-subtle: var(--neutral-50);
  --color-surface-inset: var(--neutral-100);
  --color-border: var(--neutral-200);
  --color-border-strong: var(--neutral-300);
  --color-wall: var(--neutral-100);
```

- [ ] **Step 2: `tailwind.config.ts`에 `wall` 유틸 + `slide-up` 애니메이션 등록**

File: `/Users/haneul/Projects/bloom-coffee/tailwind.config.ts`

`colors` 객체 끝(`timeline` 바로 위 또는 아래) 에 `wall` 엔트리 추가. 그리고 `extend` 아래 `keyframes`와 `animation` 블록 신설.

수정 후 전체 파일:

```ts
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
```

주석: `animation-fill-mode: both`로 initial frame 적용 + end state 고정 — 재진입마다 flicker 없이 자연스럽게 presents.

- [ ] **Step 3: 빌드 검증**

Run: `bun run build`
Expected: PASS. 새 애니메이션 CSS가 output에 포함되는지 확인 (필수 아님, but가능).

---

## Task 3.2: `WallScreen` 컴포넌트 + 테스트

**Files:**
- Create: `src/features/wall/WallScreen.tsx`
- Create: `src/features/wall/WallScreen.test.tsx`

- [ ] **Step 1: 실패 테스트 작성**

```tsx
// src/features/wall/WallScreen.test.tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { WallScreen } from './WallScreen'

describe('WallScreen', () => {
  it('renders brand mark and subtitle', () => {
    render(<WallScreen selectedDripper="v60" onPickDripper={vi.fn()} />)
    expect(screen.getByRole('heading', { level: 1, name: '뜸' })).toBeInTheDocument()
    expect(screen.getByText('오늘 한 잔')).toBeInTheDocument()
  })

  it('renders both dripper options with names', () => {
    render(<WallScreen selectedDripper="v60" onPickDripper={vi.fn()} />)
    expect(screen.getByRole('button', { name: /V60/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Kalita Wave/ })).toBeInTheDocument()
  })

  it('calls onPickDripper with tapped dripper id', () => {
    const onPickDripper = vi.fn()
    render(<WallScreen selectedDripper="v60" onPickDripper={onPickDripper} />)
    fireEvent.click(screen.getByRole('button', { name: /Kalita Wave/ }))
    expect(onPickDripper).toHaveBeenCalledWith('kalita_wave')
  })

  it('marks the selected dripper with aria-pressed', () => {
    render(<WallScreen selectedDripper="kalita_wave" onPickDripper={vi.fn()} />)
    const v60 = screen.getByRole('button', { name: /V60/ })
    const kalita = screen.getByRole('button', { name: /Kalita Wave/ })
    expect(v60).toHaveAttribute('aria-pressed', 'false')
    expect(kalita).toHaveAttribute('aria-pressed', 'true')
  })
})
```

- [ ] **Step 2: 실패 확인**

Run: `bun run test:run src/features/wall/WallScreen.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: 구현**

```tsx
// src/features/wall/WallScreen.tsx
import { dripperList } from '@/domain/drippers'
import type { DripperId } from '@/domain/types'
import { cx } from '@/ui/cx'
import { DripperIcon } from '@/ui/DripperIcon'

type Props = {
  readonly selectedDripper: DripperId
  readonly onPickDripper: (id: DripperId) => void
}

export function WallScreen({ selectedDripper, onPickDripper }: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-wall text-text-primary">
      {/* 브랜드 마크 zone */}
      <header className="flex flex-col items-center gap-2 px-5 pt-16">
        <h1 className="text-5xl font-medium leading-none tracking-tight">뜸</h1>
        <p className="text-base italic text-text-secondary">오늘 한 잔</p>
      </header>

      {/* breathing room */}
      <div className="flex-1" />

      {/* shelf */}
      <section aria-label="드리퍼 선반" className="px-8 pb-16">
        <div className="flex items-end justify-around gap-4 pb-3">
          {dripperList.map((d) => {
            const isSelected = d.id === selectedDripper
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => onPickDripper(d.id)}
                aria-pressed={isSelected}
                aria-label={d.name}
                className="flex flex-col items-center gap-2 rounded-lg p-2 transition-colors hover:bg-surface-inset/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                <DripperIcon type={d.id} size={96} selected={isSelected} />
                <span
                  className={cx(
                    'text-sm',
                    isSelected ? 'font-medium text-text-primary' : 'text-text-secondary',
                  )}
                >
                  {d.name}
                </span>
              </button>
            )
          })}
        </div>
        <div className="h-px bg-border" />
        <p className="mt-4 text-center text-xs italic text-text-muted">
          도구를 집어듭니다.
        </p>
      </section>
    </div>
  )
}
```

주석:
- `bg-wall` 유틸은 Task 3.1에서 등록됨.
- `focus-visible:ring-focus` — 키보드 포커스 링. `--color-focus-ring` 이미 토큰 존재.
- `aria-pressed`는 토글 버튼 패턴 (Phase 1 DripperPopover 수정 시 채택한 동일 방식).
- 상단 padding `pt-16` = 64px (handoff의 ~40pt 기준을 Tailwind spacing에 맞춤).

- [ ] **Step 4: 테스트 통과 확인**

Run: `bun run test:run src/features/wall/WallScreen.test.tsx`
Expected: PASS — 4 tests.

- [ ] **Step 5: 타입체크**

Run: `bun run typecheck`
Expected: PASS.

---

## Task 3.3: `AppState` DEFAULT 변경 + 기존 테스트 수정

**Files:**
- Modify: `src/features/app/state.ts`
- Modify: `src/features/app/state.test.ts`

- [ ] **Step 1: `state.test.ts`의 기존 screen 기본값 테스트 업데이트 (실패 유도 먼저)**

File: `/Users/haneul/Projects/bloom-coffee/src/features/app/state.test.ts`

기존:
```ts
  it('DEFAULT_STATE has screen = "recipe"', () => {
    expect(DEFAULT_STATE.screen).toBe('recipe' satisfies Screen)
  })
```

교체:
```ts
  it('DEFAULT_STATE has screen = "wall" (진입은 Wall부터)', () => {
    expect(DEFAULT_STATE.screen).toBe('wall' satisfies Screen)
  })
```

- [ ] **Step 2: 테스트 실행 — 아직 실패 확인 (DEFAULT_STATE가 여전히 'recipe')**

Run: `bun run test:run src/features/app/state.test.ts`
Expected: FAIL — `expected "recipe" to be "wall"`.

- [ ] **Step 3: `state.ts`의 `DEFAULT_STATE.screen` 변경**

File: `/Users/haneul/Projects/bloom-coffee/src/features/app/state.ts`

기존:
```ts
export const DEFAULT_STATE: AppState = {
  screen: 'recipe',
  coffee: g(20),
  ...
}
```

변경:
```ts
export const DEFAULT_STATE: AppState = {
  screen: 'wall',
  coffee: g(20),
  ...
}
```

(나머지 `coffee`/`dripper`/`method`/`roast`/`taste` 값은 그대로.)

- [ ] **Step 4: state 테스트 전체 통과**

Run: `bun run test:run src/features/app/state.test.ts`
Expected: PASS — 4 tests.

주석: `mergeState preserves screen across patches` 테스트는 'brewing'으로 테스트 중이라 DEFAULT 변경과 무관하게 계속 pass.

---

## Task 3.4: `AppRoot` 통합 — initial entry + wall branch + handleExit + handlePickDripper

**Files:**
- Modify: `src/features/app/AppRoot.tsx`

- [ ] **Step 1: `AppRoot.tsx` 전체 교체**

File: `/Users/haneul/Projects/bloom-coffee/src/features/app/AppRoot.tsx`

현재 AppRoot (Phase 2 state):
- `loadInitialState`에서 URL 있을 때 `mergeState(DEFAULT_STATE, fromUrl)`만 함 (screen은 DEFAULT의 'recipe' 유지).
- `screen === 'brewing' && session`, `screen === 'recipe' || !session` 두 분기.
- `handleExit`가 `patch({ screen: 'recipe' })`.

변경:
- `loadInitialState`에서 URL 있을 때 `screen: 'recipe'` 명시 패치 (DEFAULT가 'wall'이라 override 필요).
- `screen === 'wall'` 분기 추가.
- `handleExit`를 `patch({ screen: 'wall' })`로 변경.
- `handlePickDripper` 신설.
- `WallScreen` import.

수정 후 전체 `AppRoot.tsx`:

```tsx
import { useEffect, useMemo, useState } from 'react'
import { brewMethods } from '@/domain/methods'
import type {
  BrewMethodId,
  DripperId,
  RecipeInput,
  RoastLevel,
  TasteProfile,
} from '@/domain/types'
import type { BrewSession } from '@/domain/session'
import { g } from '@/domain/units'
import { BrewingScreen } from '@/features/brewing/BrewingScreen'
import { RecipeScreen } from '@/features/recipe/RecipeScreen'
import { WallScreen } from '@/features/wall/WallScreen'
import { loadParams, saveParams } from '@/features/share/storage'
import { decodeState, encodeState } from '@/features/share/urlCodec'
import { DEFAULT_STATE, mergeState, type AppState } from './state'

const loadInitialState = (): AppState => {
  const fromUrl = decodeState(new URLSearchParams(window.location.search))
  const hasUrl = Object.keys(fromUrl).length > 0
  if (hasUrl) return mergeState(DEFAULT_STATE, { ...fromUrl, screen: 'recipe' })
  const stored = loadParams()
  if (stored) return mergeState(DEFAULT_STATE, decodeState(stored))
  return DEFAULT_STATE
}

export function AppRoot() {
  const [state, setState] = useState<AppState>(loadInitialState)
  const [session, setSession] = useState<BrewSession | null>(null)

  useEffect(() => {
    const params = encodeState(state)
    window.history.replaceState(null, '', `${window.location.pathname}?${params}`)
    saveParams(params)
  }, [state])

  const patch = (p: Partial<AppState>): void => setState((prev) => mergeState(prev, p))

  const handleDripperChange = (dripper: DripperId): void => patch({ dripper })
  const handleMethodChange = (method: BrewMethodId): void => patch({ method })
  const handleRoastChange = (roast: RoastLevel): void => patch({ roast })
  const handleTasteChange = (taste: TasteProfile): void => patch({ taste })
  const handleCoffeeChange = (coffee: number): void => patch({ coffee: g(coffee) })

  const recipe = useMemo(() => {
    const input: RecipeInput = {
      method: state.method,
      dripper: state.dripper,
      coffee: state.coffee,
      roast: state.roast,
      taste: state.taste,
    }
    return brewMethods[state.method].compute(input)
  }, [state.method, state.dripper, state.coffee, state.roast, state.taste])

  const handleStart = (): void => {
    setSession({ recipe, startedAt: Date.now() })
    patch({ screen: 'brewing' })
  }

  const handleExit = (): void => {
    setSession(null)
    patch({ screen: 'wall' })
  }

  const handlePickDripper = (dripper: DripperId): void => {
    patch({ dripper, screen: 'recipe' })
  }

  if (state.screen === 'wall') {
    return <WallScreen selectedDripper={state.dripper} onPickDripper={handlePickDripper} />
  }

  if (state.screen === 'brewing' && session) {
    return <BrewingScreen session={session} onExit={handleExit} />
  }

  return (
    <RecipeScreen
      coffee={state.coffee}
      dripper={state.dripper}
      method={state.method}
      roast={state.roast}
      taste={state.taste}
      recipe={recipe}
      onCoffeeChange={handleCoffeeChange}
      onDripperChange={handleDripperChange}
      onMethodChange={handleMethodChange}
      onRoastChange={handleRoastChange}
      onTasteChange={handleTasteChange}
      onStart={handleStart}
    />
  )
}
```

변경점 요약:
1. `WallScreen` import 추가.
2. `loadInitialState`의 URL 분기에 `screen: 'recipe'` 명시.
3. `handleExit`: `'recipe'` → `'wall'`.
4. `handlePickDripper` 신설.
5. `screen === 'wall'` 분기 맨 위에 추가.
6. Recipe 분기 조건에서 `!session` 조건 제거 (wall이 fallback이 되므로 brewing 중이 아니면 wall/recipe 중 하나로 명시적으로 분기).

- [ ] **Step 2: 타입체크**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 3: 전체 테스트**

Run: `bun run test:run`
Expected: PASS. 예상 테스트 수: 99 + 4 (WallScreen) = **103**. state 테스트는 업데이트되었을 뿐 추가 아님.

주의: `loadInitialState`/`handleExit`/`handlePickDripper` 단위 테스트는 추가하지 않음 (AppRoot는 현재 통합 컴포넌트로, 내부 로직은 WallScreen + state + 수동 QA로 간접 검증). Phase 5 이후 E2E 추가 시 흐름 커버.

---

## Task 3.5: `RecipeScreen`에 slide-up 애니메이션 적용 + 최종 wrap-up

**Files:**
- Modify: `src/features/recipe/RecipeScreen.tsx`

- [ ] **Step 1: `RecipeScreen` root container에 `animate-slide-up` 추가**

File: `/Users/haneul/Projects/bloom-coffee/src/features/recipe/RecipeScreen.tsx`

기존 root `<div>` className (Phase 1에서 설정한 값):
```tsx
<div className="relative mx-auto flex min-h-screen max-w-lg flex-col bg-surface text-text-primary">
```

변경:
```tsx
<div className="relative mx-auto flex min-h-screen max-w-lg flex-col bg-surface text-text-primary animate-slide-up">
```

주석: URL 쿼리로 즉시 recipe 진입 시에도 한 번 slide-up 재생됨 (subtle 320ms). 첫 인상에서도 부드러운 연출로 허용.

- [ ] **Step 2: 타입체크**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 3: 전체 테스트**

Run: `bun run test:run`
Expected: PASS — 103 tests.

- [ ] **Step 4: 빌드**

Run: `bun run build`
Expected: PASS. 빌드 CSS에 `@keyframes slide-up`이 포함됐는지 확인 (grep):

```bash
grep -c "keyframes slide-up\|@keyframes slide-up" dist/assets/*.css
```

Expected: at least 1 매치.

- [ ] **Step 5: Dev 서버 + Playwright 시각 QA**

Run (background): `bun run dev`

Playwright MCP로 확인할 플로우 (데스크톱 1200×900 + 모바일 390×844 각각):

**최초 진입:**
- [ ] URL 파라미터 없이 접속 → Wall 스크린 (벽 배경, `뜸` 마크, V60/Kalita Wave shelf)
- [ ] V60 탭 → Recipe로 slide-up (translateY 12px → 0, opacity 0 → 1, 320ms)
- [ ] Recipe에서 `시작` → Brewing 전이 (Phase 2 동작 그대로)
- [ ] Brewing 중단 → Stop dialog → 처음으로 → Wall로 복귀 ✨ (Phase 2 땐 Recipe로 복귀했음, 지금은 Wall)

**URL 공유 링크 시나리오:**
- [ ] 쿼리 있는 URL (예: `?c=20&d=v60&m=kasuya_4_6&r=medium&sw=balanced&st=medium`)로 접속 → Recipe 바로 진입 (Wall 건너뜀)
- [ ] Recipe → Brewing → 중단/완료 후 → Wall 복귀 (한 번 Wall 경험)

**드리퍼 선택 재방문 시나리오:**
- [ ] Wall에서 Kalita Wave 탭 → Recipe (method가 kalita_pulse로 자동 스위치, slide-up 재생)
- [ ] 뒤로가기 없이 중단 → Wall → V60 탭 → Recipe (method kasuya_4_6로 복귀)

**접근성:**
- [ ] WallScreen 탭 순서: V60 → Kalita Wave (또는 DOM 순서)
- [ ] 선택된 드리퍼가 `aria-pressed="true"`
- [ ] 키보드 Tab + Enter로 드리퍼 선택 가능

- [ ] **Step 6: Dev 서버 종료**

- [ ] **Step 7: 커밋**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat: Wall 스크린 + 진입 플로우 (Phase 3)

- features/wall/WallScreen.tsx: 브랜드 마크 뜸 + 부제 오늘 한 잔 +
  하단 shelf 2-드리퍼 + 힌트. DripperIcon 재사용, aria-pressed
  토글 패턴.
- AppRoot: 초기 진입 로직 — URL 쿼리 → recipe, 없으면 wall.
  DEFAULT_STATE.screen을 'wall'로 변경. handleExit 목적지를
  recipe → wall로 교체. handlePickDripper 신설 (dripper +
  screen=recipe 패치).
- RecipeScreen: animate-slide-up 애니메이션 (320ms ease-out,
  기존 motion 토큰 재사용). 재진입마다 재생.
- tokens: --color-wall 시맨틱 토큰 추가 (--neutral-100에 alias).
  tailwind.config에 bg-wall 유틸 + slide-up keyframe/animation 등록.
- state.test.ts: DEFAULT_STATE.screen 기본값 테스트 업데이트.
- Phase 3 범위: 완료 후 destination은 여전히 wall (Phase 4에서
  Complete 스크린이 이 경로를 가로챔).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 8: 완료 확인**

Run: `git log --oneline -5`
Expected: 최상단이 `feat: Wall 스크린 + 진입 플로우 (Phase 3)`.

---

## Post-plan notes (Phase 4 진입 전)

- `TODO.md` 갱신 (Phase 3 완료 반영).
- Phase 4 플랜: `CompleteScreen` + 감정 3-way + `handleExit`를 Brewing 완료 시 Complete 경유로 분기 (중단 시는 여전히 wall).

---

## 자체 검증 체크

- **스펙 커버리지**:
  - Wall 레이아웃 (핸드오프대로) → Task 3.2 ✓
  - `레시피 먼저 보기 ›` 숨김 (스펙) → WallScreen에 해당 링크 없음 ✓
  - 드리퍼 탭 → dripper + screen=recipe 패치 (기존 methodsForDripper 자동 스위치) → Task 3.4 handlePickDripper ✓
  - 초기 진입: URL 있으면 recipe, 없으면 wall → Task 3.4 loadInitialState ✓
  - slide-up 전이 → Task 3.1 + Task 3.5 ✓
  - `--color-wall` 토큰 → Task 3.1 ✓
  - handleExit 목적지 wall로 교체 → Task 3.4 ✓
- **No placeholders**: 모든 step에 실제 코드·명령·기대 결과 ✓.
- **Type consistency**:
  - `DripperId` — `WallScreen.onPickDripper` / `AppRoot.handlePickDripper` 시그니처 일치 ✓
  - `selectedDripper: DripperId` prop — AppState.dripper와 동일 타입 ✓
  - `Screen` union에 `'wall'`은 이미 존재 (Phase 0에서 포함). 추가 수정 불요.
- **DRY**: `DripperIcon`, `dripperList` 재사용. 새 드리퍼 데이터 도입 없음.
