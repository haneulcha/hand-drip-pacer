# Brewing Skip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** BrewingScreen에 "건너뛰기 >" 버튼을 추가해 현재 스텝에서 다음 스텝으로 수동 전진. 마지막 스텝에서 스킵하면 브루잉 완료.

**Architecture:** `BrewingScreen`에 `manualStepFloor` 로컬 상태를 추가해 클럭 파생 인덱스와 합성(`min(pours.length-1, max(clockIdx, manualStepFloor))`). 도메인(`session.ts`)은 변경하지 않고 UI에서 합성. 실제 경과 시간 타이머는 건드리지 않음.

**Tech Stack:** React 19, TypeScript (strict), Vitest 2 + @testing-library/react, Tailwind 3.

**Spec:** `docs/superpowers/specs/2026-04-19-brewing-skip-design.md`

---

## File Structure

- Modify: `src/features/brewing/BrewingScreen.tsx` — 상태/핸들러/버튼/완료 조건 추가.
- Modify: `src/features/brewing/BrewingScreen.test.tsx` — 스킵 동작 테스트 4개 추가.

도메인/세션/타이머 훅 변경 없음.

---

## Task 1: Failing Tests

**Files:**
- Modify: `src/features/brewing/BrewingScreen.test.tsx`

- [ ] **Step 1: Add test for skip advancing active step**

기존 `describe("BrewingScreen", …)` 블록 맨 아래에 테스트 추가:

```tsx
  it("tapping 건너뛰기 advances hero weight to next pour", () => {
    vi.setSystemTime(new Date(1_000_000_000_000));
    const session = makeSession(1_000_000_000_000);
    render(
      <BrewingScreen session={session} onExit={vi.fn()} onComplete={vi.fn()} />,
    );

    // At elapsed=0, bloom pour (cumulativeWater=30)
    expect(screen.getByTestId("hero-weight")).toHaveTextContent("30");

    fireEvent.click(
      screen.getByRole("button", { name: "다음 스텝으로 건너뛰기" }),
    );

    // Advanced to pour 1 (cumulativeWater=150)
    expect(screen.getByTestId("hero-weight")).toHaveTextContent("150");
    // aria-live announces new step
    expect(screen.getByRole("status")).toHaveTextContent("1차: 150그램까지");
  });
```

- [ ] **Step 2: Add test for skip holding ahead of clock**

같은 블록에 추가:

```tsx
  it("keeps skipped step ahead of the clock", () => {
    vi.setSystemTime(new Date(1_000_000_000_000));
    const session = makeSession(1_000_000_000_000);
    render(
      <BrewingScreen session={session} onExit={vi.fn()} onComplete={vi.fn()} />,
    );

    // Skip from bloom (idx 0) → pour 1 at elapsed=0
    fireEvent.click(
      screen.getByRole("button", { name: "다음 스텝으로 건너뛰기" }),
    );
    expect(screen.getByTestId("hero-weight")).toHaveTextContent("150");

    // Advance clock to 10s — still before pour 1's atSec=45, clockIdx=0.
    // manualFloor=1 → activeIdx stays 1.
    act(() => {
      vi.setSystemTime(new Date(1_000_000_010_000));
      vi.advanceTimersByTime(500);
    });
    expect(screen.getByTestId("hero-weight")).toHaveTextContent("150");
  });
```

- [ ] **Step 3: Add test for skip on last step firing onComplete**

```tsx
  it("fires onComplete when skip tapped on last step", () => {
    vi.setSystemTime(new Date(1_000_000_000_000));
    // startedAt 80s ago → elapsed=80, past pour 2's atSec=75 (last pour idx=2)
    const session = makeSession(1_000_000_000_000 - 80_000);
    const onComplete = vi.fn();
    render(
      <BrewingScreen
        session={session}
        onExit={vi.fn()}
        onComplete={onComplete}
      />,
    );

    // Hero on last pour (cumulativeWater=250)
    expect(screen.getByTestId("hero-weight")).toHaveTextContent("250");
    expect(onComplete).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole("button", { name: "다음 스텝으로 건너뛰기" }),
    );
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
```

- [ ] **Step 4: Add test for rapid consecutive skips**

```tsx
  it("advances exactly one step per consecutive skip tap", () => {
    vi.setSystemTime(new Date(1_000_000_000_000));
    const session = makeSession(1_000_000_000_000);
    const onComplete = vi.fn();
    render(
      <BrewingScreen
        session={session}
        onExit={vi.fn()}
        onComplete={onComplete}
      />,
    );

    expect(screen.getByTestId("hero-weight")).toHaveTextContent("30");

    // Skip 1 → pour 1 (150)
    fireEvent.click(
      screen.getByRole("button", { name: "다음 스텝으로 건너뛰기" }),
    );
    expect(screen.getByTestId("hero-weight")).toHaveTextContent("150");

    // Skip 2 → pour 2 (250)
    fireEvent.click(
      screen.getByRole("button", { name: "다음 스텝으로 건너뛰기" }),
    );
    expect(screen.getByTestId("hero-weight")).toHaveTextContent("250");

    // Skip 3 → complete (button still visible on last step, triggers onComplete)
    fireEvent.click(
      screen.getByRole("button", { name: "다음 스텝으로 건너뛰기" }),
    );
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
```

- [ ] **Step 5: Run tests to confirm failures**

Run: `bun run test:run src/features/brewing/BrewingScreen.test.tsx`

Expected: 4 new tests FAIL with `TestingLibraryElementError: Unable to find an accessible element with the role "button" and name "다음 스텝으로 건너뛰기"`. 기존 테스트는 모두 통과.

---

## Task 2: Implement Skip

**Files:**
- Modify: `src/features/brewing/BrewingScreen.tsx`

- [ ] **Step 1: Update imports**

`BrewingScreen.tsx` 상단 import:

```tsx
import { useEffect, useRef, useState } from "react";
```

이미 `useState`, `useEffect`, `useRef` 전부 import 되어 있음. 변경 없이 그대로 둠.

- [ ] **Step 2: Add manualStepFloor state + derivations + handler**

`BrewingScreen.tsx`의 함수 본문을 다음과 같이 교체. 현재 코드 (14–32 라인):

```tsx
export function BrewingScreen({ session, onExit, onComplete }: Props) {
  const elapsed = useElapsed(session);
  const [stopDialogOpen, setStopDialogOpen] = useState(false);
  const completedRef = useRef(false);

  const { recipe } = session;
  const { pours, totalTimeSec } = recipe;
  const activeIdx = activeStepIdx(pours, elapsed);
  const active = pours[activeIdx]!;
  const nextIdx = nextStepIdx(pours, elapsed);
  const next = nextIdx !== null ? pours[nextIdx]! : null;
  const done = elapsed >= totalTimeSec;

  useEffect(() => {
    if (done && !completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  }, [done, onComplete]);
```

교체 후:

```tsx
export function BrewingScreen({ session, onExit, onComplete }: Props) {
  const elapsed = useElapsed(session);
  const [stopDialogOpen, setStopDialogOpen] = useState(false);
  const [manualStepFloor, setManualStepFloor] = useState(0);
  const completedRef = useRef(false);

  const { recipe } = session;
  const { pours, totalTimeSec } = recipe;
  const clockIdx = activeStepIdx(pours, elapsed);
  const activeIdx = Math.min(
    pours.length - 1,
    Math.max(clockIdx, manualStepFloor),
  );
  const active = pours[activeIdx]!;
  const nextLocalIdx = activeIdx + 1 < pours.length ? activeIdx + 1 : null;
  const next = nextLocalIdx !== null ? pours[nextLocalIdx]! : null;
  const done = elapsed >= totalTimeSec || manualStepFloor >= pours.length;

  const handleSkip = () => {
    setManualStepFloor((prev) => Math.max(prev, clockIdx) + 1);
  };

  useEffect(() => {
    if (done && !completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  }, [done, onComplete]);
```

변경 요점:
- `manualStepFloor` 상태 추가.
- `activeIdx`는 `max(clockIdx, manualStepFloor)`를 `pours.length - 1`로 상한.
- `next`는 파생된 `activeIdx` 기준으로 다시 계산 (기존 `nextStepIdx(pours, elapsed)`는 수동 floor를 모름).
- `done` 조건에 `manualStepFloor >= pours.length` 추가 → 마지막 스텝 스킵 시 `onComplete` 트리거.
- `handleSkip`: 함수형 setState로 연타 시에도 `prev + 1` 보장.

- [ ] **Step 3: Remove unused `nextStepIdx` import**

`next`를 `activeIdx + 1`에서 파생하므로 `nextStepIdx`가 더 이상 필요 없음. 파일 상단 2번째 import 줄 변경:

변경 전:
```tsx
import { activeStepIdx, nextStepIdx, type BrewSession } from "@/domain/session";
```

변경 후:
```tsx
import { activeStepIdx, type BrewSession } from "@/domain/session";
```

- [ ] **Step 4: Insert skip button in JSX**

JSX 내 "시점" 블록 바로 다음, "Bottom: next preview" 블록 바로 앞에 스킵 버튼 삽입.

현재 106–114 라인:

```tsx
      {/* Time marker */}
      <div className="mt-4 text-center">
        <div className="text-[10px] text-text-muted">시점</div>
        <div className="text-[22px] text-text-secondary tabular-nums">
          {formatTime(active.atSec)}
        </div>
      </div>

      {/* Bottom: next preview */}
```

교체 후:

```tsx
      {/* Time marker */}
      <div className="mt-4 text-center">
        <div className="text-[10px] text-text-muted">시점</div>
        <div className="text-[22px] text-text-secondary tabular-nums">
          {formatTime(active.atSec)}
        </div>
      </div>

      {/* Skip */}
      {manualStepFloor < pours.length && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={handleSkip}
            aria-label="다음 스텝으로 건너뛰기"
            className="px-5 py-3 text-[13px] text-text-secondary hover:text-text-primary"
          >
            건너뛰기 <span aria-hidden>›</span>
          </button>
        </div>
      )}

      {/* Bottom: next preview */}
```

- [ ] **Step 5: Run tests to confirm all pass**

Run: `bun run test:run src/features/brewing/BrewingScreen.test.tsx`

Expected: 전체 테스트(기존 + 신규 4개) 모두 PASS.

- [ ] **Step 6: Run full test + typecheck**

Run: `bun run test:run && bun run typecheck`

Expected: 전체 스위트 PASS, 타입 에러 없음.

- [ ] **Step 7: Commit**

```bash
git add src/features/brewing/BrewingScreen.tsx src/features/brewing/BrewingScreen.test.tsx
git commit -m "feat: Brewing 스킵 버튼 추가

- 현재 스텝에서 다음 스텝으로 수동 전진
- 마지막 스텝 스킵 시 onComplete 호출
- 경과 타이머는 실시간 유지 (세션 기록 정확도)
- 도메인 변경 없음, manualStepFloor는 BrewingScreen 로컬 상태"
```

---

## Self-Review Notes

- Spec `Behavior`/`UI`/`Accessibility`/`Testing`/`Non-Goals` 각 섹션 → Task 1/2 구성이 모두 커버.
- Placeholder 없음, 모든 코드 블록이 완결.
- 타입 일관성: `pours.length - 1`, `manualStepFloor`, `clockIdx`, `activeIdx` 이름 Task 1/2 전체에서 동일.
- `nextStepIdx` 제거로 dead import 안 남음 (Step 3).
- 버튼 a11y 라벨은 테스트/구현 양쪽에서 동일 문자열 `"다음 스텝으로 건너뛰기"`.
