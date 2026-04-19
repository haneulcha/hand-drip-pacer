# Brewing Flow Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 실시간 타이머가 있는 Brewing 스크린을 추가. Recipe의 `시작` 버튼이 타이머로 전이, 현재 step에 따라 저울 목표/시점/다음을 안내, 완료 또는 사용자 중단 시 Recipe로 복귀.

**Architecture:** `src/domain/session.ts`에 `BrewSession` 타입 + epoch-timestamp 기반 순수 헬퍼(`elapsedSec`, `activeStepIdx`, `nextStepIdx`, `isComplete`) 추가. `BrewingScreen`은 `AppRoot`에서 in-memory `session` state를 consumer로 받고, `useElapsed(session)` hook으로 250ms 주기 tick. Stop 다이얼로그와 완료 상태는 `BrewingScreen` 내부 파생/로컬 state로 관리.

**Tech Stack:** React 19 hooks (`useState`, `useEffect`), TypeScript strict, Vitest 2 + jsdom + @testing-library/react. 새 외부 의존성 없음.

**Spec:** `docs/superpowers/specs/2026-04-19-brewing-flow-design.md` (Brewing 섹션).
**Handoff reference:** `docs/design_handoff/README.md` Screen 3, `docs/design_handoff/reference/wall-flow.jsx` `BrewingScreen` (line 521~), `StopConfirmScreen` (line 592~).
**Prior state:** HEAD `5485c96`. Phase 0+1 완료 — `AppRoot`/screen 상태 머신 + Recipe 스크린. 현재 `시작` 버튼은 `console.log` placeholder (`AppRoot.handleStart`).

---

## Scope Notes

### Phase 2 대상 (Included)

- `BrewSession` 도메인 타입 + pure helpers + Vitest 테스트
- `useElapsed` tick hook (250ms 주기)
- `BrewingScreen` 컴포넌트 (Hero / progress rail / 다음 preview / 경과 / 중단 / 완료 상태)
- `StopConfirmDialog` 컴포넌트 + 테스트
- `AppRoot`의 session state + `handleStart` / `handleExit` wiring
- aria-live announce for step transitions

### Phase 2 **비포함** (Deferred)

- **Wall 스크린** (Phase 3): 중단 다이얼로그의 `처음으로`와 완료 후 종료는 **Recipe 화면으로** 이동. Phase 3에서 Wall로 목적지 교체.
- **Complete 스크린** (Phase 4): elapsed ≥ totalTime 시 자동 screen 전이 대신 **BrewingScreen 내부에서 "완료" 상태**로 표시하고 사용자가 `처음으로` 탭하면 Recipe로. Phase 4에서 `screen = 'complete'`로 교체.
- **localStorage 세션 저장**: Phase 4. 이번 Phase 2에선 in-memory만.
- **Step 변경 haptics**: 선택. 스펙에 언급 있으나 웹에서 제한적. 범위 밖.

### 스펙 수정 요청 (plan 실행 중)

Spec의 "Brewing substate" 예시(`kind: 'running' | 'confirm-stop' | 'done'`)는 구현상 파생값으로 충분 — `BrewingState` union 대신 `stopDialogOpen: boolean` 로컬 state + `done = elapsed >= totalTime` 파생으로 간소화. 실행 시 spec의 해당 구간에 한 줄 보정 추가 (Task 2.6 Step 6).

---

## File Structure

### 신규 파일

| 경로                                              | 책임                                                                                                                           |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `src/domain/session.ts`                           | `BrewSession` / `Feeling` 타입 + pure helpers (`elapsedSec`, `activeStepIdx`, `nextStepIdx`, `isComplete`). React 의존성 없음. |
| `src/domain/session.test.ts`                      | Helpers의 경계 케이스 테스트 (음수 elapsed, bloom step 경계, 완료 경계)                                                        |
| `src/features/brewing/BrewingScreen.tsx`          | 타이머 UI 전체 — top bar(경과/중단), progress rail, Hero(저울 목표), 시점, 다음 미리보기, 완료 오버레이, Stop dialog           |
| `src/features/brewing/BrewingScreen.test.tsx`     | 세 상태(진행중 / 다이얼로그 / 완료) 렌더 검증                                                                                  |
| `src/features/brewing/StopConfirmDialog.tsx`      | 중단 확인 다이얼로그. 계속하기(취소) / 처음으로(확정)                                                                          |
| `src/features/brewing/StopConfirmDialog.test.tsx` | 각 버튼 콜백                                                                                                                   |
| `src/features/brewing/useElapsed.ts`              | 250ms tick hook. `session` 변경 시 리셋, `null`이면 비활성.                                                                    |

### 수정

| 경로                           | 변경                                                                                                                                                                               |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/features/app/AppRoot.tsx` | `session` 상태 추가, `handleStart`/`handleExit` 와이어, `screen === 'brewing'` 분기에 `BrewingScreen` 렌더, `onStart` prop을 `handleStart`로 교체. `console.log` placeholder 제거. |

### 변경 없음 (건드리지 말 것)

- `src/domain/` 기존 파일 (types/methods/drippers/units) — 불변
- `src/features/recipe/**` — Phase 1의 결과물 그대로
- `src/features/share/**` — URL codec 등 변경 없음 (세션은 URL에 sync 안 함)
- `src/features/app/state.ts` — AppState에 session을 추가하지 않음. session은 AppRoot의 별도 `useState`로.

### 저장 위치 결정 (`session`)

`session: BrewSession | null`은 AppState에 포함시키지 **않음**. 이유:

1. AppState는 URL ↔ storage에 sync되는 레시피 파라미터 집합. 세션은 순간적 in-memory 상태.
2. session에 `startedAt` (epoch ms) 저장 시 URL 인코딩 스코프가 커짐.
3. Phase 4에서 localStorage `bloom-coffee:session:v1` 따로 저장 (완료 snapshot만). URL과 분리.

따라서 AppRoot 내부에 `useState<BrewSession | null>(null)`로 별도 관리.

---

## Conventions (Phase 0+1 동일)

- TDD: 도메인·훅·컴포넌트 behavior는 실패 테스트 먼저.
- 커밋 단위: Phase 2 전체 = 단일 커밋 (Task 2.6에서).
- 토큰 단일 출처: Tailwind semantic utility 또는 `var(--color-*)`. 핸드오프의 하드코딩 색 금지.
- Path alias: `@/domain/...`, `@/features/...`, `@/ui/...`.
- Branded types: `Grams`/`Seconds` 생성 경계는 도메인 헬퍼 내부로 국한.
- 브랜드 카피: `경과` / `중단` / `지금` / `저울 목표` / `시점` / `다음` / `계속하기` / `처음으로` / `완료` — brand.md 룰 준수 (이모지·느낌표 금지).

---

# Phase 2 Tasks

## Task 2.1: `src/domain/session.ts` — 세션 타입 + pure helpers

**Files:**

- Create: `src/domain/session.ts`
- Create: `src/domain/session.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
// src/domain/session.test.ts
import { describe, expect, it } from "vitest";
import type { Pour, Recipe } from "./types";
import { c, g, ratio, s } from "./units";
import {
  activeStepIdx,
  elapsedSec,
  isComplete,
  nextStepIdx,
  type BrewSession,
} from "./session";

const mkPour = (
  i: number,
  atSec: number,
  amt: number,
  cum: number,
  bloom = false,
): Pour => ({
  index: i,
  atSec: s(atSec),
  pourAmount: g(amt),
  cumulativeWater: g(cum),
  ...(bloom ? { label: "bloom" as const } : {}),
});

const recipe: Recipe = {
  method: "hoffmann_v60",
  dripper: "v60",
  coffee: g(15),
  totalWater: g(250),
  ratio: ratio(16.67),
  temperature: c(93),
  pours: [
    mkPour(0, 0, 30, 30, true),
    mkPour(1, 45, 120, 150),
    mkPour(2, 75, 100, 250),
  ],
  totalTimeSec: s(210),
  grindHint: "medium-fine",
  notes: [],
};

const session: BrewSession = { recipe, startedAt: 1_000_000 };

describe("elapsedSec", () => {
  it("clamps to 0 when now < startedAt", () => {
    expect(elapsedSec(session, 999_000)).toBe(0);
  });

  it("floors to integer seconds", () => {
    expect(elapsedSec(session, 1_000_500)).toBe(0);
    expect(elapsedSec(session, 1_001_999)).toBe(1);
    expect(elapsedSec(session, 1_045_000)).toBe(45);
  });
});

describe("activeStepIdx", () => {
  it("returns 0 at elapsed=0 (first pour active)", () => {
    expect(activeStepIdx(recipe.pours, 0)).toBe(0);
  });

  it("returns 0 while elapsed < next pour atSec", () => {
    expect(activeStepIdx(recipe.pours, 44)).toBe(0);
  });

  it("advances to 1 when elapsed reaches 2nd pour atSec", () => {
    expect(activeStepIdx(recipe.pours, 45)).toBe(1);
    expect(activeStepIdx(recipe.pours, 74)).toBe(1);
  });

  it("advances to last pour", () => {
    expect(activeStepIdx(recipe.pours, 75)).toBe(2);
    expect(activeStepIdx(recipe.pours, 9999)).toBe(2);
  });

  it("handles negative elapsed as 0", () => {
    expect(activeStepIdx(recipe.pours, -5)).toBe(0);
  });
});

describe("nextStepIdx", () => {
  it("returns next pour index when one exists", () => {
    expect(nextStepIdx(recipe.pours, 0)).toBe(1);
    expect(nextStepIdx(recipe.pours, 45)).toBe(2);
  });

  it("returns null when no next pour", () => {
    expect(nextStepIdx(recipe.pours, 75)).toBeNull();
    expect(nextStepIdx(recipe.pours, 999)).toBeNull();
  });
});

describe("isComplete", () => {
  it("is false while elapsed < totalTimeSec", () => {
    expect(isComplete(session, 1_209_000)).toBe(false); // 209s elapsed
  });

  it("is true at totalTimeSec boundary", () => {
    expect(isComplete(session, 1_210_000)).toBe(true); // 210s elapsed
  });

  it("is true past totalTimeSec", () => {
    expect(isComplete(session, 2_000_000)).toBe(true);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `bun run test:run src/domain/session.test.ts`
Expected: FAIL — "Cannot find module './session'".

- [ ] **Step 3: `session.ts` 구현**

```ts
// src/domain/session.ts
import type { Pour, Recipe } from "./types";

export type Feeling = "calm" | "neutral" | "wave";

export type BrewSession = {
  readonly recipe: Recipe;
  readonly startedAt: number;
  readonly completedAt?: number;
  readonly feeling?: Feeling;
};

export const elapsedSec = (session: BrewSession, now: number): number =>
  Math.max(0, Math.floor((now - session.startedAt) / 1000));

// Largest index i such that pours[i].atSec <= elapsed. Defaults to 0 (first pour).
export const activeStepIdx = (
  pours: readonly Pour[],
  elapsed: number,
): number => {
  if (elapsed < 0 || pours.length === 0) return 0;
  let idx = 0;
  for (let i = 0; i < pours.length; i++) {
    if (pours[i]!.atSec <= elapsed) idx = i;
    else break;
  }
  return idx;
};

// First index j with pours[j].atSec > elapsed, or null if no such pour exists.
export const nextStepIdx = (
  pours: readonly Pour[],
  elapsed: number,
): number | null => {
  for (let i = 0; i < pours.length; i++) {
    if (pours[i]!.atSec > elapsed) return i;
  }
  return null;
};

export const isComplete = (session: BrewSession, now: number): boolean =>
  elapsedSec(session, now) >= session.recipe.totalTimeSec;
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `bun run test:run src/domain/session.test.ts`
Expected: PASS — 12 tests

- [ ] **Step 5: 타입체크**

Run: `bun run typecheck`
Expected: PASS

---

## Task 2.2: `useElapsed` hook — 250ms tick

**Files:**

- Create: `src/features/brewing/useElapsed.ts`

- [ ] **Step 1: 구현 (훅은 테스트에서 jsdom 타이머 이슈 빈번, BrewingScreen 통합 테스트에서 간접 검증)**

```ts
// src/features/brewing/useElapsed.ts
import { useEffect, useState } from "react";
import { elapsedSec, type BrewSession } from "@/domain/session";

const TICK_MS = 250;

export function useElapsed(session: BrewSession | null): number {
  const [elapsed, setElapsed] = useState<number>(() =>
    session ? elapsedSec(session, Date.now()) : 0,
  );

  useEffect(() => {
    if (!session) {
      setElapsed(0);
      return;
    }
    setElapsed(elapsedSec(session, Date.now()));
    const id = window.setInterval(() => {
      setElapsed(elapsedSec(session, Date.now()));
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [session]);

  return elapsed;
}
```

주석: 디스플레이는 `formatTime`에서 초 단위로만 표기되므로 250ms tick이면 충분. rAF는 초 단위 UI에 오버엔지니어링.

- [ ] **Step 2: 타입체크**

Run: `bun run typecheck`
Expected: PASS

---

## Task 2.3: `StopConfirmDialog` 컴포넌트 + 테스트

**Files:**

- Create: `src/features/brewing/StopConfirmDialog.tsx`
- Create: `src/features/brewing/StopConfirmDialog.test.tsx`

- [ ] **Step 1: 실패 테스트 작성**

```tsx
// src/features/brewing/StopConfirmDialog.test.tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StopConfirmDialog } from "./StopConfirmDialog";

describe("StopConfirmDialog", () => {
  it("renders heading and description", () => {
    render(<StopConfirmDialog onCancel={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.getByText("브루잉을 중단할까요?")).toBeInTheDocument();
    expect(screen.getByText("기록은 남지 않습니다.")).toBeInTheDocument();
  });

  it("calls onCancel when 계속하기 button tapped", () => {
    const onCancel = vi.fn();
    render(<StopConfirmDialog onCancel={onCancel} onConfirm={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "계속하기" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onConfirm when 처음으로 button tapped", () => {
    const onConfirm = vi.fn();
    render(<StopConfirmDialog onCancel={vi.fn()} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole("button", { name: "처음으로" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when scrim background tapped", () => {
    const onCancel = vi.fn();
    render(<StopConfirmDialog onCancel={onCancel} onConfirm={vi.fn()} />);
    fireEvent.click(screen.getByLabelText("다이얼로그 닫기"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `bun run test:run src/features/brewing/StopConfirmDialog.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: 구현**

```tsx
// src/features/brewing/StopConfirmDialog.tsx
type Props = {
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
};

export function StopConfirmDialog({ onCancel, onConfirm }: Props) {
  return (
    <div className="fixed inset-0 z-30">
      <button
        type="button"
        aria-label="다이얼로그 닫기"
        onClick={onCancel}
        className="absolute inset-0 bg-[rgba(42,36,30,0.45)]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="stop-dialog-title"
        className="absolute left-1/2 top-1/2 w-[calc(100%-56px)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-surface p-6 shadow-xl"
      >
        <h2 id="stop-dialog-title" className="text-lg font-medium">
          브루잉을 중단할까요?
        </h2>
        <p className="mt-2 text-sm text-text-muted">기록은 남지 않습니다.</p>
        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 flex-1 rounded-xl border border-border text-sm text-text-secondary transition-colors hover:bg-surface-inset"
          >
            계속하기
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-11 flex-1 rounded-xl border-[1.4px] border-text-primary bg-surface-subtle text-sm font-medium transition-colors hover:bg-surface-inset"
          >
            처음으로
          </button>
        </div>
      </div>
    </div>
  );
}
```

주의: scrim 배경은 핸드오프의 `rgba(42,36,30,0.45)`를 Tailwind arbitrary value로 표현 (토큰 miss 허용 영역 — scrim은 semantic token 없음). 향후 `--color-scrim` 토큰 도입 시 교체.

- [ ] **Step 4: 테스트 통과**

Run: `bun run test:run src/features/brewing/StopConfirmDialog.test.tsx`
Expected: PASS — 4 tests.

---

## Task 2.4: `BrewingScreen` 컴포넌트 + 테스트

**Files:**

- Create: `src/features/brewing/BrewingScreen.tsx`
- Create: `src/features/brewing/BrewingScreen.test.tsx`

- [ ] **Step 1: 실패 테스트 작성**

```tsx
// src/features/brewing/BrewingScreen.test.tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Pour, Recipe } from "@/domain/types";
import { c, g, ratio, s } from "@/domain/units";
import type { BrewSession } from "@/domain/session";
import { BrewingScreen } from "./BrewingScreen";

const mkPour = (
  i: number,
  atSec: number,
  amt: number,
  cum: number,
  bloom = false,
): Pour => ({
  index: i,
  atSec: s(atSec),
  pourAmount: g(amt),
  cumulativeWater: g(cum),
  ...(bloom ? { label: "bloom" as const } : {}),
});

const recipe: Recipe = {
  method: "hoffmann_v60",
  dripper: "v60",
  coffee: g(15),
  totalWater: g(250),
  ratio: ratio(16.67),
  temperature: c(93),
  pours: [
    mkPour(0, 0, 30, 30, true),
    mkPour(1, 45, 120, 150),
    mkPour(2, 75, 100, 250),
  ],
  totalTimeSec: s(210),
  grindHint: "medium-fine",
  notes: [],
};

// Session with startedAt anchored at mocked Date.now; we override Date.now inside tests.
const makeSession = (startedAt: number): BrewSession => ({ recipe, startedAt });

describe("BrewingScreen", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows hero weight of active step (bloom at elapsed=0)", () => {
    vi.setSystemTime(new Date(1_000_000_000_000));
    const session = makeSession(1_000_000_000_000);
    render(<BrewingScreen session={session} onExit={vi.fn()} />);
    // bloom pour cumulativeWater = 30
    expect(screen.getByTestId("hero-weight")).toHaveTextContent("30");
    // label for active step in progress rail
    expect(screen.getByText("뜸")).toBeInTheDocument();
  });

  it("shows done state when elapsed >= totalTime", () => {
    vi.setSystemTime(new Date(1_000_000_000_000));
    const session = makeSession(1_000_000_000_000 - 300_000); // 300s elapsed
    render(<BrewingScreen session={session} onExit={vi.fn()} />);
    expect(screen.getByText("완료")).toBeInTheDocument();
    // totalWater shown as final target
    expect(screen.getByTestId("hero-weight")).toHaveTextContent("250");
  });

  it("opens stop dialog when 중단 tapped", () => {
    vi.setSystemTime(new Date(1_000_000_000_000));
    const session = makeSession(1_000_000_000_000);
    render(<BrewingScreen session={session} onExit={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "중단" }));
    expect(screen.getByText("브루잉을 중단할까요?")).toBeInTheDocument();
  });

  it("calls onExit when 처음으로 confirmed in dialog", () => {
    vi.setSystemTime(new Date(1_000_000_000_000));
    const session = makeSession(1_000_000_000_000);
    const onExit = vi.fn();
    render(<BrewingScreen session={session} onExit={onExit} />);
    fireEvent.click(screen.getByRole("button", { name: "중단" }));
    fireEvent.click(screen.getByRole("button", { name: "처음으로" }));
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("shows 처음으로 button when done", () => {
    vi.setSystemTime(new Date(1_000_000_000_000));
    const session = makeSession(1_000_000_000_000 - 300_000);
    const onExit = vi.fn();
    render(<BrewingScreen session={session} onExit={onExit} />);
    fireEvent.click(screen.getByRole("button", { name: "처음으로" }));
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `bun run test:run src/features/brewing/BrewingScreen.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: 구현**

```tsx
// src/features/brewing/BrewingScreen.tsx
import { useEffect, useState } from "react";
import { activeStepIdx, nextStepIdx, type BrewSession } from "@/domain/session";
import { formatTime } from "@/ui/format";
import { cx } from "@/ui/cx";
import { StopConfirmDialog } from "./StopConfirmDialog";
import { useElapsed } from "./useElapsed";

type Props = {
  readonly session: BrewSession;
  readonly onExit: () => void;
};

export function BrewingScreen({ session, onExit }: Props) {
  const elapsed = useElapsed(session);
  const [stopDialogOpen, setStopDialogOpen] = useState(false);

  const { recipe } = session;
  const { pours, totalTimeSec } = recipe;
  const activeIdx = activeStepIdx(pours, elapsed);
  const active = pours[activeIdx]!;
  const nextIdx = nextStepIdx(pours, elapsed);
  const next = nextIdx !== null ? pours[nextIdx]! : null;
  const done = elapsed >= totalTimeSec;

  const heroWeight = done ? recipe.totalWater : active.cumulativeWater;
  const heroHint = done ? null : `+${active.pourAmount}g 붓기`;
  const heroTimeLabel = done ? null : formatTime(active.atSec);

  return (
    <div className="relative mx-auto flex min-h-screen max-w-lg flex-col bg-surface text-text-primary">
      <AriaLiveStep session={session} activeIdx={activeIdx} />

      {/* Top bar */}
      <header className="flex items-start justify-between px-5 pt-14">
        <div>
          <div className="text-[10px] text-text-muted">경과</div>
          <div className="mt-0.5 text-[26px] font-medium tabular-nums">
            {formatTime(elapsed)}
          </div>
        </div>
        {!done && (
          <button
            type="button"
            onClick={() => setStopDialogOpen(true)}
            className="pt-2 text-[11px] text-text-muted hover:text-text-secondary"
          >
            중단
          </button>
        )}
      </header>

      {/* Progress rail */}
      <div className="mt-6 flex items-center gap-1.5 px-5">
        {pours.map((p, i) => (
          <div
            key={p.index}
            className="flex flex-1 flex-col items-center gap-1"
          >
            <div
              className={cx(
                "h-[3px] w-full rounded-full",
                i < activeIdx || done
                  ? "bg-text-primary"
                  : i === activeIdx
                    ? "bg-[var(--color-pour-bloom)]"
                    : "bg-border",
              )}
            />
            <span
              className={cx(
                "text-[9px]",
                i === activeIdx && !done
                  ? "font-semibold text-text-primary"
                  : "text-text-muted",
              )}
            >
              {p.label === "bloom" ? "뜸" : `${i}차`}
            </span>
          </div>
        ))}
      </div>

      {/* Hero */}
      <div className="mt-12 flex flex-col items-center px-5 text-center">
        {done ? (
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-pour-bloom)]">
            완료
          </span>
        ) : (
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-pour-bloom)]">
            지금
          </span>
        )}
        <span className="mt-2 text-[11px] text-text-muted">저울 목표</span>
        <div className="mt-1 flex items-baseline gap-1">
          <span
            data-testid="hero-weight"
            className="text-[96px] font-medium leading-none tabular-nums"
          >
            {heroWeight}
          </span>
          <span className="text-3xl text-text-muted">g</span>
        </div>
        {heroHint && (
          <div className="mt-2 text-base italic text-text-secondary">
            {heroHint}
          </div>
        )}
      </div>

      {/* Time marker */}
      {heroTimeLabel && (
        <div className="mt-4 text-center">
          <div className="text-[10px] text-text-muted">시점</div>
          <div className="text-[22px] text-text-secondary tabular-nums">
            {heroTimeLabel}
          </div>
        </div>
      )}

      {/* Bottom: next preview OR done exit button */}
      <div className="mt-auto px-5 pb-8">
        {done ? (
          <button
            type="button"
            onClick={onExit}
            className="flex h-14 w-full items-center justify-center rounded-xl border-[1.6px] border-text-primary bg-surface-subtle text-base font-medium transition-colors hover:bg-surface-inset"
          >
            처음으로
          </button>
        ) : next ? (
          <>
            <div className="mb-2.5 h-px bg-border" />
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] font-semibold text-text-muted">
                다음
              </span>
              <span className="text-[13px] text-text-secondary tabular-nums">
                {formatTime(next.atSec)}
              </span>
              <div className="flex-1" />
              <span className="text-lg font-medium tabular-nums">
                {next.cumulativeWater}
                <span className="ml-0.5 text-[11px] text-text-muted">g</span>
              </span>
            </div>
          </>
        ) : null}
      </div>

      {stopDialogOpen && (
        <StopConfirmDialog
          onCancel={() => setStopDialogOpen(false)}
          onConfirm={onExit}
        />
      )}
    </div>
  );
}

function AriaLiveStep({
  session,
  activeIdx,
}: {
  readonly session: BrewSession;
  readonly activeIdx: number;
}) {
  const [announced, setAnnounced] = useState<string>("");
  useEffect(() => {
    const pour = session.recipe.pours[activeIdx];
    if (!pour) return;
    const label = pour.label === "bloom" ? "뜸" : `${activeIdx}차`;
    setAnnounced(`${label}: ${pour.cumulativeWater}그램까지`);
  }, [session, activeIdx]);
  return (
    <span className="sr-only" role="status" aria-live="polite">
      {announced}
    </span>
  );
}
```

주의:

- **`done` 상태일 때 중단 버튼 숨김** — 이미 끝났으므로 중단할 것 없음. `처음으로` 버튼이 하단에 노출돼 유일한 종료 경로.
- **`text-[var(--color-pour-bloom)]` Tailwind arbitrary value** — `text-pour-bloom` utility가 없을 수 있어 CSS var 직접 사용. 기존 `PourVerticalPreview`와 동일 패턴.
- **aria-live 구현**: 스펙의 `"{n}차: {cumulativeWater}그램까지"` 포맷. `setAnnounced` useEffect는 activeIdx 변경 시에만 fire.

- [ ] **Step 4: 테스트 통과**

Run: `bun run test:run src/features/brewing/BrewingScreen.test.tsx`
Expected: PASS — 5 tests.

- [ ] **Step 5: 타입체크**

Run: `bun run typecheck`
Expected: PASS

---

## Task 2.5: `AppRoot` wire-up — session + Brewing 분기

**Files:**

- Modify: `src/features/app/AppRoot.tsx`

- [ ] **Step 1: AppRoot 수정 — session state + handleStart/handleExit + brewing 분기**

현재 AppRoot에서 `handleStart`는 `console.log` placeholder. 이를 실제 전이로 교체.

Full revised `AppRoot.tsx`:

```tsx
import { useEffect, useMemo, useState } from "react";
import { brewMethods } from "@/domain/methods";
import type {
  BrewMethodId,
  DripperId,
  RecipeInput,
  RoastLevel,
  TasteProfile,
} from "@/domain/types";
import type { BrewSession } from "@/domain/session";
import { g } from "@/domain/units";
import { BrewingScreen } from "@/features/brewing/BrewingScreen";
import { RecipeScreen } from "@/features/recipe/RecipeScreen";
import { loadParams, saveParams } from "@/features/share/storage";
import { decodeState, encodeState } from "@/features/share/urlCodec";
import { DEFAULT_STATE, mergeState, type AppState } from "./state";

const loadInitialState = (): AppState => {
  const fromUrl = decodeState(new URLSearchParams(window.location.search));
  const hasUrl = Object.keys(fromUrl).length > 0;
  if (hasUrl) return mergeState(DEFAULT_STATE, fromUrl);
  const stored = loadParams();
  if (stored) return mergeState(DEFAULT_STATE, decodeState(stored));
  return DEFAULT_STATE;
};

export function AppRoot() {
  const [state, setState] = useState<AppState>(loadInitialState);
  const [session, setSession] = useState<BrewSession | null>(null);

  useEffect(() => {
    const params = encodeState(state);
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}?${params}`,
    );
    saveParams(params);
  }, [state]);

  const patch = (p: Partial<AppState>): void =>
    setState((prev) => mergeState(prev, p));

  const handleDripperChange = (dripper: DripperId): void => patch({ dripper });
  const handleMethodChange = (method: BrewMethodId): void => patch({ method });
  const handleRoastChange = (roast: RoastLevel): void => patch({ roast });
  const handleTasteChange = (taste: TasteProfile): void => patch({ taste });
  const handleCoffeeChange = (coffee: number): void =>
    patch({ coffee: g(coffee) });

  const recipe = useMemo(() => {
    const input: RecipeInput = {
      method: state.method,
      dripper: state.dripper,
      coffee: state.coffee,
      roast: state.roast,
      taste: state.taste,
    };
    return brewMethods[state.method].compute(input);
  }, [state.method, state.dripper, state.coffee, state.roast, state.taste]);

  const handleStart = (): void => {
    setSession({ recipe, startedAt: Date.now() });
    patch({ screen: "brewing" });
  };

  const handleExit = (): void => {
    setSession(null);
    // Phase 2: return to recipe. Phase 3 will change to 'wall'.
    patch({ screen: "recipe" });
  };

  if (state.screen === "brewing" && session) {
    return <BrewingScreen session={session} onExit={handleExit} />;
  }

  if (state.screen === "recipe" || !session) {
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
    );
  }

  return null;
}
```

변경 핵심:

1. `session` 별도 `useState`.
2. `handleStart`: 현재 `recipe`로 세션 생성 + screen 전이.
3. `handleExit`: session null + recipe로 복귀.
4. 분기 순서: brewing(세션 있음) → 그 외에는 recipe.
5. `clearParams` import 제거 (Phase 1에서 reset 제거 후 미사용 — 이 플랜의 cleanup 일환).

- [ ] **Step 2: 타입체크**

Run: `bun run typecheck`
Expected: PASS

- [ ] **Step 3: 전체 테스트**

Run: `bun run test:run`
Expected: PASS. 새로 +21 테스트 (session 12 + StopConfirmDialog 4 + BrewingScreen 5). 이전 77 + 21 = **98 tests**.

기존 Phase 1의 `AppRoot`는 UI 테스트가 없으므로 무관. 회귀 없음.

---

## Task 2.6: Wrap-up — typecheck, test, 시각 QA, spec 보정, 커밋

- [ ] **Step 1: 타입체크**

Run: `bun run typecheck`
Expected: PASS

- [ ] **Step 2: 테스트**

Run: `bun run test:run`
Expected: PASS — 98 tests / 10 files.

- [ ] **Step 3: 빌드**

Run: `bun run build`
Expected: PASS

- [ ] **Step 4: Dev 서버 + Playwright 시각 QA**

Run (background): `bun run dev`

브라우저에서 각 단계 확인 (데스크톱 1200×900 + 모바일 390×844):

**Recipe 화면 → 시작 탭:**

- [ ] `시작` 탭 → BrewingScreen 나타남 (slide 전환 없이 즉시 교체, Phase 3~에서 View Transitions)
- [ ] 경과 `0:00` 표시, 1~2초 내 `0:01`로 갱신 확인
- [ ] Progress rail: bloom step ochre, 나머지 faint
- [ ] Hero: 저울 목표 `30g` (Hoffmann 기본), `+30g 붓기` 힌트
- [ ] 시점 `0:00`
- [ ] 다음 미리보기: `0:45` + `150g`

**중단 플로우:**

- [ ] 우상단 `중단` 탭 → Stop 다이얼로그 표시
- [ ] 배경 scrim 탭 → 다이얼로그만 닫힘, 브루잉 계속
- [ ] `계속하기` 탭 → 다이얼로그 닫힘
- [ ] `처음으로` 탭 → Recipe로 복귀, 타이머 초기화됨 (session null)

**완료 플로우** (시간 단축용으로 start를 과거 시점으로 뒤집는 방식 대신, 짧은 recipe로 빠르게 확인):

- [ ] Recipe에서 coffee=5g로 줄이고 `시작` → 약 3~4분 기다림 (또는 간이 확인용으로 `session.startedAt`을 콘솔에서 `Date.now() - 300_000`로 덮어써서 `done` 확인)
- [ ] `완료` ochre 라벨 + 총 목표 `g` 표시
- [ ] 중단 버튼 사라짐, `처음으로` 버튼만 하단
- [ ] `처음으로` 탭 → Recipe로 복귀

**접근성:**

- [ ] BrewingScreen 마운트 후 스크린리더에서 aria-live 영역이 step 전환 시 "뜸: 30그램까지" 같은 문구를 announce하는지 (브라우저 DevTools Accessibility 탭에서 live region 확인)

- [ ] **Step 5: Dev 서버 종료**

- [ ] **Step 6: Spec 파일 보정**

현재 spec의 "Brewing substate" 예시는 `BrewingState` union을 제시하나 실제 구현은 파생값 + 로컬 `stopDialogOpen: boolean`으로 간소화됨. Spec 파일에 한 줄 보정 추가:

File: `docs/superpowers/specs/2026-04-19-brewing-flow-design.md`

해당 섹션(`### Brewing substate`)의 코드 블록 **바로 아래**에 다음 한 줄 추가:

```
> **구현 주석 (Phase 2)**: `BrewingState` union은 개념 모델 — 실제 구현은 `stopDialogOpen: boolean` 로컬 상태 + `done = elapsed >= totalTimeSec` 파생값으로 간소화. `running`/`done` 상태는 `done` 플래그로, `confirm-stop`는 `stopDialogOpen`으로 표현.
```

- [ ] **Step 7: 커밋**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat: Brewing 스크린 + 실시간 타이머 (Phase 2, D1)

- domain/session.ts: BrewSession 타입 + pure helpers
  (elapsedSec, activeStepIdx, nextStepIdx, isComplete).
  epoch-timestamp 기반, 백그라운드 복구 가능.
- features/brewing/BrewingScreen.tsx: 경과 타이머 + progress
  rail + Hero 저울 목표 + 시점 + 다음 미리보기 + 완료 상태.
  aria-live로 step 전환 announce.
- features/brewing/StopConfirmDialog.tsx: 중단 확인 다이얼로그
  (계속하기 / 처음으로).
- features/brewing/useElapsed.ts: 250ms tick hook.
- AppRoot: session useState + handleStart(시작 → brewing 전이)
  + handleExit(Recipe로 복귀, Phase 3에서 Wall로 교체 예정).
  Phase 1의 console.log placeholder 제거.
- Phase 2 범위 한정: 완료/중단 후 Recipe로 복귀
  (Wall은 Phase 3, Complete는 Phase 4).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 8: Phase 2 완료 확인**

Run: `git log --oneline -5`
Expected: 최상단 커밋이 `feat: Brewing 스크린 + 실시간 타이머 (Phase 2, D1)`.

---

## Post-plan notes (Phase 3 진입 전)

- `TODO.md` 갱신 (Phase 2 완료 반영).
- Phase 3 새 플랜 파일 (`2026-04-19-brewing-flow-phase-3.md`) — Wall 스크린. `handleExit`의 목적지를 `wall`로 변경 + 시작 시 기본 진입 로직 조정.

---

## 자체 검증 체크

- **스펙 커버리지**:
  - `BrewSession` + `Feeling` 타입 (spec Domain Model) → Task 2.1 ✓
  - epoch-timestamp 기반 타이머 resumable → Task 2.1 + 2.2 (useElapsed는 마운트마다 재계산) ✓
  - Progress rail / Hero / 시점 / 다음 / 중단 / Stop dialog → Task 2.4 + 2.3 ✓
  - aria-live step announce → Task 2.4 `AriaLiveStep` ✓
  - `계속하기` / `처음으로` 라벨 (spec의 수정 제안) → Task 2.3 ✓
  - 완료 → Recipe 복귀 (Phase 4에서 Complete로 교체) → Task 2.5 ✓
  - 중단 → Recipe 복귀 (Phase 3에서 Wall로 교체) → Task 2.5 ✓
  - `bloom-coffee:session:v1` localStorage 저장 → Phase 4 (not Phase 2) — 스펙 명시.
- **No placeholders**: 모든 step에 실제 코드/커맨드/기대 결과 ✓.
- **Type consistency**: `BrewSession.startedAt: number`, `elapsed: number`, 모든 도메인 helpers signature 일관 ✓. `Pour.atSec`이 `Seconds` branded 이지만 활용 시 numeric compare로 충분(Seconds is number subtype).
- **테스트 중복 회피**: session pure helpers만 단위 테스트, BrewingScreen은 integration-level (`useFakeTimers` + `setSystemTime`).
