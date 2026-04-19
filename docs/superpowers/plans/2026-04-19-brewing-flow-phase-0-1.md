# Brewing Flow Phase 0 + 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 단일 `CalculatorPage` 앱을 `AppRoot` + `screen` 상태 머신으로 재편하고 (Phase 0), Recipe 화면을 핸드오프 레이아웃으로 재설계한다 (Phase 1).

**Architecture:** `src/features/app/AppRoot.tsx`가 최상위 state·URL sync·localStorage를 소유하고, `screen: 'recipe'` 분기에서 새 `RecipeScreen`을 렌더. 도메인(`BrewMethod`, `Recipe`, `Pour`, `TasteProfile`) 불변. 입력 축소: `InputMode`(커피↔인원 토글) 제거 — 핸드오프에 없고 브랜드의 '침묵' 원칙에 맞음.

**Tech Stack:** React 19, TypeScript strict, Vitest 2 + jsdom + @testing-library/react, Tailwind 3 (semantic tokens via `--color-*` CSS vars). Bun 런타임.

**Spec:** `docs/superpowers/specs/2026-04-19-brewing-flow-design.md`
**Handoff reference:** `docs/design_handoff/README.md`, `docs/design_handoff/reference/wall-flow.jsx`

---

## Scope Note — Servings mode 제거

현재 `AppState.inputMode`는 `by-coffee` / `by-servings` 두 형태. 핸드오프 Recipe에는 `커피 Stepper`만 존재하므로 Phase 1에서 **servings 모드를 제거**한다:

- `AppState.inputMode` → `AppState.coffee: Grams`
- `src/domain/servings.ts` 및 테스트 파일 삭제
- URL codec에서 `sv` 파라미터 제거 (레거시 `sv=N` URL은 무시됨 → 기본값 복귀)

이것은 스펙의 Phase 1에 포함되는 단순화이며, 사용자 결정 후 spec/TODO에 반영 필요 (plan 실행 중 `docs/superpowers/specs/2026-04-19-brewing-flow-design.md`의 Domain Model 섹션에 한 줄 추가).

---

## File Structure

### 신규 파일

| 경로                                          | 책임                                                                                                 |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `src/features/app/AppRoot.tsx`                | 최상위 컴포넌트. `AppState` 소유, URL sync + localStorage, `screen` 분기로 하위 화면 렌더            |
| `src/features/app/state.ts`                   | `AppState` 타입 + `DEFAULT_STATE` + `mergeState` (기존 `features/calculator/state.ts`에서 이동·확장) |
| `src/features/app/state.test.ts`              | `mergeState` 규칙 테스트 (신규 `screen` 포함, 드리퍼↔메서드 호환성 유지 확인)                        |
| `src/features/recipe/RecipeScreen.tsx`        | 핸드오프 Recipe 레이아웃. 상단 바 / 컨트롤 / 권장 / 세로 푸어 / 시작 버튼                            |
| `src/features/recipe/DripperPopover.tsx`      | `바꾸기 ›` 트리거로 열리는 팝오버. V60/Kalita Wave 선택. 배경 dim 탭 시 닫힘                         |
| `src/features/recipe/DripperPopover.test.tsx` | 열림/닫힘/선택 동작 테스트                                                                           |
| `src/features/recipe/PourVerticalPreview.tsx` | 세로 푸어 SVG. 시간 위→아래, 각 step이 time \| ● \| 막대 \| +Δg                                      |
| `src/ui/DripperIcon.tsx`                      | 드리퍼 라인 아이콘 (V60 / Kalita Wave). 얇은 라인, `--color-text-primary` 사용                       |

### 수정

| 경로                                                       | 변경                                                                    |
| ---------------------------------------------------------- | ----------------------------------------------------------------------- |
| `src/App.tsx`                                              | `CalculatorPage` → `AppRoot`                                            |
| `src/features/share/urlCodec.ts`                           | `AppState` import 경로 변경, `inputMode` → `coffee`, `sv` 파라미터 제거 |
| `src/features/share/urlCodec.test.ts`                      | 신규 `AppState` 형상 반영                                               |
| `docs/superpowers/specs/2026-04-19-brewing-flow-design.md` | Domain Model § servings 모드 제거 명시 (Task 3에서)                     |

### 삭제

| 경로                                         | 이유                                |
| -------------------------------------------- | ----------------------------------- |
| `src/features/calculator/CalculatorPage.tsx` | `RecipeScreen`으로 대체             |
| `src/features/calculator/InputPanel.tsx`     | 레이아웃이 RecipeScreen 내부로 통합 |
| `src/features/calculator/RecipeView.tsx`     | 동일                                |
| `src/features/calculator/PourTimeline.tsx`   | 가로 타임라인 → 세로 Preview로 대체 |
| `src/features/calculator/state.ts`           | `features/app/state.ts`로 이동      |
| `src/domain/servings.ts`                     | servings 모드 제거                  |
| `src/domain/servings.test.ts`                | 동일                                |
| `src/features/calculator/`                   | 빈 디렉토리 제거                    |

---

## Conventions

- **TDD**: 각 도메인/로직 변경은 실패 테스트 먼저 → 구현 → 통과 → 커밋.
- **UI 컴포넌트**: 행동(토글 / 조건 렌더 / 콜백) 위주로 RTL 테스트. 순수 레이아웃은 Playwright 시각 QA로.
- **커밋 단위**: 각 Task 끝에서 커밋. PR은 Phase 단위(Phase 0 하나, Phase 1 하나).
- **커밋 메시지**: 기존 스타일 — `type: 설명` 한국어 OK, Co-Authored-By 트레일러 포함.
- **태그 경로**: `@/domain/...`, `@/features/...`, `@/ui/...`.
- **CSS 토큰**: 하드코딩 금지. `text-text-primary`, `bg-surface`, `border-border` 등 Tailwind semantic 유틸 또는 `var(--color-*)` 사용.

---

# Phase 0 — Screen state foundation

목표: `AppRoot` 도입, `AppState`에 `screen` 추가, CalculatorPage를 AppRoot 자식으로 이동. UI 변화 없음.

## Task 0.1: `features/app/state.ts` — state 이동 + `screen` 필드 추가

**Files:**

- Create: `src/features/app/state.ts`
- Create: `src/features/app/state.test.ts`
- Delete (in later task): `src/features/calculator/state.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
// src/features/app/state.test.ts
import { describe, expect, it } from "vitest";
import { DEFAULT_STATE, mergeState, type AppState, type Screen } from "./state";

describe("AppState", () => {
  it('DEFAULT_STATE has screen = "recipe"', () => {
    expect(DEFAULT_STATE.screen).toBe("recipe" satisfies Screen);
  });

  it("mergeState auto-corrects method when dripper changes to incompatible", () => {
    const base: AppState = { ...DEFAULT_STATE, method: "hoffmann_v60" };
    const result = mergeState(base, { dripper: "kalita_wave" });
    expect(result.method).toBe("kalita_pulse");
    expect(result.dripper).toBe("kalita_wave");
  });

  it("mergeState preserves method when new dripper supports it", () => {
    const base: AppState = { ...DEFAULT_STATE, method: "kasuya_4_6" };
    const result = mergeState(base, { dripper: "v60" });
    expect(result.method).toBe("kasuya_4_6");
  });

  it("mergeState preserves screen across patches", () => {
    const base: AppState = { ...DEFAULT_STATE, screen: "brewing" };
    const result = mergeState(base, { roast: "dark" });
    expect(result.screen).toBe("brewing");
  });
});
```

- [ ] **Step 2: 테스트 실패 확인 (파일이 아직 없음)**

Run: `bun run test:run src/features/app/state.test.ts`
Expected: FAIL ("Cannot find module './state'")

- [ ] **Step 3: `state.ts` 구현 (기존 `calculator/state.ts` 이전 + `screen` 확장)**

```ts
// src/features/app/state.ts
import { methodsForDripper } from "@/domain/methods";
import type {
  BrewMethodId,
  DripperId,
  Grams,
  RoastLevel,
  TasteProfile,
} from "@/domain/types";
import { g } from "@/domain/units";

export type Screen = "wall" | "recipe" | "brewing" | "complete";

export type AppState = {
  readonly screen: Screen;
  readonly coffee: Grams;
  readonly dripper: DripperId;
  readonly method: BrewMethodId;
  readonly roast: RoastLevel;
  readonly taste: TasteProfile;
};

export const DEFAULT_STATE: AppState = {
  screen: "recipe",
  coffee: g(20),
  dripper: "v60",
  method: "kasuya_4_6",
  roast: "medium",
  taste: { sweetness: "balanced", strength: "medium" },
};

export const mergeState = (
  base: AppState,
  patch: Partial<AppState>,
): AppState => {
  const merged = { ...base, ...patch };
  const compat = methodsForDripper(merged.dripper);
  if (!compat.some((m) => m.id === merged.method)) {
    return { ...merged, method: compat[0]!.id };
  }
  return merged;
};
```

참고: `Grams` 타입이 `domain/types.ts`에 이미 export되어 있는지 확인. 만약 internal (`number & { __brand }` alias만)이면 re-export 필요.

- [ ] **Step 4: Grams export 확인, 누락 시 추가**

Run: `grep -n "^export.*Grams\|^export type Grams" src/domain/types.ts`
Expected: `export type Grams = ...`가 매치되어야 함. 이미 첫 줄에 있음.

- [ ] **Step 5: 테스트 통과 확인**

Run: `bun run test:run src/features/app/state.test.ts`
Expected: PASS, 4 tests

- [ ] **Step 6: 타입체크**

Run: `bun run typecheck`
Expected: PASS. 주의: 기존 `features/calculator/state.ts` + urlCodec 등이 아직 옛 `inputMode`를 참조 중이므로 **이 시점에서 에러가 남**. Task 0.2에서 해결.

- [ ] **Step 7: (아직 커밋하지 않음)**

Phase 0는 여러 태스크에 걸쳐 타입이 일시적으로 깨진 상태라, Task 0.5 "Phase 0 wrap-up"에서 한꺼번에 커밋.

---

## Task 0.2: `urlCodec` 수정 — 새 `AppState` + servings 제거

**Files:**

- Modify: `src/features/share/urlCodec.ts`
- Modify: `src/features/share/urlCodec.test.ts`

- [ ] **Step 1: 기존 urlCodec.test.ts 읽고 파라미터 형상 파악**

Run: `cat src/features/share/urlCodec.test.ts | head -60`
목적: 기존 테스트 케이스가 무엇을 검증하는지 파악, 재작성 범위 결정.

- [ ] **Step 2: 실패 테스트 작성 (기존 테스트 수정)**

```ts
// src/features/share/urlCodec.test.ts — 전면 교체
import { describe, expect, it } from "vitest";
import { DEFAULT_STATE, type AppState } from "@/features/app/state";
import { g } from "@/domain/units";
import { decodeState, encodeState } from "./urlCodec";

const fullState: AppState = {
  ...DEFAULT_STATE,
  coffee: g(18),
  dripper: "kalita_wave",
  method: "kalita_pulse",
  roast: "dark",
  taste: { sweetness: "bright", strength: "light" },
};

describe("urlCodec", () => {
  it("encodes state to URLSearchParams", () => {
    const p = encodeState(fullState);
    expect(p.get("c")).toBe("18");
    expect(p.get("d")).toBe("kalita_wave");
    expect(p.get("m")).toBe("kalita_pulse");
    expect(p.get("r")).toBe("dark");
    expect(p.get("sw")).toBe("bright");
    expect(p.get("st")).toBe("light");
  });

  it("roundtrips state", () => {
    const encoded = encodeState(fullState);
    const decoded = decodeState(encoded);
    expect(decoded).toMatchObject({
      coffee: 18,
      dripper: "kalita_wave",
      method: "kalita_pulse",
      roast: "dark",
      taste: { sweetness: "bright", strength: "light" },
    });
  });

  it("returns partial when only some params present", () => {
    const p = new URLSearchParams("c=25&d=v60");
    const decoded = decodeState(p);
    expect(decoded.coffee).toBe(25);
    expect(decoded.dripper).toBe("v60");
    expect(decoded.method).toBeUndefined();
    expect(decoded.taste).toBeUndefined();
  });

  it("ignores legacy sv (servings) param silently", () => {
    const p = new URLSearchParams("sv=3&d=v60");
    const decoded = decodeState(p);
    expect(decoded.coffee).toBeUndefined();
    expect(decoded.dripper).toBe("v60");
  });

  it("rejects out-of-range coffee", () => {
    const p = new URLSearchParams("c=999");
    expect(decodeState(p).coffee).toBeUndefined();
  });

  it("does not include screen in URL", () => {
    const p = encodeState(fullState);
    expect(p.has("screen")).toBe(false);
  });
});
```

- [ ] **Step 3: 테스트 실행 — 실패 확인**

Run: `bun run test:run src/features/share/urlCodec.test.ts`
Expected: FAIL (import 경로 에러 또는 decode 결과 mismatch).

- [ ] **Step 4: `urlCodec.ts` 재작성**

```ts
// src/features/share/urlCodec.ts
import type {
  BrewMethodId,
  DripperId,
  RoastLevel,
  StrengthProfile,
  SweetnessProfile,
} from "@/domain/types";
import { g } from "@/domain/units";
import type { AppState } from "@/features/app/state";

const METHOD_IDS: readonly BrewMethodId[] = [
  "kasuya_4_6",
  "hoffmann_v60",
  "kalita_pulse",
];
const DRIPPER_IDS: readonly DripperId[] = ["v60", "kalita_wave"];
const ROAST_LEVELS: readonly RoastLevel[] = ["light", "medium", "dark"];
const SWEETNESS: readonly SweetnessProfile[] = ["sweet", "balanced", "bright"];
const STRENGTHS: readonly StrengthProfile[] = ["light", "medium", "strong"];

const MIN_COFFEE = 5;
const MAX_COFFEE = 50;

const oneOf = <T extends string>(
  v: string | null,
  arr: readonly T[],
): T | null =>
  v !== null && (arr as readonly string[]).includes(v) ? (v as T) : null;

const intInRange = (
  v: string | null,
  min: number,
  max: number,
): number | null => {
  if (v === null) return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) return null;
  return n;
};

export const encodeState = (state: AppState): URLSearchParams => {
  const p = new URLSearchParams();
  p.set("c", String(state.coffee));
  p.set("d", state.dripper);
  p.set("m", state.method);
  p.set("r", state.roast);
  p.set("sw", state.taste.sweetness);
  p.set("st", state.taste.strength);
  return p;
};

export const decodeState = (params: URLSearchParams): Partial<AppState> => {
  const patch: { -readonly [K in keyof AppState]?: AppState[K] } = {};

  const coffee = intInRange(params.get("c"), MIN_COFFEE, MAX_COFFEE);
  if (coffee !== null) patch.coffee = g(coffee);

  const d = oneOf(params.get("d"), DRIPPER_IDS);
  if (d) patch.dripper = d;

  const m = oneOf(params.get("m"), METHOD_IDS);
  if (m) patch.method = m;

  const r = oneOf(params.get("r"), ROAST_LEVELS);
  if (r) patch.roast = r;

  const sw = oneOf(params.get("sw"), SWEETNESS);
  const st = oneOf(params.get("st"), STRENGTHS);
  if (sw && st) patch.taste = { sweetness: sw, strength: st };

  return patch;
};
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `bun run test:run src/features/share/urlCodec.test.ts`
Expected: PASS, 6 tests

---

## Task 0.3: `AppRoot.tsx` — 최상위 state + screen 분기

**Files:**

- Create: `src/features/app/AppRoot.tsx`

- [ ] **Step 1: AppRoot 구현 (기존 CalculatorPage의 state·effect 로직 이전)**

```tsx
// src/features/app/AppRoot.tsx
import { useEffect, useMemo, useState } from "react";
import { brewMethods } from "@/domain/methods";
import type {
  BrewMethodId,
  DripperId,
  RecipeInput,
  RoastLevel,
  TasteProfile,
} from "@/domain/types";
import { g } from "@/domain/units";
import { CalculatorPage } from "@/features/calculator/CalculatorPage";
import { clearParams, loadParams, saveParams } from "@/features/share/storage";
import { decodeState, encodeState } from "@/features/share/urlCodec";
import { DEFAULT_STATE, mergeState, type AppState, type Screen } from "./state";

const loadInitialState = (): AppState => {
  const fromUrl = decodeState(new URLSearchParams(window.location.search));
  const hasUrl = Object.keys(fromUrl).length > 0;
  if (hasUrl)
    return mergeState({ ...DEFAULT_STATE, screen: "recipe" }, fromUrl);
  const stored = loadParams();
  if (stored) return mergeState(DEFAULT_STATE, decodeState(stored));
  return DEFAULT_STATE;
};

export function AppRoot() {
  const [state, setState] = useState<AppState>(loadInitialState);

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

  const handleReset = (): void => {
    setState(DEFAULT_STATE);
    clearParams();
  };

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

  const methodMeta = brewMethods[state.method];

  // Phase 0: screen 상태는 추가됐지만 'recipe' 하나만 라우팅.
  // Phase 1에서 RecipeScreen으로 교체, Phase 2~4에서 분기 확장.
  if (state.screen === "recipe") {
    return (
      <CalculatorPage
        state={state}
        recipe={recipe}
        methodName={methodMeta.name}
        onCoffeeChange={handleCoffeeChange}
        onDripperChange={handleDripperChange}
        onMethodChange={handleMethodChange}
        onRoastChange={handleRoastChange}
        onTasteChange={handleTasteChange}
        onReset={handleReset}
      />
    );
  }

  return null;
}
```

주의: 이 시점에서 `CalculatorPage`는 아직 기존 형태(내부 state 소유). Step 2에서 presentational로 변환.

- [ ] **Step 2: `CalculatorPage.tsx`를 presentational로 변환**

```tsx
// src/features/calculator/CalculatorPage.tsx
import type { Recipe } from "@/domain/types";
import type { AppState } from "@/features/app/state";
import type {
  BrewMethodId,
  DripperId,
  RoastLevel,
  TasteProfile,
} from "@/domain/types";
import { InputPanel } from "./InputPanel";
import { RecipeView } from "./RecipeView";

type Props = {
  readonly state: AppState;
  readonly recipe: Recipe;
  readonly methodName: string;
  readonly onCoffeeChange: (coffee: number) => void;
  readonly onDripperChange: (dripper: DripperId) => void;
  readonly onMethodChange: (method: BrewMethodId) => void;
  readonly onRoastChange: (roast: RoastLevel) => void;
  readonly onTasteChange: (taste: TasteProfile) => void;
  readonly onReset: () => void;
};

export function CalculatorPage({
  state,
  recipe,
  methodName,
  onCoffeeChange,
  onDripperChange,
  onMethodChange,
  onRoastChange,
  onTasteChange,
  onReset,
}: Props) {
  return (
    <div className="min-h-screen bg-surface text-text-primary">
      <header className="border-b border-border px-5 py-4">
        <h1 className="text-lg font-semibold tracking-tight">
          핸드드립 계산기
        </h1>
        <p className="mt-0.5 text-xs text-text-muted">파라미터 → 레시피</p>
      </header>
      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-6">
        <InputPanel
          coffee={state.coffee}
          dripper={state.dripper}
          method={state.method}
          roast={state.roast}
          taste={state.taste}
          onCoffeeChange={onCoffeeChange}
          onDripperChange={onDripperChange}
          onMethodChange={onMethodChange}
          onRoastChange={onRoastChange}
          onTasteChange={onTasteChange}
        />
        <RecipeView recipe={recipe} methodName={methodName} onReset={onReset} />
      </main>
    </div>
  );
}
```

- [ ] **Step 3: `InputPanel.tsx` props 형상 교체 (InputMode → coffee)**

기존 `inputMode`/`onInputModeChange`/`switchEntryMode`/`Stepper` 제거. 커피 Slider만 유지 (servings 관련 전부 제거).

```tsx
// src/features/calculator/InputPanel.tsx (Phase 0 중간 상태 — Phase 1에서 다시 RecipeScreen이 대체)
import type { ReactNode } from "react";
import { dripperList } from "@/domain/drippers";
import { methodsForDripper } from "@/domain/methods";
import type {
  BrewMethodId,
  DripperId,
  Grams,
  RoastLevel,
  StrengthProfile,
  SweetnessProfile,
  TasteProfile,
} from "@/domain/types";
import { g } from "@/domain/units";
import { Segmented } from "@/ui/Segmented";
import { Slider } from "@/ui/Slider";

const MIN_COFFEE_G = 5;
const MAX_COFFEE_G = 50;

type Props = {
  readonly coffee: Grams;
  readonly dripper: DripperId;
  readonly method: BrewMethodId;
  readonly roast: RoastLevel;
  readonly taste: TasteProfile;
  readonly onCoffeeChange: (coffee: number) => void;
  readonly onDripperChange: (dripper: DripperId) => void;
  readonly onMethodChange: (method: BrewMethodId) => void;
  readonly onRoastChange: (roast: RoastLevel) => void;
  readonly onTasteChange: (taste: TasteProfile) => void;
};

export function InputPanel({
  coffee,
  dripper,
  method,
  roast,
  taste,
  onCoffeeChange,
  onDripperChange,
  onMethodChange,
  onRoastChange,
  onTasteChange,
}: Props) {
  const compat = methodsForDripper(dripper);

  return (
    <section aria-label="입력" className="flex flex-col gap-5">
      <Field label="커피">
        <Slider
          label="커피"
          value={coffee}
          onChange={onCoffeeChange}
          min={MIN_COFFEE_G}
          max={MAX_COFFEE_G}
          suffix="g"
        />
      </Field>

      <Field label="드리퍼">
        <Segmented<DripperId>
          name="dripper"
          label="드리퍼"
          value={dripper}
          onChange={onDripperChange}
          options={dripperList.map((d) => ({ value: d.id, label: d.name }))}
        />
      </Field>

      <Field label="방식">
        <Segmented<BrewMethodId>
          name="method"
          label="방식"
          value={method}
          onChange={onMethodChange}
          options={compat.map((m) => ({ value: m.id, label: m.name }))}
        />
      </Field>

      <Field label="로스팅">
        <Segmented<RoastLevel>
          name="roast"
          label="로스팅"
          value={roast}
          onChange={onRoastChange}
          options={[
            { value: "light", label: "라이트" },
            { value: "medium", label: "미디엄" },
            { value: "dark", label: "다크" },
          ]}
        />
      </Field>

      <Field label="맛">
        <Segmented<SweetnessProfile>
          name="sweetness"
          label="맛"
          value={taste.sweetness}
          onChange={(v) => onTasteChange({ ...taste, sweetness: v })}
          options={[
            { value: "sweet", label: "달게" },
            { value: "balanced", label: "균형" },
            { value: "bright", label: "산뜻하게" },
          ]}
        />
      </Field>

      <Field label="강도">
        <Segmented<StrengthProfile>
          name="strength"
          label="강도"
          value={taste.strength}
          onChange={(v) => onTasteChange({ ...taste, strength: v })}
          options={[
            { value: "light", label: "연하게" },
            { value: "medium", label: "보통" },
            { value: "strong", label: "진하게" },
          ]}
        />
      </Field>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-xs font-medium uppercase tracking-wider text-text-muted">
        {label}
      </div>
      {children}
    </div>
  );
}
```

`Slider`가 `value`에 `Grams`를 받고 `onChange(number)`를 내는지 확인 — 현재 그러함. `g()` 래퍼는 상위 `onCoffeeChange`에서 이미 감싸므로 여기선 불필요.

---

## Task 0.4: `App.tsx` 교체, `servings.ts` 및 테스트 제거

**Files:**

- Modify: `src/App.tsx`
- Delete: `src/domain/servings.ts`
- Delete: `src/domain/servings.test.ts`

- [ ] **Step 1: `App.tsx` 수정**

```tsx
// src/App.tsx
import { AppRoot } from "@/features/app/AppRoot";

export default function App() {
  return <AppRoot />;
}
```

- [ ] **Step 2: `servings.ts` 및 테스트 삭제**

Run:

```bash
rm src/domain/servings.ts src/domain/servings.test.ts
```

- [ ] **Step 3: `CalculatorPage.tsx` 및 `InputPanel.tsx`의 servings 관련 import 제거**

이미 Task 0.3 Step 2/3에서 제거됨. 이 단계는 검증용:

Run: `grep -rn "servings\|toCoffeeGrams\|COFFEE_PER_SERVING\|MAX_SERVINGS\|InputMode" src/`
Expected: 매치 없음 (또는 테스트/주석 한두 줄만).

남은 매치가 있으면 해당 파일에서 제거.

- [ ] **Step 4: 옛 `src/features/calculator/state.ts` 삭제**

Run: `rm src/features/calculator/state.ts`

---

## Task 0.5: Phase 0 wrap-up — 타입체크 + 테스트 + 커밋

- [ ] **Step 1: 타입체크**

Run: `bun run typecheck`
Expected: PASS (에러 없음)

에러가 있으면 메시지 따라 수정.

- [ ] **Step 2: 전체 테스트**

Run: `bun run test:run`
Expected: 70개 이상 pass (servings 4개 삭제, state 4개 추가, urlCodec 조정 → 대략 75~77 사이). **모두 pass**.

- [ ] **Step 3: 빌드**

Run: `bun run build`
Expected: PASS, `dist/` 갱신.

- [ ] **Step 4: 수동 확인 (dev server)**

Run (background): `bun run dev`
브라우저에서 http://localhost:5173/ (또는 표시된 포트)
화면이 브랜드 2차와 동일한 계산기로 보이고 인터랙션이 작동하는지 확인. **servings 모드 토글이 사라진 것 외에 시각 변화 없음**.

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "$(cat <<'EOF'
refactor: AppRoot + screen 상태 머신 도입 (Phase 0)

- features/app/AppRoot.tsx: 최상위 state·effect 소유, screen 분기 준비
- features/app/state.ts: AppState에 screen: 'wall'|'recipe'|'brewing'|'complete' 추가,
  features/calculator/state.ts에서 이전
- InputMode(by-coffee/by-servings 토글) 제거 — 핸드오프에 없음, 핸드오프 레이아웃
  흡수를 위한 선행 단순화
- domain/servings.ts + 테스트 삭제
- urlCodec: inputMode → coffee: Grams, sv 파라미터 drop (레거시 URL은 무시)
- CalculatorPage + InputPanel은 presentational로 변환 (Phase 1에서 RecipeScreen으로 교체)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 6: Phase 0 완료 확인**

Run: `git log --oneline -3`
Expected: 최신 커밋이 `refactor: AppRoot + screen 상태 머신 도입 (Phase 0)`로 보임.

---

# Phase 1 — Recipe screen redesign

목표: 기존 `CalculatorPage` + `InputPanel` + `RecipeView` + 가로 `PourTimeline`을 삭제하고, 핸드오프 Recipe 레이아웃의 신규 `RecipeScreen`으로 대체.

## Task 1.1: `ui/DripperIcon.tsx` — V60 / Kalita Wave 아이콘

**Files:**

- Create: `src/ui/DripperIcon.tsx`

- [ ] **Step 1: 컴포넌트 작성 (핸드오프의 `DripperSVG`를 토큰화하여 포트)**

```tsx
// src/ui/DripperIcon.tsx
import type { DripperId } from "@/domain/types";
import { cx } from "./cx";

type Props = {
  readonly type: DripperId;
  readonly size?: number;
  readonly selected?: boolean;
  readonly className?: string;
};

export function DripperIcon({
  type,
  size = 56,
  selected = false,
  className,
}: Props) {
  const strokeWidth = selected ? 1.6 : 1.2;
  const opacity = selected ? 1 : 0.55;

  if (type === "v60") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 90 90"
        className={cx("text-text-primary", className)}
        aria-hidden="true"
      >
        <g
          stroke="currentColor"
          strokeWidth={strokeWidth}
          opacity={opacity}
          fill="none"
          strokeLinejoin="round"
        >
          <path d="M 12 20 L 78 20 L 50 70 L 40 70 Z" />
          <line x1={42} y1={70} x2={42} y2={78} />
          <line x1={48} y1={70} x2={48} y2={78} />
        </g>
        <line
          x1={20}
          y1={26}
          x2={70}
          y2={26}
          stroke="currentColor"
          strokeWidth={0.8}
          opacity={opacity * 0.5}
        />
      </svg>
    );
  }

  // kalita_wave
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 90 90"
      className={cx("text-text-primary", className)}
      aria-hidden="true"
    >
      <g
        stroke="currentColor"
        strokeWidth={strokeWidth}
        opacity={opacity}
        fill="none"
        strokeLinejoin="round"
      >
        <path d="M 14 22 L 76 22 L 62 64 L 28 64 Z" />
        <line x1={30} y1={64} x2={30} y2={72} />
        <line x1={45} y1={64} x2={45} y2={72} />
        <line x1={60} y1={64} x2={60} y2={72} />
      </g>
      {[0, 1, 2].map((i) => (
        <path
          key={i}
          d={`M ${20 + i * 4} ${30 + i * 10} Q 45 ${26 + i * 10}, ${70 - i * 4} ${30 + i * 10}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={0.8}
          opacity={opacity * 0.5}
        />
      ))}
    </svg>
  );
}
```

현재 `cx` util (`src/ui/cx.ts`)을 사용. 핸드오프의 하드코딩 `#2a241e`를 `currentColor` + `text-text-primary`로 치환 — 토큰 단일 출처 원칙 준수.

- [ ] **Step 2: 타입체크**

Run: `bun run typecheck`
Expected: PASS

---

## Task 1.2: `recipe/PourVerticalPreview.tsx` — 세로 푸어 스케줄

**Files:**

- Create: `src/features/recipe/PourVerticalPreview.tsx`

- [ ] **Step 1: 컴포넌트 작성 (핸드오프의 `PourVerticalPreview`를 도메인 `Pour[]` 소비로 개작)**

```tsx
// src/features/recipe/PourVerticalPreview.tsx
import type { Pour } from "@/domain/types";
import { formatTime } from "@/ui/format";

type Props = {
  readonly pours: readonly Pour[];
  readonly totalTimeSec: number;
  readonly width?: number;
  readonly height?: number;
};

export function PourVerticalPreview({
  pours,
  totalTimeSec,
  width = 340,
  height = 230,
}: Props) {
  if (pours.length === 0 || totalTimeSec <= 0) return null;

  const padT = 10;
  const padB = 10;
  const axisX = 44;
  const nodeR = 3.5;
  const rightLabelWidth = 70;
  const barMaxW = width - axisX - 16 - rightLabelWidth;

  const maxDelta = Math.max(...pours.map((p) => p.pourAmount));
  const ty = (t: number): number =>
    padT + (t / totalTimeSec) * (height - padT - padB);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="block max-w-full"
      role="img"
      aria-label="푸어 스케줄"
    >
      <desc>
        {pours
          .map(
            (p) =>
              `${formatTime(p.atSec)} +${p.pourAmount}그램${p.label === "bloom" ? " (뜸)" : ""}`,
          )
          .join(", ")}
      </desc>

      <line
        x1={axisX}
        y1={padT}
        x2={axisX}
        y2={height - padB}
        stroke="var(--color-border)"
        strokeWidth={0.8}
      />

      {pours.map((p) => {
        const y = ty(p.atSec);
        const barW = (p.pourAmount / maxDelta) * barMaxW;
        const barStart = axisX + nodeR + 4;
        const bloom = p.label === "bloom";
        const color = bloom
          ? "var(--color-pour-bloom)"
          : "var(--color-pour-main)";

        return (
          <g key={p.index}>
            <text
              x={axisX - 8}
              y={y + 3}
              fontSize={10}
              fill="var(--color-text-secondary)"
              textAnchor="end"
              className="tabular-nums"
            >
              {formatTime(p.atSec)}
            </text>
            <circle cx={axisX} cy={y} r={nodeR} fill={color} stroke={color} />
            <line
              x1={barStart}
              y1={y}
              x2={barStart + barW}
              y2={y}
              stroke={color}
              strokeWidth={bloom ? 2.2 : 2}
              strokeLinecap="round"
              opacity={bloom ? 1 : 0.88}
            />
            <text
              x={barStart + barW + 8}
              y={y + 3.5}
              fontSize={11}
              fill="var(--color-text-primary)"
              fontWeight={500}
              className="tabular-nums"
            >
              +{p.pourAmount}g
            </text>
            {bloom && (
              <text
                x={width - 4}
                y={y + 3.5}
                fontSize={9}
                fill="var(--color-pour-bloom)"
                textAnchor="end"
                fontWeight={600}
                letterSpacing={0.4}
              >
                bloom
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
```

주의:

- 브랜드 2차에서 `bloom` 배지 표기는 한글 '뜸'이 아니라 영문 `bloom` 유지 결정. 핸드오프의 '뜸' 텍스트는 여기에서 `bloom`으로 교체.
- 색상은 `--color-pour-main` / `--color-pour-bloom` / `--color-border` / `--color-text-*` 토큰 사용. 현재 `tokens/semantic.css`에 존재하는지 확인.

- [ ] **Step 2: 토큰 존재 확인**

Run: `grep -n "pour-main\|pour-bloom" src/ui/tokens/semantic.css`
Expected: `--color-pour-main`, `--color-pour-bloom` 정의가 있음. 없다면 `primitives.css`와 `semantic.css`를 참고하여 추가해야 하지만, 현재 `RecipeView.tsx`가 이미 이 토큰을 쓰고 있으므로 존재할 것.

- [ ] **Step 3: 타입체크**

Run: `bun run typecheck`
Expected: PASS

---

## Task 1.3: `recipe/DripperPopover.tsx` — 바꾸기 popover

**Files:**

- Create: `src/features/recipe/DripperPopover.tsx`
- Create: `src/features/recipe/DripperPopover.test.tsx`

- [ ] **Step 1: 실패 테스트 작성**

```tsx
// src/features/recipe/DripperPopover.test.tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DripperPopover } from "./DripperPopover";

describe("DripperPopover", () => {
  const options = [
    { id: "v60" as const, name: "V60", methodSubtitle: "Kasuya 4:6" },
    {
      id: "kalita_wave" as const,
      name: "Kalita Wave",
      methodSubtitle: "Kalita Wave",
    },
  ];

  it("renders all options with selected marker", () => {
    render(
      <DripperPopover
        options={options}
        selected="v60"
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: /V60/ })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Kalita Wave/ }),
    ).toBeInTheDocument();
    const v60Option = screen.getByRole("button", { name: /V60/ });
    expect(v60Option).toHaveAttribute("aria-checked", "true");
  });

  it("calls onSelect when option tapped", () => {
    const onSelect = vi.fn();
    render(
      <DripperPopover
        options={options}
        selected="v60"
        onSelect={onSelect}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Kalita Wave/ }));
    expect(onSelect).toHaveBeenCalledWith("kalita_wave");
  });

  it("calls onClose when dim background tapped", () => {
    const onClose = vi.fn();
    render(
      <DripperPopover
        options={options}
        selected="v60"
        onSelect={vi.fn()}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByLabelText("팝오버 닫기"));
    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `bun run test:run src/features/recipe/DripperPopover.test.tsx`
Expected: FAIL (module not found)

- [ ] **Step 3: 구현**

```tsx
// src/features/recipe/DripperPopover.tsx
import type { DripperId } from "@/domain/types";
import { cx } from "@/ui/cx";
import { DripperIcon } from "@/ui/DripperIcon";

type Option = {
  readonly id: DripperId;
  readonly name: string;
  readonly methodSubtitle: string;
};

type Props = {
  readonly options: readonly Option[];
  readonly selected: DripperId;
  readonly onSelect: (id: DripperId) => void;
  readonly onClose: () => void;
};

export function DripperPopover({
  options,
  selected,
  onSelect,
  onClose,
}: Props) {
  return (
    <div className="absolute inset-0 z-20">
      <button
        type="button"
        aria-label="팝오버 닫기"
        onClick={onClose}
        className="absolute inset-0 bg-surface/45"
      />
      <div
        role="dialog"
        aria-label="드리퍼 선택"
        className="absolute right-4 top-[72px] min-w-[180px] rounded-xl border border-border bg-surface p-1 shadow-lg"
      >
        {options.map((opt) => {
          const isSelected = opt.id === selected;
          return (
            <button
              key={opt.id}
              type="button"
              role="button"
              aria-checked={isSelected}
              aria-label={opt.name}
              onClick={() => onSelect(opt.id)}
              className={cx(
                "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors",
                isSelected ? "bg-surface-inset" : "hover:bg-surface-inset/60",
              )}
            >
              <DripperIcon type={opt.id} size={32} selected={isSelected} />
              <div className="flex-1">
                <div
                  className={cx(
                    "text-sm",
                    isSelected ? "font-semibold" : "font-medium",
                  )}
                >
                  {opt.name}
                </div>
                <div className="text-[10px] text-text-muted">
                  {opt.methodSubtitle}
                </div>
              </div>
              {isSelected && (
                <svg
                  width={12}
                  height={12}
                  viewBox="0 0 12 12"
                  aria-hidden="true"
                >
                  <path
                    d="M 2 6 L 5 9 L 10 3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `bun run test:run src/features/recipe/DripperPopover.test.tsx`
Expected: PASS, 3 tests

---

## Task 1.4: `recipe/RecipeScreen.tsx` — 레이아웃 조립

**Files:**

- Create: `src/features/recipe/RecipeScreen.tsx`

- [ ] **Step 1: 컴포넌트 작성**

```tsx
// src/features/recipe/RecipeScreen.tsx
import { useState } from "react";
import { dripperList } from "@/domain/drippers";
import { brewMethods, methodsForDripper } from "@/domain/methods";
import type {
  BrewMethodId,
  DripperId,
  Grams,
  Recipe,
  RoastLevel,
  StrengthProfile,
  SweetnessProfile,
  TasteProfile,
} from "@/domain/types";
import { Segmented } from "@/ui/Segmented";
import { Slider } from "@/ui/Slider";
import { DripperIcon } from "@/ui/DripperIcon";
import { formatGrindHint, formatTime } from "@/ui/format";
import { DripperPopover } from "./DripperPopover";
import { PourVerticalPreview } from "./PourVerticalPreview";

const MIN_COFFEE_G = 5;
const MAX_COFFEE_G = 50;

type Props = {
  readonly coffee: Grams;
  readonly dripper: DripperId;
  readonly method: BrewMethodId;
  readonly roast: RoastLevel;
  readonly taste: TasteProfile;
  readonly recipe: Recipe;
  readonly onCoffeeChange: (coffee: number) => void;
  readonly onDripperChange: (dripper: DripperId) => void;
  readonly onMethodChange: (method: BrewMethodId) => void;
  readonly onRoastChange: (roast: RoastLevel) => void;
  readonly onTasteChange: (taste: TasteProfile) => void;
  readonly onStart: () => void;
};

export function RecipeScreen({
  coffee,
  dripper,
  method,
  roast,
  taste,
  recipe,
  onCoffeeChange,
  onDripperChange,
  onMethodChange,
  onRoastChange,
  onTasteChange,
  onStart,
}: Props) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const compatMethods = methodsForDripper(dripper);
  const methodMeta = brewMethods[method];

  const ratioDisplay = `1:${Math.round(recipe.ratio)}`;
  const recommendedLine = `${recipe.temperature}° · ${ratioDisplay} · ${formatTime(recipe.totalTimeSec)} · ${formatGrindHint(recipe.grindHint)}`;

  const popoverOptions = dripperList.map((d) => {
    const firstMethod = methodsForDripper(d.id)[0];
    return {
      id: d.id,
      name: d.name,
      methodSubtitle: firstMethod?.name ?? "",
    };
  });

  return (
    <div className="relative mx-auto flex min-h-screen max-w-lg flex-col bg-surface text-text-primary">
      {/* top bar */}
      <header className="flex items-center gap-3 px-5 pt-12">
        <DripperIcon type={dripper} size={56} selected />
        <div className="flex-1">
          <div className="text-lg font-medium">
            {dripperList.find((d) => d.id === dripper)?.name}
          </div>
          <div className="text-[11px] text-text-muted">{methodMeta.name}</div>
        </div>
        <button
          type="button"
          onClick={() => setPopoverOpen(true)}
          className="whitespace-nowrap text-[11px] text-text-muted hover:text-text-secondary"
        >
          바꾸기 ›
        </button>
      </header>

      <main className="flex flex-1 flex-col gap-3 px-5 py-4">
        <div className="h-px bg-border" />

        {/* controls */}
        <Row label="커피">
          <Slider
            label="커피"
            value={coffee}
            onChange={onCoffeeChange}
            min={MIN_COFFEE_G}
            max={MAX_COFFEE_G}
            suffix="g"
          />
        </Row>

        <Row label="맛">
          <Segmented<SweetnessProfile>
            name="sweetness"
            label="맛"
            value={taste.sweetness}
            onChange={(v) => onTasteChange({ ...taste, sweetness: v })}
            options={[
              { value: "sweet", label: "달게" },
              { value: "balanced", label: "균형" },
              { value: "bright", label: "산뜻하게" },
            ]}
          />
        </Row>

        <Row label="강도">
          <Segmented<StrengthProfile>
            name="strength"
            label="강도"
            value={taste.strength}
            onChange={(v) => onTasteChange({ ...taste, strength: v })}
            options={[
              { value: "light", label: "연하게" },
              { value: "medium", label: "보통" },
              { value: "strong", label: "진하게" },
            ]}
          />
        </Row>

        <Row label="방식">
          <Segmented<BrewMethodId>
            name="method"
            label="방식"
            value={method}
            onChange={onMethodChange}
            options={compatMethods.map((m) => ({ value: m.id, label: m.name }))}
          />
        </Row>

        <Row label="로스팅">
          <Segmented<RoastLevel>
            name="roast"
            label="로스팅"
            value={roast}
            onChange={onRoastChange}
            options={[
              { value: "light", label: "라이트" },
              { value: "medium", label: "미디엄" },
              { value: "dark", label: "다크" },
            ]}
          />
        </Row>

        {/* recommended row */}
        <div className="mt-1 flex items-center gap-2 text-[10px] text-text-muted">
          <span className="whitespace-nowrap">권장</span>
          <span className="flex-1 tabular-nums">{recommendedLine}</span>
        </div>

        <div className="h-px bg-border" />

        {/* pour schedule */}
        <section
          className="flex min-h-0 flex-1 flex-col gap-2"
          aria-label="푸어 스케줄"
        >
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              푸어 스케줄
            </span>
            <span className="text-xs text-text-muted tabular-nums">
              {recipe.totalWater}g · {formatTime(recipe.totalTimeSec)} ·{" "}
              {recipe.pours.length} pours
            </span>
          </div>
          <div className="flex-1">
            <PourVerticalPreview
              pours={recipe.pours}
              totalTimeSec={recipe.totalTimeSec}
            />
          </div>
        </section>
      </main>

      {/* start button */}
      <div className="px-5 pb-6">
        <button
          type="button"
          onClick={onStart}
          className="flex h-14 w-full items-center justify-center gap-3 rounded-xl border-[1.6px] border-text-primary bg-surface-subtle text-lg font-medium transition-colors hover:bg-surface-inset"
        >
          <svg width={14} height={16} viewBox="0 0 14 16" aria-hidden="true">
            <path d="M 2 2 L 12 8 L 2 14 Z" fill="currentColor" />
          </svg>
          시작
        </button>
      </div>

      {popoverOpen && (
        <DripperPopover
          options={popoverOptions}
          selected={dripper}
          onSelect={(id) => {
            onDripperChange(id);
            setPopoverOpen(false);
          }}
          onClose={() => setPopoverOpen(false)}
        />
      )}
    </div>
  );
}

function Row({
  label,
  children,
}: {
  readonly label: string;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[44px_1fr] items-center gap-3">
      <span className="text-[11px] text-text-secondary">{label}</span>
      <div>{children}</div>
    </div>
  );
}
```

주의 사항:

- 핸드오프의 `고급 ›` 링크는 범위 밖이라 **생략**. 후속 Phase에서 재도입.
- 시작 버튼의 `onStart`는 Phase 1에선 `console.log('start')` 등 placeholder (AppRoot에서 주입). Phase 2에서 screen 전이로 대체.
- Segmented 컴포넌트의 단일 option 렌더링은 현재 스타일 상 segment 1개라도 표시됨 (핸드오프 결정 반영).

- [ ] **Step 2: 타입체크**

Run: `bun run typecheck`
Expected: PASS

---

## Task 1.5: `AppRoot`에 `RecipeScreen` 연결, 옛 `CalculatorPage` 제거

**Files:**

- Modify: `src/features/app/AppRoot.tsx`
- Delete: `src/features/calculator/CalculatorPage.tsx`
- Delete: `src/features/calculator/InputPanel.tsx`
- Delete: `src/features/calculator/RecipeView.tsx`
- Delete: `src/features/calculator/PourTimeline.tsx`

- [ ] **Step 1: `AppRoot.tsx` 수정 — `CalculatorPage` import를 `RecipeScreen`으로 교체**

기존 (Task 0.3에서 작성):

```tsx
import { CalculatorPage } from '@/features/calculator/CalculatorPage'
// ...
  if (state.screen === 'recipe') {
    return (
      <CalculatorPage
        state={state}
        recipe={recipe}
        methodName={methodMeta.name}
        onCoffeeChange={handleCoffeeChange}
        ...
      />
    )
  }
```

교체:

```tsx
import { RecipeScreen } from "@/features/recipe/RecipeScreen";
// ...
const handleStart = (): void => {
  // Phase 2: patch({ screen: 'brewing', startedAt: Date.now() })
  // Phase 1: placeholder
  console.log("[Phase 1] 시작 tapped — Brewing 화면은 Phase 2에서.");
};

if (state.screen === "recipe") {
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

`methodMeta` / `methodName` 사용 없어졌으므로 `useMemo` 구문 유지하되 반환값 트리밍, 또는 compute 호출만 유지:

```tsx
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
```

기존 `handleReset`, `methodMeta` 변수 미사용분 제거.

- [ ] **Step 2: 옛 calculator 파일 삭제**

Run:

```bash
rm src/features/calculator/CalculatorPage.tsx \
   src/features/calculator/InputPanel.tsx \
   src/features/calculator/RecipeView.tsx \
   src/features/calculator/PourTimeline.tsx
rmdir src/features/calculator 2>/dev/null || true
```

`rmdir`은 빈 디렉토리만 제거 — Task 0.4에서 `state.ts`도 이미 제거되어 비어 있어야 함.

- [ ] **Step 3: grep으로 잔여 참조 검증**

Run: `grep -rn "features/calculator\|CalculatorPage\|InputPanel\|RecipeView\|PourTimeline" src/`
Expected: 매치 없음. (Phase 1의 `PourVerticalPreview`는 다른 이름이므로 안전.)

---

## Task 1.6: Phase 1 wrap-up — 타입체크 + 테스트 + 시각 QA + 커밋

- [ ] **Step 1: 타입체크**

Run: `bun run typecheck`
Expected: PASS

- [ ] **Step 2: 테스트**

Run: `bun run test:run`
Expected: 이전 대비 +3 (DripperPopover) = 약 76~78 pass.

- [ ] **Step 3: 빌드**

Run: `bun run build`
Expected: PASS

- [ ] **Step 4: dev 서버 + 시각 확인**

Run (background): `bun run dev`

체크리스트 (데스크톱·모바일 각각):

- [ ] 상단 바: 드리퍼 아이콘 + 이름 + 메서드 부제 + `바꾸기 ›`
- [ ] `바꾸기 ›` 탭 → popover 열림, V60/Kalita Wave 표시, 선택 마커 ✓
- [ ] popover 배경 탭 → 닫힘
- [ ] 드리퍼 바꾸면 메서드가 자동 스위치 (V60 ↔ Kalita Wave)
- [ ] 컨트롤 5개: 커피 Slider / 맛 / 강도 / 방식 / 로스팅 Segmented
- [ ] 방식 segmented가 Kalita Wave에서도 1 segment로 **표시됨**
- [ ] 권장 행: `90° · 1:15 · 3:30 · 굵은 소금 정도`
- [ ] 세로 PourVerticalPreview — bloom 행에 ochre + `bloom` 표기
- [ ] 시작 버튼 탭 → 콘솔에 `[Phase 1] 시작 tapped ...` 로그
- [ ] 모바일 (390px) 뷰에서 레이아웃 깨짐 없음

Playwright로 스크린샷 캡처:

```bash
# 아래는 보조: playwright mcp로 데스크톱·모바일 전체 페이지 스크린샷 각 1장.
```

- [ ] **Step 5: dev 서버 종료**

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat: Recipe 스크린 핸드오프 레이아웃 재설계 (Phase 1)

- features/recipe/RecipeScreen.tsx: 핸드오프 Recipe 레이아웃
  (top bar + 바꾸기 popover + 커피/맛/강도/방식/로스팅 controls +
  권장 행(+분쇄도) + 세로 PourVerticalPreview + 시작 버튼)
- features/recipe/DripperPopover.tsx: V60↔Kalita Wave 전환 팝오버
  (배경 탭으로 닫힘, 선택 마커)
- features/recipe/PourVerticalPreview.tsx: 세로 푸어 SVG
  (시간 위→아래, bloom ochre 강조)
- ui/DripperIcon.tsx: V60/Kalita Wave 라인 아이콘 (currentColor)
- 방식 segmented는 Kalita Wave 드리퍼에서 1 segment라도 표시
- 권장 행에 분쇄도 시각 비유(formatGrindHint) 추가
- 옛 calculator/ 전체(CalculatorPage, InputPanel, RecipeView,
  PourTimeline) 제거
- 시작 버튼은 Phase 2 Brewing 전이 전 placeholder

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 7: Phase 1 완료 확인**

Run: `git log --oneline -5`
Expected: 위에서 두 번째 / 첫 번째가 Phase 0 / Phase 1 커밋.

---

## Post-plan notes (Phase 2 진입 전 해야 할 것)

- Spec 업데이트: `docs/superpowers/specs/2026-04-19-brewing-flow-design.md`의 Domain Model 섹션에 "InputMode(servings 모드) 제거" 한 줄 추가 (Phase 1 실행 중 반영).
- TODO.md: 현재 지점에 "Phase 0/1 완료" 반영.
- Phase 2 시작 시 별도 플랜 문서 (`2026-04-19-brewing-flow-phase-2.md`) 작성.

---

## 자체 검증 체크

- **스펙 커버리지**: 스펙의 Phase 0(screen state foundation) + Phase 1(Recipe redesign + 방식 segmented + 권장 분쇄도 + 세로 Preview + 바꾸기 popover + 시작 버튼 스텁 + 가로 PourTimeline 제거) — 모두 태스크에 포함 ✓
- **No placeholders**: 각 step에 실제 코드·명령·예상 결과 포함 ✓
- **타입 일관성**: `handleCoffeeChange(number)`는 내부에서 `g()`로 래핑, Slider는 `number`를 내놓음 — 흐름 일치 ✓
- **파일 경로**: 절대 경로 `@/...` alias 일관 사용 ✓
