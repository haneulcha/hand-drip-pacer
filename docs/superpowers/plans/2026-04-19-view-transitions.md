# View Transitions Implementation Plan (A1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Phase 3의 CSS `animate-slide-up` 전이를 네이티브 `document.startViewTransition` API 기반으로 교체. 스크린 간 전이는 cross-fade + 공유 드리퍼 요소 morph로 업그레이드.

**Architecture:** `src/ui/viewTransition.ts` 헬퍼(`withViewTransition(update)`)가 API 존재 여부로 감쌈 — 미지원 브라우저는 update를 직접 실행(graceful degradation). `flushSync`로 React 업데이트 동기 커밋 보장. AppRoot의 screen-전환 setState 호출들을 전부 이 헬퍼로 래핑. Wall의 drippers와 Recipe의 top-bar dripper에 `viewTransitionName: dripper-${id}` inline style 부여 — 같은 드리퍼가 shelf → top-bar 위치로 자동 morph. CSS에서 duration/easing만 브랜드 motion 토큰과 정합되도록 커스터마이즈. 이전 `animate-slide-up` 관련 리소스는 전부 제거.

**Tech Stack:** React 19 (`flushSync`), TypeScript strict, 네이티브 View Transitions API, Tailwind 3. 새 외부 의존성 없음.

**Spec:** `docs/superpowers/specs/2026-04-19-brewing-flow-design.md` § Non-Goals에 "View Transitions API — Wall ↔ Recipe morph 등 정교한 전이. 후속. 지금은 단순 slide-up." → 이번 플랜으로 Non-Goals에서 제거.
**Handoff reference:** `docs/design_handoff/README.md` § 1. Wall의 `Morph transition (optional)` 섹션 ("드리퍼가 선반 위치 → 상단 중앙 앵커로 이동하며 축소 ... 총 ~350ms").
**Prior state:** HEAD `2e5cee7`. Phase 0~4 완료, 리추얼 루프 작동. 123 tests green. `animate-slide-up`이 RecipeScreen root에 적용됨.

---

## Scope Notes

### 본 플랜 대상 (Included)

- `withViewTransition(update)` 헬퍼 + 테스트 (feature detection, flushSync, fallback).
- AppRoot 4개 스크린 전환 (`handleStart`, `handleComplete`, `handleExit`, `handlePickDripper`)을 헬퍼로 래핑.
- 공유 요소 (shared element) morph: 각 드리퍼(V60/Kalita Wave)에 고유 `view-transition-name` 부여 → Wall shelf → Recipe top bar 간 자동 morph.
- `::view-transition-*` pseudo-element CSS에서 기간·easing을 브랜드 motion 토큰(`--motion-duration-base`, `--motion-easing`)에 맞춤.
- 이전 `animate-slide-up` 리소스 일괄 정리 (Tailwind config keyframes/animation, RecipeScreen className, globals.css reduce-motion 블록).
- `prefers-reduced-motion` 처리: 브라우저 기본값이 이미 존중하지만, 명시적 CSS 가드 추가.

### 비포함 (Deferred)

- **핸드오프의 완전한 morph** (wall 40% fade + 종이 canvas 아래에서 올라옴 + 드리퍼 축소 96→72pt 정확 매칭) — 핸드오프 자체가 "구현 난이도 높으면 slide-up 대체 가능" 명시. 이번 플랜은 공유 드리퍼 morph + cross-fade까지.
- **Share PNG 카드 (A2)** — 완전히 별개 작업. 별도 플랜.

### 결정 지점

- **React 19 타입**: `viewTransitionName` CSS 속성이 React 19의 `CSSProperties` 타입에 포함됐는지 확인 필요. 없으면 augmentation 파일 추가.
- **`flushSync` 필요성**: React 18+는 이벤트 핸들러 내 setState를 배치 처리. `startViewTransition`의 콜백은 DOM 커밋이 완료된 후 "after" snapshot을 캡처하므로 `flushSync` 없이는 old snapshot만 보이는 race가 이론적으로 가능. 안전하게 flushSync로 감쌈.
- **폴백**: 미지원 브라우저(Safari iOS 17 이하 등)는 전이 없이 즉시 교체. 기존 `animate-slide-up`을 폴백으로 유지하는 선택도 있으나, 복잡도 대비 이득 적어 전면 제거.

---

## File Structure

### 신규 파일

| 경로                            | 책임                                                                                                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/ui/viewTransition.ts`      | `withViewTransition(update: () => void): void` 헬퍼. API 존재 여부 feature detect, 있으면 `flushSync` 래핑 후 `startViewTransition`에 전달, 없으면 update 직접 실행 |
| `src/ui/viewTransition.test.ts` | API 있음/없음 두 경로 테스트 (stub)                                                                                                                                 |

### 수정

| 경로                                   | 변경                                                                                                                                                |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/features/app/AppRoot.tsx`         | `withViewTransition` import. `handleStart`, `handleComplete`, `handleExit`, `handlePickDripper` 4개 핸들러의 state-변경 코드를 헬퍼로 래핑          |
| `src/features/wall/WallScreen.tsx`     | 각 드리퍼 `<button>`에 `style={{ viewTransitionName: \`dripper-${d.id}\` }}` 부여                                                                   |
| `src/features/recipe/RecipeScreen.tsx` | 상단 바의 `DripperIcon` 래퍼에 `style={{ viewTransitionName: \`dripper-${dripper}\` }}`부여. root`<div>`에서 `animate-slide-up` 클래스 **제거**     |
| `src/ui/globals.css`                   | `::view-transition-group(root)` 기간·easing 토큰 매핑 추가. `prefers-reduced-motion` 블록에서 `.animate-slide-up` 참조 제거(유틸 자체가 없어지므로) |
| `tailwind.config.ts`                   | `keyframes['slide-up']` + `animation['slide-up']` 엔트리 제거 (사용처 없어짐)                                                                       |

### 변경 없음

- `src/domain/**` — 도메인 전체 불변.
- `src/features/brewing/**`, `src/features/complete/**`, `src/features/share/**` — 전이에 참여하지만 `view-transition-name` 설정은 필요 없음 (Wall/Recipe 외의 스크린 간엔 공유 요소 morph 없음, cross-fade만).
- `src/features/app/state.ts` — 불변.

---

## Conventions

- TDD: 헬퍼는 실패 테스트 먼저. UI는 통합 QA(Playwright)로 검증.
- 커밋 단위: 이번 플랜 = 단일 커밋.
- 토큰 단일 출처: `--motion-duration-base` / `--motion-easing` CSS 변수 재사용. 하드코딩 금지.
- Path alias: 기존과 동일.

---

# Tasks

## Task VT.1: `withViewTransition` 헬퍼 + 테스트

**Files:**

- Create: `src/ui/viewTransition.ts`
- Create: `src/ui/viewTransition.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
// src/ui/viewTransition.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { withViewTransition } from "./viewTransition";

type DocWithVT = Document & {
  startViewTransition?: (cb: () => void) => unknown;
};

describe("withViewTransition", () => {
  let originalStartVT: DocWithVT["startViewTransition"];

  beforeEach(() => {
    originalStartVT = (document as DocWithVT).startViewTransition;
  });

  afterEach(() => {
    if (originalStartVT !== undefined) {
      (document as DocWithVT).startViewTransition = originalStartVT;
    } else {
      delete (document as DocWithVT).startViewTransition;
    }
  });

  it("runs update directly when startViewTransition is not available", () => {
    delete (document as DocWithVT).startViewTransition;
    const update = vi.fn();
    withViewTransition(update);
    expect(update).toHaveBeenCalledTimes(1);
  });

  it("delegates to startViewTransition when available", () => {
    const update = vi.fn();
    const fakeStart = vi.fn((cb: () => void) => {
      cb();
      return {};
    });
    (document as DocWithVT).startViewTransition = fakeStart;
    withViewTransition(update);
    expect(fakeStart).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledTimes(1);
  });

  it("does not invoke update twice when both paths would execute", () => {
    // Safety: ensure we don't call update() outside AND inside startViewTransition
    const update = vi.fn();
    (document as DocWithVT).startViewTransition = (cb) => {
      cb();
      return {};
    };
    withViewTransition(update);
    expect(update).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `bun run test:run src/ui/viewTransition.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: 헬퍼 구현**

```ts
// src/ui/viewTransition.ts
import { flushSync } from "react-dom";

type DocWithVT = Document & {
  startViewTransition?: (cb: () => void) => unknown;
};

export const withViewTransition = (update: () => void): void => {
  const doc = document as DocWithVT;
  if (typeof doc.startViewTransition === "function") {
    doc.startViewTransition(() => {
      // flushSync ensures React commits synchronously before the "after"
      // snapshot is captured. Without it, React 18/19 may batch across the
      // callback boundary and produce a stale snapshot.
      flushSync(update);
    });
  } else {
    update();
  }
};
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `bun run test:run src/ui/viewTransition.test.ts`
Expected: PASS — 3 tests.

주석: `flushSync`는 React context 없이 호출해도 안전 (pending updates 없으면 no-op). 테스트의 `update: vi.fn()`는 setState를 포함하지 않으므로 flushSync는 단순 래퍼로 동작.

- [ ] **Step 5: 타입체크**

Run: `bun run typecheck`
Expected: PASS.

---

## Task VT.2: AppRoot — 스크린 전이 핸들러 4개 래핑

**Files:**

- Modify: `src/features/app/AppRoot.tsx`

- [ ] **Step 1: `withViewTransition` import 추가**

File: `/Users/haneul/Projects/bloom-coffee/src/features/app/AppRoot.tsx`

기존 import 섹션에 추가:

```ts
import { withViewTransition } from "@/ui/viewTransition";
```

- [ ] **Step 2: `handleStart` 래핑**

기존:

```ts
const handleStart = (): void => {
  setSession({ recipe, startedAt: Date.now() });
  patch({ screen: "brewing" });
};
```

변경:

```ts
const handleStart = (): void => {
  withViewTransition(() => {
    setSession({ recipe, startedAt: Date.now() });
    setState((prev) => mergeState(prev, { screen: "brewing" }));
  });
};
```

주석: `patch(...)` 대신 `setState((prev) => mergeState(prev, ...))` 직접 사용해 헬퍼 안에서 모든 state 업데이트가 동기 배치되도록.

- [ ] **Step 3: `handleComplete` 래핑 (이미 useCallback)**

기존:

```ts
const handleComplete = useCallback((): void => {
  setSession((prev) => (prev ? { ...prev, completedAt: Date.now() } : null));
  setState((prev) => mergeState(prev, { screen: "complete" }));
}, []);
```

변경:

```ts
const handleComplete = useCallback((): void => {
  withViewTransition(() => {
    setSession((prev) => (prev ? { ...prev, completedAt: Date.now() } : null));
    setState((prev) => mergeState(prev, { screen: "complete" }));
  });
}, []);
```

- [ ] **Step 4: `handleExit` 래핑**

기존:

```ts
const handleExit = (): void => {
  if (session) saveSession(session);
  setSession(null);
  patch({ screen: "wall" });
};
```

변경:

```ts
const handleExit = (): void => {
  if (session) saveSession(session);
  withViewTransition(() => {
    setSession(null);
    setState((prev) => mergeState(prev, { screen: "wall" }));
  });
};
```

주석: `saveSession`은 동기 localStorage write이고 DOM 전이와 무관하므로 헬퍼 바깥에서 먼저 호출. 안전.

- [ ] **Step 5: `handlePickDripper` 래핑**

기존:

```ts
const handlePickDripper = (dripper: DripperId): void => {
  patch({ dripper, screen: "recipe" });
};
```

변경:

```ts
const handlePickDripper = (dripper: DripperId): void => {
  withViewTransition(() => {
    setState((prev) => mergeState(prev, { dripper, screen: "recipe" }));
  });
};
```

- [ ] **Step 6: 타입체크**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 7: 전체 테스트**

Run: `bun run test:run`
Expected: PASS — 이전 123 + viewTransition 3 = **126 tests**. 회귀 없음.

---

## Task VT.3: 공유 요소 — Wall + Recipe 드리퍼에 `view-transition-name`

**Files:**

- Modify: `src/features/wall/WallScreen.tsx`
- Modify: `src/features/recipe/RecipeScreen.tsx`

### Step 1 먼저: React 19 타입 호환성 확인

- [ ] **Step 1: `viewTransitionName` React 타입 확인**

Run:

```bash
grep -r "viewTransitionName" node_modules/@types/react/index.d.ts 2>/dev/null || echo "NOT_FOUND"
```

Expected behaviors:

- 매치 **있음** (React 19): 타입 augmentation 불필요, 바로 Step 2로.
- 매치 **없음**: Step 1b에서 타입 augmentation 추가.

- [ ] **Step 1b (조건부): 타입 augmentation 추가**

위 grep 결과 NOT_FOUND일 경우에만 실행.

Create: `/Users/haneul/Projects/bloom-coffee/src/types/view-transitions.d.ts`

```ts
import "react";

declare module "react" {
  interface CSSProperties {
    viewTransitionName?: string;
  }
}
```

이 파일이 TS project 범위에 포함되는지 `tsconfig.app.json`의 `include`가 `src/**/*.ts` 류라면 자동 인식. 필요 시 `tsconfig.app.json`의 `include`에 `"src/types/**/*.d.ts"` 추가.

Run: `bun run typecheck`
Expected: PASS.

### WallScreen — 각 드리퍼에 고유 name

- [ ] **Step 2: `WallScreen.tsx` shelf 버튼에 style 부여**

File: `/Users/haneul/Projects/bloom-coffee/src/features/wall/WallScreen.tsx`

기존 shelf 드리퍼 버튼 매핑(대략 line 28~46):

```tsx
{
  dripperList.map((d) => {
    const isSelected = d.id === selectedDripper;
    return (
      <button
        key={d.id}
        type="button"
        onClick={() => onPickDripper(d.id)}
        aria-pressed={isSelected}
        aria-label={d.name}
        className="..."
      >
        <DripperIcon type={d.id} size={96} selected={isSelected} />
        <span className="...">{d.name}</span>
      </button>
    );
  });
}
```

`<button>`에 `style={{ viewTransitionName: \`dripper-${d.id}\` }}` 추가:

```tsx
{
  dripperList.map((d) => {
    const isSelected = d.id === selectedDripper;
    return (
      <button
        key={d.id}
        type="button"
        onClick={() => onPickDripper(d.id)}
        aria-pressed={isSelected}
        aria-label={d.name}
        style={{ viewTransitionName: `dripper-${d.id}` }}
        className="..."
      >
        <DripperIcon type={d.id} size={96} selected={isSelected} />
        <span className="...">{d.name}</span>
      </button>
    );
  });
}
```

(기존 className 그대로 유지. 바뀌는 것은 `style` prop 추가뿐.)

- [ ] **Step 3: `RecipeScreen.tsx` top bar 드리퍼 컨테이너에 name 부여**

File: `/Users/haneul/Projects/bloom-coffee/src/features/recipe/RecipeScreen.tsx`

기존 상단 바의 `DripperIcon` (대략 line 73):

```tsx
      <header className="flex items-center gap-3 px-5 pt-12">
        <DripperIcon type={dripper} size={56} selected />
        <div className="flex-1">
```

`DripperIcon`을 `<span>` 래퍼로 감싸고 style 부여:

```tsx
      <header className="flex items-center gap-3 px-5 pt-12">
        <span style={{ viewTransitionName: `dripper-${dripper}` }}>
          <DripperIcon type={dripper} size={56} selected />
        </span>
        <div className="flex-1">
```

주석: `DripperIcon`이 직접 `style` prop을 받는 구조라면 프롭으로 전달 가능하지만 현재 시그니처는 `className?: string`만 받으므로 `<span>` 래퍼가 안전.

### Step 4: `animate-slide-up` 클래스 제거

- [ ] **Step 4: RecipeScreen root에서 `animate-slide-up` 삭제**

File: `/Users/haneul/Projects/bloom-coffee/src/features/recipe/RecipeScreen.tsx`

Phase 3에서 추가된 root `<div>` className (line 70-ish):

```tsx
    <div className="relative mx-auto flex min-h-screen max-w-lg flex-col bg-surface text-text-primary animate-slide-up">
```

`animate-slide-up` 제거:

```tsx
    <div className="relative mx-auto flex min-h-screen max-w-lg flex-col bg-surface text-text-primary">
```

- [ ] **Step 5: 타입체크**

Run: `bun run typecheck`
Expected: PASS.

---

## Task VT.4: CSS 커스터마이즈 + `slide-up` 리소스 정리

**Files:**

- Modify: `src/ui/globals.css`
- Modify: `tailwind.config.ts`

- [ ] **Step 1: `globals.css`에 View Transitions CSS 추가 + 옛 reduce-motion 블록 제거**

File: `/Users/haneul/Projects/bloom-coffee/src/ui/globals.css`

현재 파일 끝부분에 있는 Phase 3 reduce-motion 블록:

```css
@media (prefers-reduced-motion: reduce) {
  .animate-slide-up {
    animation: none;
  }
}
```

교체 (`.animate-slide-up` 유틸이 없어지므로 해당 룰 제거, 새 View Transitions 룰로):

```css
/* View Transitions — brand motion tokens */
::view-transition-group(root) {
  animation-duration: var(--motion-duration-base);
  animation-timing-function: var(--motion-easing);
}

::view-transition-group(*) {
  animation-duration: var(--motion-duration-base);
  animation-timing-function: var(--motion-easing);
}

@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation: none !important;
  }
}
```

주석:

- `::view-transition-group(*)`는 모든 transition group(root + shared elements)에 일관된 duration/easing 적용.
- `prefers-reduced-motion` 가드는 브라우저 기본 동작을 보강 (브라우저 구현에 따라 기본이 미동작 가능).

- [ ] **Step 2: `tailwind.config.ts`에서 `slide-up` keyframe/animation 제거**

File: `/Users/haneul/Projects/bloom-coffee/tailwind.config.ts`

현재 `extend` 내부:

```ts
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(0.75rem)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'slide-up': 'slide-up var(--motion-duration-base) var(--motion-easing) both',
      },
```

두 블록 제거. 결과:

```ts
    extend: {
      transitionDuration: {
        DEFAULT: 'var(--motion-duration-base)',
        long: 'var(--motion-duration-long)',
      },
      transitionTimingFunction: {
        DEFAULT: 'var(--motion-easing)',
      },
      colors: {
        ...
      },
    },
```

(나머지 설정은 그대로.)

- [ ] **Step 3: 빌드 검증 — `animate-slide-up` 없고 view-transition CSS는 있는지**

Run: `bun run build`
Expected: PASS.

Run:

```bash
grep -c "animate-slide-up" dist/assets/*.css
```

Expected: `0` (no longer used — tree-shaken).

Run:

```bash
grep -c "view-transition-group" dist/assets/*.css
```

Expected: `≥1`.

---

## Task VT.5: Wrap-up — 타입체크 + 테스트 + 시각 QA + 커밋

- [ ] **Step 1: 타입체크**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 2: 전체 테스트**

Run: `bun run test:run`
Expected: PASS — 126 tests.

- [ ] **Step 3: 빌드**

Run: `bun run build`
Expected: PASS.

- [ ] **Step 4: Dev 서버 + Playwright 시각 QA**

Run (background): `bun run dev`

체크리스트 (데스크톱 1200×900 + 모바일 390×844, **Chromium 기반 브라우저 권장** — View Transitions 완전 지원):

**기본 cross-fade 전이:**

- [ ] Wall → V60 탭 → Recipe: 화면 전체가 부드러운 cross-fade로 전환 (Phase 3의 translate 위주 slide-up과 다르게 cross-fade 위주)
- [ ] Recipe → 시작 → Brewing: cross-fade
- [ ] Brewing → 완료(자동 전이) → Complete: cross-fade
- [ ] Complete → 처음으로 → Wall: cross-fade

**공유 요소 morph:**

- [ ] Wall에서 V60 탭 → Recipe 진입 시 V60 드리퍼 아이콘이 shelf 위치(화면 하단) → top bar 위치(화면 상단)로 이동·축소하며 morph
- [ ] Kalita Wave 탭 시 동일하게 morph
- [ ] Complete → 처음으로 → Wall: 반대 방향 (top bar → shelf)

**접근성:**

- [ ] 시스템에서 "동작 감소" 설정 on → 모든 전이가 즉시(애니메이션 없이) 발생
- [ ] DevTools Rendering 탭에서 `prefers-reduced-motion: reduce` emulate 가능

**폴백:**

- [ ] Safari 구버전 등 미지원 브라우저(수동 테스트 가능하면): 전이 없이 즉시 교체, 에러 없음. 불가능하면 코드 레벨에서 `delete document.startViewTransition` 후 확인 — optional.

**회귀 방지:**

- [ ] URL 공유 링크 직접 진입 → Recipe 바로 진입 (전이 없음, 정상)
- [ ] Brewing 중 중단 → Stop dialog → 처음으로 → Wall 복귀 + cross-fade
- [ ] 루트 URL 접속 → Wall 기본 진입

- [ ] **Step 5: Dev 서버 종료**

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat: 스크린 전이를 View Transitions API로 교체 (A1)

- ui/viewTransition.ts: withViewTransition(update) 헬퍼. feature
  detect + flushSync로 React 동기 커밋 후 네이티브 전이. 미지원
  브라우저는 update 직접 실행(graceful degradation).
- AppRoot: handleStart / handleComplete / handleExit /
  handlePickDripper 4개 스크린 전환을 헬퍼로 래핑.
- WallScreen: shelf 드리퍼 버튼에 view-transition-name dripper-${id}
  inline style.
- RecipeScreen: top bar DripperIcon 래퍼 span에 동일 name 부여.
  root container의 animate-slide-up className 제거.
- globals.css: ::view-transition-group(*) duration/easing을
  --motion-duration-base / --motion-easing에 매핑.
  prefers-reduced-motion 가드 보강. 옛 .animate-slide-up
  reduce-motion 블록 제거.
- tailwind.config: slide-up keyframe/animation 엔트리 제거
  (사용처 없어짐).
- 효과: Wall↔Recipe 전이 시 선택된 드리퍼가 shelf→top bar 위치로
  자동 morph. 그 외 전이는 cross-fade. 브랜드 320ms motion
  토큰 재사용.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 7: 완료 확인**

Run: `git log --oneline -5`
Expected: 최상단이 `feat: 스크린 전이를 View Transitions API로 교체 (A1)`.

---

## Post-plan notes

- 스펙 보정 (선택): `docs/superpowers/specs/2026-04-19-brewing-flow-design.md` § Non-Goals의 "View Transitions API"를 해당 섹션에서 제거하거나 "구현됨 — `docs/superpowers/plans/2026-04-19-view-transitions.md` 참조" 같은 각주로 대체. 이번 플랜 실행 중에 꼭 해야 할 의무는 아님.
- `TODO.md`의 A1을 완료 표시로 이동.
- 남은 A 섹션: A2 Share PNG 카드 (별도 플랜).

---

## 자체 검증 체크

- **스펙 커버리지**:
  - "Wall ↔ Recipe morph" (스펙 Non-Goals) → Task VT.3 공유 요소 ✓
  - "기존 slide-up 대체" → Task VT.3 Step 4 + Task VT.4 ✓
  - "prefers-reduced-motion 폴백" → Task VT.4 CSS 가드 ✓
  - "브라우저 미지원 폴백" → Task VT.1 helper 분기 ✓
- **No placeholders**: 모든 step에 실제 코드·명령·기대 결과 ✓.
- **Type consistency**:
  - `withViewTransition(update: () => void): void` 시그니처는 VT.1 → VT.2의 4개 호출부 전부 일치 ✓
  - `DripperId` (domain types)은 `dripper-${d.id}` 템플릿에서 모두 일관 ✓
  - CSS `view-transition-name` 값 포맷(`dripper-{id}`)은 Wall과 Recipe 양쪽에서 동일 ✓
- **DRY**: 전이 로직이 헬퍼 한 곳에 집중됨. AppRoot는 래퍼 호출만. CSS 커스터마이즈는 root + shared elements 공통 규칙.
