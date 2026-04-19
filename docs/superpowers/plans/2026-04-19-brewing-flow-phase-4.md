# Brewing Flow Phase 4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Brewing 완료 시 자동 전이되는 Complete 스크린을 추가 — 총 시간 hero, 레시피 요약 카드, 감정 3-way 기록, 처음으로(→ Wall) + 공유(disabled). 세션은 완료 시점에 localStorage에 저장 (미래 히스토리 확장 훅).

**Architecture:** `src/features/complete/CompleteScreen.tsx` 신설. BrewingScreen은 완료 감지 시 `onComplete` 콜백으로 AppRoot에 알리고, AppRoot는 `session.completedAt` 갱신 + `screen='complete'` 전이. Complete의 감정 3-way는 `session.feeling` 갱신(null 재탭으로 해제). `처음으로` 탭 시 session을 localStorage `bloom-coffee:session:v1`에 저장 후 Wall 복귀. BrewingScreen은 Phase 2/3의 "완료" 내부 UI를 제거(Complete 스크린이 그 역할을 가로챔).

**Tech Stack:** React 19 hooks, TS strict, Tailwind 3, Vitest 2 + @testing-library/react. 새 외부 의존성 없음.

**Spec:** `docs/superpowers/specs/2026-04-19-brewing-flow-design.md` Screen Specs § Complete + Domain Model § localStorage.
**Handoff reference:** `docs/design_handoff/README.md` § 4. Complete + `docs/design_handoff/reference/wall-flow.jsx` `CompleteScreen` (line 629~), `FeelingGlyph` (line 79~).
**Prior state:** HEAD `0cbbf51`. Phase 0+1+2+3 완료 — AppRoot + Wall + Recipe + Brewing + slide-up + 리추얼 루프(Wall ↔ Recipe ↔ Brewing ↔ Wall). 103 tests green.

---

## Scope Notes

### Phase 4 대상 (Included)

- `CompleteScreen` 컴포넌트 + `FeelingGlyph` (calm/neutral/wave 3종)
- 총 시간 hero + 레시피 요약 2×2 + 감정 3-way 선택/해제 + 처음으로/공유(disabled) 버튼
- `formatBrewedAt(epochMs): string` — 한국어 날짜 포맷 (`2026 · 03 · 14 · 오전 7:42`)
- BrewingScreen에 `onComplete` prop 추가, 완료 감지 시 한 번만 호출, 내부 "완료" UI 제거
- AppRoot — `handleComplete` / `handleFeeling` 추가, `screen === 'complete'` 분기, `handleExit`에서 `session`을 localStorage에 저장 후 Wall 복귀
- `src/features/share/storage.ts` — `saveSession(session)` 헬퍼 추가 (Phase 4는 저장만, 읽기 없음)

### Phase 4 **비포함** (Deferred)

- **공유 카드 PNG 렌더링 + Web Share API** — Phase 5. 공유 버튼은 `disabled` 상태로 자리 표시.
- **세션 히스토리 읽기/표시** — Phase 5 이후. `loadSession` 헬퍼도 Phase 4에선 만들지 않음 (YAGNI).
- **View Transitions** — Phase 5.
- **Dark mode 완성** — 기존 스켈레톤 유지.

### 스펙 해석

- spec § Complete에 localStorage 키가 `tteum-last-session`으로 나와 있으나, Domain Model § localStorage에는 `bloom-coffee:session:v1`로 컨벤션 정리됨. **`bloom-coffee:session:v1`을 따름** (기존 `bloom-coffee:v1` URL 파라미터 키와 일관성 유지). spec의 Complete 섹션 표기는 plan 실행 중 한 줄 정정 (Task 4.7 Step 6).
- 핸드오프의 `잘 내렸습니다.` / `오늘의 시간은 어땠나요?` 필기체 → 브랜드 2차 원칙 따라 `italic + text-text-secondary/muted`로 대체.
- 감정 3-way의 구현 계약: `session.feeling`은 `'calm' | 'neutral' | 'wave'`(이미 Phase 2에서 정의됨). "재탭 시 해제"는 AppRoot의 `handleFeeling`에서 동일 값 받으면 `undefined` 설정.

---

## File Structure

### 신규 파일

| 경로                                            | 책임                                                                                                                     |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `src/features/complete/CompleteScreen.tsx`      | Complete 레이아웃 전체 — 상단 조용한 헤더(완료 라벨 + 날짜) / Hero 총 시간 / 레시피 요약 2×2 / 감정 3-way / 하단 버튼 행 |
| `src/features/complete/CompleteScreen.test.tsx` | 렌더, 감정 선택/해제, 처음으로 콜백, 공유 disabled 검증                                                                  |
| `src/features/complete/FeelingGlyph.tsx`        | 3종 라인 글리프 (calm 정지한 원 / neutral 수평선 + tick / wave 두 물결) — `currentColor` 기반                            |

### 수정

| 경로                                                       | 변경                                                                                                                                                |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/ui/format.ts`                                         | `formatBrewedAt(epochMs: number): string` 추가. `formatGrindHint`, `formatTime` 기존 export 유지.                                                   |
| `src/ui/format.test.ts` (신규)                             | `formatBrewedAt`의 오전/오후/자정/정오 등 테스트 (파일 현재 없음 — 신규 생성)                                                                       |
| `src/features/share/storage.ts`                            | `saveSession(session)` 추가. 기존 `saveParams`/`loadParams`/`clearParams` 유지.                                                                     |
| `src/features/share/storage.test.ts` (신규)                | `saveSession` 저장 동작 (파일 현재 없음 — 신규 생성)                                                                                                |
| `src/features/brewing/BrewingScreen.tsx`                   | `onComplete` prop 추가, 완료 감지 useEffect, 내부 "완료" UI 전부 제거 (중단 버튼/처음으로 버튼/`done` 분기). 항상 running UI.                       |
| `src/features/brewing/BrewingScreen.test.tsx`              | 기존 "shows done state"/"shows 처음으로 button when done" 테스트 제거. `onComplete` 발사/비발사 2테스트 추가.                                       |
| `src/features/app/AppRoot.tsx`                             | `handleComplete` / `handleFeeling` 신설. `handleExit`에서 `saveSession` 호출. `screen === 'complete'` 분기 추가. BrewingScreen에 `onComplete` 연결. |
| `docs/superpowers/specs/2026-04-19-brewing-flow-design.md` | Complete 섹션의 localStorage 키 표기를 `bloom-coffee:session:v1`로 정정 (Task 4.7 Step 6).                                                          |

### 변경 없음

- `src/domain/**` — `BrewSession` 타입은 Phase 2에서 이미 `completedAt?` + `feeling?` 포함. 추가 변경 없음.
- `src/features/wall/**`, `src/features/recipe/**` — 불변.
- `src/features/share/urlCodec.ts` — Session은 URL 안 탐. 불변.
- `tailwind.config.ts`, `src/ui/tokens/**` — 불변.

---

## Conventions (기존과 동일)

- TDD: 도메인·헬퍼·컴포넌트 behavior는 실패 테스트 먼저.
- 커밋 단위: Phase 4 = 단일 커밋 (Task 4.7).
- 토큰 단일 출처: Tailwind semantic utility. 하드코딩 금지.
- 브랜드 카피: `완료`, `오늘의 한 잔`, `잘 내렸습니다.`, `오늘의 시간은 어땠나요?`, `만족스러워요` / `글쎄요` / `아쉬워요`, `처음으로`, `공유`.
- Path alias: `@/domain/...`, `@/features/...`, `@/ui/...`.

---

# Phase 4 Tasks

## Task 4.1: Storage — `saveSession` 헬퍼

**Files:**

- Modify: `src/features/share/storage.ts`
- Create: `src/features/share/storage.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
// src/features/share/storage.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { saveSession } from "./storage";

describe("saveSession", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("stores session JSON under bloom-coffee:session:v1 key", () => {
    const session = {
      recipe: { method: "hoffmann_v60" },
      startedAt: 1,
      completedAt: 2,
    };
    saveSession(session);
    const raw = localStorage.getItem("bloom-coffee:session:v1");
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!)).toEqual(session);
  });

  it("overwrites previous value", () => {
    saveSession({ a: 1 });
    saveSession({ b: 2 });
    const raw = localStorage.getItem("bloom-coffee:session:v1");
    expect(JSON.parse(raw!)).toEqual({ b: 2 });
  });

  it("swallows storage errors silently (quota exceeded, private mode)", () => {
    const spy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });
    expect(() => saveSession({ a: 1 })).not.toThrow();
    spy.mockRestore();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `bun run test:run src/features/share/storage.test.ts`
Expected: FAIL — `saveSession` import 에러.

- [ ] **Step 3: `storage.ts`에 `saveSession` 추가**

File: `/Users/haneul/Projects/bloom-coffee/src/features/share/storage.ts`

현재 파일:

```ts
const KEY = "bloom-coffee:v1";

export const saveParams = (params: URLSearchParams): void => {
  try {
    localStorage.setItem(KEY, params.toString());
  } catch {
    // storage unavailable (private mode, quota exceeded) — drop silently.
  }
};

export const loadParams = (): URLSearchParams | null => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? new URLSearchParams(raw) : null;
  } catch {
    return null;
  }
};

export const clearParams = (): void => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // noop
  }
};
```

추가할 부분 (파일 끝):

```ts
const SESSION_KEY = "bloom-coffee:session:v1";

// Phase 4: write-only. Future history feature reads this.
export const saveSession = (session: unknown): void => {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // storage unavailable — drop silently.
  }
};
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `bun run test:run src/features/share/storage.test.ts`
Expected: PASS — 3 tests.

---

## Task 4.2: Date formatter — `formatBrewedAt`

**Files:**

- Modify: `src/ui/format.ts`
- Create: `src/ui/format.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
// src/ui/format.test.ts
import { describe, expect, it } from "vitest";
import { formatBrewedAt, formatGrindHint, formatTime } from "./format";

describe("formatBrewedAt", () => {
  it("formats AM time with leading-zero month/day", () => {
    const d = new Date(2026, 2, 14, 7, 42); // March 14, 2026, 07:42 local
    expect(formatBrewedAt(d.getTime())).toBe("2026 · 03 · 14 · 오전 7:42");
  });

  it("formats PM time", () => {
    const d = new Date(2026, 2, 14, 15, 5);
    expect(formatBrewedAt(d.getTime())).toBe("2026 · 03 · 14 · 오후 3:05");
  });

  it("formats midnight as 오전 12", () => {
    const d = new Date(2026, 2, 14, 0, 0);
    expect(formatBrewedAt(d.getTime())).toBe("2026 · 03 · 14 · 오전 12:00");
  });

  it("formats noon as 오후 12", () => {
    const d = new Date(2026, 2, 14, 12, 0);
    expect(formatBrewedAt(d.getTime())).toBe("2026 · 03 · 14 · 오후 12:00");
  });

  it("pads minute with leading zero", () => {
    const d = new Date(2026, 0, 1, 9, 5);
    expect(formatBrewedAt(d.getTime())).toBe("2026 · 01 · 01 · 오전 9:05");
  });
});

describe("formatTime (sanity)", () => {
  it("formats mm:ss", () => {
    expect(formatTime(75)).toBe("1:15");
  });
});

describe("formatGrindHint (sanity)", () => {
  it("maps fine to 설탕 정도", () => {
    expect(formatGrindHint("fine")).toBe("설탕 정도");
  });
});
```

주석: 마지막 두 describe 블록은 기존 함수의 sanity check — 실제로는 `format.ts`의 다른 함수가 깨지지 않았는지 확인용이므로 가볍게 유지.

- [ ] **Step 2: 실패 확인**

Run: `bun run test:run src/ui/format.test.ts`
Expected: FAIL — `formatBrewedAt` import 에러.

- [ ] **Step 3: `format.ts`에 `formatBrewedAt` 추가**

File: `/Users/haneul/Projects/bloom-coffee/src/ui/format.ts`

현재 파일에 **append**:

```ts
export const formatBrewedAt = (epochMs: number): string => {
  const d = new Date(epochMs);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours24 = d.getHours();
  const hour12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;
  const minute = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours24 < 12 ? "오전" : "오후";
  return `${year} · ${month} · ${day} · ${ampm} ${hour12}:${minute}`;
};
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `bun run test:run src/ui/format.test.ts`
Expected: PASS — 7 tests (5 formatBrewedAt + 1 formatTime + 1 formatGrindHint).

---

## Task 4.3: `FeelingGlyph` + `CompleteScreen` 컴포넌트 + 테스트

**Files:**

- Create: `src/features/complete/FeelingGlyph.tsx`
- Create: `src/features/complete/CompleteScreen.tsx`
- Create: `src/features/complete/CompleteScreen.test.tsx`

- [ ] **Step 1: `FeelingGlyph` 구현 (테스트 없음 — 순수 SVG, CompleteScreen의 시각 QA로 대체)**

```tsx
// src/features/complete/FeelingGlyph.tsx
import type { Feeling } from "@/domain/session";

type Props = {
  readonly kind: Feeling;
  readonly size?: number;
};

export function FeelingGlyph({ kind, size = 34 }: Props) {
  if (kind === "calm") {
    return (
      <svg width={size} height={size} viewBox="0 0 34 34" aria-hidden="true">
        <circle
          cx={17}
          cy={17}
          r={11}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.2}
        />
        <circle cx={17} cy={17} r={2} fill="currentColor" />
      </svg>
    );
  }
  if (kind === "neutral") {
    return (
      <svg width={size} height={size} viewBox="0 0 34 34" aria-hidden="true">
        <line
          x1={5}
          y1={17}
          x2={29}
          y2={17}
          stroke="currentColor"
          strokeWidth={1.3}
          strokeLinecap="round"
        />
        <line
          x1={17}
          y1={13}
          x2={17}
          y2={21}
          stroke="currentColor"
          strokeWidth={1.2}
          strokeLinecap="round"
          opacity={0.6}
        />
      </svg>
    );
  }
  // wave
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" aria-hidden="true">
      <path
        d="M 4 14 Q 10 8, 17 14 T 30 14"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      <path
        d="M 4 20 Q 10 26, 17 20 T 30 20"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinecap="round"
        opacity={0.7}
      />
    </svg>
  );
}
```

- [ ] **Step 2: `CompleteScreen` 실패 테스트**

```tsx
// src/features/complete/CompleteScreen.test.tsx
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Pour, Recipe } from "@/domain/types";
import type { BrewSession } from "@/domain/session";
import { c, g, ratio, s } from "@/domain/units";
import { CompleteScreen } from "./CompleteScreen";

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
  method: "kasuya_4_6",
  dripper: "v60",
  coffee: g(20),
  totalWater: g(300),
  ratio: ratio(15),
  temperature: c(90),
  pours: [
    mkPour(0, 0, 60, 60),
    mkPour(1, 45, 60, 120),
    mkPour(2, 90, 90, 210),
    mkPour(3, 135, 90, 300),
  ],
  totalTimeSec: s(208), // 3:28
  grindHint: "medium-coarse",
  notes: [],
};

const baseSession: BrewSession = {
  recipe,
  startedAt: new Date(2026, 2, 14, 7, 42).getTime(),
  completedAt: new Date(2026, 2, 14, 7, 42).getTime() + 208_000,
};

describe("CompleteScreen", () => {
  it("renders 완료 header and formatted date", () => {
    render(
      <CompleteScreen
        session={baseSession}
        onFeelingChange={vi.fn()}
        onExit={vi.fn()}
      />,
    );
    expect(screen.getByText("완료")).toBeInTheDocument();
    expect(screen.getByText("2026 · 03 · 14 · 오전 7:42")).toBeInTheDocument();
  });

  it("renders hero total time", () => {
    render(
      <CompleteScreen
        session={baseSession}
        onFeelingChange={vi.fn()}
        onExit={vi.fn()}
      />,
    );
    expect(screen.getByText("오늘의 한 잔")).toBeInTheDocument();
    expect(screen.getByText("3:28")).toBeInTheDocument();
    expect(screen.getByText("잘 내렸습니다.")).toBeInTheDocument();
  });

  it("renders recipe summary fields", () => {
    render(
      <CompleteScreen
        session={baseSession}
        onFeelingChange={vi.fn()}
        onExit={vi.fn()}
      />,
    );
    expect(screen.getByText("드리퍼")).toBeInTheDocument();
    expect(screen.getByText("V60")).toBeInTheDocument();
    expect(screen.getByText("레시피")).toBeInTheDocument();
    expect(screen.getByText("Kasuya 4:6")).toBeInTheDocument();
    expect(screen.getByText("원두 · 물")).toBeInTheDocument();
    expect(screen.getByText("20 · 300 g")).toBeInTheDocument();
    expect(screen.getByText("온도 · 분쇄")).toBeInTheDocument();
    expect(screen.getByText(/90° · 거친 설탕 정도/)).toBeInTheDocument();
  });

  it("renders 3 feeling buttons", () => {
    render(
      <CompleteScreen
        session={baseSession}
        onFeelingChange={vi.fn()}
        onExit={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: "만족스러워요" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "글쎄요" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "아쉬워요" }),
    ).toBeInTheDocument();
  });

  it("calls onFeelingChange with feeling when tapped", () => {
    const onFeelingChange = vi.fn();
    render(
      <CompleteScreen
        session={baseSession}
        onFeelingChange={onFeelingChange}
        onExit={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "만족스러워요" }));
    expect(onFeelingChange).toHaveBeenCalledWith("calm");
  });

  it("calls onFeelingChange with null when same feeling re-tapped", () => {
    const onFeelingChange = vi.fn();
    const sessionWithFeeling: BrewSession = { ...baseSession, feeling: "calm" };
    render(
      <CompleteScreen
        session={sessionWithFeeling}
        onFeelingChange={onFeelingChange}
        onExit={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "만족스러워요" }));
    expect(onFeelingChange).toHaveBeenCalledWith(null);
  });

  it("marks selected feeling with aria-pressed", () => {
    const sessionWithFeeling: BrewSession = {
      ...baseSession,
      feeling: "neutral",
    };
    render(
      <CompleteScreen
        session={sessionWithFeeling}
        onFeelingChange={vi.fn()}
        onExit={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "글쎄요" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.getByRole("button", { name: "만족스러워요" }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("calls onExit when 처음으로 tapped", () => {
    const onExit = vi.fn();
    render(
      <CompleteScreen
        session={baseSession}
        onFeelingChange={vi.fn()}
        onExit={onExit}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "처음으로" }));
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("renders 공유 button as disabled", () => {
    render(
      <CompleteScreen
        session={baseSession}
        onFeelingChange={vi.fn()}
        onExit={vi.fn()}
      />,
    );
    const shareBtn = screen.getByRole("button", { name: "공유" });
    expect(shareBtn).toBeDisabled();
  });
});
```

- [ ] **Step 3: 실패 확인**

Run: `bun run test:run src/features/complete/CompleteScreen.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 4: `CompleteScreen` 구현**

```tsx
// src/features/complete/CompleteScreen.tsx
import { brewMethods } from "@/domain/methods";
import { drippers } from "@/domain/drippers";
import type { BrewSession, Feeling } from "@/domain/session";
import { cx } from "@/ui/cx";
import { formatBrewedAt, formatGrindHint, formatTime } from "@/ui/format";
import { FeelingGlyph } from "./FeelingGlyph";

type Props = {
  readonly session: BrewSession;
  readonly onFeelingChange: (feeling: Feeling | null) => void;
  readonly onExit: () => void;
};

const FEELINGS: readonly { id: Feeling; label: string }[] = [
  { id: "calm", label: "만족스러워요" },
  { id: "neutral", label: "글쎄요" },
  { id: "wave", label: "아쉬워요" },
];

export function CompleteScreen({ session, onFeelingChange, onExit }: Props) {
  const { recipe } = session;
  const dripperName = drippers[recipe.dripper].name;
  const methodName = brewMethods[recipe.method].name;
  const startedAt = session.completedAt ?? session.startedAt;
  const dateText = formatBrewedAt(startedAt);

  const handleFeelingTap = (feeling: Feeling): void => {
    onFeelingChange(session.feeling === feeling ? null : feeling);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-surface px-6 pb-10 pt-16 text-text-primary">
      {/* quiet header */}
      <header className="flex flex-col items-center gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-pour-bloom">
          완료
        </span>
        <span className="text-[11px] text-text-muted tabular-nums">
          {dateText}
        </span>
      </header>

      {/* hero */}
      <section aria-label="총 시간" className="mt-6 flex flex-col items-center">
        <span className="text-[11px] text-text-muted">오늘의 한 잔</span>
        <span className="mt-1 text-[72px] font-medium leading-none tabular-nums">
          {formatTime(recipe.totalTimeSec)}
        </span>
        <span className="mt-2 text-sm italic text-text-secondary">
          잘 내렸습니다.
        </span>
      </section>

      {/* recipe summary card */}
      <section aria-label="레시피 요약" className="mt-10">
        <div className="h-px bg-border" />
        <div className="grid grid-cols-2 gap-x-4 gap-y-4 py-5">
          <SummaryCell label="드리퍼" value={dripperName} />
          <SummaryCell label="레시피" value={methodName} small />
          <SummaryCell
            label="원두 · 물"
            value={`${recipe.coffee} · ${recipe.totalWater} g`}
          />
          <SummaryCell
            label="온도 · 분쇄"
            value={`${recipe.temperature}° · ${formatGrindHint(recipe.grindHint)}`}
          />
        </div>
        <div className="h-px bg-border" />
      </section>

      {/* feeling */}
      <section
        aria-label="감정 기록"
        className="mt-10 flex flex-col items-center gap-3"
      >
        <p className="text-sm italic text-text-secondary">
          오늘의 시간은 어땠나요?
        </p>
        <div className="flex w-full gap-2">
          {FEELINGS.map((f) => {
            const isSelected = session.feeling === f.id;
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={isSelected}
                aria-label={f.label}
                onClick={() => handleFeelingTap(f.id)}
                className={cx(
                  "flex h-20 flex-1 flex-col items-center justify-center gap-1.5 rounded-xl border transition-colors",
                  isSelected
                    ? "border-text-primary bg-surface-subtle font-medium text-text-primary"
                    : "border-border text-text-secondary hover:bg-surface-inset/60",
                )}
              >
                <FeelingGlyph kind={f.id} size={34} />
                <span className="text-xs">{f.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* bottom buttons */}
      <div className="mt-auto flex gap-2 pt-10">
        <button
          type="button"
          onClick={onExit}
          className="h-13 flex-1 rounded-xl border-[1.6px] border-text-primary bg-surface-subtle py-3.5 text-sm font-medium transition-colors hover:bg-surface-inset"
        >
          처음으로
        </button>
        <button
          type="button"
          disabled
          aria-label="공유"
          className="h-13 w-16 rounded-xl border border-border py-3.5 text-text-muted opacity-40"
        >
          공유
        </button>
      </div>
    </div>
  );
}

function SummaryCell({
  label,
  value,
  small,
}: {
  readonly label: string;
  readonly value: string;
  readonly small?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wider text-text-muted">
        {label}
      </span>
      <span
        className={cx(
          "tabular-nums",
          small ? "text-[13px] text-text-secondary" : "text-base",
        )}
      >
        {value}
      </span>
    </div>
  );
}
```

주석:

- `brewMethods[recipe.method].name` — 이미 플러그인 레지스트리. 기존 계약 재사용.
- `drippers[recipe.dripper].name` — `src/domain/drippers.ts`의 Record export. Phase 1의 `dripperList.find(...)` 선형 스캔 대비 직접 접근.
- 공유 버튼은 Phase 5까지 `disabled`. `opacity-40` + `cursor-not-allowed`는 포함 안 함 (disabled attribute가 기본 pointer-events 차단).
- Feeling button border — 선택 시 `border-text-primary` (진한 먹색), 비선택 시 `border-border` (faint). 기존 DripperPopover 선택 토글 패턴과 동일.

- [ ] **Step 5: 테스트 통과**

Run: `bun run test:run src/features/complete/CompleteScreen.test.tsx`
Expected: PASS — 9 tests.

- [ ] **Step 6: 타입체크**

Run: `bun run typecheck`
Expected: PASS.

---

## Task 4.4: BrewingScreen — `onComplete` 추가, 내부 "완료" UI 제거

**Files:**

- Modify: `src/features/brewing/BrewingScreen.tsx`
- Modify: `src/features/brewing/BrewingScreen.test.tsx`

- [ ] **Step 1: 기존 "완료" 관련 테스트 2개 제거 + `onComplete` 테스트 2개 추가**

File: `/Users/haneul/Projects/bloom-coffee/src/features/brewing/BrewingScreen.test.tsx`

제거할 테스트 (두 블록):

```tsx
it("shows done state when elapsed >= totalTime", () => {
  // ... (제거)
});

it("shows 처음으로 button when done", () => {
  // ... (제거)
});
```

추가할 테스트:

```tsx
it("fires onComplete once when elapsed >= totalTimeSec", () => {
  vi.setSystemTime(new Date(1_000_000_000_000));
  const session = makeSession(1_000_000_000_000 - 300_000); // 300s ago, > totalTime 210
  const onComplete = vi.fn();
  render(
    <BrewingScreen
      session={session}
      onExit={vi.fn()}
      onComplete={onComplete}
    />,
  );
  expect(onComplete).toHaveBeenCalledTimes(1);
});

it("does not fire onComplete while running", () => {
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
  expect(onComplete).not.toHaveBeenCalled();
});
```

다른 기존 테스트 (`shows hero weight of active step (bloom at elapsed=0)`, `opens stop dialog when 중단 tapped`, `calls onExit when 처음으로 confirmed in dialog`, `advances active step when elapsed crosses next pour boundary`)는 **모두 onComplete prop을 받도록 호출 시그니처 수정 필요**:

```tsx
render(
  <BrewingScreen session={session} onExit={vi.fn()} onComplete={vi.fn()} />,
);
```

위 4개 테스트의 render 호출을 모두 `onComplete={vi.fn()}` prop 추가하여 업데이트.

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run: `bun run test:run src/features/brewing/BrewingScreen.test.tsx`
Expected: FAIL — `onComplete` prop이 BrewingScreen에 없음.

- [ ] **Step 3: `BrewingScreen.tsx` 수정 — `onComplete` prop, useEffect 발사, 완료 UI 제거**

File: `/Users/haneul/Projects/bloom-coffee/src/features/brewing/BrewingScreen.tsx`

전체 재작성:

```tsx
import { useEffect, useRef, useState } from "react";
import { activeStepIdx, nextStepIdx, type BrewSession } from "@/domain/session";
import { formatTime } from "@/ui/format";
import { cx } from "@/ui/cx";
import { StopConfirmDialog } from "./StopConfirmDialog";
import { useElapsed } from "./useElapsed";

type Props = {
  readonly session: BrewSession;
  readonly onExit: () => void;
  readonly onComplete: () => void;
};

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
        <button
          type="button"
          onClick={() => setStopDialogOpen(true)}
          className="pt-2 text-[11px] text-text-muted hover:text-text-secondary"
        >
          중단
        </button>
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
                i < activeIdx
                  ? "bg-text-primary"
                  : i === activeIdx
                    ? "bg-pour-bloom"
                    : "bg-border",
              )}
            />
            <span
              className={cx(
                "text-[9px]",
                i === activeIdx
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
        <span className="text-[11px] font-semibold uppercase tracking-widest text-pour-bloom">
          지금
        </span>
        <span className="mt-2 text-[11px] text-text-muted">저울 목표</span>
        <div className="mt-1 flex items-baseline gap-1">
          <span
            data-testid="hero-weight"
            className="text-[96px] font-medium leading-none tabular-nums"
          >
            {active.cumulativeWater}
          </span>
          <span className="text-3xl text-text-muted">g</span>
        </div>
        <div className="mt-2 text-base italic text-text-secondary">
          +{active.pourAmount}g 붓기
        </div>
      </div>

      {/* Time marker */}
      <div className="mt-4 text-center">
        <div className="text-[10px] text-text-muted">시점</div>
        <div className="text-[22px] text-text-secondary tabular-nums">
          {formatTime(active.atSec)}
        </div>
      </div>

      {/* Bottom: next preview */}
      <div className="mt-auto px-5 pb-8">
        {next ? (
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

변경점 요약:

1. `onComplete: () => void` prop 추가.
2. `completedRef = useRef(false)`로 한 번만 발사 가드.
3. `useEffect([done, onComplete], ...)`로 완료 감지 시 `onComplete()` 호출.
4. Hero의 조건부 분기(`done ? '완료' : '지금'`)를 `'지금'`만 남김.
5. `heroHint`, `heroTimeLabel`, `heroWeight` 변수 제거 — `active.cumulativeWater` / `active.pourAmount` / `formatTime(active.atSec)` 직접 렌더.
6. 하단 분기 `done ? <button>처음으로</button> : next ? ...`에서 `done` 분기 제거, `next` 만 남김 (done=true일 땐 이 시점에 이미 screen 전이가 트리거되어 곧 unmount).
7. 중단 버튼의 `!done && ` 조건 제거 — 항상 노출. (race: done과 중단 탭 동시 발생 시 양쪽 다 session 종료 경로라 안전.)
8. `bg-pour-bloom` / `text-pour-bloom` Tailwind 유틸 유지 (Phase 2 fix에서 정규화됨).

- [ ] **Step 4: 테스트 통과**

Run: `bun run test:run src/features/brewing/BrewingScreen.test.tsx`
Expected: PASS — 6 tests (기존 4 + 새 2, 제거 2).

- [ ] **Step 5: 타입체크**

Run: `bun run typecheck`
Expected: PASS. 단, `AppRoot`가 아직 `onComplete`를 안 넘겨서 에러 뜸 — Task 4.5에서 해결.

---

## Task 4.5: `AppRoot` 통합 — handleComplete + handleFeeling + complete 분기 + session 저장

**Files:**

- Modify: `src/features/app/AppRoot.tsx`

- [ ] **Step 1: AppRoot 전체 수정**

File: `/Users/haneul/Projects/bloom-coffee/src/features/app/AppRoot.tsx`

현재 파일(Phase 3 fix 상태) — Wall 분기, brewing 분기, recipe fallthrough가 있음.

추가/변경:

1. `CompleteScreen` + `Feeling` import.
2. `saveSession` import.
3. `handleComplete` 신설 — `session.completedAt` 세팅 + `patch({ screen: 'complete' })`.
4. `handleFeeling` 신설 — `session.feeling` 세팅 (null이면 undefined).
5. `handleExit` 수정 — `session`을 localStorage에 저장 (있을 때만).
6. `screen === 'complete'` 분기 추가.
7. BrewingScreen에 `onComplete={handleComplete}` 연결.

전체 교체:

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
import type { BrewSession, Feeling } from "@/domain/session";
import { g } from "@/domain/units";
import { BrewingScreen } from "@/features/brewing/BrewingScreen";
import { CompleteScreen } from "@/features/complete/CompleteScreen";
import { RecipeScreen } from "@/features/recipe/RecipeScreen";
import { WallScreen } from "@/features/wall/WallScreen";
import { loadParams, saveParams, saveSession } from "@/features/share/storage";
import { decodeState, encodeState } from "@/features/share/urlCodec";
import { DEFAULT_STATE, mergeState, type AppState } from "./state";

const loadInitialState = (): AppState => {
  const fromUrl = decodeState(new URLSearchParams(window.location.search));
  const hasUrl = Object.keys(fromUrl).length > 0;
  if (hasUrl)
    return mergeState(DEFAULT_STATE, { ...fromUrl, screen: "recipe" });
  const stored = loadParams();
  if (stored) return mergeState(DEFAULT_STATE, decodeState(stored));
  return DEFAULT_STATE;
};

export function AppRoot() {
  const [state, setState] = useState<AppState>(loadInitialState);
  const [session, setSession] = useState<BrewSession | null>(null);

  useEffect(() => {
    const params = encodeState(state);
    if (state.screen === "wall") {
      window.history.replaceState(null, "", window.location.pathname);
    } else {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}?${params}`,
      );
    }
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

  const handleComplete = (): void => {
    setSession((prev) => (prev ? { ...prev, completedAt: Date.now() } : null));
    patch({ screen: "complete" });
  };

  const handleFeeling = (feeling: Feeling | null): void => {
    setSession((prev) => {
      if (!prev) return null;
      return { ...prev, feeling: feeling ?? undefined };
    });
  };

  const handleExit = (): void => {
    if (session) saveSession(session);
    setSession(null);
    patch({ screen: "wall" });
  };

  const handlePickDripper = (dripper: DripperId): void => {
    patch({ dripper, screen: "recipe" });
  };

  if (state.screen === "wall") {
    return (
      <WallScreen
        selectedDripper={state.dripper}
        onPickDripper={handlePickDripper}
      />
    );
  }

  if (state.screen === "brewing" && session) {
    return (
      <BrewingScreen
        session={session}
        onExit={handleExit}
        onComplete={handleComplete}
      />
    );
  }

  if (state.screen === "complete" && session) {
    return (
      <CompleteScreen
        session={session}
        onFeelingChange={handleFeeling}
        onExit={handleExit}
      />
    );
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
  );
}
```

변경점 요약:

1. Import 추가: `CompleteScreen`, `Feeling`, `saveSession`.
2. `handleComplete` — session.completedAt + screen='complete'. 이전 session 없으면 no-op.
3. `handleFeeling` — null은 feeling 속성 제거, 값은 갱신.
4. `handleExit` — session saveSession 호출 (save-only, 미래 히스토리 훅).
5. `screen === 'complete' && session` 분기 추가 (brewing 분기 뒤, recipe fallthrough 앞).
6. BrewingScreen에 `onComplete={handleComplete}` 연결.

- [ ] **Step 2: 타입체크**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 3: 전체 테스트**

Run: `bun run test:run`
Expected: PASS. 예상 테스트 수:

- 이전 103
- storage 신규 +3
- format 신규 +7
- CompleteScreen 신규 +9
- BrewingScreen 변동: -2 (제거), +2 (추가) = 0 net
- 총: 103 + 3 + 7 + 9 = **122 tests**.

---

## Task 4.6: Spec 파일 한 줄 정정

**Files:**

- Modify: `docs/superpowers/specs/2026-04-19-brewing-flow-design.md`

- [ ] **Step 1: Complete 섹션의 localStorage 키 표기 통일**

File: `/Users/haneul/Projects/bloom-coffee/docs/superpowers/specs/2026-04-19-brewing-flow-design.md`

`### Complete` 섹션 안의 문장:

```
- 세션 저장: `처음으로` 탭 시점에 `localStorage['tteum-last-session']`에 `JSON.stringify(session)`. 읽는 곳은 Phase 4엔 없음.
```

아래로 교체 (키를 Domain Model § localStorage와 일치시킴):

```
- 세션 저장: `처음으로` 탭 시점에 `localStorage['bloom-coffee:session:v1']`에 `JSON.stringify(session)`. 읽는 곳은 Phase 4엔 없음 (미래 히스토리 훅).
```

---

## Task 4.7: Wrap-up — 타입체크 + 테스트 + 시각 QA + 커밋

- [ ] **Step 1: 타입체크**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 2: 테스트**

Run: `bun run test:run`
Expected: PASS — 122 tests.

- [ ] **Step 3: 빌드**

Run: `bun run build`
Expected: PASS.

- [ ] **Step 4: Dev server + Playwright 시각 QA**

Run (background): `bun run dev`

체크리스트 (데스크톱 1200×900 + 모바일 390×844):

**완료 플로우 (짧은 레시피 또는 session.startedAt 조작으로 유도):**

- [ ] Wall → V60 → Recipe (coffee 5g로 줄여 totalTime 단축) → 시작 → Brewing
- [ ] Brewing 경과 시간이 totalTime을 넘으면 자동으로 Complete 스크린으로 전이
- [ ] Complete 상단: 작은 `완료` ochre 라벨, 아래 `YYYY · MM · DD · 오전/오후 H:MM`
- [ ] Hero: `오늘의 한 잔` + 큰 총 시간 (72px) + `잘 내렸습니다.` italic
- [ ] 레시피 요약 카드: hairline + 2×2 그리드 (드리퍼/레시피/원두·물/온도·분쇄)
- [ ] 감정 3 버튼: calm/neutral/wave 글리프 + 라벨
- [ ] 감정 탭 → 테두리 진해짐, `aria-pressed=true`
- [ ] 동일 감정 재탭 → 해제 (`aria-pressed=false`)
- [ ] 공유 버튼 disabled (클릭해도 반응 없음, 시각적으로 opacity-40)
- [ ] `처음으로` → Wall 복귀
- [ ] localStorage 확인: `bloom-coffee:session:v1` 키에 JSON 저장되었는지 DevTools Application 탭에서 확인

**중단 플로우 (Complete 건너뛰어 직접 Wall):**

- [ ] Wall → Recipe → 시작 → Brewing → 중단 → 처음으로 → Wall (Complete 건너뜀)
- [ ] localStorage `bloom-coffee:session:v1`는 저장되어도 (중단 시점 session snapshot 기록됨) — 허용 동작 (Phase 4 범위에서 "complete"와 "stop"을 분리 저장하지 않음).

- [ ] **Step 5: Dev server 종료**

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat: Complete 스크린 + 감정 기록 + 세션 저장 (Phase 4)

- features/complete/CompleteScreen.tsx: 상단 완료 라벨 + 날짜 + Hero
  총 시간 + 레시피 요약 2×2 + 감정 3-way + 처음으로/공유(disabled).
- features/complete/FeelingGlyph.tsx: calm(정지한 원) / neutral(수평선
  + tick) / wave(두 물결) 라인 글리프. currentColor 기반.
- ui/format.ts: formatBrewedAt(epochMs) 한국어 날짜 포맷
  (YYYY · MM · DD · 오전/오후 H:MM).
- features/share/storage.ts: saveSession() 헬퍼. write-only,
  bloom-coffee:session:v1 키. Phase 5 이후 히스토리 feature가 읽음.
- BrewingScreen: onComplete prop 추가, 완료 감지 useEffect(완료 1회
  가드 useRef). 내부 '완료' UI 전부 제거 — Complete 스크린이 대체.
- AppRoot: handleComplete / handleFeeling 신설. handleExit에서
  saveSession 호출. screen='complete' 분기 추가.
- spec: Complete 섹션 localStorage 키를 bloom-coffee:session:v1로
  통일 (Domain Model 섹션과 일치).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 7: 완료 확인**

Run: `git log --oneline -5`
Expected: 최상단이 `feat: Complete 스크린 + 감정 기록 + 세션 저장 (Phase 4)`.

---

## Post-plan notes

- Phase 4 완료 후 앱 전체 리추얼 루프(Wall → Recipe → Brewing → Complete → Wall) 완성.
- 남은 단계: Phase 5 (Share PNG 카드 + Web Share API + View Transitions) — 별도 마일스톤.
- `TODO.md` 갱신 고려.

---

## 자체 검증 체크

- **스펙 커버리지**:
  - Complete 레이아웃 (핸드오프대로) → Task 4.3 ✓
  - 감정 3-way + 재탭 해제 → Task 4.3 + Task 4.5 handleFeeling ✓
  - 처음으로 → Wall → Task 4.5 handleExit ✓
  - 공유 disabled → Task 4.3 ✓
  - `bloom-coffee:session:v1` localStorage 저장 → Task 4.1 + Task 4.5 ✓
  - Spec Complete 섹션 localStorage 키 통일 → Task 4.6 ✓
  - `session.completedAt` 갱신 → Task 4.5 handleComplete ✓
  - Brewing 완료 자동 전이 → Task 4.4 + Task 4.5 ✓
- **No placeholders**: 모든 step 실제 코드·명령·예상 결과.
- **Type consistency**:
  - `Feeling | null` 계약 — CompleteScreen Props, handleFeeling signature, FeelingGlyph Props 일관.
  - `onComplete: () => void` — BrewingScreen Props + AppRoot handleComplete 호출 시그니처.
  - `BrewSession.completedAt?` 갱신 경로 — Phase 2에서 이미 정의된 필드 사용.
